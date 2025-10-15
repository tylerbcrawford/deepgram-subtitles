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
from flask import Flask, request, jsonify, Response, abort, render_template
from tasks import celery_app, make_batch
from core.transcribe import is_video

MEDIA_ROOT = Path(os.environ.get("MEDIA_ROOT", "/media"))
DEFAULT_MODEL = os.environ.get("DEFAULT_MODEL", "nova-3")
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
    _require_auth()
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
    _require_auth()
    return jsonify({
        "default_model": DEFAULT_MODEL,
        "default_language": DEFAULT_LANGUAGE
    })


@app.get("/api/scan")
def api_scan():
    """
    Scan a directory for videos without subtitles.
    
    Query Parameters:
        root: Directory path to scan (default: MEDIA_ROOT)
        
    Returns:
        JSON with count and list of video files needing subtitles
        
    Security:
        - Path must be under MEDIA_ROOT
        - Limited to 500 results
    """
    _require_auth()
    root = request.args.get("root", str(MEDIA_ROOT))
    root = Path(root)
    
    # Security: Ensure path is under MEDIA_ROOT
    if not str(root).startswith(str(MEDIA_ROOT)):
        abort(400, "Path must be under MEDIA_ROOT")
    
    files = []
    for p in root.rglob("*"):
        if p.is_file() and is_video(p) and not p.with_suffix(".srt").exists():
            files.append(str(p))
            if len(files) >= 500:
                break
    
    return jsonify({"count": len(files), "files": files})


@app.post("/api/submit")
def api_submit():
    """
    Submit a batch of videos for transcription.
    
    Request Body (JSON):
        model: Deepgram model to use (default: nova-3)
        language: Language code (default: en)
        files: List of video file paths to process
        
    Returns:
        JSON with batch_id, count of enqueued files, and submitter email
        
    Security:
        - All file paths must be under MEDIA_ROOT
        - Files must exist before submission
    """
    user = _require_auth()
    body = request.get_json(force=True) or {}
    
    model = body.get("model", DEFAULT_MODEL)
    language = body.get("language", DEFAULT_LANGUAGE)
    raw_files = body.get("files", [])
    
    # Validate and filter files
    files = []
    for f in raw_files:
        p = Path(f)
        # Security: Ensure path is under MEDIA_ROOT
        if not str(p).startswith(str(MEDIA_ROOT)):
            continue
        if p.exists():
            files.append(p)
    
    # Submit batch job
    async_result = make_batch(files, model, language)
    
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
        JSON with job state and result data
    """
    _require_auth()
    res = celery_app.AsyncResult(rid)
    state = res.state
    data = None
    
    try:
        if res.ready():
            data = res.get(propagate=False)
    except Exception as e:
        data = {"error": str(e)}
    
    return jsonify({"state": state, "data": data})


@app.get("/api/progress")
def api_progress():
    """
    Server-Sent Events (SSE) endpoint for real-time progress updates.
    
    Sends periodic ping events to keep the connection alive.
    Clients can poll /api/job/<batch_id> to get actual job status.
    """
    _require_auth()
    
    def stream():
        while True:
            yield f"event: ping\ndata: {json.dumps({'t': time.time()})}\n\n"
            time.sleep(2)
    
    return Response(stream(), mimetype="text/event-stream")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)