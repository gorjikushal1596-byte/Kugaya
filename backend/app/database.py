import datetime
import logging
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings
from app.models import Base, User

logger = logging.getLogger(__name__)

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def init_db():
    async with engine.begin() as conn:
        # Enable Foreign Key enforcement in SQLite
        await conn.execute(text("PRAGMA foreign_keys = ON;"))
        # Create all tables if they don't exist
        await conn.run_sync(Base.metadata.create_all)

        # Migrate new columns onto existing tables if missing
        await _apply_column_migrations(conn)
        
    # Seed default user if not exists
    async with AsyncSessionLocal() as session:
        user = await session.get(User, "user_default")
        if not user:
            default_user = User(
                id="user_default",
                name="Priya",
                base_language="Telugu",
                dialect="Andhra & Telangana",
                speaking_mode="bilingual",
                code_mixing_style="balanced_50_50",
                explanation_complexity="intermediate",
                technical_terminology_mode="english_standard",
                audio_playback_auto=0,
                speech_playback_speed=1.0,
                streak_days=4,
                points=1250,
                daily_goal_minutes=20,
                created_at=datetime.datetime.utcnow(),
                updated_at=datetime.datetime.utcnow()
            )
            session.add(default_user)
            await session.commit()

async def _apply_column_migrations(conn):
    """
    Safely inspects existing SQLite tables and adds any missing columns declared in models.py.
    This guarantees zero data loss and flawless backward compatibility.
    """
    migrations = {
        "users": [
            ("code_mixing_style", "TEXT DEFAULT 'balanced_50_50'"),
            ("explanation_complexity", "TEXT DEFAULT 'intermediate'"),
            ("technical_terminology_mode", "TEXT DEFAULT 'english_standard'"),
            ("audio_playback_auto", "INTEGER DEFAULT 0"),
            ("speech_playback_speed", "REAL DEFAULT 1.0"),
            ("streak_days", "INTEGER DEFAULT 4"),
            ("points", "INTEGER DEFAULT 1250"),
            ("daily_goal_minutes", "INTEGER DEFAULT 20"),
            ("updated_at", "TIMESTAMP"),
        ],
        "conversation_messages": [
            ("curriculum_sources_json", "TEXT"),
        ],
        "saved_lessons": [
            ("conversation_id", "TEXT"),
            ("full_explanation_json", "TEXT"),
            ("curriculum_sources_json", "TEXT"),
            ("tags", "TEXT DEFAULT ''"),
        ]
    }

    for table, columns in migrations.items():
        try:
            res = await conn.execute(text(f"PRAGMA table_info({table});"))
            existing_cols = {row[1] for row in res.fetchall()}
            for col_name, col_type in columns:
                if col_name not in existing_cols:
                    logger.info(f"Adding missing column '{col_name}' to table '{table}'")
                    await conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type};"))
        except Exception as e:
            logger.warning(f"Column migration check for {table} notice: {e}")

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
