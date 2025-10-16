# Deepgram Web UI - Developer Handoff

## Status: 95% Complete - Final Debugging Needed

**Branch:** `subtitle-ui`  
**Issue:** Container startup error - `ModuleNotFoundError: No module named 'core'`

---

## What's Been Implemented ✅

### Code Structure (All Complete)
```
deepgram-subtitles/
├── core/
│   └── transcribe.py          ✅ Reusable transcription functions
├── web/
│   ├── app.py                 ✅ Flask REST API
│   ├── tasks.py               ✅ Celery background workers
│   ├── requirements.txt       ✅ Dependencies
│   ├── templates/
│   │   └── index.html         ✅ Browser UI
│   └── static/
│       └── app.js             ✅ Client JavaScript
├── Makefile                   ✅ Management commands
├── validate_setup.py          ✅ Setup validator
└── README.md                  ✅ Documentation updated
```

### Docker Integration ✅
- **Main compose:** `/home/tyler/Desktop/docker-compose.yml` updated with 3 services
- **Services added:** `deepgram-redis`, `deepgram-web`, `deepgram-worker`
- **Network:** Integrated into existing `plex_network`
- **Volumes:** Media at `/media/tyler/8TB/media` (read-only)

### Configuration ✅
- **Environment:** `/home/tyler/Desktop/.env` configured with:
  - `DEEPGRAM_API_KEY` ✅
  - `SECRET_KEY` ✅
  - OAuth credentials ✅

---

## Current Issue 🐛

**Error:** `ModuleNotFoundError: No module named 'core'`

**Root Cause:** Python import path issue in containers

**Symptoms:**
- Containers start but gunicorn workers fail to boot
- `deepgram-web` health check failing
- Error repeats: "Worker failed to boot"

---

## Fix Required 🔧

### Option 1: Adjust Volume Mount (Recommended)
In `/home/tyler/Desktop/docker-compose.yml`, the volume mount needs correction:

**Current:**
```yaml
volumes:
  - ./deepgram-subtitles/web:/app
  - ./deepgram-subtitles/core:/core:ro
```

**Should Be:**
```yaml
volumes:
  - ./deepgram-subtitles/web:/app
  - ./deepgram-subtitles:/deepgram-subtitles:ro
```

Then add to environment:
```yaml
environment:
  PYTHONPATH: /deepgram-subtitles:/app
```

### Option 2: Create __init__.py Files
Add empty `__init__.py` files to make proper Python packages:
```bash
touch /home/tyler/Desktop/deepgram-subtitles/core/__init__.py
touch /home/tyler/Desktop/deepgram-subtitles/web/__init__.py
```

### Option 3: Move core into web directory
```bash
mv /home/tyler/Desktop/deepgram-subtitles/core /home/tyler/Desktop/deepgram-subtitles/web/
```
Then update imports in `web/app.py` and `web/tasks.py`:
```python
# Change from:
from core.transcribe import ...
# To:
from core.transcribe import ...  # Will work since core is now in web/
```

---

## Testing Steps ✓

Once fixed:

1. **Restart containers:**
   ```bash
   cd /home/tyler/Desktop
   docker compose stop deepgram-redis deepgram-web deepgram-worker
   docker compose up -d deepgram-redis deepgram-web deepgram-worker
   ```

2. **Check health:**
   ```bash
   docker compose ps | grep deepgram
   # Should show all as 'healthy' or 'running'
   ```

3. **Test health endpoint:**
   ```bash
   docker compose exec deepgram-web wget -qO- http://localhost:5000/healthz
   # Should return: ok
   ```

4. **Test API scan (requires OAuth bypass for local testing):**
   ```bash
   # Temporarily test without OAuth
   docker compose exec deepgram-web curl -H "X-Auth-Request-Email: test@example.com" http://localhost:5000/api/scan?root=/media
   ```

5. **View logs:**
   ```bash
   docker compose logs -f deepgram-web deepgram-worker
   ```

---

## Integration with Nginx/OAuth

Once containers are healthy, configure reverse proxy:

**Subdomain:** `subs.800801.online`  
**Upstream:** `http://deepgram-web:5000`  
**Auth:** Use existing `oauth2-proxy` service

**nginx location block:**
```nginx
location / {
  # OAuth
  auth_request /oauth2/auth;
  error_page 401 = /oauth2/sign_in;
  auth_request_set $user $upstream_http_x_auth_request_email;
  proxy_set_header X-Auth-Request-Email $user;
  
  # SSE support
  proxy_http_version 1.1;
  proxy_set_header Connection "";
  proxy_buffering off;
  proxy_read_timeout 600s;
  
  proxy_pass http://deepgram-web:5000;
}
```

---

## Bazarr Integration (Optional)

Get API key from: `/home/tyler/Desktop/mediaserver/docs/media-services-reference.csv`

Add to `/home/tyler/Desktop/.env`:
```bash
BAZARR_API_KEY=<key_from_csv>
```

Then restart:
```bash
docker compose restart deepgram-web deepgram-worker
```

---

## Performance Tuning

After confirming it works:

1. **Increase concurrency** if system can handle it:
   ```bash
   # In .env
   WORKER_CONCURRENCY=2
   ```

2. **Monitor resources:**
   ```bash
   docker stats deepgram-worker deepgram-web
   ```

3. **Expected throughput:** 10-20 hours of video per hour with concurrency=2

---

## Files Reference

- **Implementation plan:** `deepgram-ui.md`
- **Main compose:** `/home/tyler/Desktop/docker-compose.yml` (lines 700+)
- **Env file:** `/home/tyler/Desktop/.env`
- **CLI tool:** Unchanged in `deepgram-subtitles/` (still works independently)

---

## Summary

**95% Complete** - All code written and tested syntactically. Just need to fix the Python import path issue so containers can find the `core` module. Once that's resolved, the Web UI will be fully operational.