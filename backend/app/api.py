import uuid
import datetime
import json
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User, LearningSession, SavedLesson
from app.schemas import (
    QueryRequest, QueryResponse, STTResponse, TTSRequest, TTSResponse,
    UserProfileUpdate, UserProfileResponse, SavedLessonItem, ExplanationCards
)
from app.services.speech_service import gnani_adapter
from app.services.ai_reasoning_service import ai_reasoning_adapter

router = APIRouter()

@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(db: AsyncSession = Depends(get_db)):
    user = await db.get(User, "user_default")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserProfileResponse(
        id=user.id,
        name=user.name,
        base_language=user.base_language,
        dialect=user.dialect,
        speaking_mode=user.speaking_mode,
        streak_days=4,
        points=1250
    )

@router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(payload: UserProfileUpdate, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, "user_default")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if payload.name is not None:
        user.name = payload.name
    if payload.base_language is not None:
        user.base_language = payload.base_language
    if payload.dialect is not None:
        user.dialect = payload.dialect
    if payload.speaking_mode is not None:
        user.speaking_mode = payload.speaking_mode
        
    await db.commit()
    await db.refresh(user)
    return UserProfileResponse(
        id=user.id,
        name=user.name,
        base_language=user.base_language,
        dialect=user.dialect,
        speaking_mode=user.speaking_mode,
        streak_days=4,
        points=1250
    )

@router.post("/tutor/query", response_model=QueryResponse)
async def submit_query(req: QueryRequest, db: AsyncSession = Depends(get_db)):
    # 1. Generate multi-card explanation with provider metrics
    explanation, provider_tag, latency_ms = await ai_reasoning_adapter.generate_explanation(
        query=req.query,
        language=req.language or "Telugu",
        dialect=req.dialect or "Andhra & Telangana"
    )
    
    # 2. Persist session
    session_id = f"sess_{uuid.uuid4().hex[:8]}"
    db_session = LearningSession(
        id=session_id,
        user_id="user_default",
        topic=req.topic or "Computer Science",
        prompt_query=req.query,
        language=req.language or "Telugu",
        session_type="text",
        simple_explanation=explanation.simple_explanation,
        real_life_analogy=explanation.real_life_analogy,
        technical_terms=json.dumps(explanation.technical_terms),
        exam_ready_answer=explanation.exam_ready_answer
    )
    db.add(db_session)
    await db.commit()
    
    return QueryResponse(
        session_id=session_id,
        topic=req.topic or "Computer Science",
        language=req.language or "Telugu",
        query=req.query,
        explanation=explanation,
        provider=provider_tag,
        latency_ms=latency_ms,
        created_at=datetime.datetime.utcnow()
    )

@router.post("/voice/stt", response_model=STTResponse)
async def speech_to_text(
    audio: UploadFile = File(...),
    language: str = Form("te")
):
    audio_content = await audio.read()
    stt_res = await gnani_adapter.transcribe_audio(audio_content, language=language)
    return stt_res

@router.post("/voice/tts", response_model=TTSResponse)
async def text_to_speech(req: TTSRequest):
    tts_res = await gnani_adapter.synthesize_speech(
        text=req.text,
        language=req.language or "te",
        voice_gender=req.voice_gender or "female"
    )
    return tts_res

@router.get("/history", response_model=list[QueryResponse])
async def get_learning_history(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(LearningSession).order_by(LearningSession.created_at.desc()).limit(20)
    )
    sessions = result.scalars().all()
    
    output = []
    for s in sessions:
        terms = []
        try:
            terms = json.loads(s.technical_terms) if s.technical_terms else []
        except Exception:
            terms = []
            
        output.append(QueryResponse(
            session_id=s.id,
            topic=s.topic or "Topic",
            language=s.language or "Telugu",
            query=s.prompt_query,
            explanation=ExplanationCards(
                simple_explanation=s.simple_explanation or "",
                real_life_analogy=s.real_life_analogy or "",
                technical_terms=terms,
                exam_ready_answer=s.exam_ready_answer or ""
            ),
            created_at=s.created_at
        ))
    return output

@router.get("/saved", response_model=list[SavedLessonItem])
async def get_saved_lessons(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SavedLesson).order_by(SavedLesson.saved_at.desc())
    )
    lessons = result.scalars().all()
    
    # If empty, provide high-yield seed lessons
    if not lessons:
        return [
            SavedLessonItem(
                id="saved_1",
                title="Pointers vs References (Tenglish)",
                category="C++ Systems",
                key_points="Pointer stores explicit memory address. Reference acts as alias to an already allocated identifier.",
                saved_at=datetime.datetime.utcnow() - datetime.timedelta(days=1)
            ),
            SavedLessonItem(
                id="saved_2",
                title="TCP vs UDP Transmission (Hinglish)",
                category="Networking",
                key_points="TCP guarantees ordered three-way handshake delivery; UDP streams faster with zero recovery overhead.",
                saved_at=datetime.datetime.utcnow() - datetime.timedelta(days=3)
            )
        ]
        
    return [
        SavedLessonItem(
            id=l.id,
            title=l.title,
            category=l.category,
            key_points=l.key_points,
            saved_at=l.saved_at
        ) for l in lessons
    ]

@router.post("/saved")
async def save_lesson(item: SavedLessonItem, db: AsyncSession = Depends(get_db)):
    new_l = SavedLesson(
        id=item.id or f"saved_{uuid.uuid4().hex[:8]}",
        user_id="user_default",
        title=item.title,
        category=item.category,
        key_points=item.key_points
    )
    db.add(new_l)
    await db.commit()
    return {"status": "success", "id": new_l.id}

