from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field
from passlib.context import CryptContext
import secrets
from backend.database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

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

    return {"message":  "User created"}

@router.post("/login")
async def login(user: Login, db=Depends(get_db)):

    db_user = await db.fetchrow(
        "SELECT id, password_hash FROM users WHERE email = $1",
        user.email.lower()
    )

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not pwd_context.verify(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
     
    return {"message": "Login successful"}