"""
Segmind API Integration Service

Handles all interactions with the Segmind API for video and image generation.
Supports kling-2 I2V model and image generation for character references.
"""

import asyncio
import base64
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Union
from urllib.parse import urljoin

import aiofiles
import aiohttp
import backoff
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class SegmindConfig(BaseModel):
    """Configuration for Segmind API"""
    api_key: str
    base_url: str = "https://api.segmind.com"
    timeout: int = 300
    max_retries: int = 3
    retry_delay: float = 1.0


class ImageGenerationRequest(BaseModel):
    """Request model for image generation"""
    prompt: str
    negative_prompt: Optional[str] = None
    width: int = 1024
    height: int = 1024
    steps: int = 20
    guidance_scale: float = 7.5
    seed: Optional[int] = None
    model: str = "sdxl1.0-txt2img"


class VideoGenerationRequest(BaseModel):
    """Request model for kling-2 video generation"""
    image: str  # Base64 encoded image
    prompt: str
    negative_prompt: Optional[str] = None
    duration: int = 5  # 5 or 10 seconds
    aspect_ratio: str = "16:9"  # 16:9, 9:16, 1:1
    cfg_scale: float = 0.5
    seed: Optional[int] = None


class GenerationResponse(BaseModel):
    """Response from generation API"""
    status: str
    output: Optional[Union[str, List[str]]] = None  # URL(s) or base64 data
    error: Optional[str] = None
    eta: Optional[float] = None
    fetch_result: Optional[str] = None  # URL to fetch result


class CreditInfo(BaseModel):
    """Credit information response"""
    credits: float
    api_calls: int
    queued_api_calls: int


class SegmindAPIError(Exception):
    """Custom exception for Segmind API errors"""
    def __init__(self, message: str, status_code: Optional[int] = None, response_data: Optional[Dict] = None):
        self.message = message
        self.status_code = status_code
        self.response_data = response_data
        super().__init__(self.message)


class SegmindAPI:
    """Segmind API client for video and image generation"""
    
    def __init__(self, config: SegmindConfig):
        self.config = config
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def __aenter__(self):
        """Async context manager entry"""
        await self._ensure_session()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close()
        
    async def _ensure_session(self):
        """Ensure aiohttp session is created"""
        if self.session is None or self.session.closed:
            timeout = aiohttp.ClientTimeout(total=self.config.timeout)
            self.session = aiohttp.ClientSession(
                timeout=timeout,
                headers={
                    "x-api-key": self.config.api_key,
                    "Content-Type": "application/json"
                }
            )
    
    async def close(self):
        """Close the aiohttp session"""
        if self.session and not self.session.closed:
            await self.session.close()
    
    @backoff.on_exception(
        backoff.expo,
        (aiohttp.ClientError, asyncio.TimeoutError),
        max_tries=3,
        max_time=300
    )
    async def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict] = None,
        params: Optional[Dict] = None
    ) -> Dict:
        """Make HTTP request with retry logic"""
        await self._ensure_session()
        
        url = urljoin(self.config.base_url, endpoint)
        
        try:
            async with self.session.request(
                method=method,
                url=url,
                json=data,
                params=params
            ) as response:
                response_data = await response.json()
                
                if response.status >= 400:
                    error_msg = response_data.get("error", "Unknown error")
                    raise SegmindAPIError(
                        message=f"API request failed: {error_msg}",
                        status_code=response.status,
                        response_data=response_data
                    )
                
                return response_data
                
        except aiohttp.ClientError as e:
            logger.error(f"HTTP client error: {e}")
            raise SegmindAPIError(f"HTTP client error: {e}")
        except asyncio.TimeoutError:
            logger.error("Request timeout")
            raise SegmindAPIError("Request timeout")
    
    async def get_credits(self) -> CreditInfo:
        """Get current credit balance and usage"""
        logger.info("Fetching credit information")
        
        response_data = await self._make_request("GET", "/v1/credits")
        
        return CreditInfo(
            credits=response_data["credits"],
            api_calls=response_data.get("api_calls", 0),
            queued_api_calls=response_data.get("queued_api_calls", 0)
        )
    
    async def generate_image(self, request: ImageGenerationRequest) -> GenerationResponse:
        """Generate image from text prompt"""
        logger.info(f"Starting image generation with model: {request.model}")
        
        payload = {
            "prompt": request.prompt,
            "negative_prompt": request.negative_prompt or "",
            "width": request.width,
            "height": request.height,
            "steps": request.steps,
            "guidance_scale": request.guidance_scale,
            "seed": request.seed or -1,
            "base64": False  # Return URL instead of base64
        }
        
        response_data = await self._make_request("POST", f"/v1/{request.model}", data=payload)
        
        return GenerationResponse(
            status="completed",
            output=response_data.get("image")
        )
    
    async def generate_video_kling2(self, request: VideoGenerationRequest) -> GenerationResponse:
        """Generate video using kling-2 model"""
        logger.info("Starting kling-2 video generation")
        
        payload = {
            "image": request.image,
            "prompt": request.prompt,
            "negative_prompt": request.negative_prompt or "",
            "duration": request.duration,
            "aspect_ratio": request.aspect_ratio,
            "cfg_scale": request.cfg_scale,
            "seed": request.seed or -1
        }
        
        response_data = await self._make_request("POST", "/v1/kling-video-v1", data=payload)
        
        # Segmind may return immediate result or require polling
        if "output" in response_data:
            return GenerationResponse(
                status="completed",
                output=response_data["output"]
            )
        elif "fetch_result" in response_data:
            return GenerationResponse(
                status="processing",
                fetch_result=response_data["fetch_result"],
                eta=response_data.get("eta")
            )
        else:
            raise SegmindAPIError("Unexpected response format from kling-2 API")
    
    async def fetch_result(self, fetch_url: str) -> GenerationResponse:
        """Fetch result from a processing job"""
        logger.info(f"Fetching result from: {fetch_url}")
        
        try:
            async with self.session.get(fetch_url) as response:
                if response.status == 202:
                    # Still processing
                    return GenerationResponse(status="processing")
                elif response.status == 200:
                    response_data = await response.json()
                    return GenerationResponse(
                        status="completed",
                        output=response_data.get("output")
                    )
                else:
                    raise SegmindAPIError(f"Failed to fetch result: HTTP {response.status}")
                    
        except aiohttp.ClientError as e:
            raise SegmindAPIError(f"Failed to fetch result: {e}")
    
    async def wait_for_completion(
        self, 
        fetch_url: str, 
        max_wait_time: int = 600,
        poll_interval: int = 10
    ) -> GenerationResponse:
        """Wait for video generation to complete"""
        logger.info(f"Waiting for completion of job: {fetch_url}")
        
        start_time = asyncio.get_event_loop().time()
        
        while True:
            response = await self.fetch_result(fetch_url)
            
            if response.status == "completed":
                logger.info("Job completed successfully")
                return response
            elif response.status == "failed":
                raise SegmindAPIError(f"Job failed: {response.error}")
            
            elapsed_time = asyncio.get_event_loop().time() - start_time
            if elapsed_time > max_wait_time:
                raise SegmindAPIError(f"Job timed out after {max_wait_time} seconds")
            
            logger.debug(f"Job still processing, waiting {poll_interval}s...")
            await asyncio.sleep(poll_interval)
    
    async def download_file(self, url: str, output_path: Path) -> Path:
        """Download generated file to local path"""
        logger.info(f"Downloading file from: {url}")
        
        await self._ensure_session()
        
        try:
            async with self.session.get(url) as response:
                if response.status != 200:
                    raise SegmindAPIError(f"Failed to download file: HTTP {response.status}")
                
                # Ensure output directory exists
                output_path.parent.mkdir(parents=True, exist_ok=True)
                
                async with aiofiles.open(output_path, 'wb') as f:
                    async for chunk in response.content.iter_chunked(8192):
                        await f.write(chunk)
                
                logger.info(f"File downloaded to: {output_path}")
                return output_path
                
        except aiohttp.ClientError as e:
            raise SegmindAPIError(f"Failed to download file: {e}")
    
    @staticmethod
    async def encode_image_to_base64(image_path: Path) -> str:
        """Encode image file to base64 string"""
        try:
            async with aiofiles.open(image_path, 'rb') as f:
                image_data = await f.read()
                return base64.b64encode(image_data).decode('utf-8')
        except Exception as e:
            raise SegmindAPIError(f"Failed to encode image: {e}")
    
    @staticmethod
    def decode_base64_to_file(base64_data: str, output_path: Path) -> Path:
        """Decode base64 data to file"""
        try:
            # Remove data URL prefix if present
            if base64_data.startswith('data:'):
                base64_data = base64_data.split(',', 1)[1]
            
            image_data = base64.b64decode(base64_data)
            
            # Ensure output directory exists
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_path, 'wb') as f:
                f.write(image_data)
            
            return output_path
        except Exception as e:
            raise SegmindAPIError(f"Failed to decode base64 data: {e}")
    
    @staticmethod
    def get_available_models() -> Dict[str, Dict]:
        """Get information about available Segmind models"""
        return {
            "kling-video-v1": {
                "description": "Kling-2 image-to-video generation",
                "type": "video",
                "max_duration": 10,
                "resolution": "720p",
                "features": ["I2V"],
                "aspect_ratios": ["16:9", "9:16", "1:1"]
            },
            "sdxl1.0-txt2img": {
                "description": "SDXL 1.0 text-to-image generation",
                "type": "image",
                "max_resolution": "1024x1024",
                "features": ["T2I"]
            },
            "sd1.5-txt2img": {
                "description": "Stable Diffusion 1.5 text-to-image",
                "type": "image",
                "max_resolution": "512x512",
                "features": ["T2I"]
            },
            "kandinsky2.2-txt2img": {
                "description": "Kandinsky 2.2 text-to-image",
                "type": "image",
                "max_resolution": "768x768",
                "features": ["T2I"]
            }
        }
    
    async def generate_character_reference(
        self,
        prompt: str,
        output_dir: Path,
        width: int = 1024,
        height: int = 1024
    ) -> Path:
        """Generate character reference image"""
        logger.info(f"Generating character reference: {prompt}")
        
        request = ImageGenerationRequest(
            prompt=prompt,
            width=width,
            height=height,
            model="sdxl1.0-txt2img"
        )
        
        response = await self.generate_image(request)
        
        if not response.output:
            raise SegmindAPIError("No image generated")
        
        # Download the image
        import uuid
        filename = f"character_ref_{uuid.uuid4().hex[:8]}.png"
        output_path = output_dir / filename
        
        return await self.download_file(response.output, output_path)
    
    async def generate_video_and_wait(
        self,
        request: VideoGenerationRequest,
        output_dir: Path,
        max_wait_time: int = 600
    ) -> Path:
        """Complete workflow: generate video and download when ready"""
        response = await self.generate_video_kling2(request)
        
        if response.status == "completed" and response.output:
            # Immediate result
            import uuid
            filename = f"video_{uuid.uuid4().hex[:8]}.mp4"
            output_path = output_dir / filename
            return await self.download_file(response.output, output_path)
        
        elif response.status == "processing" and response.fetch_result:
            # Need to wait for completion
            final_response = await self.wait_for_completion(response.fetch_result, max_wait_time)
            
            if not final_response.output:
                raise SegmindAPIError("No video URL in completed response")
            
            import uuid
            filename = f"video_{uuid.uuid4().hex[:8]}.mp4"
            output_path = output_dir / filename
            return await self.download_file(final_response.output, output_path)
        
        else:
            raise SegmindAPIError("Unexpected response from video generation")
    
    async def estimate_cost(self, operation: str, **kwargs) -> Dict[str, float]:
        """Estimate cost for operations (approximate values)"""
        # These are approximate costs - actual costs may vary
        cost_estimates = {
            "image_generation": 0.01,  # per image
            "video_generation_5s": 0.05,  # per 5-second video
            "video_generation_10s": 0.10,  # per 10-second video
        }
        
        if operation == "video_generation":
            duration = kwargs.get("duration", 5)
            if duration <= 5:
                return {"estimated_cost": cost_estimates["video_generation_5s"]}
            else:
                return {"estimated_cost": cost_estimates["video_generation_10s"]}
        
        return {"estimated_cost": cost_estimates.get(operation, 0.0)}
SegmindAPIService = SegmindAPI