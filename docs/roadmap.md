# Project Roadmap

## Phase 1: Pre-Beta Development

### Core Functionality
- [ ] Fix Subsyncarr marker file removal in overwrite subtitles function
- [ ] Update Nova 3 model configuration (see [reference](#nova-3-configuration-reference) below)
- [ ] Add profanity filter toggle to GUI (3 options: off, tag, remove)
- [ ] Refine Keyterms feature
  - [ ] Add CSV import/export functionality for keyterms
  - [ ] Store keyterms CSV in `Transcripts` folder of each show/movie directory
- [ ] Finalize transcript generation function
  - [ ] Add toggle for raw JSON output
  - [ ] Create `Transcripts` folder structure (at season folder level)
  - [ ] Save raw JSON to `Transcripts/JSON` subfolder

### User Interface
- [ ] Complete GUI visual overhaul (see [`gui-upgrade.md`](gui-upgrade.md) for details)

### Documentation
- [ ] Redesign README for user-facing content
  - [ ] Make it punchy and engaging for potential users
  - [ ] Highlight Nova 3 model features and capabilities
  - [ ] Showcase subtitle generator app features
  - [ ] Move technical setup and troubleshooting to separate document

## Phase 2: Beta Testing

- [ ] Deploy beta version
- [ ] Collect user feedback
- [ ] Address critical issues

## Phase 3: Future Features

### Translation
- [ ] Implement translation feature
  - [ ] Support Anthropic and OpenAI API keys for LLM-powered translation

### AI-Enhanced Keyterm Discovery
- [ ] Add LLM-powered keyterm search functionality
  - [ ] Support Anthropic and OpenAI API keys for LLM analysis
  - [ ] Integrate IMDb, TVdb, and similar data sources
  - [ ] Parse reviews and press releases
  - [ ] Generate keyterm list via LLM analysis
  - [ ] Output to CSV or auto-fill GUI
  - **Note:** See [`keyterm-info.md`](keyterm-info.md) for Deepgram keyterm best practices and implementation details

### Diarization & Sync
- [ ] Refine speaker map functionality
  - [ ] CSV list mapping speaker IDs to names for diarization mode
  - [ ] Store speaker map CSV in `Transcripts/Speakermap` folder of each show/movie directory
- [ ] Add internal FFmpeg subtitle synchronization function

---

## Reference

### Nova 3 Configuration Reference

Default configuration for Deepgram Nova 3 model:

```json
{
  "version": 1,
  "stt": {
    "model": "nova-3",
    "language_default": "en",
    "smart_format": true,
    "punctuate": true,
    "timestamps": true,
    "diarize": true,
    "utterances": true,
    "paragraphs": true,
    "profanity_filter": "off"
  },
  "keyterms": [],
  "replace": [],
  "rules": {
    "unicode_normalize_before_replace": true,
    "max_keyterms": 100
  },
  "captionizer": {
    "max_lines_per_cue": 2,
    "max_chars_per_line": 40,
    "min_cue_duration_sec": 1.0,
    "max_cue_duration_sec": 6.0,
    "min_gap_ms": 120,
    "snap_to_word_boundaries": true,
    "merge_short_utterances_sec": 0.6,
    "break_priority": ["punctuation", "semantic", "word_count"]
  }
}
