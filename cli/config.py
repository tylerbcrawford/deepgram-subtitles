"""Configuration management for Deepgram Subtitle Generator"""
import os

class Config:
    """Application configuration"""
    
    DEEPGRAM_API_KEY = os.environ.get("DEEPGRAM_API_KEY")
    MEDIA_PATH = os.environ.get("MEDIA_PATH", "/media")
    FILE_LIST_PATH = os.environ.get("FILE_LIST_PATH")
    LOG_PATH = os.environ.get("LOG_PATH", "/logs")
    TEMP_AUDIO_PATH = "/tmp/audio_extract.mp3"
    BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "0"))
    LANGUAGE = os.environ.get("LANGUAGE", "en")
    VIDEO_EXTENSIONS = {'.mkv', '.mp4', '.avi', '.mov', '.m4v', '.wmv', '.flv'}
    
    # Transcript feature settings
    ENABLE_TRANSCRIPT = os.environ.get("ENABLE_TRANSCRIPT", "0") == "1"
    SPEAKER_MAPS_PATH = os.environ.get("SPEAKER_MAPS_PATH", "/config/speaker_maps")
    
    # Raw JSON output toggle - saves raw Deepgram API response for debugging
    SAVE_RAW_JSON = os.environ.get("SAVE_RAW_JSON", "0") == "1"
    
    # Force regeneration settings
    FORCE_REGENERATE = os.environ.get("FORCE_REGENERATE", "0") == "1"
    
    # Profanity filter settings - "off", "tag", or "remove"
    PROFANITY_FILTER = os.environ.get("PROFANITY_FILTER", "off")
    
    # Model configuration - Nova 3 only
    MODEL = "nova-3"
    
    # Cost per minute (USD) for Nova 3
    COST_PER_MINUTE = 0.0043
    
    @classmethod
    def validate(cls) -> bool:
        """
        Validate required configuration values.
        
        Raises:
            ValueError: If DEEPGRAM_API_KEY is not set
            
        Returns:
            bool: True if validation passes
        """
        if not cls.DEEPGRAM_API_KEY:
            raise ValueError("DEEPGRAM_API_KEY environment variable not set")
        return True