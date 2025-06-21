"""
MiniMax API integration service for video generation.

Supports:
- Text-to-Video (T2V) generation
- Image-to-Video (I2V) generation  
- Subject-to-Video (S2V) generation with character reference
- Camera control support for Director models
"""

import asyncio
import logging
import time
from typing import Dict, Any, Optional, List, Union
from pathlib import Path
import aiohttp
import json
from urllib.parse import urljoin

from ..core.config import settings

logger = logging.getLogger(__name__)


class MinimaxAPIError(Exception):
    """Custom exception for MiniMax API errors."""
    pass


class MinimaxAPIService:
    """Service for interacting with MiniMax video generation API."""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.MINIMAX_API_KEY
        self.base_url = "https://api.minimax.chat/v1/"
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Model configurations
        self.models = {
            "t2v": "video-01",
            "t2v_director": "video-01-director", 
            "i2v": "video-01",
            "i2v_director": "video-01-director",
            "s2v": "video-01"
        }
        
        # Camera movement instructions for Director models
        self.camera_movements = [
            "Truck left", "Truck right",
            "Pan left", "Pan right", 
            "Push in", "Pull out",
            "Pedestal up", "Pedestal down",
            "Tilt up", "Tilt down",
            "Zoom in", "Zoom out",
            "Shake", "Tracking shot", "Static shot"
        ]
        
    async def __aenter__(self):
        """Async context manager entry."""
        await self._ensure_session()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self._close_session()
        
    async def _ensure_session(self):
        """Ensure aiohttp session is created."""
        if self.session is None or self.session.closed:
            timeout = aiohttp.ClientTimeout(total=300)  # 5 minute timeout
            self.session = aiohttp.ClientSession(
                timeout=timeout,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
            )
            
    async def _close_session(self):
        """Close aiohttp session."""
        if self.session and not self.session.closed:
            await self.session.close()
            
    async def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict[str, Any]] = None,
        files: Optional[Dict[str, Any]] = None,
        max_retries: int = 3
    ) -> Dict[str, Any]:
        """Make HTTP request with retry logic."""
        await self._ensure_session()
        
        url = urljoin(self.base_url, endpoint)
        
        for attempt in range(max_retries):
            try:
                if files:
                    # For file uploads, use FormData
                    form_data = aiohttp.FormData()
                    for key, value in (data or {}).items():
                        if isinstance(value, (dict, list)):
                            form_data.add_field(key, json.dumps(value))
                        else:
                            form_data.add_field(key, str(value))
                    
                    for key, file_info in files.items():
                        form_data.add_field(
                            key, 
                            file_info['content'],
                            filename=file_info['filename'],
                            content_type=file_info.get('content_type', 'application/octet-stream')
                        )
                    
                    async with self.session.request(method, url, data=form_data) as response:
                        response_data = await response.json()
                else:
                    # For JSON requests
                    async with self.session.request(method, url, json=data) as response:
                        response_data = await response.json()
                
                if response.status == 200:
                    return response_data
                elif response.status == 429:  # Rate limit
                    wait_time = 2 ** attempt
                    logger.warning(f"Rate limited, waiting {wait_time}s before retry {attempt + 1}")
                    await asyncio.sleep(wait_time)
                    continue
                else:
                    error_msg = response_data.get('error', {}).get('message', f'HTTP {response.status}')
                    raise MinimaxAPIError(f"API request failed: {error_msg}")
                    
            except aiohttp.ClientError as e:
                if attempt == max_retries - 1:
                    raise MinimaxAPIError(f"Network error after {max_retries} attempts: {str(e)}")
                await asyncio.sleep(2 ** attempt)
                
        raise MinimaxAPIError(f"Max retries ({max_retries}) exceeded")
        
    async def text_to_video(
        self,
        prompt: str,
        model: str = "t2v",
        use_director: bool = False,
        camera_movements: Optional[List[str]] = None,
        duration: int = 6,
        resolution: str = "1080p",
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate video from text prompt.
        
        Args:
            prompt: Text description for video generation
            model: Model type ("t2v" or "t2v_director")
            use_director: Whether to use Director model for camera control
            camera_movements: List of camera movement instructions
            duration: Video duration in seconds (6-10)
            resolution: Video resolution ("1080p")
            **kwargs: Additional parameters
            
        Returns:
            Dict containing task_id and other response data
        """
        if use_director:
            model = "t2v_director"
            
        # Add camera movements to prompt if using Director model
        if use_director and camera_movements:
            movement_instructions = ", ".join([f"[{move}]" for move in camera_movements])
            prompt = f"{prompt}. {movement_instructions}"
            
        data = {
            "model": self.models[model],
            "prompt": prompt,
            "duration": min(max(duration, 6), 10),  # Clamp between 6-10 seconds
            "resolution": resolution,
            **kwargs
        }
        
        logger.info(f"Starting text-to-video generation with prompt: {prompt[:100]}...")
        
        response = await self._make_request("POST", "video/generations", data=data)
        
        task_id = response.get("task_id")
        if not task_id:
            raise MinimaxAPIError("No task_id returned from API")
            
        logger.info(f"Text-to-video task started with ID: {task_id}")
        return response
        
    async def image_to_video(
        self,
        image_path: Union[str, Path],
        prompt: Optional[str] = None,
        model: str = "i2v",
        use_director: bool = False,
        camera_movements: Optional[List[str]] = None,
        duration: int = 6,
        resolution: str = "1080p",
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate video from image with optional text prompt.
        
        Args:
            image_path: Path to input image file
            prompt: Optional text description
            model: Model type ("i2v" or "i2v_director")
            use_director: Whether to use Director model
            camera_movements: List of camera movement instructions
            duration: Video duration in seconds (6-10)
            resolution: Video resolution ("1080p")
            **kwargs: Additional parameters
            
        Returns:
            Dict containing task_id and other response data
        """
        if use_director:
            model = "i2v_director"
            
        # Add camera movements to prompt if using Director model
        if use_director and camera_movements and prompt:
            movement_instructions = ", ".join([f"[{move}]" for move in camera_movements])
            prompt = f"{prompt}. {movement_instructions}"
            
        # Read image file
        image_path = Path(image_path)
        if not image_path.exists():
            raise MinimaxAPIError(f"Image file not found: {image_path}")
            
        with open(image_path, 'rb') as f:
            image_content = f.read()
            
        data = {
            "model": self.models[model],
            "duration": min(max(duration, 6), 10),
            "resolution": resolution,
            **kwargs
        }
        
        if prompt:
            data["prompt"] = prompt
            
        files = {
            "image": {
                "content": image_content,
                "filename": image_path.name,
                "content_type": f"image/{image_path.suffix[1:]}"
            }
        }
        
        logger.info(f"Starting image-to-video generation with image: {image_path.name}")
        
        response = await self._make_request("POST", "video/generations", data=data, files=files)
        
        task_id = response.get("task_id")
        if not task_id:
            raise MinimaxAPIError("No task_id returned from API")
            
        logger.info(f"Image-to-video task started with ID: {task_id}")
        return response
        
    async def subject_to_video(
        self,
        subject_image_path: Union[str, Path],
        prompt: str,
        duration: int = 6,
        resolution: str = "1080p",
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate video with character consistency using subject image.
        
        Args:
            subject_image_path: Path to character reference image
            prompt: Text description for video generation
            duration: Video duration in seconds (6-10)
            resolution: Video resolution ("1080p")
            **kwargs: Additional parameters
            
        Returns:
            Dict containing task_id and other response data
        """
        # Read subject image file
        subject_path = Path(subject_image_path)
        if not subject_path.exists():
            raise MinimaxAPIError(f"Subject image file not found: {subject_path}")
            
        with open(subject_path, 'rb') as f:
            subject_content = f.read()
            
        data = {
            "model": self.models["s2v"],
            "prompt": prompt,
            "duration": min(max(duration, 6), 10),
            "resolution": resolution,
            **kwargs
        }
        
        files = {
            "subject_image": {
                "content": subject_content,
                "filename": subject_path.name,
                "content_type": f"image/{subject_path.suffix[1:]}"
            }
        }
        
        logger.info(f"Starting subject-to-video generation with subject: {subject_path.name}")
        
        response = await self._make_request("POST", "video/generations", data=data, files=files)
        
        task_id = response.get("task_id")
        if not task_id:
            raise MinimaxAPIError("No task_id returned from API")
            
        logger.info(f"Subject-to-video task started with ID: {task_id}")
        return response
        
    async def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """
        Get the status of a video generation task.
        
        Args:
            task_id: Task ID returned from generation request
            
        Returns:
            Dict containing task status and results
        """
        response = await self._make_request("GET", f"video/generations/{task_id}")
        return response
        
    async def wait_for_completion(
        self, 
        task_id: str, 
        max_wait_time: int = 600,
        poll_interval: int = 10
    ) -> Dict[str, Any]:
        """
        Wait for video generation task to complete.
        
        Args:
            task_id: Task ID to monitor
            max_wait_time: Maximum time to wait in seconds
            poll_interval: How often to check status in seconds
            
        Returns:
            Dict containing final task results
        """
        start_time = time.time()
        
        while time.time() - start_time < max_wait_time:
            status_response = await self.get_task_status(task_id)
            status = status_response.get("status")
            
            logger.info(f"Task {task_id} status: {status}")
            
            if status == "completed":
                return status_response
            elif status == "failed":
                error_msg = status_response.get("error", "Unknown error")
                raise MinimaxAPIError(f"Task failed: {error_msg}")
            elif status in ["pending", "processing"]:
                await asyncio.sleep(poll_interval)
            else:
                raise MinimaxAPIError(f"Unknown task status: {status}")
                
        raise MinimaxAPIError(f"Task {task_id} did not complete within {max_wait_time} seconds")
        
    async def download_video(
        self, 
        video_url: str, 
        output_path: Union[str, Path]
    ) -> Path:
        """
        Download generated video from URL.
        
        Args:
            video_url: URL of the generated video
            output_path: Local path to save the video
            
        Returns:
            Path to downloaded video file
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        await self._ensure_session()
        
        async with self.session.get(video_url) as response:
            if response.status != 200:
                raise MinimaxAPIError(f"Failed to download video: HTTP {response.status}")
                
            with open(output_path, 'wb') as f:
                async for chunk in response.content.iter_chunked(8192):
                    f.write(chunk)
                    
        logger.info(f"Video downloaded to: {output_path}")
        return output_path
        
    async def generate_and_download(
        self,
        generation_type: str,
        output_dir: Union[str, Path],
        filename: Optional[str] = None,
        **generation_kwargs
    ) -> Dict[str, Any]:
        """
        Complete workflow: generate video and download when ready.
        
        Args:
            generation_type: Type of generation ("text_to_video", "image_to_video", "subject_to_video")
            output_dir: Directory to save the generated video
            filename: Optional custom filename
            **generation_kwargs: Arguments for the generation method
            
        Returns:
            Dict containing task info and local file path
        """
        # Start generation
        if generation_type == "text_to_video":
            response = await self.text_to_video(**generation_kwargs)
        elif generation_type == "image_to_video":
            response = await self.image_to_video(**generation_kwargs)
        elif generation_type == "subject_to_video":
            response = await self.subject_to_video(**generation_kwargs)
        else:
            raise MinimaxAPIError(f"Unknown generation type: {generation_type}")
            
        task_id = response["task_id"]
        
        # Wait for completion
        final_response = await self.wait_for_completion(task_id)
        
        # Download video
        video_url = final_response.get("video_url")
        if not video_url:
            raise MinimaxAPIError("No video URL in completed task response")
            
        if not filename:
            filename = f"minimax_{task_id}.mp4"
            
        output_path = Path(output_dir) / filename
        downloaded_path = await self.download_video(video_url, output_path)
        
        return {
            "task_id": task_id,
            "video_path": str(downloaded_path),
            "response": final_response
        }
        
    def validate_camera_movements(self, movements: List[str]) -> List[str]:
        """
        Validate and filter camera movement instructions.
        
        Args:
            movements: List of camera movement strings
            
        Returns:
            List of valid camera movements
        """
        valid_movements = []
        for movement in movements:
            if movement in self.camera_movements:
                valid_movements.append(movement)
            else:
                logger.warning(f"Invalid camera movement ignored: {movement}")
                
        return valid_movements