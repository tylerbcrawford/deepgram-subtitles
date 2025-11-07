# Technical Documentation

This document contains detailed technical information about Subgeneratorr's architecture, implementation, and advanced configuration options.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [File Structure](#file-structure)
- [Subtitle File Naming](#subtitle-file-naming)
- [Directory Structure](#directory-structure)
- [Detailed Configuration](#detailed-configuration)
- [Platform-Specific Details](#platform-specific-details)
- [API Endpoints](#api-endpoints)
- [Advanced Usage](#advanced-usage)
- [Keyterm Prompting Deep Dive](#keyterm-prompting-deep-dive)
- [Speaker Maps Technical Details](#speaker-maps-technical-details)
- [Utilities and Scripts](#utilities-and-scripts)

---

## Architecture Overview

### CLI Architecture

The CLI tool is a standalone Python application that:
- Scans directories for media files
- Extracts audio using FFmpeg
- Calls Deepgram API for transcription
- Generates SRT subtitle files and optional speaker-labeled transcripts
- Manages keyterms and speaker maps via CSV files

**Key Components:**
- `cli/generate_subtitles.py` - Main entry point
- `cli/config.py` - Configuration management
- `cli/transcript_generator.py` - Transcript generation with speaker mapping
- `core/transcribe.py` - Shared transcription logic

### Web UI Architecture

The Web UI adds asynchronous processing capabilities:

**Components:**
- **Flask API** (`web/app.py`) - REST endpoints for job submission and monitoring
- **Celery Workers** (`web/tasks.py`) - Background task processing
- **Redis** - Message broker and result backend
- **Shared Core** (`core/transcribe.py`) - Same transcription logic as CLI

**Workflow:**
1. User submits batch via Web UI
2. Flask API creates Celery task group
3. Workers process files in parallel (configurable concurrency)
4. Progress updates sent via Server-Sent Events (SSE)
5. Bazarr rescan triggered on completion (if configured)

---

## File Structure

```
subgeneratorr/
├── cli/                          # CLI tool for batch processing
│   ├── generate_subtitles.py    # Main CLI script
│   ├── config.py                 # Configuration management
│   ├── transcript_generator.py  # Transcript generation with speaker maps
│   ├── Dockerfile                # CLI container definition
│   ├── entrypoint.sh            # Container entrypoint script
│   └── requirements.txt          # CLI dependencies
├── core/                         # Shared core functionality
│   ├── __init__.py
│   └── transcribe.py            # Reusable transcription functions
├── web/                          # Web UI (optional)
│   ├── app.py                   # Flask API server
│   ├── tasks.py                 # Celery background workers
│   ├── requirements.txt          # Web dependencies
│   ├── static/                  # Frontend assets
│   │   ├── app.js               # Main JavaScript application
│   │   └── styles.css           # Stylesheet
│   └── templates/               # HTML templates
│       └── index.html           # Main UI template
├── scripts/                      # Utility scripts
│   ├── postprocess_subtitles.py # Rename existing subtitle files
│   └── validate_setup.py        # Setup validation tool
├── docs/                         # Documentation
│   ├── technical.md             # This file
│   └── roadmap.md               # Project roadmap
├── examples/                     # Example configurations
│   ├── docker-compose.example.yml  # Full docker-compose template
│   └── video-list-example.txt   # Example file list
├── tests/                        # Test scripts
│   └── test_single_video.py     # Single video test script
├── deepgram-logs/               # Processing logs (gitignored)
├── .env.example                 # Environment template
├── .gitignore
├── LICENSE
├── Makefile                     # Command shortcuts
└── README.md                    # Main documentation
```

---

## Subtitle File Naming

Subgeneratorr generates subtitle files with proper ISO-639-2 language tags (e.g., `.eng.srt`) to ensure automatic recognition by Plex, Jellyfin, and other media servers.

### Generated Files

**For a video file `Movie.mkv`:**
- `Movie.eng.srt` - English subtitles (automatically recognized by media servers)

**If transcript generation is enabled (`ENABLE_TRANSCRIPT=1`):**

**TV Shows (at show level):**
```
/media/tv/Show Name/
├── Transcripts/                       # At show level, alongside seasons
│   ├── episode1.transcript.speakers.txt
│   ├── episode2.transcript.speakers.txt
│   ├── JSON/
│   │   ├── episode1.deepgram.json    # Raw API response (if enabled)
│   │   └── episode2.deepgram.json
│   ├── Keyterms/
│   │   └── Show Name_keyterms.csv     # Shared across all episodes
│   └── Speakermap/
│       └── speakers.csv                # Shared speaker map
├── Season 01/
│   ├── episode1.mkv
│   └── episode1.eng.srt
└── Season 02/
    ├── episode2.mkv
    └── episode2.eng.srt
```

**Movies:**
```
/media/movies/Movie Name (2024)/
├── Movie.mkv
├── Movie.eng.srt
└── Transcripts/
    ├── Movie.transcript.speakers.txt
    ├── JSON/
    │   └── Movie.deepgram.json        # Raw API response (if enabled)
    ├── Keyterms/
    │   └── Movie Name (2024)_keyterms.csv
    └── Speakermap/
        └── speakers.csv
```

### Renaming Existing Subtitles

Use the included `scripts/postprocess_subtitles.py` script to rename existing subtitle files:

```bash
# Preview what would be renamed (dry run)
python3 scripts/postprocess_subtitles.py --dry-run /path/to/media/

# Rename a single file
python3 scripts/postprocess_subtitles.py /path/to/Movie.srt

# Rename all subtitles in a directory
python3 scripts/postprocess_subtitles.py /path/to/media/

# Process specific files
python3 scripts/postprocess_subtitles.py file1.srt file2.en.srt file3.srt
```

**Script behavior:**
- Convert `*.srt` → `*.eng.srt` (if no other language subtitles exist)
- Convert `*.en.srt` → `*.eng.srt`
- Skip files that already have proper `.eng.srt` naming
- Provide detailed feedback on what was renamed or skipped

**Clear transcode cache after renaming:**
```bash
# For Plex (Docker):
docker exec -it plex rm -rf "/config/Library/Application Support/Plex Media Server/Cache/Transcode/*"
```

---

## Directory Structure

### File List Format

Create text files with video paths for batch processing:

```
# Comments start with #
# Empty lines are ignored

# TV Shows
/media/tv/Show Name/Season 01/Episode 01.mkv
/media/tv/Show Name/Season 01/Episode 02.mkv

# Movies
/media/movies/Movie Title (2024).mp4
```

See `examples/video-list-example.txt` for a complete example.

---

## Detailed Configuration

### Environment Variables (Complete Reference)

#### Core Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `DEEPGRAM_API_KEY` | (required) | Your Deepgram API key |
| `MEDIA_PATH` | `/media` | Path to scan for videos (inside container) |
| `FILE_LIST_PATH` | - | Path to text file with specific videos to process |
| `LOG_PATH` | `/logs` | Directory for processing logs |
| `BATCH_SIZE` | `0` | Max videos per run (0 = unlimited) |
| `LANGUAGE` | `en` | Language code (e.g., `en`, `es`, `fr`) |

#### Feature Toggles

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_TRANSCRIPT` | `0` | Set to `1` to enable speaker-labeled transcript generation |
| `FORCE_REGENERATE` | `0` | Set to `1` to regenerate SRT files even if they already exist |
| `SAVE_RAW_JSON` | `0` | Set to `1` to save raw Deepgram API responses to Transcripts/JSON/ |

#### Transcription Quality Options

| Variable | Default | Description |
|----------|---------|-------------|
| `PROFANITY_FILTER` | `off` | Profanity filter: `off` (disabled) or any other value enables filtering |
| `NUMERALS` | `0` | Convert spoken numbers to digits (e.g., "twenty twenty four" → "2024") |
| `FILLER_WORDS` | `0` | Include filler words like "uh", "um" (usually off for subtitles) |
| `DETECT_LANGUAGE` | `0` | Auto-detect language for international content |
| `MEASUREMENTS` | `0` | Convert spoken measurements (e.g., "fifty meters" → "50m") |

#### Web UI Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `change-me` | Flask session secret (generate with `python -c "import secrets; print(secrets.token_hex(32))"`) |
| `REDIS_URL` | `redis://redis:6379/0` | Redis connection string |
| `MEDIA_ROOT` | `/media` | Media root path |
| `LOG_ROOT` | `/logs` | Log directory path |
| `DEFAULT_MODEL` | `nova-3` | Default transcription model |
| `DEFAULT_LANGUAGE` | `en` | Default language |
| `ALLOWED_EMAILS` | - | Comma-separated list of allowed email addresses for OAuth |
| `BAZARR_BASE_URL` | - | Bazarr base URL (leave empty to disable integration) |
| `BAZARR_API_KEY` | - | Bazarr API key |
| `WORKER_CONCURRENCY` | `1` | Number of concurrent transcription jobs per worker |

#### LLM API Keys (Optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | - | Anthropic API key for AI keyterm generation (optional) |
| `OPENAI_API_KEY` | - | OpenAI API key for AI keyterm generation (optional) |

---

## Platform-Specific Details

### Linux

- **Docker:** Native support with Docker Engine or Docker Desktop
- **File Permissions:** Use `PUID` and `PGID` environment variables to match your user
- **Performance:** Best performance, no virtualization overhead
- **Tested On:** Ubuntu, Debian, Fedora, Arch Linux

**Find your UID/GID:**
```bash
id -u  # Get your UID
id -g  # Get your GID
```

**Set in docker-compose.yml:**
```yaml
environment:
  - PUID=1000  # Your user ID
  - PGID=1000  # Your group ID
```

### macOS

- **Docker:** Requires Docker Desktop for Mac
- **File Permissions:** Automatically handled by Docker Desktop (PUID/PGID not needed)
- **Performance:** Runs containers in lightweight VM
- **M1/M2 Macs:** Fully supported via Docker's ARM64 compatibility
- **Path Format:** Unix-style paths (e.g., `/Users/username/Videos`)

### Windows

- **Docker:** Requires Docker Desktop with WSL2 backend
- **File Permissions:** Automatically handled by Docker Desktop (PUID/PGID not needed)
- **Performance:** Near-native Linux performance with WSL2
- **Path Formats:**
  - Windows-style: `C:/Users/YourName/Videos:/media`
  - WSL2 format: `/c/Users/YourName/Videos:/media`
  - Network drives: `//server/share:/media`
- **Line Endings:** Ensure `entrypoint.sh` has LF endings (not CRLF)

---

## API Endpoints

### Web UI REST API

#### Configuration

**GET `/api/config`**

Get default model and language settings, including LLM API key availability.

**Response:**
```json
{
  "default_model": "nova-3",
  "default_language": "en",
  "anthropic_api_key_configured": true,
  "openai_api_key_configured": false
}
```

#### File Browsing

**GET `/api/browse?path=/media&show_all=false`**

Browse directories and media files.

**Parameters:**
- `path` - Directory path to browse
- `show_all` - Show all files (true) or only media without subtitles (false)

**Response:**
```json
{
  "current_path": "/media/tv",
  "parent_path": "/media",
  "directories": [
    {"name": "Show Name", "path": "/media/tv/Show Name"}
  ],
  "files": [
    {
      "name": "episode.mkv",
      "path": "/media/tv/Show Name/episode.mkv",
      "has_subtitles": false,
      "size": 1234567890,
      "duration": 2700
    }
  ]
}
```

**GET `/api/scan?root=/media/tv`**

Scan directory recursively for media without subtitles.

**Response:**
```json
{
  "files": [
    "/media/tv/Show/Season 01/episode1.mkv",
    "/media/tv/Show/Season 01/episode2.mkv"
  ],
  "count": 2
}
```

#### Cost Estimation

**POST `/api/estimate`**

Get cost and time estimates for selected files.

**Request:**
```json
{
  "files": ["/media/tv/Show/episode.mkv"]
}
```

**Response:**
```json
{
  "total_duration": 2700,
  "estimated_cost": 0.26,
  "estimated_time": 180,
  "file_count": 1
}
```

#### Job Management

**POST `/api/submit`**

Submit batch of files for processing.

**Request:**
```json
{
  "language": "en",
  "files": ["/media/tv/Show/episode.mkv"],
  "force_regenerate": false,
  "enable_transcript": false,
  "profanity_filter": "off",
  "keyterms": ["ProductName", "TechnicalTerm", "account number"],
  "numerals": false,
  "filler_words": false,
  "detect_language": false,
  "measurements": false,
  "diarize": true,
  "utterances": true,
  "paragraphs": true
}
```

**Response:**
```json
{
  "batch_id": "abc123-def456-ghi789",
  "status": "pending",
  "file_count": 1
}
```

**GET `/api/job/<batch_id>`**

Check job status with child task details.

**Response:**
```json
{
  "batch_id": "abc123",
  "status": "processing",
  "progress": {
    "completed": 5,
    "total": 10,
    "percentage": 50
  },
  "files": [
    {
      "path": "/media/tv/Show/episode.mkv",
      "status": "completed",
      "cost": 0.26,
      "duration": 2700
    }
  ],
  "estimated_cost": 2.57,
  "total_duration": 27000
}
```

**POST `/api/job/<batch_id>/cancel`**

Cancel a running job.

**Response:**
```json
{
  "status": "cancelled",
  "message": "Job cancelled successfully"
}
```

**GET `/api/progress`**

Server-Sent Events stream for real-time updates.

**Event Format:**
```
event: job_progress
data: {"batch_id": "abc123", "progress": 50, "status": "processing"}

event: job_complete
data: {"batch_id": "abc123", "status": "completed"}
```

#### Keyterm Management

**GET `/api/keyterms/load?video_path=/media/tv/Show/episode.mkv`**

Load keyterms for a video from CSV.

**Response:**
```json
{
  "keyterms": ["Name1", "Name2", "Term3"],
  "count": 3
}
```

**POST `/api/keyterms/upload`**

Upload keyterms CSV for a video.

**Request (multipart/form-data):**
- `file` - CSV file
- `video_path` - Video file path

**Response:**
```json
{
  "status": "success",
  "count": 25,
  "path": "/media/tv/Show/Transcripts/Keyterms/Show_keyterms.csv"
}
```

**GET `/api/keyterms/download?video_path=/media/tv/Show/episode.mkv`**

Download keyterms CSV for a video.

**Response:** CSV file download

#### LLM Keyterm Generation

**POST `/api/keyterms/generate`**

Generate keyterms using AI.

**Request:**
```json
{
  "video_path": "/media/tv/Show/episode.mkv",
  "provider": "anthropic",
  "model": "claude-sonnet-4.5",
  "existing_keyterms": ["Existing", "Terms"],
  "merge": true
}
```

**Response:**
```json
{
  "keyterms": ["Character Name", "Location", "Technical Term"],
  "count": 25,
  "cost": 0.05,
  "model_used": "claude-sonnet-4.5"
}
```

---

## Advanced Usage

### CLI Processing Examples

**Process entire library:**
```bash
docker compose run --rm deepgram-cli
```

**Process specific directory:**
```bash
docker compose run --rm -e MEDIA_PATH=/media/tv/ShowName deepgram-cli
```

**Process specific season:**
```bash
docker compose run --rm -e MEDIA_PATH=/media/tv/ShowName/Season\ 01 deepgram-cli
```

**Process from file list:**
```bash
docker compose run --rm -e FILE_LIST_PATH=/config/video-list.txt deepgram-cli
```

**Batch processing (limit to 10 files):**
```bash
docker compose run --rm -e BATCH_SIZE=10 deepgram-cli
```

**Process non-English content:**
```bash
docker compose run --rm -e LANGUAGE=es deepgram-cli
```

**Generate speaker-labeled transcripts:**
```bash
docker compose run --rm -e ENABLE_TRANSCRIPT=1 deepgram-cli
```

**Force regenerate SRT files:**
```bash
docker compose run --rm -e FORCE_REGENERATE=1 deepgram-cli
```

**Enable all Nova-3 quality features:**
```bash
docker compose run --rm \
  -e NUMERALS=1 \
  -e MEASUREMENTS=1 \
  -e DETECT_LANGUAGE=1 \
  deepgram-cli
```

### Automation with Cron

Process new videos daily:

```bash
# Add to crontab
0 5 * * * cd /path/to/subgeneratorr && docker compose run --rm -e BATCH_SIZE=50 deepgram-cli
```

Weekly scan for missing subtitles:

```bash
# Every Sunday at 3 AM
0 3 * * 0 cd /path/to/subgeneratorr && docker compose run --rm deepgram-cli
```

---

## Keyterm Prompting Deep Dive

### How Keyterms Work

Keyterms are passed to Deepgram's Nova-3 API as hints for important terminology. The API uses these hints to improve Keyword Recall Rate (KRR) by up to 90%.

**API Parameter:**
```python
opts = PrerecordedOptions(
    model="nova-3",
    keyterm=["Walter White", "Jesse Pinkman", "Heisenberg"]
)
```

### Keyterm Best Practices

**What to Include:**
- Character names (full names work best)
- Location names specific to the content
- Show-specific terminology and jargon
- Product/company names
- Technical terms that might be misrecognized
- Proper nouns with specific capitalization

**What to Avoid:**
- Generic common words rarely misrecognized
- Too many keyterms (stay under 500 token limit)
- Overly broad terms

**Token Estimation:**
- Approximately 1.3 tokens per word
- Recommended: 20-50 focused keyterms
- Maximum: 500 tokens per request

### CSV Format Specification

**File Location:**
- TV Shows: `{Show Directory}/Transcripts/Keyterms/{show_name}_keyterms.csv`
- Movies: `{Movie Directory}/Transcripts/Keyterms/{movie_name}_keyterms.csv`

**Format Rules:**
- UTF-8 encoding
- One keyterm per line
- No header row required
- Empty lines ignored
- Lines starting with `#` treated as comments
- Case-sensitive (preserve proper capitalization)

**Example:**
```csv
Walter White
Jesse Pinkman
Heisenberg
Los Pollos Hermanos
Albuquerque
methylamine
DEA
# Add more as characters appear
```

### AI-Powered Generation

The Web UI supports AI-powered keyterm generation using Anthropic Claude or OpenAI GPT.

**Supported Models:**
- **Anthropic:** Claude Sonnet 4.5, Claude Haiku 4.5
- **OpenAI:** GPT-5, GPT-5 Mini

**Pricing (per 1M tokens):**
- Claude Sonnet 4.5: $3.00 input / $15.00 output (best quality)
- Claude Haiku 4.5: $1.00 input / $5.00 output (faster, cheaper)
- GPT-5: $10.00 input / $30.00 output
- GPT-5 Mini: $0.15 input / $0.60 output (cheapest)

**How It Works:**
1. User selects video in Web UI
2. Opens Advanced Options → AI Keyterm Generation
3. Selects provider and model
4. Clicks "Generate Keyterms with AI"
5. AI researches show/movie and generates 20-50 optimized keyterms
6. Keyterms populate text box for review/editing
7. On transcribe, saved to CSV for reuse

---

## Speaker Maps Technical Details

### How Speaker Maps Work

Speaker maps replace generic "Speaker 0", "Speaker 1" labels with character names in transcripts.

**Location:**
- Per-show/movie location: `Transcripts/Speakermap/speakers.csv`

### CSV Format

```csv
speaker_id,name
0,Walter White
1,Jesse Pinkman
2,Skyler White
3,Hank Schrader
```

**Rules:**
- Header row required: `speaker_id,name`
- Speaker IDs are integers starting from 0
- UTF-8 encoding
- One mapping per line

### Speaker ID Assignment

Speaker IDs are assigned by Deepgram's diarization algorithm based on voice characteristics. IDs may vary between episodes, so speaker maps often need per-episode adjustment.

**Workflow:**
1. Generate transcript without speaker map
2. Review `.transcript.speakers.txt` to see Speaker IDs
3. Create/update speaker map CSV
4. Regenerate transcript with speaker map applied

---

## Utilities and Scripts

### Postprocess Subtitles Script

Location: `scripts/postprocess_subtitles.py`

Renames existing subtitle files to proper ISO-639-2 format.

**Usage:**
```bash
# Dry run (preview)
python3 scripts/postprocess_subtitles.py --dry-run /path/to/media/

# Process directory
python3 scripts/postprocess_subtitles.py /path/to/media/

# Process specific files
python3 scripts/postprocess_subtitles.py file1.srt file2.srt
```

### Validate Setup Script

Location: `scripts/validate_setup.py`

Validates Docker, API keys, and configuration.

**Usage:**
```bash
python3 scripts/validate_setup.py
```

### Makefile Commands

```bash
# Web UI
make web-up        # Start Web UI services
make web-down      # Stop Web UI services
make web-logs      # Follow Web UI logs
make web-restart   # Restart Web UI services

# CLI
make cli-run       # Run CLI tool
make cli-build     # Build CLI container

# Development
make clean         # Clean up containers and volumes
make logs          # View all logs
```

---

## Logs and Statistics

Processing statistics are saved to `deepgram-logs/` in JSON format:

```json
{
  "processed": 5,
  "skipped": 2,
  "failed": 0,
  "total_minutes": 42.5,
  "estimated_cost": 0.24,
  "model": "nova-3",
  "language": "en",
  "start_time": "2024-01-15T10:30:00",
  "end_time": "2024-01-15T10:45:00",
  "files": [
    {
      "path": "/media/tv/Show/episode.mkv",
      "duration": 2700,
      "cost": 0.26,
      "status": "completed"
    }
  ]
}
```

---

## Nova-3 Configuration Reference

```python
opts = PrerecordedOptions(
    model="nova-3",
    smart_format=True,
    utterances=True,
    punctuate=True,
    paragraphs=True,
    diarize=enable_diarization,
    language=language,
    profanity_filter=use_profanity_filter  # Boolean: True or False
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
```

---

## Security Considerations

### Web UI Security

- Web UI can be protected with OAuth authentication (configured at reverse proxy level)
- Media mounts should be **read-only** for web container, read-write for worker container
- Only `.eng.srt` subtitle and transcript files are created (next to source media files)
- Email allowlist available for additional access control via `ALLOWED_EMAILS` environment variable
- API key never exposed to browser (server-side only)

### File Permissions

- CLI and workers need write access to create `.eng.srt` files
- Web UI needs read access to browse media
- Use `PUID`/`PGID` on Linux to match your user
- On macOS/Windows, Docker Desktop handles permissions automatically

---

## Performance Tuning

### Worker Concurrency

Start with `WORKER_CONCURRENCY=1`, increase to 2-3 if your system can handle it:

```yaml
environment:
  - WORKER_CONCURRENCY=2
```

**Resource Requirements:**
- 1-2GB RAM per concurrent job
- 1 CPU core per concurrent job
- Network bandwidth for API calls

### Batch Size Limits

Limit processing to avoid overwhelming your system or API:

```bash
docker compose run --rm -e BATCH_SIZE=10 deepgram-cli
```

### Processing Speed

- Average: 0.0109x real-time (10 hours of video takes ~6.5 minutes to process)
- Nova-3 is optimized for accuracy, not speed
- Parallel processing with Web UI workers can significantly increase throughput

---

For additional information, see:
- [README.md](../README.md) - Main documentation
- [roadmap.md](roadmap.md) - Project roadmap and future features
