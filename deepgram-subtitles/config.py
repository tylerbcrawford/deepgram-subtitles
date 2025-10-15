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
    MODEL = os.environ.get("MODEL", "nova-2")
    LANGUAGE = os.environ.get("LANGUAGE", "en")
    VIDEO_EXTENSIONS = {'.mkv', '.mp4', '.avi', '.mov', '.m4v', '.wmv', '.flv'}
    
    # Transcript feature settings
    ENABLE_TRANSCRIPT = os.environ.get("ENABLE_TRANSCRIPT", "0") == "1"
    SPEAKER_MAPS_PATH = os.environ.get("SPEAKER_MAPS_PATH", "/config/speaker_maps")
    
    # Force regeneration settings
    FORCE_REGENERATE = os.environ.get("FORCE_REGENERATE", "0") == "1"
    
    COST_PER_MINUTE = {
        "nova-2": 0.0125,
        "base": 0.0043,
        "enhanced": 0.0181
    }
    
    @classmethod
    def get_cost_per_minute(cls) -> float:
        """
        Get the cost per minute for the configured model.
        
        Returns:
            float: Cost per minute in USD
        """
        return cls.COST_PER_MINUTE.get(cls.MODEL, 0.0125)
    
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