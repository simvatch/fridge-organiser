from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from backend.database import get_db
from backend.auth import get_current_user

router = APIRouter(
    prefix="/settings",
    tags=["settings"]
)

class SettingsModel(BaseModel):
    temperature: str
    weight: str
    volume: str
    dietry_restrictions: list[str] = []
    diets: list[str] = []

@router.get("")
async def get_settings(user=Depends(get_current_user), db=Depends(get_db)):

    settings = await db.fetchrow(
        """
        SELECT *
        FROM settings
        WHERE user_id = $1
        """,
        user
    )

    if not settings:
        await db.execute(
            """
            INSERT INTO settings (
                user_id,
                temperature,
                weight,
                volume,
                dietry_restrictions,
                diets
            )
            VALUES ($1, 'celsius', 'grams', 'ml')
            """,
            user
        )

        settings = await db.fetchrow(
            """
            SELECT *
            FROM settings
            WHERE user_id = $1
            """,
            user
        )

    return dict(settings)

@router.post("")
async def save_settings(settings: SettingsModel, user=Depends(get_current_user), db=Depends(get_db)):
    
    await db.execute(
        """
        INSERT INTO settings (
            user_id,
            temperature,
            weight,
            volume,
            dietry_restrictions,
            diets
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET
            temperature = EXCLUDED.temperature,
            weight = EXCLUDED.weight,
            volume = EXCLUDED.volume
            dietry_restrictions = EXLCUDED.dietry_restrictions
            diets = EXCLUDED.diets
        """,
        user,
        settings.temperature,
        settings.weight,
        settings.volume,
        settings.dietry_restrictions,
        settings.diets
    )

    return {"success": True}