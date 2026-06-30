from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import ORJSONResponse
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
import uvicorn
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from pydantic import BaseModel
import base64
import json
import os
import httpx
from io import BytesIO
from PIL import Image
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from backend.auth import router as auth_router
from backend.database import connect_db, disconnect_db
from backend.items import router as item_router
from backend.settings import router as settings_router
from backend.shopping import router as shopping_router
from backend.auth import get_current_user, get_db

load_dotenv()

API_KEY = os.getenv("hackclubAPI")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Connecting to database")
    await connect_db()
    yield
    print("Disconnecting from database")
    await disconnect_db()
    await client.aclose()

app = FastAPI(
    lifespan=lifespan,
    default_response_class=ORJSONResponse
)

app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://fridge-organiser-six.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    GZipMiddleware,
    minimum_size=1000
)

app.include_router(auth_router)
app.include_router(item_router)
app.include_router(settings_router)
app.include_router(shopping_router)

client = httpx.AsyncClient(
    http2=True,
    timeout=httpx.Timeout(
        connect=5.0,
        read=30.0,
        write=30.0,
        pool=5.0
    ),
    limits=httpx.Limits(
        max_connections=100,
        max_keepalive_connections=50
    )
)

class FridgeRequest(BaseModel):
    ingredients: list[str]

async def call_gemini(payload: dict, retries: int = 2):
    for attempt in range(retries + 1):
        try:
            response = await client.post(
                "https://ai.hackclub.com/proxy/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {API_KEY}",
                    "Content-Type": "application/json"
                },
                json=payload
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code in (502, 503, 502) and attempt < retries:
                continue
            raise

@app.get("/")
@app.head("/")
def home():
    return {"status": "online"}

@app.post("/recipes")
async def get_recipes(request: FridgeRequest, user=Depends(get_current_user), db=Depends(get_db)):

    settings = await db.fetchrow(
        """
        SELECT dietary_restrictions, diets
        FROM settings
        WHERE user_id = $1
        """,
        user
    )

    dietary_text = ""
    if settings: 
        restrictions = settings["dietary_restrictions"] or []
        diets = settings["diets"] or []
        if restrictions:
            dietary_text += f"\n -Must be: {', '.join(restrictions)}"
        if diets:
            dietary_text += f"\n -Must follow: {', '.join(diets)} diet(s)"

    ingredients = ",".join(request.ingredients)
    prompt = f"""
    Ingredients:

    {ingredients}

    Generate exactly 5 recipes.

    Rules:
    - First 3 use only provided ingredients
    - Last 2 may require extras
    - 5-8 steps
    - Beginner friendly
    - servings must be integer
    - include imagePrompt
    - use ONLY metric units
    - Temperatures must be Celsius
    - Weight must be grams
    - Volume must be millilitres
    - {dietary_text}
    - return ONLY JSON

    Format:

    {{
    "recipes": [
        {{
        "name": "",
        "description": "",
        "servings": "",
        "ingredients": [
            {{
                "name": "",
                "quantity": 0,
                "unit": ""
            }}
        ],
        "steps": [
            "step 1",
            "step 2"
        ],
        "missingIngredients": [],
        "cookTime": "",
        "temperature": {{
            "value": 0,
            "unit": "C"
        }},
        "imagePrompt": ""
        }}
    ]
    }}
    """

    result = await call_gemini({
        "model": "google/gemini-2.5-flash",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.7,
        "max_tokens": 8000
    })

    return {"content": result["choices"][0]["message"]["content"]}

@app.post("/image")
async def generate_image(data: dict):

    prompt = data["prompt"]

    try:
        result = await call_gemini({
            "model": "google/gemini-3-pro-image-preview",
            "messages": [
                {
                    "role": "user",
                    "content": data["prompt"]
                }
            ],
            "modalities": ["image", "text"],
            "image_config": {
                "aspect_ratio": "1:1",
            }
        })
    except Exception as e:
        print("Image generation failed:", e)
        return {"image": None}

    image_url = None
    try:
        image_url = result["choices"][0]["message"]["images"][0]["image_url"]["url"]
    except Exception as e:
        print("Image error:", e)
    
    return {"image": image_url}

@app.post("/detect-items")
async def detect_items(file: UploadFile = File(...)):

    image_bytes = await file.read()
    img = Image.open(BytesIO(image_bytes))

    if img.mode != "RGB":
        img = img.convert("RGB")
    
    img.thumbnail((1200, 1200))

    compressed = BytesIO()

    img.save(
        compressed,
        format="JPEG",
        quality=75,
        optimize=True
    )

    image_base64 = base64.b64encode(compressed.getvalue()).decode("utf-8")

    result = await call_gemini({
        "model": "google/gemini-2.5-flash",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """
                            Return ONLY JSON
                            {
                            "ingredients": []
                            }
                            List visible food ingredients only.
                            No brands
                            No duplicates
                            No guessing
                        """
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_base64}"
                        }
                    }
                ]
            }
        ],
        "temperature": 0.1,
        "max_tokens": 2000
    })

    try:
        content = result["choices"][0]["message"]["content"]
        
        content = (
            content
            .replace("```json", "")
            .replace("```", "")
            .strip()
        )

        return json.loads(content)

    except Exception as e:
        print(result)
        return {
            "error": str(e),
            "raw_response": result
        }