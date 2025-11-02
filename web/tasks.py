#!/usr/bin/env python3
"""
Celery tasks for background transcription processing.

Handles asynchronous video transcription jobs using Celery workers.
Supports batched processing with Bazarr integration for subtitle rescanning.
"""

import os
import json
import time
import sys
from pathlib import Path
from celery import Celery
from celery import group, chord

# Add parent directory to path to import core module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from core.transcribe import (
    is_video, extract_audio, transcribe_file, write_srt, get_transcripts_folder,
    get_json_folder, write_raw_json, load_keyterms_from_csv, save_keyterms_to_csv,
    find_speaker_map, write_transcript, get_video_duration
)

# Configuration from environment
REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")
MEDIA_ROOT = Path(os.environ.get("MEDIA_ROOT", "/media"))
LOG_ROOT = Path(os.environ.get("LOG_ROOT", "/logs"))
DEFAULT_MODEL = os.environ.get("DEFAULT_MODEL", "nova-3")
DEFAULT_LANGUAGE = os.environ.get("DEFAULT_LANGUAGE", "en")
BAZARR_BASE_URL = os.environ.get("BAZARR_BASE_URL", "")
BAZARR_API_KEY = os.environ.get("BAZARR_API_KEY", "")
DG_KEY = os.environ["DEEPGRAM_API_KEY"]
SAVE_RAW_JSON = os.environ.get("SAVE_RAW_JSON", "0") == "1"

# Initialize Celery app
celery_app = Celery(__name__, broker=REDIS_URL, backend=REDIS_URL)

# Configure task routing
celery_app.conf.task_routes = {
    'transcribe_task': {'queue': 'transcribe'},
    'batch_finalize': {'queue': 'transcribe'},
    'generate_keyterms_task': {'queue': 'transcribe'},
}


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
def transcribe_task(self, video_path: str, model=DEFAULT_MODEL, language=DEFAULT_LANGUAGE,
                    profanity_filter="off", force_regenerate=False, enable_transcript=False,
                    keyterms=None, save_raw_json=False, auto_save_keyterms=False,
                    numerals=False, filler_words=False, detect_language=False, measurements=False,
                    diarization=True, utterances=True, paragraphs=True):
    """
    Transcribe a single video file.

    Args:
        video_path: Path to video file
        model: Deepgram model to use (default: nova-3)
        language: Language code (default: en)
        profanity_filter: Profanity filter mode - "off", "tag", or "remove" (default: off)
        force_regenerate: Force overwrite existing subtitles
        enable_transcript: Generate transcript file in addition to subtitles
        keyterms: Optional list of keyterms for better recognition (Nova-3, monolingual only)
        save_raw_json: Save raw Deepgram API response for debugging (default: false)
        auto_save_keyterms: Automatically save keyterms to CSV in Transcripts/Keyterms/ (default: false)
        numerals: Convert spoken numbers to digits (e.g., "twenty twenty four" → "2024")
        filler_words: Include filler words like "uh", "um" in transcription (default: False)
        detect_language: Auto-detect language for international content
        measurements: Convert spoken measurements (e.g., "fifty meters" → "50m")
        diarization: Enable speaker diarization (default: True)
        utterances: Enable utterance segmentation (default: True)
        paragraphs: Enable paragraph formatting (default: True)

    Returns:
        dict: Status and file paths
        
    The task will:
    1. Check if SRT already exists (skip if yes unless force_regenerate)
    2. Auto-load keyterms from CSV if available (or use provided keyterms)
    3. Extract audio from video
    4. Transcribe with Deepgram API
    5. Generate and save SRT file
    6. Remove Subsyncarr marker file if present (so Subsyncarr knows to reprocess)
    7. Optionally save keyterms to CSV in Transcripts/Keyterms/
    8. Optionally generate transcript file to Transcripts folder with auto-detected speaker map
    9. Optionally save raw JSON to Transcripts/JSON folder
    10. Log the result
    11. Clean up temporary audio file
    """
    vp = Path(video_path)
    srt_out = vp.with_suffix(".eng.srt")
    synced_marker = vp.with_suffix(".eng.synced")
    
    # Determine transcript path based on Transcripts folder structure
    if enable_transcript:
        transcripts_folder = get_transcripts_folder(vp)
        txt_out = transcripts_folder / f"{vp.stem}.transcript.speakers.txt"
    else:
        txt_out = None
    
    # Start timing
    start_time = time.time()
    
    # Get video duration for timing analysis
    video_duration = get_video_duration(vp)
    
    meta = {
        "video": str(vp),
        "srt": str(srt_out),
        "filename": vp.name,
        "video_duration_seconds": video_duration,
        "start_time": start_time
    }
    
    if enable_transcript:
        meta["transcript"] = str(txt_out)
    
    # Update task state to show current file
    self.update_state(state='PROGRESS', meta={'current_file': vp.name, 'stage': 'checking'})
    
    # Skip if SRT already exists (unless force_regenerate)
    if srt_out.exists() and not force_regenerate:
        return {"status": "skipped", **meta}
    
    # Auto-load keyterms from CSV if no keyterms provided
    if not keyterms:
        csv_keyterms = load_keyterms_from_csv(vp)
        if csv_keyterms:
            keyterms = csv_keyterms
            print(f"Auto-loaded {len(keyterms)} keyterms from CSV")
    
    audio_tmp = None
    try:
        # Extract audio
        self.update_state(state='PROGRESS', meta={'current_file': vp.name, 'stage': 'extracting_audio'})
        audio_tmp = extract_audio(vp)
        
        # Transcribe with optional parameters
        self.update_state(state='PROGRESS', meta={'current_file': vp.name, 'stage': 'transcribing'})
        with open(audio_tmp, "rb") as f:
            resp = transcribe_file(
                f.read(),
                DG_KEY,
                model,
                language,
                profanity_filter=profanity_filter,
                diarize=diarization,  # Use the new parameter instead of enable_transcript
                keyterms=keyterms,
                numerals=numerals,
                filler_words=filler_words,
                detect_language=detect_language,
                measurements=measurements,
                utterances=utterances,
                paragraphs=paragraphs
            )
        
        # Generate SRT
        self.update_state(state='PROGRESS', meta={'current_file': vp.name, 'stage': 'generating_srt'})
        write_srt(resp, srt_out)
        
        # Remove Subsyncarr marker file if it exists so Subsyncarr knows to reprocess
        if synced_marker.exists():
            synced_marker.unlink()
            print(f"Removed Subsyncarr marker: {synced_marker}")
        
        # Save keyterms to CSV if enabled and keyterms were provided
        if auto_save_keyterms and keyterms:
            self.update_state(state='PROGRESS', meta={'current_file': vp.name, 'stage': 'saving_keyterms'})
            try:
                if save_keyterms_to_csv(vp, keyterms):
                    print(f"Saved {len(keyterms)} keyterms to CSV")
            except Exception as e:
                print(f"Warning: Failed to save keyterms: {e}")
        
        # Generate transcript if requested
        if enable_transcript:
            self.update_state(state='PROGRESS', meta={'current_file': vp.name, 'stage': 'generating_transcript'})

            # Auto-detect speaker map from Transcripts/Speakermap/
            speaker_map_path = find_speaker_map(vp)

            if speaker_map_path:
                print(f"Using speaker map: {speaker_map_path}")

            write_transcript(resp, txt_out, speaker_map_path)
        
        # Save raw JSON if enabled (either globally or per-request)
        if SAVE_RAW_JSON or save_raw_json:
            self.update_state(state='PROGRESS', meta={'current_file': vp.name, 'stage': 'saving_raw_json'})
            try:
                write_raw_json(resp, vp)
            except Exception as e:
                print(f"Warning: Failed to save raw JSON: {e}")
        
        # Calculate processing time
        end_time = time.time()
        processing_time = end_time - start_time
        
        # Calculate time multiplier (actual_time / video_duration)
        time_multiplier = processing_time / video_duration if video_duration > 0 else 0
        
        # Add timing data to meta
        timing_data = {
            "end_time": end_time,
            "processing_time_seconds": processing_time,
            "time_multiplier": time_multiplier,
            "processing_time_formatted": f"{int(processing_time // 60)}:{int(processing_time % 60):02d}",
            "video_duration_formatted": f"{int(video_duration // 60)}:{int(video_duration % 60):02d}"
        }
        
        # Log success with timing data
        _save_job_log({"status": "ok", **meta, **timing_data})
        
        return {"status": "ok", **meta, **timing_data}
        
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


@celery_app.task(bind=True, name="generate_keyterms_task")
def generate_keyterms_task(
    self,
    video_path: str,
    provider: str,
    model: str,
    preserve_existing: bool = False
):
    """
    Async task to generate keyterms using LLM.
    
    Args:
        video_path: Path to video file
        provider: LLM provider ("anthropic" or "openai")
        model: Model identifier (e.g., "claude-sonnet-4", "gpt-4")
        preserve_existing: If True, merge with existing; if False, overwrite
        
    Returns:
        dict: Generated keyterms and metadata
        
    Updates state with progress:
        - PROGRESS: Initializing, generating, saving
        - SUCCESS: Complete with keyterms
        - FAILURE: Error details
    """
    vp = Path(video_path)
    
    try:
        # Update: Initializing
        self.update_state(
            state='PROGRESS',
            meta={'stage': 'initializing', 'progress': 0}
        )
        
        # Get API key from environment
        if provider == 'anthropic':
            api_key = os.environ.get('ANTHROPIC_API_KEY')
        elif provider == 'openai':
            api_key = os.environ.get('OPENAI_API_KEY')
        else:
            raise ValueError(f"Unsupported provider: {provider}")
        
        if not api_key:
            raise ValueError(f"API key not configured for {provider}")
        
        # Extract show name
        path_parts = vp.parts
        show_name = None
        
        for i, part in enumerate(path_parts):
            part_lower = part.lower()
            if 'season' in part_lower or part_lower == 'specials':
                if i > 0:
                    show_name = path_parts[i - 1]
                break
        
        if not show_name:
            show_name = vp.parent.name
        
        # Load existing keyterms if any
        existing = load_keyterms_from_csv(vp)
        
        # Update: Generating
        self.update_state(
            state='PROGRESS',
            meta={'stage': 'generating', 'progress': 30}
        )
        
        # Import here to avoid import errors if dependencies not installed
        from core.keyterm_search import KeytermSearcher, LLMProvider, LLMModel
        
        # Convert string provider/model to enums using bracket notation (access by NAME)
        try:
            provider_enum = LLMProvider[provider.upper()]
            model_enum = LLMModel[model.upper().replace('-', '_')]
        except KeyError:
            raise ValueError(f"Invalid provider or model: {provider}, {model}")
        
        # Generate keyterms
        searcher = KeytermSearcher(
            provider=provider_enum,
            model=model_enum,
            api_key=api_key
        )
        
        result = searcher.generate_from_metadata(
            show_name=show_name,
            existing_keyterms=existing,
            preserve_existing=preserve_existing
        )
        
        # Update: Saving
        self.update_state(
            state='PROGRESS',
            meta={'stage': 'saving', 'progress': 80}
        )
        
        # Save to CSV
        if save_keyterms_to_csv(vp, result['keyterms']):
            print(f"Saved {len(result['keyterms'])} LLM-generated keyterms to CSV")
        
        # Return results
        return {
            'keyterms': result['keyterms'],
            'token_count': result['token_count'],
            'actual_cost': result['estimated_cost'],
            'provider': provider,
            'model': model,
            'keyterm_count': len(result['keyterms'])
        }
        
    except Exception as e:
        self.update_state(
            state='FAILURE',
            meta={'error': str(e)}
        )
        raise


def make_batch(files, model, language, profanity_filter="off", force_regenerate=False,
               enable_transcript=False, keyterms=None, save_raw_json=False,
               auto_save_keyterms=False, numerals=False, filler_words=False,
               detect_language=False, measurements=False, diarization=True, utterances=True,
               paragraphs=True):
    """
    Create a batch of transcription jobs.

    Uses Celery's chord to run jobs in parallel and trigger a callback
    when all jobs complete.

    Args:
        files: List of Path objects for videos to transcribe
        model: Deepgram model to use
        language: Language code
        profanity_filter: Profanity filter mode - "off", "tag", or "remove"
        force_regenerate: Force overwrite existing subtitles
        enable_transcript: Generate transcript files in addition to subtitles
        keyterms: Optional list of keyterms for better recognition (Nova-3, monolingual)
        save_raw_json: Save raw Deepgram API response for debugging (default: false)
        auto_save_keyterms: Automatically save keyterms to CSV in Transcripts/Keyterms/ (default: false)
        numerals: Convert spoken numbers to digits (e.g., "twenty twenty four" → "2024")
        filler_words: Include filler words like "uh", "um" in transcription (default: False)
        detect_language: Auto-detect language for international content
        measurements: Convert spoken measurements (e.g., "fifty meters" → "50m")
        diarization: Enable speaker diarization (default: True)
        utterances: Enable utterance segmentation (default: True)
        paragraphs: Enable paragraph formatting (default: True)

    Returns:
        AsyncResult: Celery async result for tracking batch progress
    """
    jobs = [
        transcribe_task.s(
            str(f),
            model,
            language,
            profanity_filter,
            force_regenerate,
            enable_transcript,
            keyterms,
            save_raw_json,
            auto_save_keyterms,
            numerals,
            filler_words,
            detect_language,
            measurements,
            diarization,
            utterances,
            paragraphs
        ) for f in files
    ]
    # Use group() instead of chord to allow progress tracking
    # GroupResult allows the API to query individual task states
    job_group = group(jobs)
    result = job_group.apply_async()

    # Save the GroupResult so it can be restored later
    result.save()

    return result