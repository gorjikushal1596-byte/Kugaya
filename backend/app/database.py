from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings
from app.models import Base, User
import uuid

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    # Seed default user if not exists
    async with AsyncSessionLocal() as session:
        user = await session.get(User, "user_default")
        if not user:
            default_user = User(
                id="user_default",
                name="Priya",
                base_language="Telugu",
                dialect="Andhra & Telangana",
                speaking_mode="bilingual"
            )
            session.add(default_user)
            await session.commit()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
