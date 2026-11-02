import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, default="Priya")
    base_language = Column(String, default="Telugu")
    dialect = Column(String, default="Andhra & Telangana")
    speaking_mode = Column(String, default="bilingual")  # bilingual | immersion
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    sessions = relationship("LearningSession", back_populates="user", cascade="all, delete-orphan")
    saved_lessons = relationship("SavedLesson", back_populates="user", cascade="all, delete-orphan")

class LearningSession(Base):
    __tablename__ = "learning_sessions"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    topic = Column(String)
    prompt_query = Column(Text)
    language = Column(String, default="Telugu")
    session_type = Column(String, default="text") # text | voice
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # 4-Card Multi-modal Explanation model
    simple_explanation = Column(Text)
    real_life_analogy = Column(Text)
    technical_terms = Column(Text)
    exam_ready_answer = Column(Text)
    
    user = relationship("User", back_populates="sessions")

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
