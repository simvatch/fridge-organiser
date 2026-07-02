from fastapi import APIRouter, Depends
from backend.database import get_db
from backend.auth import get_current_user
import json

router = APIRouter(prefix="/favourites", tags=["favourites"])

@router.get("")
async def get_favourites(user=Depends(get_current_user), db=Depends(get_db)):
    rows = await db.fetch(
        """
        SELECT id, recipe
        FROM favourites
        WHERE user_id = $1 
        ORDER BY created_at DESC
        """,
        user
    )

    return {"favourites": [{"id": row["id"], **json.loads(row["recipe"])} for row in rows]}

@router.post("")
async def add_favourites(data: dict, user=Depends(get_current_user), db=Depends(get_db)):
    row = await db.fetchrow(
        """
        INSERT INTO favourites (user_id, recipe)
        VALUES ($1, $2)
        RETURNING id
        """,
        user,
        json.dumps(data)
    )

    return {"id": row["id"]}

@router.delete("/{favourite_id}")
async def delete_favourites(favourite_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    await db.execute(
        """
        DELETE FROM favourites
        WHERE id = $1 AND user_id = $2
        """,
        favourite_id,
        user
    )

    return{"success": True}