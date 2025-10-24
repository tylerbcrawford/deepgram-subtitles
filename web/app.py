#!/usr/bin/env python3
"""
Flask API for Deepgram Subtitle Generator Web UI.

Provides REST API endpoints for scanning media directories, submitting
transcription jobs, and monitoring progress via Server-Sent Events (SSE).
"""

import os
import json
import time
from pathlib import Path
from flask import Flask, request, jsonify, Response, abort, render_template, send_file
from werkzeug.utils import secure_filename
from tasks import celery_app, make_batch
from core.transcribe import (
    is_video, is_media, get_video_duration,
    load_keyterms_from_csv, save_keyterms_to_csv,
    get_keyterms_folder
)

MEDIA_ROOT = Path(os.environ.get("MEDIA_ROOT", "/media"))
DEFAULT_MODEL = "nova-3"  # Hardcoded to Nova-3
DEFAULT_LANGUAGE = os.environ.get("DEFAULT_LANGUAGE", "en")
ALLOWED = set([e.strip().lower() for e in os.environ.get("ALLOWED_EMAILS", "").split(",") if e.strip()])

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "change-me")


def _require_auth():
    """
    Require authentication via OAuth proxy headers.
    
    The OAuth proxy (oauth2-proxy) sets the X-Auth-Request-Email header
    when a user successfully authenticates with Google OAuth.
    
    Returns:
        str: Authenticated user's email
        
    Raises:
        401: If no authentication header is present
        403: If user's email is not in the allowlist
    """
    user = request.headers.get("X-Auth-Request-Email") or request.headers.get("X-Forwarded-User")
    if not user:
        abort(401)
    if ALLOWED and user.lower() not in ALLOWED:
        abort(403)
    return user


@app.get("/")
def index():
    """Serve the web UI (optional)."""
    # Temporarily disabled for local testing - uncomment _require_auth() for production
    # _require_auth()
    return render_template("index.html")


@app.get("/healthz")
def healthz():
    """Health check endpoint for container orchestration."""
    return ("ok", 200)


@app.get("/api/config")
def api_config():
    """
    Get current configuration defaults.
    
    Returns default model and language settings.
    """
    # _require_auth()
    return jsonify({
        "default_model": DEFAULT_MODEL,
        "default_language": DEFAULT_LANGUAGE
    })


@app.get("/api/browse")
def api_browse():
    """
    Browse directories and video files within MEDIA_ROOT.
    
    Query Parameters:
        path: Subdirectory to list (default: MEDIA_ROOT)
        show_all: Include videos with existing subtitles (default: false)
        
    Returns:
        JSON with list of subdirectories and video files
        
    Security:
        - Path must be under MEDIA_ROOT
    """
    # _require_auth()
    path = request.args.get("path", str(MEDIA_ROOT))
    show_all = request.args.get("show_all", "false").lower() == "true"
    path = Path(path).resolve()
    media_root_resolved = MEDIA_ROOT.resolve()
    
    # Security: Ensure path is under MEDIA_ROOT
    try:
        # Use is_relative_to for proper path comparison (Python 3.9+)
        if not path.is_relative_to(media_root_resolved):
            abort(400, "Path must be under MEDIA_ROOT")
    except (ValueError, AttributeError):
        # Fallback for older Python or path comparison issues
        if not str(path).startswith(str(media_root_resolved)):
            abort(400, "Path must be under MEDIA_ROOT")
    
    if not path.exists() or not path.is_dir():
        abort(404, "Directory not found")
    
    directories = []
    files = []
    
    try:
        for item in sorted(path.iterdir()):
            if item.is_dir() and not item.name.startswith('.'):
                # Count media files in this directory (recursive)
                media_count = sum(1 for p in item.rglob("*") if p.is_file() and is_media(p))
                directories.append({
                    "name": item.name,
                    "path": str(item),
                    "video_count": media_count  # Keep name for compatibility, but now includes audio
                })
            elif item.is_file() and is_media(item):
                # Only include if showing all OR subtitle doesn't exist
                if show_all or not item.with_suffix(".eng.srt").exists():
                    files.append({
                        "name": item.name,
                        "path": str(item),
                        "has_subtitles": item.with_suffix(".eng.srt").exists()
                    })
    except PermissionError:
        abort(403, "Permission denied")
    
    return jsonify({
        "current_path": str(path),
        "parent_path": str(path.parent) if path != MEDIA_ROOT else None,
        "directories": directories,
        "files": files,
        "file_count": len(files)
    })


@app.get("/api/scan")
def api_scan():
    """
    Scan a directory for videos.
    
    Query Parameters:
        root: Directory path to scan (default: MEDIA_ROOT)
        show_all: Include videos with existing subtitles (default: false)
        
    Returns:
        JSON with count and list of video files
        
    Security:
        - Path must be under MEDIA_ROOT
        - Limited to 500 results
    """
    # _require_auth()
    root = request.args.get("root", str(MEDIA_ROOT))
    show_all = request.args.get("show_all", "false").lower() == "true"
    root = Path(root)
    
    # Security: Ensure path is under MEDIA_ROOT
    if not str(root).startswith(str(MEDIA_ROOT)):
        abort(400, "Path must be under MEDIA_ROOT")
    
    files = []
    for p in root.rglob("*"):
        if p.is_file() and is_media(p):
            # Only include if showing all OR subtitle doesn't exist
            if show_all or not p.with_suffix(".eng.srt").exists():
                files.append(str(p))
                if len(files) >= 500:
                    break
    
    return jsonify({"count": len(files), "files": files, "show_all": show_all})


@app.post("/api/estimate")
def api_estimate():
    """
    Get cost and time estimates for a batch of videos.
    
    Request Body (JSON):
        files: List of video file paths
        
    Returns:
        JSON with duration metadata and cost estimates
        - Nova-3 pricing: $0.0043 per minute of audio
        - Estimated processing time: ~0.1x real-time (rough estimate)
    """
    # _require_auth()
    body = request.get_json(force=True) or {}
    raw_files = body.get("files", [])
    
    NOVA3_PRICE_PER_MINUTE = 0.0043
    PROCESSING_TIME_MULTIPLIER = 0.1  # Rough estimate: 10% of video length
    
    total_duration = 0.0
    file_durations = []
    
    for f in raw_files:
        p = Path(f)
        # Security: Ensure path is under MEDIA_ROOT
        if not str(p).startswith(str(MEDIA_ROOT)):
            continue
        if p.exists():
            duration = get_video_duration(p)
            total_duration += duration
            file_durations.append({
                "file": str(p),
                "duration_seconds": duration,
                "duration_minutes": duration / 60.0
            })
    
    total_minutes = total_duration / 60.0
    estimated_cost = total_minutes * NOVA3_PRICE_PER_MINUTE
    estimated_time = total_duration * PROCESSING_TIME_MULTIPLIER
    
    return jsonify({
        "total_files": len(file_durations),
        "total_duration_seconds": total_duration,
        "total_duration_minutes": total_minutes,
        "estimated_cost_usd": round(estimated_cost, 2),
        "estimated_processing_time_seconds": estimated_time,
        "price_per_minute": NOVA3_PRICE_PER_MINUTE,
        "files": file_durations
    })


@app.post("/api/submit")
def api_submit():
    """
    Submit a batch of videos for transcription.
    
    Request Body (JSON):
        model: Deepgram model to use (default: nova-3)
        language: Language code (default: en)
        profanity_filter: Profanity filter mode - "off", "tag", or "remove" (default: off)
        files: List of video file paths to process
        force_regenerate: Force overwrite existing subtitles (default: false)
        enable_transcript: Generate transcript in addition to subtitles (default: false)
        speaker_map: Optional speaker map name for diarization (deprecated - auto-detected)
        keyterms: Optional list of key terms for better recognition (Nova-3)
        save_raw_json: Save raw Deepgram API response for debugging (default: false)
        auto_save_keyterms: Automatically save keyterms to CSV (default: false)
        
    Returns:
        JSON with batch_id, count of enqueued files, and submitter email
        
    Security:
        - All file paths must be under MEDIA_ROOT
        - Files must exist before submission
    """
    # user = _require_auth()
    user = "local_user"
    body = request.get_json(force=True) or {}
    
    model = "nova-3"  # Hardcoded to Nova-3
    language = body.get("language", DEFAULT_LANGUAGE)
    profanity_filter = body.get("profanity_filter", "off")
    raw_files = body.get("files", [])
    force_regenerate = body.get("force_regenerate", False)
    enable_transcript = body.get("enable_transcript", False)
    speaker_map = body.get("speaker_map")
    keyterms = body.get("keyterms")
    save_raw_json = body.get("save_raw_json", False)
    auto_save_keyterms = body.get("auto_save_keyterms", False)
    
    # Validate and filter files
    files = []
    for f in raw_files:
        p = Path(f)
        # Security: Ensure path is under MEDIA_ROOT
        if not str(p).startswith(str(MEDIA_ROOT)):
            continue
        if p.exists():
            files.append(p)
    
    # Submit batch job with all options
    async_result = make_batch(
        files,
        model,
        language,
        profanity_filter=profanity_filter,
        force_regenerate=force_regenerate,
        enable_transcript=enable_transcript,
        speaker_map=speaker_map,
        keyterms=keyterms,
        save_raw_json=save_raw_json,
        auto_save_keyterms=auto_save_keyterms
    )
    
    return jsonify({
        "batch_id": async_result.id,
        "enqueued": len(files),
        "by": user
    })


@app.get("/api/job/<rid>")
def api_job(rid):
    """
    Get status of a specific job or batch.
    
    Parameters:
        rid: Job/batch ID returned from /api/submit
        
    Returns:
        JSON with job state and result data including detailed child task progress
    """
    # _require_auth()
    res = celery_app.AsyncResult(rid)
    state = res.state
    data = None
    children_info = []
    
    try:
        if res.ready():
            data = res.get(propagate=False)
        
        # Get child task information for detailed progress
        if hasattr(res, 'children') and res.children:
            for child in res.children:
                child_result = celery_app.AsyncResult(child.id)
                child_info = {
                    'id': child.id,
                    'state': child_result.state,
                }
                
                # Get task metadata if available
                if child_result.state == 'PROGRESS' and child_result.info:
                    child_info['current_file'] = child_result.info.get('current_file', '')
                    child_info['stage'] = child_result.info.get('stage', '')
                elif child_result.ready():
                    result = child_result.get(propagate=False)
                    if isinstance(result, dict):
                        child_info['filename'] = result.get('filename', '')
                        child_info['status'] = result.get('status', '')
                        child_info['video'] = result.get('video', '')
                
                children_info.append(child_info)
    
    except Exception as e:
        data = {"error": str(e)}
    
    return jsonify({
        "state": state,
        "data": data,
        "children": children_info
    })


@app.post("/api/job/<rid>/cancel")
def api_cancel_job(rid):
    """
    Cancel a running job.
    
    Parameters:
        rid: Job/batch ID to cancel
        
    Returns:
        JSON with cancellation status
    """
    # _require_auth()
    try:
        celery_app.control.revoke(rid, terminate=True, signal='SIGKILL')
        return jsonify({"status": "cancelled", "job_id": rid})
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500


@app.get("/api/progress")
def api_progress():
    """
    Server-Sent Events (SSE) endpoint for real-time progress updates.
    
    Sends periodic ping events to keep the connection alive.
    Clients can poll /api/job/<batch_id> to get actual job status.
    """
    # _require_auth()
    
    def stream():
        while True:
            yield f"event: ping\ndata: {json.dumps({'t': time.time()})}\n\n"
            time.sleep(2)
    
    return Response(stream(), mimetype="text/event-stream")


@app.post("/api/keyterms/upload")
def api_keyterms_upload():
    """
    Upload keyterms CSV file for a show/movie.
    
    Form Data:
        file: CSV file with one keyterm per line
        video_path: Path to any video file in the show/movie directory
        
    Returns:
        JSON with success status and keyterms count
    """
    # _require_auth()
    
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    video_path = request.form.get('video_path')
    
    if not video_path:
        return jsonify({"error": "No video_path provided"}), 400
    
    vp = Path(video_path)
    
    # Security: Ensure path is under MEDIA_ROOT
    if not str(vp).startswith(str(MEDIA_ROOT)):
        return jsonify({"error": "Invalid path"}), 400
    
    try:
        # Read keyterms from uploaded file
        content = file.read().decode('utf-8')
        keyterms = [line.strip() for line in content.split('\n') if line.strip() and not line.strip().startswith('#')]
        
        # Save keyterms using the core function
        if save_keyterms_to_csv(vp, keyterms):
            return jsonify({
                "success": True,
                "keyterms_count": len(keyterms),
                "message": f"Uploaded {len(keyterms)} keyterms"
            })
        else:
            return jsonify({"error": "Failed to save keyterms"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/api/keyterms/download")
def api_keyterms_download():
    """
    Download keyterms CSV file for a show/movie.
    
    Query Parameters:
        video_path: Path to any video file in the show/movie directory
        
    Returns:
        CSV file download or 404 if not found
    """
    # _require_auth()
    
    video_path = request.args.get('video_path')
    
    if not video_path:
        return jsonify({"error": "No video_path provided"}), 400
    
    vp = Path(video_path)
    
    # Security: Ensure path is under MEDIA_ROOT
    if not str(vp).startswith(str(MEDIA_ROOT)):
        return jsonify({"error": "Invalid path"}), 400
    
    try:
        # Load keyterms
        keyterms = load_keyterms_from_csv(vp)
        
        if not keyterms:
            return jsonify({"error": "No keyterms found"}), 404
        
        # Get the CSV file path
        keyterms_folder = get_keyterms_folder(vp)
        path_parts = vp.parts
        show_or_movie_name = None
        for i, part in enumerate(path_parts):
            if 'season' in part.lower():
                if i > 0:
                    show_or_movie_name = path_parts[i - 1]
                break
        
        if not show_or_movie_name:
            show_or_movie_name = vp.parent.name
        
        csv_path = keyterms_folder / f"{show_or_movie_name}_keyterms.csv"
        
        if csv_path.exists():
            return send_file(
                csv_path,
                mimetype='text/csv',
                as_attachment=True,
                download_name=f"{show_or_movie_name}_keyterms.csv"
            )
        else:
            return jsonify({"error": "Keyterms file not found"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)