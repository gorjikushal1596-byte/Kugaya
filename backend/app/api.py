import uuid
import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User, SavedLesson
from app.schemas import (
    TutorInquiryRequest, TutorInquiryResponse,
    ConversationSummary, ConversationDetail,
    STTResponse, TTSRequest, TTSResponse,
    UserProfileUpdate, UserProfileResponse, SavedLessonItem
)
from app.services.speech_service import gnani_speech_service
from app.services.reasoning_service import reasoning_service
from app.services.conversation_service import conversation_service

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
        streak_days=user.streak_days if hasattr(user, 'streak_days') else 4,
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

# Core AI Tutor Reasoning Endpoint
@router.post("/tutor/query", response_model=TutorInquiryResponse)
async def submit_query(req: TutorInquiryRequest, db: AsyncSession = Depends(get_db)):
    explanation, conv_id, msg_id, latency_ms = await reasoning_service.answer_student_inquiry(
        db=db,
        query=req.query,
        conversation_id=req.conversation_id,
        language=req.language or "Telugu",
        dialect=req.dialect or "Andhra & Telangana",
        topic=req.topic or "Computer Science"
    )

    return TutorInquiryResponse(
        conversation_id=conv_id,
        message_id=msg_id,
        topic=req.topic or "Computer Science",
        language=req.language or "Telugu",
        query=req.query,
        explanation=explanation,
        provider="baseten/muse-spark-open",
        latency_ms=latency_ms,
        created_at=datetime.datetime.utcnow()
    )

# Conversation Management Endpoints
@router.get("/conversations", response_model=list[ConversationSummary])
async def list_conversations(db: AsyncSession = Depends(get_db)):
    return await conversation_service.list_conversations(db=db, user_id="user_default")

@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(conversation_id: str, db: AsyncSession = Depends(get_db)):
    conv = await conversation_service.get_conversation_detail(db=db, conversation_id=conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv

# Voice STT & TTS Endpoints
@router.post("/voice/stt", response_model=STTResponse)
async def speech_to_text(
    audio: UploadFile = File(...),
    language: str = Form("te")
):
    audio_content = await audio.read()
    try:
        stt_res = await gnani_speech_service.transcribe_audio(
            audio_bytes=audio_content,
            filename=audio.filename or "audio.wav",
            content_type=audio.content_type or "audio/wav",
            language=language
        )
        return stt_res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gnani STT service error: {str(e)}")

@router.post("/voice/tts", response_model=TTSResponse)
async def text_to_speech(req: TTSRequest):
    tts_res = await gnani_speech_service.synthesize_speech(
        text=req.text,
        language=req.language or "te",
        voice_gender=req.voice_gender or "female"
    )
    return tts_res

# Saved Lessons Endpoints
@router.get("/saved", response_model=list[SavedLessonItem])
async def get_saved_lessons(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SavedLesson).order_by(SavedLesson.saved_at.desc())
    )
    lessons = result.scalars().all()
    
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
