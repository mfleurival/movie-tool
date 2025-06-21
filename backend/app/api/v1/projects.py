from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from ...core.database import get_db
from ...models import Project, ProjectSettings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects", tags=["projects"])


class ProjectCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    settings: Optional[dict] = None


class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[dict] = None


@router.get("/", summary="List all projects")
async def list_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Retrieve a list of all projects with pagination.
    """
    try:
        projects = db.query(Project).offset(skip).limit(limit).all()
        return projects
    except Exception as e:
        logger.error(f"Error listing projects: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve projects"
        )


@router.get("/{project_id}", summary="Get project by ID")
async def get_project(
    project_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieve a specific project by its ID.
    """
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        return project
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve project"
        )


@router.post("/", summary="Create new project")
async def create_project(
    project_data: ProjectCreateRequest,
    db: Session = Depends(get_db)
):
    """
    Create a new project with the provided data.
    """
    try:
        # Create the project
        new_project = Project(
            name=project_data.name,
            description=project_data.description
        )
        
        db.add(new_project)
        db.flush()  # Get the ID without committing
        
        # Create project settings if provided
        if project_data.settings:
            project_settings = ProjectSettings(
                project_id=new_project.id,
                api_preferences=project_data.settings.get('api_preferences', {}),
                default_params=project_data.settings.get('default_params', {}),
                export_settings=project_data.settings.get('export_settings', {})
            )
            db.add(project_settings)
        
        db.commit()
        db.refresh(new_project)
        
        logger.info(f"Created project: {new_project.id} - {new_project.name}")
        return new_project
        
    except Exception as e:
        logger.error(f"Error creating project: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project"
        )


@router.put("/{project_id}", summary="Update project")
async def update_project(
    project_id: str,
    project_data: ProjectUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Update an existing project with the provided data.
    """
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Update project fields
        if project_data.name is not None:
            project.name = project_data.name
        if project_data.description is not None:
            project.description = project_data.description
            
        # Update settings if provided
        if project_data.settings:
            settings = db.query(ProjectSettings).filter(ProjectSettings.project_id == project_id).first()
            if not settings:
                settings = ProjectSettings(project_id=project.id)
                db.add(settings)
            
            if 'api_preferences' in project_data.settings:
                settings.api_preferences = project_data.settings['api_preferences']
            if 'default_params' in project_data.settings:
                settings.default_params = project_data.settings['default_params']
            if 'export_settings' in project_data.settings:
                settings.export_settings = project_data.settings['export_settings']
        
        db.commit()
        db.refresh(project)
        
        logger.info(f"Updated project: {project.id} - {project.name}")
        return project
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating project {project_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update project"
        )


@router.delete("/{project_id}", summary="Delete project")
async def delete_project(
    project_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete a project and all associated data.
    """
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        db.delete(project)
        db.commit()
        return {"message": "Project deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting project {project_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete project"
        )