from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.database import get_db
from backend.auth import get_current_user
from datetime import date

router = APIRouter(prefix="/items", tags=["items"])

class ItemCreate(BaseModel):
    name: str
    expires_at: str | None = None

@router.post("/add")
async def add_item(item: ItemCreate, user_id: int = Depends(get_current_user), db=Depends(get_db)):

    try:

        await db.execute(
            """
            INSERT INTO items (user_id, name, expires_at)
            VALUES ($1, $2, $3)
            """,
            user_id,
            item.name.lower(),
            date.fromisoformat(item.expires_at) if item.expires_at else None
        )

        existing = await db.fetchrow(
            """
            SELECT id FROM item_history
            WHERE user_id = $1 AND name = $2
            """,
            user_id,
            item.name.lower()
        )

        if not existing:
            await db.execute(
                """
                INSERT INTO item_history (user_id, name)
                VALUES ($1, $2)
                """,
                user_id,
                item.name.lower()
            )

        return {"message": "Item added"}

    except Exception as e:
        print("Add item error:", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_items(user_id: int = Depends(get_current_user), db=Depends(get_db)):

    try:
        rows = await db.fetch(
            """
            SELECT id, name
            FROM items
            WHERE user_id = $1
            ORDER BY created_at DESC
            """,
            user_id
        )

        items = [
            {
                "id": row["id"],
                "name": row["name"],
                "expires_at": row["expires_at"].isoformat() if row["expires_at"] else None
            }
            for row in rows
        ]

        return {"items": items}

    except Exception as e:
        print("Get items error:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{item_id}")
async def delete_item(item_id: int, user_id: int = Depends(get_current_user), db=Depends(get_db)):

    try:
        result = await db.execute(
            """
            DELETE FROM items
            WHERE id = $1 and user_id = $2
            """,
            item_id,
            user_id
        )

        return {"message": "Item deleted"}

    except Exception as e:
        print("Delete item error:", e)
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/history")
async def get_history(user_id: int = Depends(get_current_user), db=Depends(get_db)):

    try:
        rows = await db.fetch(
            """
            SELECT name
            FROM item_history
            WHERE user_id = $1
            ORDER BY name ASC
            """,
            user_id
        )

        history = [row["name"] for row in rows]

        return {"history": history}
    
    except Exception as e:
        print("History error:", e)
        raise HTTPException(status_code=500, detail=str(e))
    
@router.delete("/history/{name}")
async def delete_history_item(name: str, user_id: int = Depends(get_current_user), db=Depends(get_db)):
    try: 
        await db.execute(
            """
            DELETE FROM item_history
            WHERE user_id = $1 AND name = $2
            """,
            user_id,
            name.lower()
        )
        return {"message": "History item deleted"}
    
    except Exception as e:
        print("History delete error:", e)
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/dismissed")
async def get_dismissed(user_id: int = Depends(get_current_user), db=Depends(get_db)):
    try:
        rows = await db.fetch(
            """
            SELECT name
            FROM dismissed_shopping_items
            WHERE user_id = $1
            """,
            user_id
        )
        return {"dismissed": [row["name"] for row in rows]}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/dismissed")
async def add_dismissed(item: ItemCreate, user_id: int = Depends(get_current_user), db=Depends(get_db)):
    try:
        await db.execute(
            """
            INSERT INTO dismissed_shopping_items (user_id, name)
            VALUES ($1, $2)
            ON CONFLICT (user_id, name) DO NOTHING
            """,
            user_id,
            item.name.lower()
        )
        return {"message": "Item dismissed"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.delete("/dismissed")
async def clear_dismissed(user_id: int = Depends(get_current_user), db=Depends(get_db)):
    try:
        await db.execute(
            """
            DELETE FROM dismissed_shopping_items
            WHERE user_id = $1
            """,
            user_id
        )
        return {"message": "Dismissed items cleared"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))