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
import csv
from typing import Optional, List

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
                    profanity_filter: str = "off", diarize: bool = False, keyterms: list = None,
                    numerals: bool = False, filler_words: bool = False,
                    detect_language: bool = False, measurements: bool = False,
                    utterances: bool = True, paragraphs: bool = True) -> dict:
    """
    Transcribe audio buffer using Deepgram API.

    Args:
        buf: Audio file contents as bytes
        api_key: Deepgram API key
        model: Model to use (e.g., 'nova-3')
        language: Language code (e.g., 'en')
        profanity_filter: Profanity filter mode - "off", "tag", or "remove" (default: off)
        diarize: Enable speaker diarization (default: False)
        keyterms: List of keyterms for better recognition (Nova-3 only, monolingual)
        numerals: Convert spoken numbers to digits (e.g., "twenty twenty four" → "2024")
        filler_words: Include filler words like "uh", "um" in transcription (default: False for subtitles)
        detect_language: Auto-detect language for international content
        measurements: Convert spoken measurements (e.g., "fifty meters" → "50m")
        utterances: Enable utterance segmentation (default: True)
        paragraphs: Enable paragraph formatting (default: True)

    Returns:
        Deepgram response object

    Raises:
        Exception: If transcription fails
    """
    client = DeepgramClient(api_key=api_key)

    # Convert profanity_filter to boolean for API compatibility
    # API expects True/False, not "off"/"tag"/"remove"
    use_profanity_filter = profanity_filter != "off"

    opts = PrerecordedOptions(
        model=model,
        smart_format=True,
        utterances=utterances,
        punctuate=True,
        paragraphs=paragraphs,
        diarize=diarize,
        language=language,
        profanity_filter=use_profanity_filter
    )
    
    # Add keyterms if provided (Nova-3 feature - monolingual only)
    if keyterms and model == "nova-3":
        opts.keyterm = keyterms
    
    # Add Nova-3 quality enhancement parameters
    if numerals:
        opts.numerals = True
    
    if filler_words:
        opts.filler_words = True
    
    if detect_language:
        opts.detect_language = True
    
    if measurements:
        opts.measurements = True
    
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
    - TV Shows: /media/tv/Show/Transcripts/ (at show level, alongside seasons)
    - TV Specials: /media/tv/Show/Transcripts/ (at show level, alongside specials)
    - Movies: /media/movies/Movie (2024)/Transcripts/
    
    Args:
        video_path: Path to the video file
        
    Returns:
        Path to the Transcripts folder (created if doesn't exist)
    """
    # Get the parent directory of the video file
    video_parent = video_path.parent
    
    # Try to detect if this is a TV show (has "Season" or "Specials" in path) or movie
    path_str = str(video_path).lower()
    parent_name_lower = video_parent.name.lower()
    
    # For TV shows, Transcripts folder should be at the show level (one level up from season/specials)
    # Path pattern: /media/tv/Show Name/Season 01/episode.mkv
    # Path pattern: /media/tv/Show Name/Specials/episode.mkv
    # Transcripts: /media/tv/Show Name/Transcripts/ (alongside Season/Specials folders)
    if 'season' in path_str or parent_name_lower.startswith('season') or parent_name_lower == 'specials':
        # Go up one more level to get to the show folder
        show_folder = video_parent.parent
        transcripts_folder = show_folder / "Transcripts"
    else:
        # For movies, Transcripts folder at the movie directory level
        # Path pattern: /media/movies/Movie (2024)/movie.mkv
        # Transcripts: /media/movies/Movie (2024)/Transcripts/
        transcripts_folder = video_parent / "Transcripts"
    
    # Create folder if it doesn't exist with proper permissions
    transcripts_folder.mkdir(parents=True, exist_ok=True)
    
    # Ensure folder has proper permissions (0o755 = rwxr-xr-x)
    # This prevents permission issues when created by Docker containers
    try:
        transcripts_folder.chmod(0o755)
        # Also set permissions for parent directories if they were just created
        if 'season' in path_str or parent_name_lower.startswith('season') or parent_name_lower == 'specials':
            # For TV shows, also ensure the parent Transcripts folder has proper permissions
            parent = transcripts_folder.parent
            if parent.exists():
                parent.chmod(0o755)
    except (OSError, PermissionError):
        # If we can't set permissions (e.g., running as non-root), that's okay
        pass
    
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
    
    # Ensure proper permissions
    try:
        json_folder.chmod(0o755)
    except (OSError, PermissionError):
        pass
    
    return json_folder


def get_keyterms_folder(video_path: Path) -> Path:
    """
    Get the Keyterms subfolder within the Transcripts folder.
    
    Creates: Transcripts/Keyterms/
    
    Args:
        video_path: Path to the video file
        
    Returns:
        Path to the Keyterms folder (created if doesn't exist)
    """
    transcripts_folder = get_transcripts_folder(video_path)
    keyterms_folder = transcripts_folder / "Keyterms"
    keyterms_folder.mkdir(parents=True, exist_ok=True)
    
    # Ensure proper permissions
    try:
        keyterms_folder.chmod(0o755)
    except (OSError, PermissionError):
        pass
    
    return keyterms_folder


def get_speakermap_folder(video_path: Path) -> Path:
    """
    Get the Speakermap subfolder within the Transcripts folder.
    
    Creates: Transcripts/Speakermap/
    
    Args:
        video_path: Path to the video file
        
    Returns:
        Path to the Speakermap folder (created if doesn't exist)
    """
    transcripts_folder = get_transcripts_folder(video_path)
    speakermap_folder = transcripts_folder / "Speakermap"
    speakermap_folder.mkdir(parents=True, exist_ok=True)
    
    # Ensure proper permissions
    try:
        speakermap_folder.chmod(0o755)
    except (OSError, PermissionError):
        pass
    
    return speakermap_folder


def load_keyterms_from_csv(video_path: Path) -> Optional[List[str]]:
    """
    Load keyterms from CSV file in Transcripts/Keyterms/ folder.
    
    Looks for: Transcripts/Keyterms/{show_or_movie_name}_keyterms.csv
    
    CSV Format (one keyterm per line):
    ```
    Walter White
    Jesse Pinkman
    Heisenberg
    Albuquerque
    ```
    
    Args:
        video_path: Path to the video file
        
    Returns:
        List of keyterms if CSV exists, None otherwise
    """
    try:
        keyterms_folder = get_keyterms_folder(video_path)
        
        # Determine show/movie name from path
        # For TV: /media/tv/Show Name/Season XX/episode.mkv -> "Show Name"
        # For TV Specials: /media/tv/Show Name/Specials/episode.mkv -> "Show Name"
        # For Movies: /media/movies/Movie (2024)/movie.mkv -> "Movie (2024)"
        path_parts = video_path.parts
        
        # Try to find the show/movie name
        show_or_movie_name = None
        for i, part in enumerate(path_parts):
            part_lower = part.lower()
            # Check for season folders or specials folders
            if 'season' in part_lower or part_lower == 'specials':
                # TV show - name is one level up from season/specials
                if i > 0:
                    show_or_movie_name = path_parts[i - 1]
                break
        
        if not show_or_movie_name:
            # Movie - parent directory of video file
            show_or_movie_name = video_path.parent.name
        
        # Look for keyterms CSV
        csv_path = keyterms_folder / f"{show_or_movie_name}_keyterms.csv"
        
        if not csv_path.exists():
            return None
        
        # Read keyterms from CSV
        keyterms = []
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            for row in reader:
                if row and row[0].strip() and not row[0].strip().startswith('#'):
                    keyterms.append(row[0].strip())
        
        return keyterms if keyterms else None
        
    except Exception as e:
        print(f"Warning: Failed to load keyterms from CSV: {e}")
        return None


def save_keyterms_to_csv(video_path: Path, keyterms: List[str]) -> bool:
    """
    Save keyterms to CSV file in Transcripts/Keyterms/ folder.
    
    Saves to: Transcripts/Keyterms/{show_or_movie_name}_keyterms.csv
    
    Args:
        video_path: Path to the video file
        keyterms: List of keyterms to save
        
    Returns:
        True if saved successfully, False otherwise
    """
    try:
        keyterms_folder = get_keyterms_folder(video_path)
        
        # Determine show/movie name from path
        path_parts = video_path.parts
        show_or_movie_name = None
        for i, part in enumerate(path_parts):
            part_lower = part.lower()
            # Check for season folders or specials folders
            if 'season' in part_lower or part_lower == 'specials':
                if i > 0:
                    show_or_movie_name = path_parts[i - 1]
                break
        
        if not show_or_movie_name:
            show_or_movie_name = video_path.parent.name
        
        # Save keyterms to CSV
        csv_path = keyterms_folder / f"{show_or_movie_name}_keyterms.csv"
        
        with open(csv_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            for keyterm in keyterms:
                if keyterm.strip():
                    writer.writerow([keyterm.strip()])
        
        return True
        
    except Exception as e:
        print(f"Warning: Failed to save keyterms to CSV: {e}")
        return False


def find_speaker_map(video_path: Path) -> Optional[Path]:
    """
    Find speaker map for a video file.

    Looks for: Transcripts/Speakermap/speakers.csv

    Args:
        video_path: Path to the video file

    Returns:
        Path to speakers.csv if found, None otherwise
    """
    try:
        # Check Transcripts/Speakermap/ folder
        speakermap_folder = get_speakermap_folder(video_path)
        local_map = speakermap_folder / "speakers.csv"

        if local_map.exists():
            return local_map

        return None

    except Exception as e:
        print(f"Warning: Failed to find speaker map: {e}")
        return None


def write_transcript(resp: dict, dest: Path, speaker_map_path: Optional[Path] = None):
    """
    Generate and write transcript text file from Deepgram response.
    
    Args:
        resp: Deepgram transcription response with diarization
        dest: Path where transcript file should be written
        speaker_map_path: Optional path to speaker map CSV file
        
    Raises:
        Exception: If transcript generation or writing fails
    """
    # Load speaker map if provided
    speaker_map = {}
    if speaker_map_path and speaker_map_path.exists():
        try:
            with open(speaker_map_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    speaker_map[int(row['speaker_id'])] = row['name']
        except Exception as e:
            print(f"Warning: Failed to load speaker map: {e}")
    
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