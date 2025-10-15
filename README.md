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
- 🎛️ **Configurable models** - Choose between different Deepgram models (nova-2, base, enhanced)
- 📊 **Detailed logging** - JSON logs with processing statistics and costs

## Requirements

- Docker and Docker Compose
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
| `MODEL` | `nova-2` | Deepgram model: `nova-2`, `base`, or `enhanced` |
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

### Use Different Model

Switch to a different Deepgram model:

```bash
docker compose run --rm -e MODEL=enhanced deepgram-subtitles
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

## Cost Information

Deepgram charges per minute of audio processed. Current pricing (as of 2024):

| Model | Cost per Minute |
|-------|----------------|
| nova-2 (default) | $0.0125 |
| base | $0.0043 |
| enhanced | $0.0181 |

**Example costs:**
- 10-minute TV episode: ~$0.13 (nova-2)
- 90-minute movie: ~$1.13 (nova-2)
- 100 episodes: ~$13.00 (nova-2)

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
  "estimated_cost": 0.53,
  "model": "nova-2",
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

If you encounter permission issues:
1. Check the `PUID` and `PGID` values in your `docker-compose.yml`
2. Ensure they match your user's UID/GID (`id -u` and `id -g`)

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