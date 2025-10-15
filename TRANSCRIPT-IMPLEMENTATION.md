# Transcript Feature Implementation Summary

## Overview

The transcript plan from [`transcript-plan.md`](transcript-plan.md) has been successfully implemented into your existing Python-based Deepgram subtitle system. The implementation follows all core requirements while adapting to the Python/Docker architecture.

## ✅ Implementation Checklist

### Requirements Met
- ✅ **Does not interfere with existing `.srt` generation** - SRT files are generated as before
- ✅ **Transcript generation OFF by default** - Must explicitly enable with `ENABLE_TRANSCRIPT=1`
- ✅ **Can be enabled manually per-run** - Environment variable controls feature
- ✅ **Speaker name mapping via CSV** - Full support for character name mappings
- ✅ **Clean, maintainable integration** - Separate module with minimal changes to core
- ✅ **Docker-based environment** - Leverages existing Docker setup with ffmpeg

### Deliverables
1. ✅ **Transcript generator module** - [`deepgram-subtitles/transcript_generator.py`](deepgram-subtitles/transcript_generator.py)
2. ✅ **Speaker maps directory** - [`speaker_maps/`](speaker_maps/) with example and README
3. ✅ **Feature flag** - `ENABLE_TRANSCRIPT` environment variable in [`config.py`](deepgram-subtitles/config.py)
4. ✅ **Updated main script** - [`generate_subtitles.py`](deepgram-subtitles/generate_subtitles.py) with optional transcript block

### Acceptance Criteria
- ✅ Subtitle script still produces `.srt` as usual
- ✅ Transcript generation is optional
- ✅ No transcript unless explicitly requested
- ✅ Errors do not break SRT pipeline (transcripts are wrapped in try/except)
- ✅ Speaker CSV works per show

## 📁 Files Created/Modified

### New Files
- [`deepgram-subtitles/transcript_generator.py`](deepgram-subtitles/transcript_generator.py) - Core transcript generation logic
- [`speaker_maps/README.md`](speaker_maps/README.md) - Documentation for speaker maps
- [`speaker_maps/Breaking Bad/speakers.csv`](speaker_maps/Breaking%20Bad/speakers.csv) - Example speaker map

### Modified Files
- [`deepgram-subtitles/config.py`](deepgram-subtitles/config.py) - Added `ENABLE_TRANSCRIPT` and `SPEAKER_MAPS_PATH` settings
- [`deepgram-subtitles/generate_subtitles.py`](deepgram-subtitles/generate_subtitles.py) - Integrated transcript generation
- [`docker-compose.example.yml`](docker-compose.example.yml) - Added transcript configuration docs
- [`README.md`](README.md) - Added speaker maps and transcript documentation

## 🚀 Usage

### Default Behavior (Unchanged)
Generate only SRT subtitles:
```bash
docker compose run --rm deepgram-subtitles
```

### Enable Transcripts
Generate both SRT and speaker-labeled transcripts:
```bash
docker compose run --rm -e ENABLE_TRANSCRIPT=1 deepgram-subtitles
```

### Process Specific Show with Transcripts
```bash
docker compose run --rm -e ENABLE_TRANSCRIPT=1 -e MEDIA_PATH=/media/tv/Breaking\ Bad deepgram-subtitles
```

## 📄 Output Files

When `ENABLE_TRANSCRIPT=1` is set, the system generates:

1. **`episode.srt`** - Standard subtitle file (as before)
2. **`episode.transcript.speakers.txt`** - Speaker-labeled transcript
3. **`episode.deepgram.json`** - Debug file with raw Deepgram response

## 🗺️ Speaker Maps

### Directory Structure
```
speaker_maps/
├── README.md
├── Breaking Bad/
│   └── speakers.csv
└── [Your Show Name]/
    └── speakers.csv
```

### CSV Format
```csv
speaker_id,name
0,Walter
1,Jesse
2,Skyler
```

### How It Works
1. The system extracts the show/movie name from the video path
2. Looks for `speaker_maps/[Show Name]/speakers.csv`
3. If found, maps speaker IDs to character names
4. If not found, uses generic "Speaker 0", "Speaker 1" labels

## 🔄 Differences from Original Plan

The original plan in [`transcript-plan.md`](transcript-plan.md) proposed bash scripts, but this implementation:

- ✅ **Uses Python** instead of bash to integrate seamlessly with existing codebase
- ✅ **Leverages Docker** for the existing containerized environment
- ✅ **Maintains all core functionality** from the plan
- ✅ **Follows same principles** - optional, non-breaking, speaker mapping support

This approach was chosen because:
1. Your existing system is Python-based
2. Easier to maintain with unified codebase
3. Better error handling and logging
4. Reuses existing Deepgram API integration

## 🧪 Testing the Implementation

### Test 1: Default Behavior
```bash
docker compose run --rm -e FILE_LIST_PATH=/config/video-list-example.txt deepgram-subtitles
```
**Expected:** Only `.srt` files generated, transcript feature disabled message appears

### Test 2: Enable Transcripts
```bash
docker compose run --rm -e ENABLE_TRANSCRIPT=1 -e FILE_LIST_PATH=/config/video-list-example.txt deepgram-subtitles
```
**Expected:** Both `.srt` and `.transcript.speakers.txt` files generated

### Test 3: With Speaker Map
1. Create `speaker_maps/[Your Show]/speakers.csv`
2. Run with `ENABLE_TRANSCRIPT=1`
3. **Expected:** Transcript uses character names from CSV

## 💡 Tips

1. **Start without speaker maps** to see the speaker IDs Deepgram assigns
2. **Create speaker maps incrementally** as you identify consistent speakers
3. **Speaker IDs may vary** between episodes - adjust mappings as needed
4. **Use the debug JSON** to troubleshoot speaker detection issues
5. **Transcripts don't affect SRT generation** - they're completely independent

## 🐛 Troubleshooting

### No transcript generated
- Check that `ENABLE_TRANSCRIPT=1` is set
- Look for "Transcript feature enabled" message in logs
- Check for errors in the transcript generation step

### Wrong speaker labels
- Review the `.deepgram.json` file to see actual speaker IDs
- Update your `speakers.csv` file with correct mappings
- Remember speaker IDs can vary between episodes

### Transcripts break SRT generation
- This shouldn't happen - transcript errors are caught separately
- If it does, please report as a bug

## 📞 Support

For issues or questions:
1. Check the logs in `deepgram-logs/`
2. Review the `.deepgram.json` debug files
3. See main [`README.md`](README.md) for general usage
4. See [`speaker_maps/README.md`](speaker_maps/README.md) for speaker map details