from sqlalchemy import Column, String, DateTime, Text, JSON, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
import uuid


class Character(Base):
    __tablename__ = "characters"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Character appearance and voice settings
    appearance_description = Column(Text, nullable=True)
    voice_settings = Column(JSON, default=dict)  # Voice configuration for TTS
    reference_images = Column(JSON, default=list)  # Array of image paths
    
    # Generation preferences
    preferred_api = Column(String(50), default="minimax")  # minimax, segmind
    generation_params = Column(JSON, default=dict)  # API-specific parameters
    
    # Status and metadata
    is_active = Column(Boolean, default=True)
    thumbnail_path = Column(String(500), nullable=True)
    
    # Relationships
    project = relationship("Project", back_populates="characters")
    video_clips = relationship("VideoClip", back_populates="character")
    
    def __repr__(self):
        return f"<Character(id={self.id}, name='{self.name}', project_id={self.project_id})>"