from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    # Application
    app_name: str = "Movie Tool API"
    app_version: str = "1.0.0"
    debug: bool = True
    log_level: str = "INFO"
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Database
    database_url: str = "sqlite:///./movie_tool.db"
    
    # API Keys
    minimax_api_key: Optional[str] = None
    segmind_api_key: Optional[str] = None
    
    # Security
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    allowed_origins: List[str] = ["*"]
    # File Storage
    upload_dir: str = "./storage/uploads"
    output_dir: str = "./storage/outputs"
    temp_dir: str = "./storage/temp"
    character_dir: str = "./storage/characters"
    
    # External APIs
    minimax_base_url: str = "https://api.minimax.chat"
    segmind_base_url: str = "https://api.segmind.com"
    
    # API Configuration
    api_timeout: int = 300  # 5 minutes for video generation
    api_retry_attempts: int = 3
    api_retry_delay: int = 5  # seconds
    
    # Video Generation Settings
    default_video_duration: int = 6  # seconds
    max_video_duration: int = 10  # seconds
    default_video_resolution: str = "1080p"
    
    # Processing
    max_concurrent_generations: int = 3
    max_file_size_mb: int = 100
    supported_video_formats: List[str] = ["mp4", "mov", "avi"]
    supported_image_formats: List[str] = ["jpg", "jpeg", "png", "webp"]
    
    # FFmpeg Configuration
    ffmpeg_path: Optional[str] = None  # Will use system PATH if None
    ffprobe_path: Optional[str] = None  # Will use system PATH if None
    ffmpeg_timeout: int = 600  # 10 minutes for video processing
    
    # Video Processing
    default_thumbnail_width: int = 320
    default_thumbnail_height: int = 180
    default_frame_extraction_fps: float = 1.0
    max_extracted_frames: int = 100
    
    # Export
    default_export_format: str = "mp4"
    default_export_quality: str = "high"
    default_export_resolution: str = "1920x1080"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Ensure storage directories exist
        self._create_storage_directories()
    
    def _create_storage_directories(self):
        """Create storage directories if they don't exist"""
        directories = [
            self.upload_dir,
            self.output_dir,
            self.temp_dir,
            self.character_dir
        ]
        
        for directory in directories:
            os.makedirs(directory, exist_ok=True)


# Global settings instance
settings = Settings()