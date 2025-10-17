# Deepgram Subtitle Generator

Transform your media library into a fully accessible experience! This tool uses [Deepgram's](https://deepgram.com/) cutting-edge AI to automatically generate crystal-clear subtitles for your videos and audio files. Whether you're building subtitles for your personal Plex server, adding accessibility to your content library, or creating transcripts for podcasts and audiobooks, this tool makes it effortless. With support for 29 languages, speaker identification, and seamless integration with popular media servers like Plex and Jellyfin, you'll have professional-quality subtitles in minutes—not hours.

## Features

- 🎯 **Automatic subtitle generation** - Transcribes audio from video and audio files and creates SRT subtitle files
- 🗣️ **Speaker-labeled transcripts** - Optional generation of transcripts with speaker diarization and character name mapping
- � **Docker-based** - Easy deployment with Docker and Docker Compose
- 📁 **Flexible processing** - Process entire directories, specific shows/movies/audiobooks, or files from a list
- 💰 **Cost tracking** - Real-time cost estimation and detailed processing logs
- ⚡ **Smart skipping** - Automatically skips videos that already have subtitles
- 🌍 **Multi-language support** - Supports various languages via Deepgram API
- 🤖 **Nova-3 model** - Uses Deepgram's latest flagship model for best accuracy
- 📊 **Detailed logging** - JSON logs with processing statistics and costs
- 🔑 **Keyterm Prompting** - Boost accuracy up to 90% for important terminology (Nova-3, monolingual only)

## Platform Compatibility

This project is **fully cross-platform** and works on:

- ✅ **Linux** - Native Docker support (Docker Engine or Docker Desktop)
- ✅ **macOS** - Requires Docker Desktop
- ✅ **Windows** - Requires Docker Desktop with WSL2 backend

The application runs in a Linux container via Docker, ensuring consistent behavior across all platforms. Platform-specific differences are limited to configuration (mainly volume mount paths).

## Requirements

- Docker and Docker Compose
  - **Linux**: Docker Engine or Docker Desktop
  - **macOS**: [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)
  - **Windows**: [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) with WSL2 enabled
- A Deepgram API key ([Get one here](https://console.deepgram.com/))
- Media files in supported formats:
  - **Video**: MKV, MP4, AVI, MOV, M4V, WMV, FLV
  - **Audio**: MP3, WAV, FLAC, OGG, Opus, M4A, AAC, WMA

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/deepgram-subtitles.git
cd deepgram-subtitles
```

### 2. Set Up Environment Variables

Copy the example environment file and add your Deepgram API key:

```bash
cp .env.example .env
```

Edit `.env` and add your API key:

```
DEEPGRAM_API_KEY=your_actual_api_key_here
```

### 3. Build the Docker Image

```bash
docker compose build
```

## Configuration

### Environment Variables

Configure the application using environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DEEPGRAM_API_KEY` | (required) | Your Deepgram API key |
| `MEDIA_PATH` | `/media` | Path to scan for videos (inside container) |
| `FILE_LIST_PATH` | - | Path to text file with specific videos to process |
| `LOG_PATH` | `/logs` | Directory for processing logs |
| `BATCH_SIZE` | `0` | Max videos per run (0 = unlimited) |
| `LANGUAGE` | `en` | Language code (e.g., `en`, `es`, `fr`) |
| `ENABLE_TRANSCRIPT` | `0` | Set to `1` to enable speaker-labeled transcript generation |
| `FORCE_REGENERATE` | `0` | Set to `1` to regenerate SRT files even if they already exist |

### Docker Compose Configuration

A complete `docker-compose.example.yml` is provided in the [`examples/`](examples/) directory with both CLI and Web UI services configured. Copy it to `docker-compose.yml` and customize the media paths:

```bash
cp examples/docker-compose.example.yml docker-compose.yml
```

**Important:** Update `/path/to/your/media` in `docker-compose.yml` to point to your actual media directory.

#### Platform-Specific Volume Paths

The volume mount paths in your `docker-compose.yml` file differ by platform:

**Linux:**
```yaml
volumes:
  - /home/username/Videos:/media
  - /mnt/media:/media
```

**macOS:**
```yaml
volumes:
  - /Users/username/Videos:/media
  - /Volumes/MediaDrive:/media
```

**Windows:**
```yaml
volumes:
  # Option 1: Windows-style path
  - C:/Users/YourName/Videos:/media
  
  # Option 2: WSL2 path format
  - /c/Users/YourName/Videos:/media
  
  # For network drives
  - //server/share:/media
```

**Note:** The `PUID` and `PGID` environment variables are primarily for Linux file permissions. On Windows and macOS with Docker Desktop, you can keep the default values (1000) or omit them entirely.

## Subtitle File Naming

This tool generates subtitle files with proper ISO-639-2 language tags (e.g., `.eng.srt`) to ensure automatic recognition by Plex, Jellyfin, and other media servers. This prevents subtitles from appearing as "Unknown (SRT External)" and instead displays them as "English (SRT External)" or the appropriate language.

### Generated Files

For a video file `Movie.mkv`, the following files are created:
- `Movie.eng.srt` - English subtitles (automatically recognized by media servers)
- `Movie.transcript.speakers.txt` - Speaker-labeled transcript (if `ENABLE_TRANSCRIPT=1`)
- `Movie.deepgram.json` - Raw API response (debug file, if enabled)

### Renaming Existing Subtitles

If you have existing subtitle files without language tags or with incorrect tags, use the included [`scripts/postprocess_subtitles.py`](scripts/postprocess_subtitles.py) script:

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

The script will:
- Convert `*.srt` → `*.eng.srt` (if no other language subtitles exist)
- Convert `*.en.srt` → `*.eng.srt`
- Skip files that already have proper `.eng.srt` naming
- Provide detailed feedback on what was renamed or skipped

After renaming, you may need to refresh your Plex or Jellyfin library and clear the transcode cache:

```bash
# For Plex (Docker):
docker exec -it plex rm -rf "/config/Library/Application Support/Plex Media Server/Cache/Transcode/*"
```

## Usage

### Process Entire Media Library

Scan and process all videos without subtitles:

```bash
docker compose run --rm deepgram-cli
```

### Process Specific Directory

Process a specific show or directory:

```bash
docker compose run --rm -e MEDIA_PATH=/media/tv/ShowName deepgram-cli
```

### Process Specific Season

```bash
docker compose run --rm -e MEDIA_PATH=/media/tv/ShowName/Season\ 01 deepgram-cli
```

### Process From File List

Create a text file with video paths (one per line):

```bash
# video-list.txt
/media/tv/Show1/Season 01/episode1.mkv
/media/tv/Show2/Season 02/episode5.mkv
/media/movies/Movie.mp4
```

Then process:

```bash
docker compose run --rm -e FILE_LIST_PATH=/config/video-list.txt deepgram-cli
```

### Batch Processing

Limit processing to a specific number of videos:

```bash
docker compose run --rm -e BATCH_SIZE=10 deepgram-cli
```

### Process Non-English Content

```bash
docker compose run --rm -e LANGUAGE=es deepgram-cli
```

### Generate Speaker-Labeled Transcripts

Enable transcript generation with speaker diarization:

```bash
docker compose run --rm -e ENABLE_TRANSCRIPT=1 deepgram-cli
```

This will generate:
- Standard `.eng.srt` subtitle files (properly tagged for media servers)
- `.transcript.speakers.txt` files with speaker-labeled dialogue (with speaker diarization)
- `.deepgram.json` debug files with raw API responses (if enabled in code)

To use character name mapping, create speaker map CSV files in the `speaker_maps/` directory. See [Speaker Maps](#speaker-maps) for details.

### Regenerate SRT Files

If you have videos with existing SRT files that have errors, missing parts, or other problems, you can force regeneration:

```bash
docker compose run --rm -e FORCE_REGENERATE=1 deepgram-cli
```

This will:
- Process all videos in the scan path, even if they already have SRT files
- Overwrite existing SRT files with newly generated ones
- Work with both directory scanning and file list modes
- Respect BATCH_SIZE limits

**Use cases for force regeneration:**
- SRT files with transcription errors or poor quality
- Videos missing portions of dialogue in subtitles
- Need to regenerate with a different model or language setting
- Corrupted or incomplete subtitle files

**Example: Regenerate for a specific show**
```bash
docker compose run --rm -e FORCE_REGENERATE=1 -e MEDIA_PATH=/media/tv/ShowName deepgram-cli
```

**Example: Regenerate from a file list**
```bash
docker compose run --rm -e FORCE_REGENERATE=1 -e FILE_LIST_PATH=/config/problem-files.txt deepgram-cli
```

**Note:** Force regeneration will incur API costs for all processed videos, so use with care. Consider using BATCH_SIZE to limit costs.

## Keyterm Prompting

Keyterm Prompting allows you to improve Keyword Recall Rate (KRR) for important keyterms or phrases by up to 90%. This feature is available for **Nova-3 model with monolingual transcription only**.

### What to Include as Keyterms

**Good keyterm examples:**
- **Industry-specific terminology**: Medical terms (tretinoin, diagnosis), technical jargon (escalation, API)
- **Product and company names**: Brand names, service names, competitor names
- **Multi-word phrases**: Common phrases in your domain (account number, customer service)
- **Proper nouns**: Names, brands, titles with appropriate capitalization (Deepgram, iPhone, Dr. Smith)
- **Common non-proper nouns**: Use lowercase (algorithm, protocol, refill)

**What to avoid:**
- **Generic common words**: Very common words rarely misrecognized (the, and, is)
- **Overly broad terms**: Words that appear in many contexts without specific meaning
- **Excessive keyterms**: Stay well under the 500 token limit; focus on the most important 20-50 terms
- **Inconsistent formatting**: Ensure capitalization matches your desired output

### Keyterm Limits

- **Maximum**: 500 tokens per request
- **Recommended**: 20-50 focused keyterms for best results
- **Token estimation**: Approximately 1.3 tokens per word

### Using Keyterms with CLI

When using the CLI tool, keyterms can be added programmatically in the code. See [`core/transcribe.py`](core/transcribe.py) for implementation details. The CLI implementation is in the [`cli/`](cli/) directory.

### Using Keyterms with Web UI

The Web UI provides a textarea input for keyterms with:
- Real-time token counter
- Warning indicators when approaching the 500 token limit
- Tooltip with best practices
- Support for comma-delimited entries

See [Web UI](#web-ui-optional) section for more details.

## Pricing

Deepgram charges per minute of audio processed. This project uses **Nova-3**, Deepgram's latest flagship model.

**Nova-3 Pricing:**
- **Cost per minute:** ~$0.0043 USD
- 10-minute TV episode: ~$0.04
- 90-minute movie: ~$0.39
- 100 episodes (10 min each): ~$4.30

**Note:** Actual pricing may vary by account plan. Check your [Deepgram dashboard](https://console.deepgram.com/) for your specific rates.

### About Nova-3

Nova-3 is Deepgram's latest flagship model, offering:
- Best-in-class accuracy for speech recognition
- Advanced speaker diarization support
- Smart formatting with proper punctuation
- Multi-language support
- Utterances for natural conversation flow
- Optimized for media transcription

The application displays estimated costs before processing and logs actual costs in JSON format.

## Speaker Maps

Speaker maps allow you to replace generic "Speaker 0", "Speaker 1" labels with character names in transcripts.

### Directory Structure

Create speaker maps in the `speaker_maps/` directory:

```
speaker_maps/
├── Breaking Bad/
│   └── speakers.csv
├── The Sopranos/
│   └── speakers.csv
└── Movie Title (2024)/
    └── speakers.csv
```

The directory name must match your show/movie directory name in your media library.

### CSV Format

Each `speakers.csv` file maps speaker IDs to character names:

```csv
speaker_id,name
0,Walter
1,Jesse
2,Skyler
3,Hank
```

### How to Create Speaker Maps

1. Generate a transcript without a speaker map first to see speaker IDs
2. Create a directory matching your show/movie name in `speaker_maps/`
3. Create a `speakers.csv` file with the ID mappings
4. Reprocess with `ENABLE_TRANSCRIPT=1`

**Note:** Speaker IDs are assigned based on voice characteristics and may vary between episodes. You may need to adjust mappings per season or episode range.

### Example Output

**Without speaker map:**
```
[00:01:23] Speaker 0: I am the one who knocks.
[00:01:28] Speaker 1: Yeah, science!
```

**With speaker map:**
```
[00:01:23] Walter: I am the one who knocks.
[00:01:28] Jesse: Yeah, science!
```

## File List Format

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

See [`examples/video-list-example.txt`](examples/video-list-example.txt) for a complete example.

## Logs and Statistics

Processing statistics are saved to `deepgram-logs/` in JSON format:

```json
{
  "processed": 5,
  "skipped": 2,
  "failed": 0,
  "total_minutes": 42.5,
  "estimated_cost": 0.18,
  "model": "nova-3",
  "language": "en",
  "start_time": "2024-01-15T10:30:00",
  "end_time": "2024-01-15T10:45:00"
}
```

## Troubleshooting

### Videos Being Skipped

The application skips videos that already have `.eng.srt` files. To reprocess:
1. Use the `FORCE_REGENERATE=1` flag to regenerate without deleting files
2. Or manually delete the existing `.eng.srt` file and run again

### Permission Errors

**Linux:**
If you encounter permission issues:
1. Check the `PUID` and `PGID` values in your `docker-compose.yml`
2. Ensure they match your user's UID/GID (run `id -u` and `id -g` to find them)
3. Set these values in your docker-compose.yml:
   ```yaml
   environment:
     - PUID=1000  # Your user ID
     - PGID=1000  # Your group ID
   ```

**macOS/Windows:**
Permission handling is managed by Docker Desktop automatically. If you experience issues:
- Ensure your media directory is accessible to Docker Desktop
- Check Docker Desktop's file sharing settings
- On Windows, verify WSL2 integration is enabled

### API Errors

- Verify your API key is correct in `.env`
- Check your Deepgram account balance at https://console.deepgram.com/
- Ensure you have sufficient API credits

### No Audio Detected

Some videos may fail if:
- The video has no audio track
- The audio is corrupted
- The speech is unclear or heavily distorted

## Advanced Usage

### Integration with Media Servers

This tool works great alongside:
- **Plex** - Automatically recognizes `.eng.srt` files as "English (SRT External)"
- **Jellyfin** - Picks up properly tagged SRT files automatically
- **Bazarr** - Use as a fallback when online subtitles aren't available
- **Emby** - Supports ISO-639-2 language codes for subtitle recognition

### Automation

You can automate subtitle generation using cron:

```bash
# Process new videos daily at 5 AM
0 5 * * * cd /path/to/project && docker compose run --rm -e BATCH_SIZE=50 deepgram-cli
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Platform-Specific Notes

### Windows

- **Requires:** Docker Desktop with WSL2 backend enabled
- **Path format:** Use forward slashes in paths (e.g., `C:/Users/Name/Videos`)
- **Line endings:** Git may convert line endings; ensure `entrypoint.sh` has LF endings
- **Performance:** Running Docker with WSL2 provides near-native Linux performance

### macOS

- **Requires:** Docker Desktop for Mac
- **Path format:** Use Unix-style paths (e.g., `/Users/Name/Videos`)
- **Performance:** Docker Desktop runs containers in a lightweight VM
- **M1/M2 Macs:** Fully supported via Docker's ARM64 compatibility

### Linux

- **Native support:** Best performance with Docker Engine
- **Distributions:** Tested on Ubuntu, Debian, Fedora, and Arch Linux
- **File permissions:** Use `PUID` and `PGID` to match your user for proper file ownership

## Web UI (Optional)

The Web UI provides a browser-based interface for managing subtitle generation jobs remotely. This is an **optional feature** - the CLI tool works independently and does not require the Web UI.

### Features

- 🌐 **Remote access** - Manage transcription from any device via web browser
- 🔐 **Authentication** - Secure access via OAuth2 proxy (optional)
- ⚡ **Background processing** - Jobs run asynchronously using Celery workers
- 📊 **Real-time progress** - Detailed job status with per-file progress tracking
- 🔄 **Bazarr integration** - Auto-trigger subtitle rescans after batch completion
- 📁 **Directory browser** - Interactive file selection from your media library
- 🎯 **Batch submission** - Queue multiple videos/audio files for processing
- 💰 **Cost estimation** - Pre-job cost and time estimates using ffprobe
- 🔑 **Keyterm prompting** - Add custom terminology for improved accuracy (Nova-3, monolingual)
- ❌ **Job cancellation** - Cancel in-progress jobs from the UI
- 🌍 **29 Languages** - Support for all Deepgram-supported languages

### Performance & Scaling

**Processing Speed:**
- Single video: ~2-5 minutes (depending on length and system)
- Parallel processing with multiple workers
- Average throughput: 10-20 hours of video content per hour (with concurrency=2)

**Cost Efficiency:**
- Same Nova-3 pricing: $0.0043/minute
- Batch processing minimizes overhead
- Single Bazarr rescan per batch (vs per-file)
- 24-hour TV season (~10 episodes × 45min): ~$1.93 total, ~3-6 hours processing time

**System Requirements:**
- Modest hardware: Works on Intel NUC, Raspberry Pi 4, or similar
- Recommended: 2-4GB RAM, 2+ CPU cores
- Start with `WORKER_CONCURRENCY=1`, scale to 2-3 if system allows
- Storage: Minimal (only `.eng.srt` subtitle files created, ~50KB per episode)

### Setup

1. **Update docker-compose.yml paths:**

```yaml
# Update media path in both web and worker services
volumes:
  - /path/to/your/media:/media:ro
```

2. **Configure environment variables in `.env`:**

```bash
# Required
DEEPGRAM_API_KEY=your_key_here
SECRET_KEY=generate_with_python_secrets

# Optional: Email allowlist for OAuth
ALLOWED_EMAILS=user1@example.com,user2@example.com

# Optional: Bazarr integration
BAZARR_BASE_URL=http://bazarr:6767
BAZARR_API_KEY=your_bazarr_api_key
```

3. **Start Web UI services:**

```bash
# Using make (recommended)
make web-up

# Or using docker compose directly
docker compose up -d redis deepgram-web deepgram-worker
```

4. **Configure reverse proxy:**

Point your subdomain (e.g., `subs.yourdomain.com`) to `http://localhost:5000` (or `http://deepgram-web:5000` if using Docker networks). Configure OAuth2 proxy if you want authentication protection. See [`docs/deepgram-ui-update.md`](docs/deepgram-ui-update.md) for implementation notes.

### Usage

**Access the Web UI:**

Visit your configured subdomain in a web browser to access the interactive interface.

**API endpoints (for programmatic access):**

- `GET /api/config` - Get default model and language settings
- `GET /api/browse?path=/media&show_all=false` - Browse directories and media files
- `GET /api/scan?root=/media/tv` - Scan directory for media without subtitles
- `POST /api/estimate` - Get cost and time estimates for selected files
- `POST /api/submit` - Submit batch of files for processing
  ```json
  {
    "language": "en",
    "files": ["/media/tv/Show/episode.mkv"],
    "force_regenerate": false,
    "enable_transcript": false,
    "speaker_map": null,
    "keyterms": ["ProductName", "TechnicalTerm", "account number"]
  }
  ```
- `GET /api/job/<batch_id>` - Check job status with child task details
- `POST /api/job/<batch_id>/cancel` - Cancel a running job
- `GET /api/progress` - SSE stream for real-time updates

**View logs:**

```bash
# Follow worker logs
make web-logs

# Or directly with docker compose
docker compose logs -f deepgram-web deepgram-worker
```

**Stop services:**

```bash
make web-down
```

### Architecture

- **Flask API** - REST endpoints for job submission and monitoring
- **Celery Workers** - Background task processing with Redis broker
- **Redis** - Message queue and result backend
- **Shared Core** - Same transcription logic as CLI tool

Both CLI and Web UI can run simultaneously on the same media directory. Properly tagged `.eng.srt` files are created next to video files, automatically recognized by Plex, Jellyfin, and other media servers.

### Example Workflows

**Batch process a TV season:**
1. Scan `/media/tv/ShowName/Season 01` via API
2. Submit all 24 episodes as a batch
3. Workers process in parallel (concurrency=2)
4. Bazarr automatically rescans once when batch completes
5. Total time: ~3-4 hours, cost: ~$1.93

**Weekly automation:**
1. Scan entire `/media` directory for new content
2. Submit new episodes in batches of 10
3. Process overnight with minimal system load
4. Review logs in the morning

### Security Notes

- Web UI can be protected with OAuth authentication (configured at reverse proxy level)
- Media mounts should be **read-only** for web container, read-write for worker container (to create `.eng.srt` files)
- Only `.eng.srt` subtitle and transcript files are created (next to source media files)
- Email allowlist available for additional access control via `ALLOWED_EMAILS` environment variable
- API key never exposed to browser (server-side only)

## Project Structure

```
deepgram-subtitles/
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
│   │   └── app.js
│   └── templates/               # HTML templates
│       └── index.html
├── scripts/                      # Utility scripts
│   ├── postprocess_subtitles.py # Rename existing subtitle files
│   └── validate_setup.py        # Setup validation tool
├── docs/                         # Documentation
│   ├── deepgram-ui-update.md    # Web UI implementation notes
│   ├── embedded-subtitles-implementation-guide.md
│   ├── keyterm-info.md          # Keyterm prompting guide
│   └── name-fix.md
├── examples/                     # Example configurations
│   ├── docker-compose.example.yml  # Full docker-compose template
│   ├── video-list-example.txt   # Example file list
│   └── test-video.txt
├── tests/                        # Test scripts
│   └── test_single_video.py     # Single video test script
├── speaker_maps/                 # Speaker name mappings
│   ├── README.md
│   └── [Show Name]/
│       └── speakers.csv
├── deepgram-logs/               # Processing logs (gitignored)
├── .env.example                 # Environment template
├── .gitignore
├── LICENSE
├── Makefile                     # Command shortcuts
└── README.md                    # This file
```

For detailed development notes and implementation status, see [`docs/deepgram-ui-update.md`](docs/deepgram-ui-update.md).

---

## Additional Resources

- [Keyterm Prompting Documentation](https://developers.deepgram.com/docs/keyterm) - Official Deepgram documentation on keyterm prompting
- [Nova-3 Model Overview](https://developers.deepgram.com/docs/models-languages-overview#nova-3) - Details about Deepgram's flagship model
- [Speaker Diarization](https://developers.deepgram.com/docs/diarization) - Guide to speaker identification features

## Acknowledgments

- [Deepgram](https://deepgram.com/) - AI-powered speech recognition API
- Built with the [Deepgram Python SDK](https://github.com/deepgram/deepgram-python-sdk)
- Uses [deepgram-captions](https://github.com/deepgram/deepgram-python-captions) for SRT generation

## Support

- 📖 [Deepgram Documentation](https://developers.deepgram.com/)
- 💬 [GitHub Issues](https://github.com/yourusername/deepgram-subtitles/issues)
- 🌐 [Deepgram Community](https://discord.gg/deepgram)

## Disclaimer

This tool requires a Deepgram API key and incurs costs based on usage. Always monitor your API usage and costs through the [Deepgram Console](https://console.deepgram.com/).