from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import base64
import json
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from backend.auth import router as auth_router
from backend.database import connect_db, disconnect_db
from backend.items import router as item_router

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Connecting to database")
    await connect_db()
    yield
    print("Disconnecting from database")
    await disconnect_db()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(item_router)

API_KEY = os.getenv("hackclubAPI")

class FridgeRequest(BaseModel):
    ingredients: list[str]

@app.get("/")
@app.head("/")
def home():
    return {"status": "online"}

@app.post("/recipes")
def get_recipes(request: FridgeRequest):

    ingredients = ",".join(request.ingredients)
    prompt = f"""
    The user has these ingredients:

    {ingredients}

    Generate exactly 5 recipes:
    - 3 recipes must use ONLY the provided ingredients
    - 2 recipes may include a few extra ingredients (must be listed in missingIngredients)

    Return ONLY valid JSON.

    Rules:
    - Each recipe must have 5 to 8 steps (no fewer, no more)
    - Steps must be simple, single actions only
    - Each step must contain ONE action only (no combining actions)
    - Steps must be clear, beginner-friendly, and practical
    - No paragraphs allowed in steps
    - Do NOT use vague phrases like "cook until done" or "season to taste"
    - Always include quantities (grams, cups, units) when adding ingredients
    - Always include cooking times in minutes when relevant
    - Do NOT invent ingredients inside steps
    - Any ingredient not in the fridge list MUST go in missingIngredients only
    - Keep recipes realistic and consistent with available ingredients
    - Each recipe must include a "servings" field
    - "servings" must be an integer representing number of people served
    - base all ingredient quantities on that number
    - Each recipe must include an "imagePrompt" field.
    - The imagePrompt must describe the final cooked dish in a visually appealing way for image generation.
    - It must be 2 sentences that are descriptive and food-focused.
    - Do not include steps or ingredients in the imagePrompt.

    Format:

    {{
    "recipes": [
        {{
        "name": "",
        "description": "",
        "servings": "",
        "ingredients": [],
        "steps": [
            "step 1",
            "step 2"
        ],
        "missingIngredients": [],
        "cookTime": "",
        "imagePrompt": ""
        }}
    ]
    }}
    """

    response = requests.post(
        "https://ai.hackclub.com/proxy/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "qwen/qwen3-32b",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
    )

    data = response.json()
    content = data["choices"][0]["message"]["content"]

    return {"content": content}

@app.post("/image")
def generate_image(data: dict):

    prompt = data["prompt"]

    response = requests.post(
        "https://ai.hackclub.com/proxy/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "google/gemini-3-pro-image-preview",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "modalities": ["image", "text"],
            "image_config": {
                "aspect_ratio": "1:1",
            }
        }
    )

    result = response.json()

    image = None

    try:
        image = result["choices"][0]["message"]["images"][0]["image_url"]["url"]
    except Exception as e:
        print("Image error:", e)
    
    return {
        "image": image
    }

@app.post("/detect-items")
async def detect_items(file: UploadFile = File(...)):

    image_bytes = await file.read()
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")

    response = requests.post(
        "https://ai.hackclub.com/proxy/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "google/gemini-2.5-flash",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """
                                Identify all food ingredients visible in this image.

                                Rules:
                                - Return ONLY JSON
                                - Use simple ingredient names
                                - No brand names
                                - Singular names only
                                - Ignore non-food objects
                                - If unsure do not guess

                                Format:

                                {
                                    "ingredients": [
                                        "milk",
                                        "egg",
                                        "tomato"
                                    ]
                                }
                            """
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{file.content_type};base64,{image_base64}"
                            }
                        }
                    ]
                }
            ]
        }
    )

    result = response.json()

    try:
        content = result["choices"][0]["message"]["content"]
        return json.loads(content)

    except Exception as e:
        print(result)
        return {
            "error": str(e),
            "raw_response": result
        }