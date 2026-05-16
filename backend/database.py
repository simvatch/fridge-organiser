import asyncpg
import os
from fastapi import HTTPException

DATABASE_URL = os.getenv("DATABASE_URL")

pool: asyncpg.Pool | None = None

async def connect_db():
    global pool
    if pool is None:
        pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=1,
            max_size=5,
            statement_cache_size=0,
            command_timeout=60
        )

async def disconnect_db():
    global pool
    if pool:
        await pool.close()
        pool = None

async def get_db():
    if pool is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    async with pool.acquire() as connection:
        async with connection.transaction():
            yield connection