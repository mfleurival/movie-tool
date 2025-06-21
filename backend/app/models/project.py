from sqlalchemy import Column, String, DateTime, Text, JSON, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
import uuid


class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    sequence_order = Column(JSON, default=list)  # Array of clip IDs in order
    status = Column(String(50), default="active", index=True)  # active, archived, deleted
    thumbnail_path = Column(String(500), nullable=True)
    
    # Relationships
    characters = relationship("Character", back_populates="project", cascade="all, delete-orphan")
    video_clips = relationship("VideoClip", back_populates="project", cascade="all, delete-orphan")
    settings = relationship("ProjectSettings", back_populates="project", uselist=False, cascade="all, delete-orphan")
    export_jobs = relationship("ExportJob", back_populates="project", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Project(id={self.id}, name='{self.name}', status='{self.status}')>"


class ProjectSettings(Base):
    __tablename__ = "project_settings"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    export_settings = Column(JSON, default=dict)  # Export configuration
    api_preferences = Column(JSON, default=dict)  # Preferred API settings
    default_params = Column(JSON, default=dict)   # Default generation parameters
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="settings")
    
    def __repr__(self):
        return f"<ProjectSettings(id={self.id}, project_id={self.project_id})>"