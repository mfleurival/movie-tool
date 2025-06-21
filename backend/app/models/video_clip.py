from sqlalchemy import Column, String, DateTime, Text, JSON, Boolean, ForeignKey, Integer, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
import uuid


class VideoClip(Base):
    __tablename__ = "video_clips"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    character_id = Column(String(36), ForeignKey("characters.id"), nullable=True, index=True)
    
    # Basic clip information
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    prompt = Column(Text, nullable=False)  # Generation prompt
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Generation details
    api_used = Column(String(50), nullable=True)  # minimax, segmind
    generation_params = Column(JSON, default=dict)  # Parameters used for generation
    generation_time = Column(Float, nullable=True)  # Time taken to generate (seconds)
    
    # File information
    file_path = Column(String(500), nullable=True)  # Path to generated video
    file_size = Column(Integer, nullable=True)  # File size in bytes
    duration = Column(Float, nullable=True)  # Video duration in seconds
    resolution = Column(String(20), nullable=True)  # e.g., "1920x1080"
    format = Column(String(10), nullable=True)  # e.g., "mp4"
    
    # Status and metadata
    status = Column(String(50), default="pending", index=True)  # pending, generating, completed, failed
    error_message = Column(Text, nullable=True)
    thumbnail_path = Column(String(500), nullable=True)
    sequence_position = Column(Integer, nullable=True)  # Position in project sequence
    
    # Processing metadata
    processing_metadata = Column(JSON, default=dict)  # Additional processing info
    
    # Relationships
    project = relationship("Project", back_populates="video_clips")
    character = relationship("Character", back_populates="video_clips")
    
    def __repr__(self):
        return f"<VideoClip(id={self.id}, name='{self.name}', status='{self.status}')>"