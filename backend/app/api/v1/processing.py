from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from ...core.database import get_db
from ...models import ExportJob, VideoClip, Project, Character
from ...services.minimax_api import MinimaxAPIService
from ...services.segmind_api import SegmindAPIService
from ...services.video_processor import VideoProcessor
import logging
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/processing", tags=["processing"])

# Request models
class VideoGenerationRequest(BaseModel):
    project_id: str
    clip_id: str
    prompt: str
    provider: str  # "minimax" or "segmind"
    model_type: str  # "t2v", "i2v", "s2v"
    duration: Optional[int] = 6
    resolution: Optional[str] = "1080p"
    character_id: Optional[str] = None
    reference_image_url: Optional[str] = None
    camera_controls: Optional[dict] = None

class ExportRequest(BaseModel):
    project_id: str
    format: str = "mp4"
    quality: str = "high"
    resolution: str = "1920x1080"
    include_audio: bool = True


@router.get("/jobs", summary="List export jobs")
async def list_export_jobs(
    project_id: str = None,
    status_filter: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Retrieve a list of export jobs with optional filtering.
    """
    try:
        query = db.query(ExportJob)
        
        if project_id:
            query = query.filter(ExportJob.project_id == project_id)
        if status_filter:
            query = query.filter(ExportJob.status == status_filter)
        
        jobs = query.offset(skip).limit(limit).all()
        return {"jobs": jobs, "total": len(jobs)}
    except Exception as e:
        logger.error(f"Error listing export jobs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve export jobs"
        )


@router.get("/jobs/{job_id}", summary="Get export job by ID")
async def get_export_job(
    job_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieve a specific export job by its ID.
    """
    try:
        job = db.query(ExportJob).filter(ExportJob.id == job_id).first()
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Export job not found"
            )
        return job
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving export job {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve export job"
        )


@router.post("/generate-video", summary="Generate video clip")
async def generate_video(
    request: VideoGenerationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Generate a video clip using AI providers (MiniMax or Segmind).
    """
    try:
        # Validate project and clip exist
        project = db.query(Project).filter(Project.id == request.project_id).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        clip = db.query(VideoClip).filter(VideoClip.id == request.clip_id).first()
        if not clip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Video clip not found"
            )
        
        # Validate character if provided
        character = None
        if request.character_id:
            character = db.query(Character).filter(Character.id == request.character_id).first()
            if not character:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Character not found"
                )
        
        # Update clip status to processing
        clip.status = "processing"
        db.commit()
        
        # Start background video generation task
        task_id = str(uuid.uuid4())
        background_tasks.add_task(
            _generate_video_background,
            task_id,
            request,
            character
        )
        
        return {
            "task_id": task_id,
            "message": "Video generation started",
            "clip_id": request.clip_id,
            "status": "processing"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting video generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start video generation"
        )


@router.post("/export", summary="Start export job")
async def start_export(
    request: ExportRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Start a new export job for a project.
    """
    try:
        # Validate project exists
        project = db.query(Project).filter(Project.id == request.project_id).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Create export job
        export_job = ExportJob(
            id=str(uuid.uuid4()),
            project_id=request.project_id,
            status="pending",
            export_format=request.format,
            export_quality=request.quality,
            export_resolution=request.resolution,
            settings={
                "include_audio": request.include_audio,
                "format": request.format,
                "quality": request.quality,
                "resolution": request.resolution
            }
        )
        
        db.add(export_job)
        db.commit()
        
        # Start background export task
        background_tasks.add_task(
            _export_project_background,
            export_job.id,
            request
        )
        
        return {
            "job_id": export_job.id,
            "message": "Export job started",
            "status": "pending"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting export: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start export"
        )


@router.post("/jobs/{job_id}/cancel", summary="Cancel export job")
async def cancel_export_job(
    job_id: str,
    db: Session = Depends(get_db)
):
    """
    Cancel a running export job.
    """
    try:
        job = db.query(ExportJob).filter(ExportJob.id == job_id).first()
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Export job not found"
            )
        
        if job.status not in ["pending", "processing"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot cancel job that is not pending or processing"
            )
        
        # Placeholder implementation - actual cancellation logic would go here
        job.status = "cancelled"
        db.commit()
        
        return {"message": "Export job cancelled successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling export job {job_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel export job"
        )


@router.delete("/jobs/{job_id}", summary="Delete export job")
async def delete_export_job(
    job_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete an export job and its associated files.
    """
    try:
        job = db.query(ExportJob).filter(ExportJob.id == job_id).first()
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Export job not found"
            )
        
        db.delete(job)
        db.commit()
        return {"message": "Export job deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting export job {job_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete export job"
        )


@router.get("/status", summary="Get processing system status")
async def get_processing_status(db: Session = Depends(get_db)):
    """
    Get the current status of the processing system.
    """
    try:
        # Count active jobs
        active_jobs = db.query(ExportJob).filter(
            ExportJob.status.in_(["pending", "processing"])
        ).count()
        
        # Count processing clips
        processing_clips = db.query(VideoClip).filter(
            VideoClip.status == "processing"
        ).count()
        
        return {
            "status": "operational",
            "active_export_jobs": active_jobs,
            "processing_clips": processing_clips,
            "total_active": active_jobs + processing_clips
        }
    except Exception as e:
        logger.error(f"Error getting processing status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get processing status"
        )


# Background task functions
async def _generate_video_background(
    task_id: str,
    request: VideoGenerationRequest,
    character: Optional[Character]
):
    """
    Background task for video generation.
    """
    from ...core.database import SessionLocal
    
    db = SessionLocal()
    try:
        # Get the clip
        clip = db.query(VideoClip).filter(VideoClip.id == request.clip_id).first()
        if not clip:
            logger.error(f"Clip {request.clip_id} not found for task {task_id}")
            return
        
        # Initialize the appropriate API service
        if request.provider == "minimax":
            api_service = MinimaxAPIService()
        elif request.provider == "segmind":
            api_service = SegmindAPIService()
        else:
            logger.error(f"Unknown provider: {request.provider}")
            clip.status = "failed"
            clip.error_message = f"Unknown provider: {request.provider}"
            db.commit()
            return
        
        # Prepare generation parameters
        generation_params = {
            "prompt": request.prompt,
            "duration": request.duration,
            "resolution": request.resolution
        }
        
        # Add character reference if provided
        if character and character.reference_image_path:
            generation_params["reference_image"] = character.reference_image_path
        elif request.reference_image_url:
            generation_params["reference_image"] = request.reference_image_url
        
        # Add camera controls if provided
        if request.camera_controls:
            generation_params["camera_controls"] = request.camera_controls
        
        # Generate video based on model type
        try:
            if request.model_type == "t2v":
                result = await api_service.generate_text_to_video(**generation_params)
            elif request.model_type == "i2v":
                if not generation_params.get("reference_image"):
                    raise ValueError("Reference image required for I2V generation")
                result = await api_service.generate_image_to_video(**generation_params)
            elif request.model_type == "s2v":
                if not generation_params.get("reference_image"):
                    raise ValueError("Reference image required for S2V generation")
                result = await api_service.generate_subject_to_video(**generation_params)
            else:
                raise ValueError(f"Unknown model type: {request.model_type}")
            
            # Update clip with results
            clip.status = "completed"
            clip.video_path = result.get("video_path")
            clip.thumbnail_path = result.get("thumbnail_path")
            clip.metadata = result.get("metadata", {})
            
        except Exception as e:
            logger.error(f"Video generation failed for task {task_id}: {e}")
            clip.status = "failed"
            clip.error_message = str(e)
        
        db.commit()
        
    except Exception as e:
        logger.error(f"Background video generation task {task_id} failed: {e}")
    finally:
        db.close()


async def _export_project_background(job_id: str, request: ExportRequest):
    """
    Background task for project export.
    """
    from ...core.database import SessionLocal
    
    db = SessionLocal()
    try:
        # Get the export job
        job = db.query(ExportJob).filter(ExportJob.id == job_id).first()
        if not job:
            logger.error(f"Export job {job_id} not found")
            return
        
        # Update status to processing
        job.status = "processing"
        db.commit()
        
        # Get project and clips
        project = db.query(Project).filter(Project.id == request.project_id).first()
        if not project:
            job.status = "failed"
            job.error_message = "Project not found"
            db.commit()
            return
        
        clips = db.query(VideoClip).filter(
            VideoClip.project_id == request.project_id,
            VideoClip.status == "completed"
        ).order_by(VideoClip.sequence_number).all()
        
        if not clips:
            job.status = "failed"
            job.error_message = "No completed clips found for export"
            db.commit()
            return
        
        # Initialize video processor
        video_processor = VideoProcessor()
        
        try:
            # Export the project
            result = await video_processor.export_project(
                clips=clips,
                output_format=request.format,
                quality=request.quality,
                resolution=request.resolution,
                include_audio=request.include_audio
            )
            
            # Update job with results
            job.status = "completed"
            job.output_path = result.get("output_path")
            job.file_size = result.get("file_size")
            job.metadata = result.get("metadata", {})
            
        except Exception as e:
            logger.error(f"Export failed for job {job_id}: {e}")
            job.status = "failed"
            job.error_message = str(e)
        
        db.commit()
        
    except Exception as e:
        logger.error(f"Background export task {job_id} failed: {e}")
    finally:
        db.close()