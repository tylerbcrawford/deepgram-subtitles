# Phase 2 — Web UI (Remote, Subdomain) — Developer Handoff

**Decisions locked**

* Subdomain: `subs.800801.online`
* Auth: **Google OAuth only** at the reverse proxy, allowlisted emails (already configured)
* Bazarr: **rescan after each batch** (dev will have API key + base URL)
* Worker schedule: **no quiet hours**; run anytime
* Defaults: `model=nova-3`, `language=en` (no other presets)
* Logs: keep under repo `./deepgram-logs` (included in backups)

---

## 1) Repo changes

```
repo-root/
  core/
    transcribe.py                # Phase-1 logic extracted into reusable funcs (see 4)
  web/
    app.py                       # Flask API + SSE
    tasks.py                     # Celery tasks (transcribe, chord callback)
    requirements.txt
    templates/index.html         # Minimal UI (optional)
    static/app.js                # Minimal UI (optional)
  docker-compose.phase2.yml
  .env.example                   # +SECRET_KEY +REDIS_URL +ALLOWED_EMAILS +BAZARR_* +DEFAULT_MODEL/LANGUAGE
```

---

## 2) .env.example (additions)

```bash
# Flask / Celery
SECRET_KEY=change_me
REDIS_URL=redis://redis:6379/0
MEDIA_ROOT=/media
LOG_ROOT=/logs
DEFAULT_MODEL=nova-3
DEFAULT_LANGUAGE=en

# Defense-in-depth allowlist (proxy already enforces Google OAuth)
# Comma-separated emails; leave empty to skip app-level allowlist
ALLOWED_EMAILS=me@example.com,partner@example.com

# Bazarr rescan (enable by setting BAZARR_BASE_URL; dev will inject API key)
BAZARR_BASE_URL=http://bazarr:6767
BAZARR_API_KEY=your_bazarr_key_here
```

---

## 3) docker-compose.phase2.yml

```yaml
version: "3.9"

services:
  redis:
    image: redis:7-alpine
    container_name: deepgram-redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "redis-cli ping | grep PONG"]
      interval: 10s
      timeout: 3s
      retries: 5

  deepgram-web:
    image: python:3.11-slim
    container_name: deepgram-web
    working_dir: /app
    environment:
      DEEPGRAM_API_KEY: ${DEEPGRAM_API_KEY}
      SECRET_KEY: ${SECRET_KEY}
      REDIS_URL: ${REDIS_URL}
      MEDIA_ROOT: ${MEDIA_ROOT:-/media}
      LOG_ROOT: ${LOG_ROOT:-/logs}
      DEFAULT_MODEL: ${DEFAULT_MODEL:-nova-3}
      DEFAULT_LANGUAGE: ${DEFAULT_LANGUAGE:-en}
      ALLOWED_EMAILS: ${ALLOWED_EMAILS}
      BAZARR_BASE_URL: ${BAZARR_BASE_URL}
      BAZARR_API_KEY: ${BAZARR_API_KEY}
    command: >
      bash -lc "pip install --no-cache-dir -r requirements.txt &&
                gunicorn -w 2 -k gevent --worker-connections 100
                -b 0.0.0.0:5000 app:app"
    volumes:
      - /path/to/media:/media:ro
      - ./deepgram-logs:/logs
      - ./web:/app
      - ./core:/core:ro
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:5000/healthz | grep ok"]
      interval: 15s
      timeout: 3s
      retries: 5

  deepgram-worker:
    image: python:3.11-slim
    container_name: deepgram-worker
    working_dir: /app
    environment:
      DEEPGRAM_API_KEY: ${DEEPGRAM_API_KEY}
      REDIS_URL: ${REDIS_URL}
      MEDIA_ROOT: ${MEDIA_ROOT:-/media}
      LOG_ROOT: ${LOG_ROOT:-/logs}
      DEFAULT_MODEL: ${DEFAULT_MODEL:-nova-3}
      DEFAULT_LANGUAGE: ${DEFAULT_LANGUAGE:-en}
      BAZARR_BASE_URL: ${BAZARR_BASE_URL}
      BAZARR_API_KEY: ${BAZARR_API_KEY}
      # Adjust as desired; S12 Pro is modest—start with 1 and bump to 2 if okay.
      CELERYD_CONCURRENCY: ${WORKER_CONCURRENCY:-1}
    command: >
      bash -lc "pip install --no-cache-dir -r requirements.txt &&
                celery -A tasks.celery_app worker
                --loglevel=INFO -Q transcribe
                --concurrency=${WORKER_CONCURRENCY:-1}"
    volumes:
      - /path/to/media:/media:ro
      - ./deepgram-logs:/logs
      - ./web:/app
      - ./core:/core:ro
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped
```

---

## 4) core/transcribe.py (factor out Phase-1)

Pull from Phase-1 and expose these pure functions:

```python
# core/transcribe.py
from pathlib import Path
from deepgram import DeepgramClient, PrerecordedOptions
from deepgram_captions import DeepgramConverter, srt
import subprocess, tempfile, os

VIDEO_EXTS = {'.mkv','.mp4','.avi','.mov','.m4v','.wmv','.flv'}

def is_video(p: Path) -> bool:
    return p.suffix.lower() in VIDEO_EXTS

def extract_audio(video: Path) -> Path:
    tmp = Path(tempfile.mkstemp(suffix=".mp3")[1])
    cmd = ["ffmpeg","-hide_banner","-loglevel","error","-i", str(video),
           "-vn","-acodec","mp3","-ar","16000","-ac","1","-y", str(tmp)]
    subprocess.run(cmd, check=True)
    return tmp

def transcribe_file(buf: bytes, api_key: str, model: str, language: str) -> dict:
    client = DeepgramClient(api_key=api_key)
    opts = PrerecordedOptions(model=model, smart_format=True,
                              utterances=True, diarize=False, language=language)
    return client.listen.prerecorded.v("1").transcribe_file({"buffer": buf}, opts)

def write_srt(resp: dict, dest: Path):
    dest.write_text(srt(DeepgramConverter(resp)), encoding="utf-8")
```

---

## 5) web/requirements.txt

```
flask==3.0.*
celery==5.3.*
redis==5.*
gunicorn==22.*
gevent==24.*
deepgram-sdk==3.*
deepgram-captions==1.*
```

---

## 6) web/tasks.py (Celery tasks + Bazarr chord callback)

```python
import os, json, time
from pathlib import Path
from celery import Celery
from celery import group, chord
from core.transcribe import is_video, extract_audio, transcribe_file, write_srt

REDIS_URL = os.environ.get("REDIS_URL","redis://redis:6379/0")
MEDIA_ROOT = Path(os.environ.get("MEDIA_ROOT","/media"))
LOG_ROOT   = Path(os.environ.get("LOG_ROOT","/logs"))
DEFAULT_MODEL = os.environ.get("DEFAULT_MODEL","nova-3")
DEFAULT_LANGUAGE = os.environ.get("DEFAULT_LANGUAGE","en")
BAZARR_BASE_URL = os.environ.get("BAZARR_BASE_URL","")
BAZARR_API_KEY  = os.environ.get("BAZARR_API_KEY","")
DG_KEY = os.environ["DEEPGRAM_API_KEY"]

celery_app = Celery(__name__, broker=REDIS_URL, backend=REDIS_URL)

def _save_job_log(payload: dict):
    LOG_ROOT.mkdir(parents=True, exist_ok=True)
    (LOG_ROOT / f"job_{int(time.time()*1000)}.json").write_text(json.dumps(payload, indent=2))

@celery_app.task(bind=True, name="transcribe_task")
def transcribe_task(self, video_path: str, model=DEFAULT_MODEL, language=DEFAULT_LANGUAGE):
    vp = Path(video_path)
    srt_out = vp.with_suffix(".srt")
    meta = {"video": str(vp), "srt": str(srt_out)}
    if srt_out.exists():
        return {"status":"skipped", **meta}

    audio_tmp = None
    try:
        audio_tmp = extract_audio(vp)
        with open(audio_tmp, "rb") as f:
            resp = transcribe_file(f.read(), DG_KEY, model, language)
        write_srt(resp, srt_out)
        _save_job_log({"status":"ok", **meta})
        return {"status":"ok", **meta}
    except Exception as e:
        _save_job_log({"status":"error", "error": str(e), **meta})
        raise
    finally:
        if audio_tmp and Path(audio_tmp).exists():
            try: Path(audio_tmp).unlink()
            except: pass

@celery_app.task(name="batch_finalize")
def batch_finalize(results):
    # Trigger Bazarr rescan once per batch (only if configured)
    if BAZARR_BASE_URL and BAZARR_API_KEY:
        import requests
        try:
            requests.post(
              f"{BAZARR_BASE_URL}/api/system/tasks/SearchWantedSubtitles",
              headers={"X-API-KEY": BAZARR_API_KEY}, timeout=10
            )
        except Exception:
            pass
    return {"batch_status":"done","results":results}

def make_batch(files, model, language):
    jobs = [transcribe_task.s(str(f), model, language) for f in files]
    return chord(group(jobs))(batch_finalize.s())
```

---

## 7) web/app.py (Flask API + SSE, OAuth trust)

```python
import os, json, time
from pathlib import Path
from flask import Flask, request, jsonify, Response, abort
from tasks import celery_app, make_batch
from core.transcribe import is_video

MEDIA_ROOT = Path(os.environ.get("MEDIA_ROOT","/media"))
DEFAULT_MODEL = os.environ.get("DEFAULT_MODEL","nova-3")
DEFAULT_LANGUAGE = os.environ.get("DEFAULT_LANGUAGE","en")
ALLOWED = set([e.strip().lower() for e in os.environ.get("ALLOWED_EMAILS","").split(",") if e.strip()])

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY","change-me")

def _require_auth():
    # Google OAuth enforced at proxy; we honor the forwarded identity header
    user = request.headers.get("X-Auth-Request-Email") or request.headers.get("X-Forwarded-User")
    if not user:
        abort(401)
    if ALLOWED and user.lower() not in ALLOWED:
        abort(403)
    return user

@app.get("/healthz")
def healthz(): return ("ok", 200)

@app.get("/api/config")
def api_config():
    _require_auth()
    return jsonify({"default_model": DEFAULT_MODEL, "default_language": DEFAULT_LANGUAGE})

@app.get("/api/scan")
def api_scan():
    _require_auth()
    root = request.args.get("root", str(MEDIA_ROOT))
    root = Path(root)
    if not str(root).startswith(str(MEDIA_ROOT)):
        abort(400, "Path must be under MEDIA_ROOT")
    files = []
    for p in root.rglob("*"):
        if p.is_file() and is_video(p) and not p.with_suffix(".srt").exists():
            files.append(str(p))
            if len(files) >= 500: break
    return jsonify({"count": len(files), "files": files})

@app.post("/api/submit")
def api_submit():
    user = _require_auth()
    body = request.get_json(force=True) or {}
    model = body.get("model", DEFAULT_MODEL)
    language = body.get("language", DEFAULT_LANGUAGE)
    raw_files = body.get("files", [])
    files = []
    for f in raw_files:
        p = Path(f)
        if not str(p).startswith(str(MEDIA_ROOT)): continue
        if p.exists(): files.append(p)
    async_result = make_batch(files, model, language)
    return jsonify({"batch_id": async_result.id, "enqueued": len(files), "by": user})

@app.get("/api/job/<rid>")
def api_job(rid):
    _require_auth()
    res = celery_app.AsyncResult(rid)
    state = res.state
    data = None
    try:
        if res.ready(): data = res.get(propagate=False)
    except Exception as e:
        data = {"error": str(e)}
    return jsonify({"state": state, "data": data})

@app.get("/api/progress")
def api_progress():
    _require_auth()
    def stream():
        while True:
            yield f"event: ping\ndata: {json.dumps({'t': time.time()})}\n\n"
            time.sleep(2)
    return Response(stream(), mimetype="text/event-stream")
```

---

## 8) nginx (SSE + OAuth-only upstream)

> Reuse your existing Google OAuth gate. Below is the upstream location for `subs.800801.online` pointing to `deepgram-web:5000` on your Docker network.

```
location / {
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;

  # OAuth forward-headers (adjust to your oauth2-proxy config)
  auth_request /oauth2/auth;
  error_page 401 = /oauth2/sign_in;
  auth_request_set $user $upstream_http_x_auth_request_email;
  proxy_set_header X-Auth-Request-Email $user;

  # SSE friendly
  proxy_http_version 1.1;
  proxy_set_header Connection "";
  proxy_buffering off;
  proxy_read_timeout 600s;

  proxy_pass http://deepgram-web:5000;
}
```

---

## 9) Minimal UI (optional; can start API-only)

* `templates/index.html` renders:

  * Root path input (defaults to `/media`)
  * “Scan” → table of files (checkboxes)
  * Model/language selects (pre-filled)
  * “Submit” → POST to `/api/submit`, show `batch_id`
  * A small panel that `EventSource('/api/progress')` to keep the page “alive” and polls `/api/job/<batch_id>` every few seconds until `done`
* Keep static assets tiny; no framework necessary.

---

## 10) Make targets

```makefile
phase2-up:
\tdocker compose -f docker-compose.phase2.yml up -d

phase2-logs:
\tdocker compose -f docker-compose.phase2.yml logs -f deepgram-web deepgram-worker

phase2-down:
\tdocker compose -f docker-compose.phase2.yml down
```

---

## 11) Acceptance checklist

* `GET https://subs.800801.online/healthz` returns **200** when authenticated; **401/403** when not/unauthorized.
* `GET /api/scan?root=/media/TV%20Shows` returns a non-zero count on a folder with missing SRTs.
* `POST /api/submit` with 2–3 files returns a `batch_id`; SRTs appear next to videos.
* Celery chord callback triggers **one** Bazarr rescan per batch (observe Bazarr logs).
* SSE at `/api/progress` streams heartbeats; UI reflects progress/poll results.
* Logs written to `./deepgram-logs`; job JSONs contain `status`, `video`, `srt`.

---

## 12) Rollout

1. Pull changes; copy `.env.example` → `.env` and set values (Deepgram key, allowlist, Bazarr URL/key).
2. `docker compose -f docker-compose.phase2.yml up -d redis`
3. `docker compose -f docker-compose.phase2.yml up -d deepgram-web deepgram-worker`
4. Configure nginx vhost for `subs.800801.online` (OAuth only) → reload nginx.
5. Smoke test health, then scan/submit on a small set. Monitor CPU/RAM; start with `WORKER_CONCURRENCY=1`.
6. If stable, keep running; Phase-1 CLI remains available in parallel.

---

## 13) Notes

* All Deepgram calls remain **server-side**; API key never reaches the browser.
* Media mounts are **read-only**; only `.srt` files are created next to sources; logs to `./deepgram-logs`.
* Concurrency can be tuned with `WORKER_CONCURRENCY` env; default 1 on S12 Pro.
* Bazarr rescan is batched via **Celery chord** callback to avoid multiple rescans per batch.
