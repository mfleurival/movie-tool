from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...models import Character
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/characters", tags=["characters"])


@router.get("/", summary="List all characters")
async def list_characters(
    project_id: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Retrieve a list of characters, optionally filtered by project.
    """
    try:
        query = db.query(Character)
        if project_id:
            query = query.filter(Character.project_id == project_id)
        
        characters = query.offset(skip).limit(limit).all()
        return {"characters": characters, "total": len(characters)}
    except Exception as e:
        logger.error(f"Error listing characters: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve characters"
        )


@router.get("/{character_id}", summary="Get character by ID")
async def get_character(
    character_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieve a specific character by its ID.
    """
    try:
        character = db.query(Character).filter(Character.id == character_id).first()
        if not character:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Character not found"
            )
        return character
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving character {character_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve character"
        )


@router.post("/", summary="Create new character")
async def create_character(
    db: Session = Depends(get_db)
):
    """
    Create a new character.
    Note: This is a placeholder endpoint. Full implementation will include request models.
    """
    try:
        # Placeholder implementation
        return {"message": "Character creation endpoint - to be implemented"}
    except Exception as e:
        logger.error(f"Error creating character: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create character"
        )


@router.put("/{character_id}", summary="Update character")
async def update_character(
    character_id: str,
    db: Session = Depends(get_db)
):
    """
    Update an existing character.
    Note: This is a placeholder endpoint. Full implementation will include request models.
    """
    try:
        # Placeholder implementation
        return {"message": f"Character {character_id} update endpoint - to be implemented"}
    except Exception as e:
        logger.error(f"Error updating character {character_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update character"
        )


@router.delete("/{character_id}", summary="Delete character")
async def delete_character(
    character_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete a character.
    """
    try:
        character = db.query(Character).filter(Character.id == character_id).first()
        if not character:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Character not found"
            )
        
        db.delete(character)
        db.commit()
        return {"message": "Character deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting character {character_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete character"
        )