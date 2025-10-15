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

# Supported video file extensions
VIDEO_EXTS = {'.mkv', '.mp4', '.avi', '.mov', '.m4v', '.wmv', '.flv'}


def is_video(p: Path) -> bool:
    """
    Check if a path points to a supported video file.
    
    Args:
        p: Path to check
        
    Returns:
        True if the file has a supported video extension
    """
    return p.suffix.lower() in VIDEO_EXTS


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


def transcribe_file(buf: bytes, api_key: str, model: str, language: str) -> dict:
    """
    Transcribe audio buffer using Deepgram API.
    
    Args:
        buf: Audio file contents as bytes
        api_key: Deepgram API key
        model: Model to use (e.g., 'nova-3')
        language: Language code (e.g., 'en')
        
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
        diarize=False,
        language=language
    )
    return client.listen.rest.v("1").transcribe_file({"buffer": buf}, opts)


def write_srt(resp: dict, dest: Path):
    """
    Generate and write SRT subtitle file from Deepgram response.
    
    Args:
        resp: Deepgram transcription response
        dest: Path where SRT file should be written
        
    Raises:
        Exception: If SRT generation or writing fails
    """
    srt_content = srt(DeepgramConverter(resp))
    dest.write_text(srt_content, encoding="utf-8")