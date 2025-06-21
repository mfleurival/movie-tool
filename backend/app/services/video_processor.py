"""
Video Processing Service

Handles FFmpeg operations for video processing, including frame extraction,
format normalization, merging, quality analysis, and thumbnail generation.
"""

import asyncio
import json
import logging
import shutil
import subprocess
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

import aiofiles
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class VideoInfo(BaseModel):
    """Video information model"""
    duration: float
    width: int
    height: int
    fps: float
    bitrate: Optional[int] = None
    codec: str
    format: str
    size_bytes: int
    aspect_ratio: str


class ProcessingOptions(BaseModel):
    """Video processing options"""
    output_format: str = "mp4"
    video_codec: str = "libx264"
    audio_codec: str = "aac"
    crf: int = 23  # Constant Rate Factor (lower = better quality)
    preset: str = "medium"  # FFmpeg preset
    max_width: Optional[int] = None
    max_height: Optional[int] = None
    target_fps: Optional[float] = None


class VideoProcessorError(Exception):
    """Custom exception for video processing errors"""
    def __init__(self, message: str, command: Optional[str] = None, stderr: Optional[str] = None):
        self.message = message
        self.command = command
        self.stderr = stderr
        super().__init__(self.message)


class VideoProcessor:
    """Video processing service using FFmpeg"""
    
    def __init__(self):
        self.ffmpeg_path = self._find_ffmpeg()
        self.ffprobe_path = self._find_ffprobe()
    
    def _find_ffmpeg(self) -> str:
        """Find FFmpeg executable"""
        ffmpeg_path = shutil.which("ffmpeg")
        if not ffmpeg_path:
            raise VideoProcessorError("FFmpeg not found. Please install FFmpeg.")
        return ffmpeg_path
    
    def _find_ffprobe(self) -> str:
        """Find FFprobe executable"""
        ffprobe_path = shutil.which("ffprobe")
        if not ffprobe_path:
            raise VideoProcessorError("FFprobe not found. Please install FFmpeg.")
        return ffprobe_path
    
    async def _run_command(self, command: List[str], timeout: int = 300) -> Tuple[str, str]:
        """Run command asynchronously with timeout"""
        try:
            process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(
                process.communicate(), 
                timeout=timeout
            )
            
            if process.returncode != 0:
                raise VideoProcessorError(
                    f"Command failed with return code {process.returncode}",
                    command=" ".join(command),
                    stderr=stderr.decode()
                )
            
            return stdout.decode(), stderr.decode()
            
        except asyncio.TimeoutError:
            raise VideoProcessorError(f"Command timed out after {timeout} seconds")
        except Exception as e:
            raise VideoProcessorError(f"Command execution failed: {e}")
    
    async def get_video_info(self, video_path: Path) -> VideoInfo:
        """Get detailed video information using FFprobe"""
        logger.info(f"Getting video info for: {video_path}")
        
        if not video_path.exists():
            raise VideoProcessorError(f"Video file not found: {video_path}")
        
        command = [
            self.ffprobe_path,
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            str(video_path)
        ]
        
        stdout, _ = await self._run_command(command)
        
        try:
            probe_data = json.loads(stdout)
        except json.JSONDecodeError as e:
            raise VideoProcessorError(f"Failed to parse FFprobe output: {e}")
        
        # Find video stream
        video_stream = None
        for stream in probe_data.get("streams", []):
            if stream.get("codec_type") == "video":
                video_stream = stream
                break
        
        if not video_stream:
            raise VideoProcessorError("No video stream found")
        
        # Extract information
        format_info = probe_data.get("format", {})
        duration = float(format_info.get("duration", 0))
        width = int(video_stream.get("width", 0))
        height = int(video_stream.get("height", 0))
        
        # Calculate FPS
        fps_str = video_stream.get("r_frame_rate", "0/1")
        if "/" in fps_str:
            num, den = map(int, fps_str.split("/"))
            fps = num / den if den != 0 else 0
        else:
            fps = float(fps_str)
        
        # Calculate aspect ratio
        aspect_ratio = f"{width}:{height}"
        if width and height:
            from math import gcd
            common_divisor = gcd(width, height)
            aspect_ratio = f"{width // common_divisor}:{height // common_divisor}"
        
        return VideoInfo(
            duration=duration,
            width=width,
            height=height,
            fps=fps,
            bitrate=int(format_info.get("bit_rate", 0)) if format_info.get("bit_rate") else None,
            codec=video_stream.get("codec_name", "unknown"),
            format=format_info.get("format_name", "unknown"),
            size_bytes=int(format_info.get("size", 0)),
            aspect_ratio=aspect_ratio
        )
    
    async def extract_frame(
        self, 
        video_path: Path, 
        timestamp: float, 
        output_path: Path,
        width: Optional[int] = None,
        height: Optional[int] = None
    ) -> Path:
        """Extract a single frame from video at specified timestamp"""
        logger.info(f"Extracting frame at {timestamp}s from: {video_path}")
        
        if not video_path.exists():
            raise VideoProcessorError(f"Video file not found: {video_path}")
        
        # Ensure output directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        command = [
            self.ffmpeg_path,
            "-i", str(video_path),
            "-ss", str(timestamp),
            "-vframes", "1",
            "-y"  # Overwrite output file
        ]
        
        # Add scaling if specified
        if width and height:
            command.extend(["-vf", f"scale={width}:{height}"])
        
        command.append(str(output_path))
        
        await self._run_command(command)
        
        if not output_path.exists():
            raise VideoProcessorError("Frame extraction failed - output file not created")
        
        logger.info(f"Frame extracted to: {output_path}")
        return output_path
    
    async def extract_frames(
        self,
        video_path: Path,
        output_dir: Path,
        fps: float = 1.0,
        start_time: float = 0,
        duration: Optional[float] = None
    ) -> List[Path]:
        """Extract multiple frames from video"""
        logger.info(f"Extracting frames at {fps} FPS from: {video_path}")
        
        if not video_path.exists():
            raise VideoProcessorError(f"Video file not found: {video_path}")
        
        # Ensure output directory exists
        output_dir.mkdir(parents=True, exist_ok=True)
        
        command = [
            self.ffmpeg_path,
            "-i", str(video_path),
            "-ss", str(start_time),
            "-vf", f"fps={fps}",
            "-y"
        ]
        
        if duration:
            command.extend(["-t", str(duration)])
        
        # Output pattern
        output_pattern = output_dir / "frame_%04d.png"
        command.append(str(output_pattern))
        
        await self._run_command(command)
        
        # Find generated frames
        frames = sorted(output_dir.glob("frame_*.png"))
        logger.info(f"Extracted {len(frames)} frames")
        
        return frames
    
    async def normalize_video(
        self,
        input_path: Path,
        output_path: Path,
        options: ProcessingOptions
    ) -> Path:
        """Normalize video format, resolution, and quality"""
        logger.info(f"Normalizing video: {input_path}")
        
        if not input_path.exists():
            raise VideoProcessorError(f"Input video not found: {input_path}")
        
        # Ensure output directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        command = [
            self.ffmpeg_path,
            "-i", str(input_path),
            "-c:v", options.video_codec,
            "-c:a", options.audio_codec,
            "-crf", str(options.crf),
            "-preset", options.preset,
            "-y"
        ]
        
        # Add scaling if specified
        if options.max_width or options.max_height:
            scale_filter = []
            if options.max_width and options.max_height:
                scale_filter.append(f"scale='min({options.max_width},iw)':'min({options.max_height},ih)':force_original_aspect_ratio=decrease")
            elif options.max_width:
                scale_filter.append(f"scale={options.max_width}:-1")
            elif options.max_height:
                scale_filter.append(f"scale=-1:{options.max_height}")
            
            if scale_filter:
                command.extend(["-vf", ",".join(scale_filter)])
        
        # Add FPS filter if specified
        if options.target_fps:
            fps_filter = f"fps={options.target_fps}"
            if "-vf" in command:
                # Append to existing filter
                vf_index = command.index("-vf") + 1
                command[vf_index] += f",{fps_filter}"
            else:
                command.extend(["-vf", fps_filter])
        
        command.append(str(output_path))
        
        await self._run_command(command, timeout=600)  # Longer timeout for processing
        
        if not output_path.exists():
            raise VideoProcessorError("Video normalization failed - output file not created")
        
        logger.info(f"Video normalized to: {output_path}")
        return output_path
    
    async def merge_videos(
        self,
        video_paths: List[Path],
        output_path: Path,
        normalize_first: bool = True
    ) -> Path:
        """Merge multiple videos into one"""
        logger.info(f"Merging {len(video_paths)} videos")
        
        if not video_paths:
            raise VideoProcessorError("No videos to merge")
        
        for video_path in video_paths:
            if not video_path.exists():
                raise VideoProcessorError(f"Video file not found: {video_path}")
        
        # Ensure output directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        if normalize_first:
            # Normalize all videos to same format first
            normalized_videos = []
            temp_dir = output_path.parent / "temp_normalized"
            temp_dir.mkdir(exist_ok=True)
            
            try:
                for i, video_path in enumerate(video_paths):
                    temp_output = temp_dir / f"normalized_{i}.mp4"
                    options = ProcessingOptions(
                        max_width=1920,
                        max_height=1080,
                        target_fps=30
                    )
                    await self.normalize_video(video_path, temp_output, options)
                    normalized_videos.append(temp_output)
                
                # Create concat file
                concat_file = temp_dir / "concat.txt"
                async with aiofiles.open(concat_file, 'w') as f:
                    for video_path in normalized_videos:
                        await f.write(f"file '{video_path.absolute()}'\n")
                
                # Merge using concat demuxer
                command = [
                    self.ffmpeg_path,
                    "-f", "concat",
                    "-safe", "0",
                    "-i", str(concat_file),
                    "-c", "copy",
                    "-y",
                    str(output_path)
                ]
                
                await self._run_command(command, timeout=900)
                
            finally:
                # Clean up temp files
                if temp_dir.exists():
                    shutil.rmtree(temp_dir)
        else:
            # Simple concatenation without normalization
            # Create concat file
            concat_file = output_path.parent / "concat.txt"
            try:
                async with aiofiles.open(concat_file, 'w') as f:
                    for video_path in video_paths:
                        await f.write(f"file '{video_path.absolute()}'\n")
                
                command = [
                    self.ffmpeg_path,
                    "-f", "concat",
                    "-safe", "0",
                    "-i", str(concat_file),
                    "-c", "copy",
                    "-y",
                    str(output_path)
                ]
                
                await self._run_command(command, timeout=900)
                
            finally:
                if concat_file.exists():
                    concat_file.unlink()
        
        if not output_path.exists():
            raise VideoProcessorError("Video merging failed - output file not created")
        
        logger.info(f"Videos merged to: {output_path}")
        return output_path
    
    async def generate_thumbnail(
        self,
        video_path: Path,
        output_path: Path,
        timestamp: Optional[float] = None,
        width: int = 320,
        height: int = 180
    ) -> Path:
        """Generate thumbnail from video"""
        logger.info(f"Generating thumbnail for: {video_path}")
        
        if not video_path.exists():
            raise VideoProcessorError(f"Video file not found: {video_path}")
        
        # Use middle of video if no timestamp specified
        if timestamp is None:
            video_info = await self.get_video_info(video_path)
            timestamp = video_info.duration / 2
        
        return await self.extract_frame(
            video_path=video_path,
            timestamp=timestamp,
            output_path=output_path,
            width=width,
            height=height
        )
    
    async def analyze_quality(self, video_path: Path) -> Dict[str, Union[float, str]]:
        """Analyze video quality metrics"""
        logger.info(f"Analyzing quality for: {video_path}")
        
        video_info = await self.get_video_info(video_path)
        
        # Calculate quality score based on resolution, bitrate, and codec
        quality_score = 0.0
        
        # Resolution score (0-40 points)
        pixel_count = video_info.width * video_info.height
        if pixel_count >= 1920 * 1080:  # 1080p+
            quality_score += 40
        elif pixel_count >= 1280 * 720:  # 720p+
            quality_score += 30
        elif pixel_count >= 854 * 480:  # 480p+
            quality_score += 20
        else:
            quality_score += 10
        
        # Bitrate score (0-30 points)
        if video_info.bitrate:
            bitrate_mbps = video_info.bitrate / 1_000_000
            if bitrate_mbps >= 8:
                quality_score += 30
            elif bitrate_mbps >= 4:
                quality_score += 20
            elif bitrate_mbps >= 2:
                quality_score += 15
            else:
                quality_score += 10
        
        # Codec score (0-20 points)
        if video_info.codec in ["h264", "libx264"]:
            quality_score += 20
        elif video_info.codec in ["h265", "libx265", "hevc"]:
            quality_score += 20
        elif video_info.codec in ["vp9", "av1"]:
            quality_score += 15
        else:
            quality_score += 10
        
        # FPS score (0-10 points)
        if video_info.fps >= 60:
            quality_score += 10
        elif video_info.fps >= 30:
            quality_score += 8
        elif video_info.fps >= 24:
            quality_score += 6
        else:
            quality_score += 4
        
        # Determine quality rating
        if quality_score >= 90:
            quality_rating = "Excellent"
        elif quality_score >= 75:
            quality_rating = "Good"
        elif quality_score >= 60:
            quality_rating = "Fair"
        else:
            quality_rating = "Poor"
        
        return {
            "quality_score": quality_score,
            "quality_rating": quality_rating,
            "resolution": f"{video_info.width}x{video_info.height}",
            "bitrate_mbps": video_info.bitrate / 1_000_000 if video_info.bitrate else None,
            "fps": video_info.fps,
            "codec": video_info.codec,
            "duration": video_info.duration,
            "file_size_mb": video_info.size_bytes / 1_000_000
        }
    
    async def validate_video(self, video_path: Path) -> Dict[str, Union[bool, str, List[str]]]:
        """Validate video file integrity and format"""
        logger.info(f"Validating video: {video_path}")
        
        issues = []
        is_valid = True
        
        try:
            video_info = await self.get_video_info(video_path)
            
            # Check basic properties
            if video_info.duration <= 0:
                issues.append("Invalid duration")
                is_valid = False
            
            if video_info.width <= 0 or video_info.height <= 0:
                issues.append("Invalid resolution")
                is_valid = False
            
            if video_info.fps <= 0:
                issues.append("Invalid frame rate")
                is_valid = False
            
            # Check for common issues
            if video_info.duration < 1:
                issues.append("Video too short (< 1 second)")
            
            if video_info.width < 320 or video_info.height < 240:
                issues.append("Resolution too low")
            
            if video_info.fps < 15:
                issues.append("Frame rate too low")
            
            # Check file size
            if video_info.size_bytes < 1000:  # Less than 1KB
                issues.append("File size suspiciously small")
                is_valid = False
            
        except Exception as e:
            issues.append(f"Failed to analyze video: {e}")
            is_valid = False
        
        return {
            "is_valid": is_valid,
            "issues": issues,
            "status": "valid" if is_valid and not issues else "invalid" if not is_valid else "warning"
        }