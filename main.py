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

    Generate:
    1. 3 recipes that can be made with these ingredients
    2. 2 recipe ideas requiring only a few additional ingredients

    Return:
    - recipe name
    - list of ingredients
    - instructions
    - extra ingredients needed (if applicable)
    - estimated cooking time
    """

    response = requests.post(
        "https://ai.hackclub.com/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
    )

    return response.json()