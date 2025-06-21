from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from ...core.database import get_db
from ...models import VideoClip, Project, Character
import logging
import uuid
import json

logger = logging.getLogger(__name__)

# Request models
class ClipGenerateRequest(BaseModel):
    project_id: str
    prompt: str
    provider: str  # "minimax" or "segmind"
    model_type: str  # "t2v", "i2v", "s2v"
    duration: Optional[int] = 6
    resolution: Optional[str] = "1080p"
    character_id: Optional[str] = None
    reference_image_url: Optional[str] = None
    camera_controls: Optional[dict] = None
    sequence_number: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None

router = APIRouter(prefix="/clips", tags=["clips"])


@router.get("/", summary="List all video clips")
async def list_clips(
    project_id: str = None,
    character_id: str = None,
    status_filter: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Retrieve a list of video clips with optional filtering.
    """
    try:
        query = db.query(VideoClip)
        
        if project_id:
            query = query.filter(VideoClip.project_id == project_id)
        if character_id:
            query = query.filter(VideoClip.character_id == character_id)
        if status_filter:
            query = query.filter(VideoClip.status == status_filter)
        
        clips = query.offset(skip).limit(limit).all()
        return {"clips": clips, "total": len(clips)}
    except Exception as e:
        logger.error(f"Error listing clips: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve clips"
        )


@router.get("/{clip_id}", summary="Get clip by ID")
async def get_clip(
    clip_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieve a specific video clip by its ID.
    """
    try:
        clip = db.query(VideoClip).filter(VideoClip.id == clip_id).first()
        if not clip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Clip not found"
            )
        return clip
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving clip {clip_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve clip"
        )


@router.post("/", summary="Create new video clip")
async def create_clip(
    db: Session = Depends(get_db)
):
    """
    Create a new video clip.
    Note: This is a placeholder endpoint. Full implementation will include request models.
    """
    try:
        # Placeholder implementation
        return {"message": "Clip creation endpoint - to be implemented"}
    except Exception as e:
        logger.error(f"Error creating clip: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create clip"
        )


@router.put("/{clip_id}", summary="Update video clip")
async def update_clip(
    clip_id: str,
    db: Session = Depends(get_db)
):
    """
    Update an existing video clip.
    Note: This is a placeholder endpoint. Full implementation will include request models.
    """
    try:
        # Placeholder implementation
        return {"message": f"Clip {clip_id} update endpoint - to be implemented"}
    except Exception as e:
        logger.error(f"Error updating clip {clip_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update clip"
        )


@router.delete("/{clip_id}", summary="Delete video clip")
async def delete_clip(
    clip_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete a video clip.
    """
    try:
        clip = db.query(VideoClip).filter(VideoClip.id == clip_id).first()
        if not clip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Clip not found"
            )
        
        db.delete(clip)
        db.commit()
        return {"message": "Clip deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting clip {clip_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete clip"
        )


@router.post("/debug-generate", summary="DEBUG: Log raw request data")
async def debug_generate_request(request: Request):
    """
    Temporary debugging endpoint to log the exact raw request data
    """
    try:
        # Get raw request body
        body = await request.body()
        body_str = body.decode('utf-8')
        
        # Parse JSON to see structure
        try:
            body_json = json.loads(body_str)
            logger.info(f"DEBUG: Raw request body as JSON: {body_json}")
            logger.info(f"DEBUG: Available fields in request: {list(body_json.keys())}")
            
            # Check for specific field mismatches
            if 'api_provider' in body_json:
                logger.info(f"DEBUG: Found 'api_provider' field: {body_json['api_provider']}")
            if 'provider' in body_json:
                logger.info(f"DEBUG: Found 'provider' field: {body_json['provider']}")
            if 'model_type' in body_json:
                logger.info(f"DEBUG: Found 'model_type' field: {body_json['model_type']}")
            else:
                logger.warning("DEBUG: Missing required 'model_type' field!")
                
        except json.JSONDecodeError as e:
            logger.error(f"DEBUG: Failed to parse JSON: {e}")
            logger.info(f"DEBUG: Raw body string: {body_str}")
        
        return {"debug": "Request logged", "fields": list(body_json.keys()) if 'body_json' in locals() else []}
        
    except Exception as e:
        logger.error(f"DEBUG: Error processing debug request: {e}")
        return {"debug": "Error logging request", "error": str(e)}


@router.post("/generate", summary="Create and generate video clip")
async def create_and_generate_clip(
    request: ClipGenerateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Create a new video clip and immediately start video generation.
    This endpoint combines clip creation and generation in a single request.
    """
    try:
        # DEBUG: Log the received request data
        logger.info(f"DEBUG: Received clip generation request: {request}")
        logger.info(f"DEBUG: Request model dump: {request.model_dump()}")
        # Validate project exists
        project = db.query(Project).filter(Project.id == request.project_id).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
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
        
        # Determine sequence number if not provided
        sequence_number = request.sequence_number
        if sequence_number is None:
            # Get the highest sequence number for this project and increment
            max_sequence = db.query(VideoClip).filter(
                VideoClip.project_id == request.project_id
            ).order_by(VideoClip.sequence_number.desc()).first()
            sequence_number = (max_sequence.sequence_number + 1) if max_sequence else 1
        
        # Create new video clip
        clip_id = str(uuid.uuid4())
        new_clip = VideoClip(
            id=clip_id,
            project_id=request.project_id,
            title=request.title or f"Clip {sequence_number}",
            description=request.description or "",
            prompt=request.prompt,
            sequence_number=sequence_number,
            duration=request.duration or 6,
            status="processing",
            provider=request.provider,
            model_type=request.model_type,
            character_id=request.character_id,
            metadata={
                "resolution": request.resolution,
                "camera_controls": request.camera_controls,
                "reference_image_url": request.reference_image_url
            }
        )
        
        db.add(new_clip)
        db.commit()
        db.refresh(new_clip)
        
        # Start background video generation task
        task_id = str(uuid.uuid4())
        background_tasks.add_task(
            _generate_video_background,
            task_id,
            clip_id,
            request,
            character
        )
        
        return {
            "id": new_clip.id,
            "project_id": new_clip.project_id,
            "title": new_clip.title,
            "description": new_clip.description,
            "prompt": new_clip.prompt,
            "sequence_number": new_clip.sequence_number,
            "duration": new_clip.duration,
            "status": new_clip.status,
            "provider": new_clip.provider,
            "model_type": new_clip.model_type,
            "character_id": new_clip.character_id,
            "metadata": new_clip.metadata,
            "task_id": task_id,
            "message": "Clip created and video generation started"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating and generating clip: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create and generate clip"
        )


async def _generate_video_background(task_id: str, clip_id: str, request: ClipGenerateRequest, character):
    """
    Background task to generate video for a clip.
    This function integrates with the existing video generation logic.
    """
    from ...core.database import SessionLocal
    from ...services.minimax_api import MinimaxAPI
    from ...services.segmind_api import SegmindAPI
    
    db = SessionLocal()
    try:
        # Get the clip from database
        clip = db.query(VideoClip).filter(VideoClip.id == clip_id).first()
        if not clip:
            logger.error(f"Clip {clip_id} not found for background generation")
            return
        
        # Prepare generation parameters
        generation_params = {
            "prompt": request.prompt,
            "duration": request.duration or 6,
            "resolution": request.resolution or "1080p",
            "model_type": request.model_type
        }
        
        # Add character-specific parameters if character is provided
        if character and character.image_url:
            generation_params["reference_image_url"] = character.image_url
        elif request.reference_image_url:
            generation_params["reference_image_url"] = request.reference_image_url
        
        # Add camera controls if provided
        if request.camera_controls:
            generation_params["camera_controls"] = request.camera_controls
        
        # Initialize the appropriate API service
        if request.provider == "minimax":
            api_service = MinimaxAPI()
        elif request.provider == "segmind":
            api_service = SegmindAPI()
        else:
            logger.error(f"Unknown provider: {request.provider}")
            clip.status = "failed"
            clip.error_message = f"Unknown provider: {request.provider}"
            db.commit()
            return
        
        # Start video generation
        logger.info(f"Starting video generation for clip {clip_id} with provider {request.provider}")
        
        try:
            # Call the appropriate generation method based on model type
            if request.model_type == "t2v":
                result = await api_service.generate_text_to_video(**generation_params)
            elif request.model_type == "i2v":
                if not generation_params.get("reference_image_url"):
                    raise ValueError("Reference image required for image-to-video generation")
                result = await api_service.generate_image_to_video(**generation_params)
            else:
                raise ValueError(f"Unsupported model type: {request.model_type}")
            
            # Update clip with generation result
            if result and result.get("success"):
                clip.status = "completed"
                clip.video_url = result.get("video_url")
                clip.metadata = {
                    **clip.metadata,
                    "generation_result": result,
                    "task_id": task_id
                }
                logger.info(f"Video generation completed for clip {clip_id}")
            else:
                clip.status = "failed"
                clip.error_message = result.get("error", "Video generation failed")
                logger.error(f"Video generation failed for clip {clip_id}: {clip.error_message}")
                
        except Exception as e:
            logger.error(f"Error during video generation for clip {clip_id}: {e}")
            clip.status = "failed"
            clip.error_message = str(e)
        
        db.commit()
        
    except Exception as e:
        logger.error(f"Error in background video generation task: {e}")
        db.rollback()
    finally:
        db.close()


@router.post("/{clip_id}/generate", summary="Generate video for clip")
async def generate_clip(
    clip_id: str,
    db: Session = Depends(get_db)
):
    """
    Start video generation for a clip.
    Note: This is a placeholder endpoint. Full implementation will include generation logic.
    """
    try:
        # Placeholder implementation
        return {"message": f"Video generation for clip {clip_id} - to be implemented"}
    except Exception as e:
        logger.error(f"Error generating clip {clip_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start clip generation"
        )