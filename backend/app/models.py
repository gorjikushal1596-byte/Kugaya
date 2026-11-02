import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, default="Priya")
    base_language = Column(String, default="Telugu")
    dialect = Column(String, default="Andhra & Telangana")
    speaking_mode = Column(String, default="bilingual")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    saved_lessons = relationship("SavedLesson", back_populates="user", cascade="all, delete-orphan")

class CurriculumDocument(Base):
    __tablename__ = "curriculum_documents"

    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    filename = Column(String)
    file_type = Column(String)  # 'pdf' | 'txt' | 'notes'
    subject = Column(String, default="Computer Science")
    file_size_bytes = Column(Integer)
    page_count = Column(Integer, default=1)
    chunk_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    chunks = relationship("CurriculumChunk", back_populates="document", cascade="all, delete-orphan")

class CurriculumChunk(Base):
    __tablename__ = "curriculum_chunks"

    id = Column(String, primary_key=True, index=True)
    document_id = Column(String, ForeignKey("curriculum_documents.id"))
    chapter = Column(String, default="General")
    page_number = Column(Integer, default=1)
    chunk_index = Column(Integer)
    content = Column(Text)
    embedding_json = Column(Text, nullable=True)  # JSON-serialized dense embedding vector

    document = relationship("CurriculumDocument", back_populates="chunks")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    title = Column(String, default="New Conversation")
    topic = Column(String, default="Computer Science")
    language = Column(String, default="Telugu")
    dialect = Column(String, default="Andhra & Telangana")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="conversations")
    messages = relationship("ConversationMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="ConversationMessage.created_at")

class ConversationMessage(Base):
    __tablename__ = "conversation_messages"

    id = Column(String, primary_key=True, index=True)
    conversation_id = Column(String, ForeignKey("conversations.id"))
    role = Column(String)  # 'user' | 'assistant'
    query = Column(Text)
    language = Column(String, default="Telugu")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # 5-Tier Structured Explanation (Assistant only)
    simple_explanation = Column(Text, nullable=True)
    real_life_analogy = Column(Text, nullable=True)
    technical_terms = Column(Text, nullable=True)
    exam_ready_answer = Column(Text, nullable=True)
    comprehension_check = Column(Text, nullable=True)
    raw_response = Column(Text, nullable=True)
    latency_ms = Column(Integer, nullable=True)

    conversation = relationship("Conversation", back_populates="messages")

class SavedLesson(Base):
    __tablename__ = "saved_lessons"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    session_id = Column(String, nullable=True)
    title = Column(String)
    category = Column(String, default="Computer Science")
    key_points = Column(Text)
    saved_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="saved_lessons")
