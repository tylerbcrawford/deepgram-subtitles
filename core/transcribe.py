#!/usr/bin/env python3
"""
Core transcription functionality for Deepgram Subtitle Generator.

This module provides reusable functions for video processing and transcription
that can be used by both the CLI tool and the Web UI.
"""

from pathlib import Path
from deepgram import DeepgramClient, PrerecordedOptions
from deepgram_captions import DeepgramConverter, srt
import subprocess
import tempfile
import os
import json

# Supported video file extensions
VIDEO_EXTS = {'.mkv', '.mp4', '.avi', '.mov', '.m4v', '.wmv', '.flv'}

# Supported audio file extensions (Deepgram compatible)
AUDIO_EXTS = {'.mp3', '.wav', '.flac', '.ogg', '.opus', '.m4a', '.aac', '.wma'}


def is_video(p: Path) -> bool:
    """
    Check if a path points to a supported video file.
    
    Args:
        p: Path to check
        
    Returns:
        True if the file has a supported video extension
    """
    return p.suffix.lower() in VIDEO_EXTS


def is_audio(p: Path) -> bool:
    """
    Check if a path points to a supported audio file.
    
    Args:
        p: Path to check
        
    Returns:
        True if the file has a supported audio extension
    """
    return p.suffix.lower() in AUDIO_EXTS


def is_media(p: Path) -> bool:
    """
    Check if a path points to a supported media file (video or audio).
    
    Args:
        p: Path to check
        
    Returns:
        True if the file has a supported media extension
    """
    return is_video(p) or is_audio(p)


def get_video_duration(video: Path) -> float:
    """
    Get video duration in seconds using ffprobe.
    
    Args:
        video: Path to video file
        
    Returns:
        Duration in seconds, or 0 if unable to determine
    """
    try:
        cmd = [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "json",
            str(video)
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)
        return float(data.get("format", {}).get("duration", 0))
    except Exception:
        return 0.0


def extract_audio(video: Path) -> Path:
    """
    Extract audio from video file using FFmpeg.
    
    Args:
        video: Path to source video file
        
    Returns:
        Path to temporary MP3 audio file
        
    Raises:
        subprocess.CalledProcessError: If FFmpeg extraction fails
    """
    tmp = Path(tempfile.mkstemp(suffix=".mp3")[1])
    cmd = [
        "ffmpeg", "-hide_banner", "-loglevel", "error",
        "-i", str(video),
        "-vn", "-acodec", "mp3", "-ar", "16000", "-ac", "1",
        "-y", str(tmp)
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    return tmp


def transcribe_file(buf: bytes, api_key: str, model: str, language: str,
                    profanity_filter: str = "off", diarize: bool = False, keyterms: list = None) -> dict:
    """
    Transcribe audio buffer using Deepgram API.
    
    Args:
        buf: Audio file contents as bytes
        api_key: Deepgram API key
        model: Model to use (e.g., 'nova-3')
        language: Language code (e.g., 'en')
        profanity_filter: Profanity filter mode - "off", "tag", or "remove" (default: off)
        diarize: Enable speaker diarization
        keyterms: List of keyterms for better recognition (Nova-3 only, monolingual)
        
    Returns:
        Deepgram response object
        
    Raises:
        Exception: If transcription fails
    """
    client = DeepgramClient(api_key=api_key)
    opts = PrerecordedOptions(
        model=model,
        smart_format=True,
        utterances=True,
        punctuate=True,
        paragraphs=True,
        timestamps=True,
        diarize=diarize,
        language=language,
        profanity_filter=profanity_filter
    )
    
    # Add keyterms if provided (Nova-3 feature - monolingual only)
    if keyterms and model == "nova-3":
        opts.keyterm = keyterms
    
    return client.listen.rest.v("1").transcribe_file({"buffer": buf}, opts)


def write_srt(resp: dict, dest: Path, lang: str = "eng"):
    """
    Generate and write SRT subtitle file from Deepgram response.
    
    Args:
        resp: Deepgram transcription response
        dest: Path where SRT file should be written
        lang: Language code for subtitle file (default: "eng" for English)
        
    Raises:
        Exception: If SRT generation or writing fails
    """
    # Ensure the destination has the proper .lang.srt extension
    if not dest.name.endswith(f".{lang}.srt"):
        dest = dest.parent / f"{dest.stem}.{lang}.srt"
    
    srt_content = srt(DeepgramConverter(resp))
    dest.write_text(srt_content, encoding="utf-8")


def get_transcripts_folder(video_path: Path) -> Path:
    """
    Determine the appropriate Transcripts folder for a video file.
    
    Creates folder structure:
    - TV Shows: /media/tv/Show/Season 01/Transcripts/
    - Movies: /media/movies/Movie (2024)/Transcripts/
    
    Args:
        video_path: Path to the video file
        
    Returns:
        Path to the Transcripts folder (created if doesn't exist)
    """
    # Get the parent directory of the video file
    video_parent = video_path.parent
    
    # Try to detect if this is a TV show (has "Season" in path) or movie
    path_str = str(video_path).lower()
    
    # For TV shows, Transcripts folder should be at the season level
    # Path pattern: /media/tv/Show Name/Season 01/episode.mkv
    # Transcripts: /media/tv/Show Name/Season 01/Transcripts/
    if 'season' in path_str or video_parent.name.lower().startswith('season'):
        transcripts_folder = video_parent / "Transcripts"
    else:
        # For movies, Transcripts folder at the movie directory level
        # Path pattern: /media/movies/Movie (2024)/movie.mkv
        # Transcripts: /media/movies/Movie (2024)/Transcripts/
        transcripts_folder = video_parent / "Transcripts"
    
    # Create folder if it doesn't exist
    transcripts_folder.mkdir(parents=True, exist_ok=True)
    
    return transcripts_folder


def get_json_folder(video_path: Path) -> Path:
    """
    Get the JSON subfolder within the Transcripts folder.
    
    Creates: Transcripts/JSON/
    
    Args:
        video_path: Path to the video file
        
    Returns:
        Path to the JSON folder (created if doesn't exist)
    """
    transcripts_folder = get_transcripts_folder(video_path)
    json_folder = transcripts_folder / "JSON"
    json_folder.mkdir(parents=True, exist_ok=True)
    return json_folder


def write_transcript(resp: dict, dest: Path, speaker_map_name: str = None):
    """
    Generate and write transcript text file from Deepgram response.
    
    Args:
        resp: Deepgram transcription response with diarization
        dest: Path where transcript file should be written
        speaker_map_name: Optional speaker map name for mapping speaker IDs to names
        
    Raises:
        Exception: If transcript generation or writing fails
    """
    # Load speaker map if provided
    speaker_map = {}
    if speaker_map_name:
        speaker_map_path = Path(os.environ.get("SPEAKER_MAPS_PATH", "/config/speaker_maps")) / speaker_map_name / "speakers.csv"
        if speaker_map_path.exists():
            import csv
            with open(speaker_map_path, 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    speaker_map[int(row['speaker_id'])] = row['name']
    
    # Generate transcript with speaker labels
    transcript_lines = []
    
    try:
        # Access the response data
        result = resp.results.channels[0].alternatives[0]
        
        # Check if diarization was enabled
        if hasattr(result, 'words') and result.words:
            current_speaker = None
            current_text = []
            
            for word in result.words:
                speaker_id = getattr(word, 'speaker', None)
                
                # Handle speaker changes
                if speaker_id != current_speaker:
                    # Save previous speaker's text
                    if current_speaker is not None and current_text:
                        speaker_name = speaker_map.get(current_speaker, f"Speaker {current_speaker}")
                        transcript_lines.append(f"{speaker_name}: {' '.join(current_text)}")
                    
                    # Start new speaker
                    current_speaker = speaker_id
                    current_text = [word.word]
                else:
                    current_text.append(word.word)
            
            # Save last speaker's text
            if current_text:
                speaker_name = speaker_map.get(current_speaker, f"Speaker {current_speaker}")
                transcript_lines.append(f"{speaker_name}: {' '.join(current_text)}")
        else:
            # No diarization, just write the transcript
            transcript_lines.append(result.transcript)
    
    except Exception as e:
        # Fallback to simple transcript
        try:
            result = resp.results.channels[0].alternatives[0]
            transcript_lines.append(result.transcript)
        except:
            raise Exception(f"Failed to generate transcript: {e}")
    
    # Write transcript to file
    dest.write_text('\n\n'.join(transcript_lines), encoding='utf-8')


def write_raw_json(resp: dict, video_path: Path):
    """
    Save raw Deepgram API response as JSON for debugging.
    
    Saves to: Transcripts/JSON/{video_name}.deepgram.json
    
    Args:
        resp: Deepgram transcription response
        video_path: Path to the original video file
        
    Raises:
        Exception: If JSON writing fails
    """
    json_folder = get_json_folder(video_path)
    json_path = json_folder / f"{video_path.stem}.deepgram.json"
    
    try:
        # Convert response to dict if it has to_dict method
        response_data = resp.to_dict() if hasattr(resp, 'to_dict') else resp
        json_path.write_text(json.dumps(response_data, indent=2), encoding='utf-8')
    except Exception as e:
        raise Exception(f"Failed to write raw JSON: {e}")