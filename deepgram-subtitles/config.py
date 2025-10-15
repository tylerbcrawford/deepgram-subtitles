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
    
    # Force regeneration settings
    FORCE_REGENERATE = os.environ.get("FORCE_REGENERATE", "0") == "1"
    
    # Model configuration
    DEFAULT_MODEL = "nova-3"
    MODEL_CHOICES = {"nova-2", "base", "enhanced", "nova-3"}
    
    # Cost per minute (USD) - can be overridden via environment variables
    COST_PER_MINUTE = {
        "nova-2": float(os.environ.get("PRICE_NOVA_2", "0.0125")),
        "base": float(os.environ.get("PRICE_BASE", "0.0043")),
        "enhanced": float(os.environ.get("PRICE_ENHANCED", "0.0181")),
        "nova-3": float(os.environ.get("PRICE_NOVA_3", "0.0043")),
    }
    
    @classmethod
    def get_model(cls) -> str:
        """
        Get the configured model with validation.
        
        Returns:
            str: The model name
            
        Raises:
            ValueError: If an unsupported model is specified
        """
        model = os.environ.get("MODEL", cls.DEFAULT_MODEL).strip().lower()
        if model not in cls.MODEL_CHOICES:
            raise ValueError(
                f"Unsupported model '{model}'. Choose one of {sorted(cls.MODEL_CHOICES)}"
            )
        return model
    
    @classmethod
    def get_cost_per_minute(cls) -> float:
        """
        Get the cost per minute for the configured model.
        
        Returns:
            float: Cost per minute in USD
        """
        model = cls.get_model()
        return cls.COST_PER_MINUTE.get(model, 0.0043)
    
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