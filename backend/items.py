from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.database import get_db

router = APIRouter(prefix="/items", tags=["items"])

class ItemCreate(BaseModel):
    user_id: int
    name: str

@router.post("/add")
async def add_item(item: ItemCreate, db=Depends(get_db)):

    try:

        await db.execute(
            """
            INSERT INTO items (user_id, name)
            VALUES ($1, $2)
            """,
            item.user_id,
            item.name.lower()
        )

        existing = await db.fetchrow(
            """
            SELECT id FROM item_history
            WHERE user_id = $1 AND name = $2
            """,
            item.user_id,
            item.name.lower()
        )

        if not existing:
            await db.execute(
                """
                INSERT INTO item_history (user_id, name)
                VALUES ($1, $2)
                """,
                item.user_id,
                item.name.lower()
            )

        return {"message": "Item added"}

    except Exception as e:
        print("Add item error:", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}")
async def get_items(user_id: int, db=Depends(get_db)):

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

        items = []

        for row in rows:
            items.append({
                "id": row["id"],
                "name": row["name"]
            })

        return {"items": items}

    except Exception as e:
        print("Get items error:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{item_id}")
async def delete_item(item_id: int, db=Depends(get_db)):

    try:
        result = await db.execute(
            """
            DELETE FROM items
            WHERE id = $1
            """,
            item_id
        )

        return {"message": "Item deleted"}

    except Exception as e:
        print("Delete item error:", e)
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/history/{user_id}")
async def get_history(user_id: int, db=Depends(get_db)):

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