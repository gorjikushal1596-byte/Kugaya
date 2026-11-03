import uuid
import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User, SavedLesson
from app.schemas import (
    TutorInquiryRequest, TutorInquiryResponse,
    ConversationCreateRequest, ConversationSummary, ConversationDetail,
    STTResponse, TTSRequest, TTSResponse,
    UserProfileUpdate, UserProfileResponse,
    SavedLessonItem, SavedLessonCreate, DataPurgeResponse,
    CurriculumUploadResponse, CurriculumDocumentSummary
)
from app.services.speech_service import gnani_speech_service
from app.services.reasoning_service import reasoning_service
from app.services.conversation_service import conversation_service
from app.services.rag_service import curriculum_rag_service

router = APIRouter()

# --- User Profile & Preferences ---

@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(db: AsyncSession = Depends(get_db)):
    user = await db.get(User, "user_default")
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")
    return UserProfileResponse(
        id=user.id,
        name=user.name,
        base_language=user.base_language,
        dialect=user.dialect,
        speaking_mode=user.speaking_mode,
        code_mixing_style=getattr(user, "code_mixing_style", "balanced_50_50"),
        explanation_complexity=getattr(user, "explanation_complexity", "intermediate"),
        technical_terminology_mode=getattr(user, "technical_terminology_mode", "english_standard"),
        audio_playback_auto=bool(getattr(user, "audio_playback_auto", 0)),
        speech_playback_speed=float(getattr(user, "speech_playback_speed", 1.0)),
        streak_days=getattr(user, "streak_days", 4),
        points=getattr(user, "points", 1250),
        daily_goal_minutes=getattr(user, "daily_goal_minutes", 20)
    )

@router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(payload: UserProfileUpdate, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, "user_default")
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")
        
    if payload.name is not None:
        user.name = payload.name.strip()
    if payload.base_language is not None:
        user.base_language = payload.base_language
    if payload.dialect is not None:
        user.dialect = payload.dialect
    if payload.speaking_mode is not None:
        user.speaking_mode = payload.speaking_mode
    if payload.code_mixing_style is not None:
        user.code_mixing_style = payload.code_mixing_style
    if payload.explanation_complexity is not None:
        user.explanation_complexity = payload.explanation_complexity
    if payload.technical_terminology_mode is not None:
        user.technical_terminology_mode = payload.technical_terminology_mode
    if payload.audio_playback_auto is not None:
        user.audio_playback_auto = 1 if payload.audio_playback_auto else 0
    if payload.speech_playback_speed is not None:
        user.speech_playback_speed = payload.speech_playback_speed
    if payload.daily_goal_minutes is not None:
        user.daily_goal_minutes = payload.daily_goal_minutes
    if payload.streak_days is not None:
        user.streak_days = payload.streak_days
    if payload.points is not None:
        user.points = payload.points
        
    user.updated_at = datetime.datetime.now(datetime.timezone.utc)
    await db.commit()
    await db.refresh(user)

    return UserProfileResponse(
        id=user.id,
        name=user.name,
        base_language=user.base_language,
        dialect=user.dialect,
        speaking_mode=user.speaking_mode,
        code_mixing_style=getattr(user, "code_mixing_style", "balanced_50_50"),
        explanation_complexity=getattr(user, "explanation_complexity", "intermediate"),
        technical_terminology_mode=getattr(user, "technical_terminology_mode", "english_standard"),
        audio_playback_auto=bool(getattr(user, "audio_playback_auto", 0)),
        speech_playback_speed=float(getattr(user, "speech_playback_speed", 1.0)),
        streak_days=getattr(user, "streak_days", 4),
        points=getattr(user, "points", 1250),
        daily_goal_minutes=getattr(user, "daily_goal_minutes", 20)
    )

@router.delete("/profile/data", response_model=DataPurgeResponse)
async def purge_student_data(db: AsyncSession = Depends(get_db)):
    """
    Privacy & Data Reset: Deletes all student conversations and saved lessons.
    """
    result = await conversation_service.purge_user_data(db, user_id="user_default")
    return DataPurgeResponse(
        status="success",
        conversations_deleted=result["conversations_deleted"],
        saved_lessons_deleted=result["saved_lessons_deleted"],
        message=f"Purged {result['conversations_deleted']} conversations and {result['saved_lessons_deleted']} saved lessons."
    )

# --- Core AI Tutor Reasoning ---

@router.post("/tutor/query", response_model=TutorInquiryResponse)
async def submit_query(req: TutorInquiryRequest, db: AsyncSession = Depends(get_db)):
    explanation, conv_id, msg_id, latency_ms, has_grounding = await reasoning_service.answer_student_inquiry(
        db=db,
        query=req.query,
        conversation_id=req.conversation_id,
        language=req.language or "Telugu",
        dialect=req.dialect or "Andhra & Telangana",
        topic=req.topic or "Computer Science",
        use_curriculum_rag=req.use_curriculum_rag if req.use_curriculum_rag is not None else True
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
        has_curriculum_grounding=has_grounding,
        created_at=datetime.datetime.now(datetime.timezone.utc)
    )

# --- Conversation Management ---

@router.get("/conversations", response_model=List[ConversationSummary])
async def list_conversations(
    q: Optional[str] = Query(None, description="Search keyword in title or topic"),
    db: AsyncSession = Depends(get_db)
):
    return await conversation_service.list_conversations(db=db, user_id="user_default", search_query=q)

@router.post("/conversations", response_model=ConversationSummary)
async def create_conversation(
    req: ConversationCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    return await conversation_service.create_conversation(
        db=db,
        user_id="user_default",
        title=req.title or "New Conversation",
        topic=req.topic or "Computer Science",
        language=req.language or "Telugu",
        dialect=req.dialect or "Andhra & Telangana"
    )

@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(conversation_id: str, db: AsyncSession = Depends(get_db)):
    conv = await conversation_service.get_conversation_detail(db=db, conversation_id=conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, db: AsyncSession = Depends(get_db)):
    deleted = await conversation_service.delete_conversation(db=db, conversation_id=conversation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"status": "success", "deleted_conversation_id": conversation_id}

# --- Saved Lessons Management ---

@router.get("/saved", response_model=List[SavedLessonItem])
async def get_saved_lessons(
    q: Optional[str] = Query(None, description="Search keyword in title or concepts"),
    category: Optional[str] = Query(None, description="Category filter"),
    db: AsyncSession = Depends(get_db)
):
    return await conversation_service.list_saved_lessons(
        db=db,
        user_id="user_default",
        search_query=q,
        category=category
    )

@router.post("/saved", response_model=SavedLessonItem)
async def save_lesson(item: SavedLessonCreate, db: AsyncSession = Depends(get_db)):
    return await conversation_service.save_lesson(db=db, user_id="user_default", item=item)

@router.get("/saved/{lesson_id}", response_model=SavedLessonItem)
async def get_single_saved_lesson(lesson_id: str, db: AsyncSession = Depends(get_db)):
    lesson = await conversation_service.get_saved_lesson(db=db, lesson_id=lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Saved lesson not found")
    return lesson

@router.delete("/saved/{lesson_id}")
async def delete_saved_lesson(lesson_id: str, db: AsyncSession = Depends(get_db)):
    deleted = await conversation_service.delete_saved_lesson(db=db, lesson_id=lesson_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Saved lesson not found")
    return {"status": "success", "deleted_lesson_id": lesson_id}

# --- Voice STT & TTS Endpoints ---

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
    try:
        tts_res = await gnani_speech_service.synthesize_speech(
            text=req.text,
            language=req.language or "te",
            voice_gender=req.voice_gender or "female",
            speed=req.speed or 1.0
        )
        return tts_res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gnani TTS service error: {str(e)}")

# --- Curriculum Grounding & RAG Endpoints ---

@router.post("/curriculum/upload", response_model=CurriculumUploadResponse)
async def upload_curriculum_document(
    file: UploadFile = File(...),
    title: str = Form(None),
    subject: str = Form("Computer Science"),
    db: AsyncSession = Depends(get_db)
):
    content = await file.read()
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds maximum allowed upload size of 25MB.")

    filename = file.filename or "curriculum_doc.txt"
    doc_title = title.strip() if title and title.strip() else filename

    try:
        doc_summary = await curriculum_rag_service.ingest_document(
            db=db,
            file_bytes=content,
            filename=filename,
            title=doc_title,
            subject=subject
        )
        return CurriculumUploadResponse(
            document_id=doc_summary.id,
            title=doc_summary.title,
            chunks_created=doc_summary.chunk_count,
            message=f"Successfully ingested and indexed '{doc_summary.title}' into {doc_summary.chunk_count} curriculum chunks."
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process curriculum document: {str(e)}")

@router.get("/curriculum/documents", response_model=List[CurriculumDocumentSummary])
async def list_curriculum_documents(db: AsyncSession = Depends(get_db)):
    return await curriculum_rag_service.list_documents(db)

@router.delete("/curriculum/documents/{document_id}")
async def delete_curriculum_document(document_id: str, db: AsyncSession = Depends(get_db)):
    deleted = await curriculum_rag_service.delete_document(db, document_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Curriculum document not found.")
    return {"status": "success", "deleted_document_id": document_id}
