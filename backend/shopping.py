from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.database import get_db
from backend.auth import get_current_user

router = APIRouter(prefix="/shopping", tags=["shopping"])

class ShoppingItemCreate(BaseModel):
    name: str

@router.get("/")
async def get_shopping(user_id: int = Depends(get_current_user), db=Depends(get_db)):
    try:
        rows = await db.fetch(
            """
            SELECT id, name
            FROM shopping_list
            WHERE user_id = $1
            ORDER BY created_at DESC
            """,
            user_id
        )

        return {"items": [{"id": row["id"], "name": row["name"]} for row in rows]}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/add")
async def add_shopping(item: ShoppingItemCreate, user_id = Depends(get_current_user), db=Depends(get_db)):
    try: 
        await db.execute(
            """
            INSERT INTO shopping_list (user_id, name)
            VALUES ($1, $2)
            """,
            user_id,
            item.name.lower()
        )
        return {"message": "Item added to shopping list"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.delete("/{item_id}")
async def delete_shopping(item_id: int, user_id: int = Depends(get_current_user), db=Depends(get_db)):
    try: 
        await db.execute(
            """
            DELETE FROM shopping_list 
            WHERE id = $1 AND user_id = $2
            """,
            item_id,
            user_id
        )
        return {"message": "Item deleted from shopping list"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))