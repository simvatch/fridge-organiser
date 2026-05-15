from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("hackclubAPI")

class FridgeRequest(BaseModel):
    ingredients: list[str]

@app.get("/")
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

    data = response.json()

    return data