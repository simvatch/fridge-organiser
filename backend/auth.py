from fastapi import APIRouter, HTTPException, Depends, Response, Cookie
from pydantic import BaseModel, EmailStr, Field
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
import os
from dotenv import load_dotenv
from backend.database import get_db

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def create_access_token(user_id: int):
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": str(user_id),
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

async def get_current_user(
    access_token: str | None = Cookie(default=None)
):
    if not access_token:
        raise HTTPException(401)
    
    try:
        payload = jwt.decode(
            access_token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return int(payload["sub"])

    except JWTError:
        raise HTTPException(401)

class Signup(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str = Field(min_length=8)

class Login(BaseModel):
    email: EmailStr
    password: str

@router.post("/signup")
async def signup(user: Signup, db=Depends(get_db)):

    print("In signup")

    try:
        existing = await db.fetchrow(
            "SELECT id FROM users WHERE email = $1",
            user.email.lower()
        )
    
    except Exception as e:
        print("Database error", e)
        raise HTTPException(500, str(e))

    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    hashed = pwd_context.hash(user.password)

    try:
        await db.execute(
            """
            INSERT INTO users (first_name, last_name, email, password_hash)
            VALUES ($1, $2, $3, $4)
            """,
            user.first_name,
            user.last_name,
            user.email.lower(),
            hashed
        )

    except Exception as e:
        print("Insert error", e)
        raise HTTPException(500, str(e))

    return {"message":  "User created"}

@router.post("/login")
async def login(user: Login, response: Response, db=Depends(get_db)):

    db_user = await db.fetchrow(
        "SELECT id, password_hash FROM users WHERE email = $1",
        user.email.lower()
    )

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not pwd_context.verify(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(db_user["id"])

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,  # Come back and change to True later when not on localhost
        samesite="lax",
        max_age=60 * 60 * 24 * 30
    )
     
    return {"message": "Login successful"}

@router.get("/me")
async def me(user_id: int = Depends(get_current_user)):
    return {
        "user_id": user_id,
        "authenticated": True
    }

@router.post("/logout")
async def logout(response: Response):

    response.delete_cookie("access_token")
    return { "message": "Logged out" }