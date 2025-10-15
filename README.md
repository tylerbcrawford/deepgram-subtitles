# Deepgram Subtitle Generator

Automatically generate high-quality SRT subtitle files for your video library using [Deepgram's](https://deepgram.com/) AI-powered speech recognition API.

## Features

- 🎯 **Automatic subtitle generation** - Transcribes audio from video files and creates SRT subtitle files
- 🗣️ **Speaker-labeled transcripts** - Optional generation of transcripts with speaker diarization and character name mapping
- � **Docker-based** - Easy deployment with Docker and Docker Compose
- 📁 **Flexible processing** - Process entire directories, specific shows/movies, or files from a list
- 💰 **Cost tracking** - Real-time cost estimation and detailed processing logs
- ⚡ **Smart skipping** - Automatically skips videos that already have subtitles
- 🌍 **Multi-language support** - Supports various languages via Deepgram API
- 🤖 **Nova-3 model** - Uses Deepgram's latest flagship model for best accuracy
- 📊 **Detailed logging** - JSON logs with processing statistics and costs

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
- Video files in supported formats (MKV, MP4, AVI, MOV, M4V, WMV, FLV)

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

Create a `docker-compose.yml` file (or add to your existing one):

```yaml
services:
  deepgram-subtitles:
    build: ./deepgram-subtitles
    container_name: deepgram-subtitles
    environment:
      - DEEPGRAM_API_KEY=${DEEPGRAM_API_KEY}
      - PUID=1000
      - PGID=1000
    volumes:
      # Mount your media directory
      - /path/to/your/media:/media
      # Mount logs directory
      - ./deepgram-subtitles/deepgram-logs:/logs
      # Mount config directory for file lists
      - ./deepgram-subtitles:/config
    restart: "no"
```

**Important:** Update `/path/to/your/media` to point to your actual media directory.

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

## Usage

### Process Entire Media Library

Scan and process all videos without subtitles:

```bash
docker compose run --rm deepgram-subtitles
```

### Process Specific Directory

Process a specific show or directory:

```bash
docker compose run --rm -e MEDIA_PATH=/media/tv/ShowName deepgram-subtitles
```

### Process Specific Season

```bash
docker compose run --rm -e MEDIA_PATH=/media/tv/ShowName/Season\ 01 deepgram-subtitles
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
docker compose run --rm -e FILE_LIST_PATH=/config/video-list.txt deepgram-subtitles
```

### Batch Processing

Limit processing to a specific number of videos:

```bash
docker compose run --rm -e BATCH_SIZE=10 deepgram-subtitles
```

### Process Non-English Content

```bash
docker compose run --rm -e LANGUAGE=es deepgram-subtitles
```

### Generate Speaker-Labeled Transcripts

Enable transcript generation with speaker diarization:

```bash
docker compose run --rm -e ENABLE_TRANSCRIPT=1 deepgram-subtitles
```

This will generate:
- Standard `.srt` subtitle files (as usual)
- `.transcript.speakers.txt` files with speaker-labeled dialogue
- `.deepgram.json` debug files with raw API responses

To use character name mapping, create speaker map CSV files in the `speaker_maps/` directory. See [Speaker Maps](#speaker-maps) for details.

### Regenerate SRT Files

If you have videos with existing SRT files that have errors, missing parts, or other problems, you can force regeneration:

```bash
docker compose run --rm -e FORCE_REGENERATE=1 deepgram-subtitles
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
docker compose run --rm -e FORCE_REGENERATE=1 -e MEDIA_PATH=/media/tv/ShowName deepgram-subtitles
```

**Example: Regenerate from a file list**
```bash
docker compose run --rm -e FORCE_REGENERATE=1 -e FILE_LIST_PATH=/config/problem-files.txt deepgram-subtitles
```

**Note:** Force regeneration will incur API costs for all processed videos, so use with care. Consider using BATCH_SIZE to limit costs.

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

See [`video-list-example.txt`](./video-list-example.txt) for a complete example.

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

The application skips videos that already have `.srt` files. To reprocess:
1. Use the `FORCE_REGENERATE=1` flag to regenerate without deleting files
2. Or manually delete the existing `.srt` file and run again

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
- **Plex** - Automatically serves generated subtitles
- **Jellyfin** - Picks up SRT files automatically
- **Bazarr** - Use as a fallback when online subtitles aren't available

### Automation

You can automate subtitle generation using cron:

```bash
# Process new videos daily at 5 AM
0 5 * * * cd /path/to/project && docker compose run --rm -e BATCH_SIZE=50 deepgram-subtitles
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
- 🔐 **Google OAuth** - Secure authentication via OAuth2 proxy
- ⚡ **Background processing** - Jobs run asynchronously using Celery workers
- 📊 **Real-time progress** - Server-Sent Events (SSE) for live job status
- 🔄 **Bazarr integration** - Auto-trigger subtitle rescans after batch completion
- 📁 **Directory scanning** - Browse and select videos from your media library
- 🎯 **Batch submission** - Queue multiple videos for processing

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
- Storage: Minimal (only SRT files created, ~50KB per episode)

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

Point your OAuth-protected subdomain (e.g., `subs.yourdomain.com`) to `http://deepgram-web:5000`. See [`deepgram-ui.md`](./deepgram-ui.md) for nginx configuration example with OAuth2 integration.

### Usage

**Access the API endpoints:**

- `GET /api/config` - Get default model and language settings
- `GET /api/scan?root=/media/tv` - Scan directory for videos without subtitles
- `POST /api/submit` - Submit batch of videos for processing
  ```json
  {
    "model": "nova-3",
    "language": "en",
    "files": ["/media/tv/Show/episode.mkv"]
  }
  ```
- `GET /api/job/<batch_id>` - Check job status
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

Both CLI and Web UI can run simultaneously on the same media directory. SRT files are created next to video files, accessible to both Plex/Jellyfin and the Web UI.

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

- Web UI requires OAuth authentication (configured at reverse proxy)
- Media mounts are **read-only** for web/worker containers
- Only SRT files are created (next to source videos)
- Email allowlist for additional access control
- API key never exposed to browser (server-side only)

For detailed setup instructions and nginx configuration, see [`deepgram-ui.md`](./deepgram-ui.md).

---

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