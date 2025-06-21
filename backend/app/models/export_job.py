from sqlalchemy import Column, String, DateTime, Text, JSON, Boolean, ForeignKey, Integer, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
import uuid


class ExportJob(Base):
    __tablename__ = "export_jobs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    
    # Job information
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Export configuration
    export_settings = Column(JSON, default=dict)  # Export parameters
    clip_sequence = Column(JSON, default=list)  # Array of clip IDs in export order
    
    # Output information
    output_path = Column(String(500), nullable=True)
    output_format = Column(String(10), default="mp4")
    output_resolution = Column(String(20), default="1920x1080")
    output_quality = Column(String(20), default="high")
    file_size = Column(Integer, nullable=True)  # Final file size in bytes
    duration = Column(Float, nullable=True)  # Total duration in seconds
    
    # Status and progress
    status = Column(String(50), default="pending", index=True)  # pending, processing, completed, failed
    progress_percentage = Column(Integer, default=0)  # 0-100
    current_step = Column(String(100), nullable=True)  # Current processing step
    error_message = Column(Text, nullable=True)
    
    # Processing metadata
    processing_log = Column(JSON, default=list)  # Array of processing steps/logs
    processing_time = Column(Float, nullable=True)  # Total processing time in seconds
    
    # Relationships
    project = relationship("Project", back_populates="export_jobs")
    
    def __repr__(self):
        return f"<ExportJob(id={self.id}, name='{self.name}', status='{self.status}')>"