#!/usr/bin/env python3
"""
Celery tasks for background transcription processing.

Handles asynchronous video transcription jobs using Celery workers.
Supports batched processing with Bazarr integration for subtitle rescanning.
"""

import os
import json
import time
from pathlib import Path
from celery import Celery
from celery import group, chord
from core.transcribe import is_video, extract_audio, transcribe_file, write_srt

# Configuration from environment
REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")
MEDIA_ROOT = Path(os.environ.get("MEDIA_ROOT", "/media"))
LOG_ROOT = Path(os.environ.get("LOG_ROOT", "/logs"))
DEFAULT_MODEL = os.environ.get("DEFAULT_MODEL", "nova-3")
DEFAULT_LANGUAGE = os.environ.get("DEFAULT_LANGUAGE", "en")
BAZARR_BASE_URL = os.environ.get("BAZARR_BASE_URL", "")
BAZARR_API_KEY = os.environ.get("BAZARR_API_KEY", "")
DG_KEY = os.environ["DEEPGRAM_API_KEY"]

# Initialize Celery app
celery_app = Celery(__name__, broker=REDIS_URL, backend=REDIS_URL)


def _save_job_log(payload: dict):
    """
    Save job result to JSON log file.
    
    Args:
        payload: Job result data to log
    """
    LOG_ROOT.mkdir(parents=True, exist_ok=True)
    timestamp = int(time.time() * 1000)
    log_file = LOG_ROOT / f"job_{timestamp}.json"
    log_file.write_text(json.dumps(payload, indent=2))


@celery_app.task(bind=True, name="transcribe_task")
def transcribe_task(self, video_path: str, model=DEFAULT_MODEL, language=DEFAULT_LANGUAGE):
    """
    Transcribe a single video file.
    
    Args:
        video_path: Path to video file
        model: Deepgram model to use (default: nova-3)
        language: Language code (default: en)
        
    Returns:
        dict: Status and file paths
        
    The task will:
    1. Check if SRT already exists (skip if yes)
    2. Extract audio from video
    3. Transcribe with Deepgram API
    4. Generate and save SRT file
    5. Log the result
    6. Clean up temporary audio file
    """
    vp = Path(video_path)
    srt_out = vp.with_suffix(".srt")
    meta = {"video": str(vp), "srt": str(srt_out)}
    
    # Skip if SRT already exists
    if srt_out.exists():
        return {"status": "skipped", **meta}
    
    audio_tmp = None
    try:
        # Extract audio
        audio_tmp = extract_audio(vp)
        
        # Transcribe
        with open(audio_tmp, "rb") as f:
            resp = transcribe_file(f.read(), DG_KEY, model, language)
        
        # Generate SRT
        write_srt(resp, srt_out)
        
        # Log success
        _save_job_log({"status": "ok", **meta})
        
        return {"status": "ok", **meta}
        
    except Exception as e:
        # Log error
        _save_job_log({"status": "error", "error": str(e), **meta})
        raise
        
    finally:
        # Clean up temporary audio file
        if audio_tmp and Path(audio_tmp).exists():
            try:
                Path(audio_tmp).unlink()
            except:
                pass


@celery_app.task(name="batch_finalize")
def batch_finalize(results):
    """
    Finalize a batch of transcription jobs.
    
    Called automatically after all jobs in a batch complete via Celery chord.
    Triggers Bazarr rescan if configured.
    
    Args:
        results: List of results from transcribe_task
        
    Returns:
        dict: Batch completion status
    """
    # Trigger Bazarr rescan once per batch (only if configured)
    if BAZARR_BASE_URL and BAZARR_API_KEY:
        import requests
        try:
            response = requests.post(
                f"{BAZARR_BASE_URL}/api/system/tasks/SearchWantedSubtitles",
                headers={"X-API-KEY": BAZARR_API_KEY},
                timeout=10
            )
            print(f"Bazarr rescan triggered: {response.status_code}")
        except Exception as e:
            print(f"Bazarr rescan failed: {e}")
    
    return {"batch_status": "done", "results": results}


def make_batch(files, model, language):
    """
    Create a batch of transcription jobs.
    
    Uses Celery's chord to run jobs in parallel and trigger a callback
    when all jobs complete.
    
    Args:
        files: List of Path objects for videos to transcribe
        model: Deepgram model to use
        language: Language code
        
    Returns:
        AsyncResult: Celery async result for tracking batch progress
    """
    jobs = [transcribe_task.s(str(f), model, language) for f in files]
    return chord(group(jobs))(batch_finalize.s())