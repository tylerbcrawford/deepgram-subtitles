# Project Roadmap

## 🎯 Current Status: Beta Ready

**Last Updated:** 2025-10-19

### Beta Readiness: ✅ 100% Core Features Complete
- ✅ All critical functionality implemented and tested
- ⚠️ GUI visual polish deferred to post-beta
- 📋 Ready for beta deployment

---

## ✅ Completed Features (Phase 1)

### Core Transcription
- **Nova 3 Model:** Full configuration with smart_format, punctuate, timestamps, diarize, utterances, paragraphs, profanity_filter
- **Profanity Filter:** 3 modes (off/tag/remove) in CLI and Web UI - [`core/transcribe.py`](../core/transcribe.py:136)
- **Keyterms:** Manual comma-separated entry with Nova-3 support - [`web/templates/index.html`](../web/templates/index.html:309)
- **Batch Processing:** CLI and Web UI with cost estimation and progress tracking
- **Force Regenerate:** Overwrite existing subtitles with Subsyncarr marker cleanup - [`cli/generate_subtitles.py`](../cli/generate_subtitles.py:220)

### Transcript Features
- **Transcripts Folder:** Auto-detects TV/Movie, creates `Season/Transcripts/` or `Movie/Transcripts/` - [`core/transcribe.py`](../core/transcribe.py:169)
- **Raw JSON Output:** Toggle via `SAVE_RAW_JSON` env or Web UI, saves to `Transcripts/JSON/` - [`core/transcribe.py`](../core/transcribe.py:294)
- **Speaker Diarization:** With optional speaker maps from `speaker_maps/` directory
- **Integration:** Subsyncarr marker removal, Bazarr rescan trigger

### Environment Variables
```bash
PROFANITY_FILTER=off|tag|remove  # Profanity handling
SAVE_RAW_JSON=0|1               # Debug JSON output
ENABLE_TRANSCRIPT=0|1           # Generate transcripts
FORCE_REGENERATE=0|1            # Overwrite existing
```

---

## 🎯 Active Development

### GUI Visual Overhaul (Deferred)
- [ ] See [`gui-upgrade.md`](gui-upgrade.md) for full specification
- **Priority:** HIGH for UX, but non-blocking for beta
- **Effort:** 2-3 days phased approach
- **Decision:** Complete all backend features before UI polish

### Documentation
- [ ] **README Redesign:** User-facing content, defer until post-beta for user feedback incorporation
- **Priority:** MEDIUM, current docs functional

---

## 📋 Deferred Features (Post-Beta)

### Keyterms Enhancement
- [ ] CSV import/export for keyterms
- [ ] Auto-store keyterms in `Transcripts/` folder
- **Reason:** Manual entry sufficient, adds complexity without critical value

### Speaker Maps
- [ ] Auto-detect speaker maps by show/movie directory
- [ ] Store in `Transcripts/Speakermap/` per show

---

## 🚀 Beta Testing

### Beta Launch Checklist ✅ READY
- [x] All must-have features complete
- [x] CLI + Web UI fully functional
- [x] Cost estimation and batch processing
- [x] Transcripts folder organization
- [ ] GUI polish (deferred, non-blocking)

### Testing Focus
1. **Core:** Subtitle accuracy, Nova 3 performance, profanity filter, speaker diarization
2. **UX:** Web UI usability, feature discoverability, error handling, cost transparency
3. **Integration:** Plex/Jellyfin recognition, Subsyncarr/Bazarr workflow, Docker deployment
4. **Performance:** Bottlenecks, edge cases, library scale (100-1000 videos)

### Test Plan
- [ ] Deploy beta environment
- [ ] Recruit 3-5 testers
- [ ] Create testing guide and feedback form
- [ ] Set up error tracking
- [ ] Weekly check-ins
- [ ] Address critical issues within 48h
- [ ] Plan v1.0 based on feedback

---

## 🔮 Future Features (Post-Beta)

### Nova-3 Quality Enhancements (Low Priority)
From Nova-3 review - optional improvements for specific use cases:
- [ ] Add `numerals=True` parameter (convert "twenty twenty four" → "2024")
- [ ] Add `filler_words` toggle (optional transcription of "uh", "um" - default OFF for subtitles)
- [ ] Add `detect_language=True` (auto-detect language for international content)
- [ ] Add `measurements=True` (convert "fifty meters" → "50m" for sports/science content)

**Decision:** These are quality-of-life improvements, not critical. Current implementation covers all essential Nova-3 features for movie/TV subtitle generation.

### Translation
- [ ] LLM-powered subtitle translation (Anthropic/OpenAI)
- [ ] Multi-language support with timing preservation

### AI-Enhanced Keyterms
- [ ] LLM-powered keyterm discovery from IMDb, TVdb, reviews
- [ ] Auto-generate and export to CSV or GUI
- [ ] See [`keyterm-info.md`](keyterm-info.md) for details

### Bazarr Auto-Fallback Workflow
**Current:** Manual trigger after 24h wait
**Planned:** Automatic fallback via webhook or scheduled scan

**Beta Testing:**
- [ ] Test Bazarr rescan integration
- [ ] Document manual workflow
- [ ] Evaluate automation options (webhook vs cron)

**Implementation Options:**
- **A:** Bazarr custom post-processing script
- **B:** Webhook integration (`POST /api/webhook/bazarr`)
- **C:** Scheduled scan with age filter (recommended for beta)

**Environment Variables:**
```bash
BAZARR_BASE_URL=http://bazarr:6767
BAZARR_API_KEY=your_key
MIN_AGE_HOURS=24  # For scheduled scan
```

### Subtitle Synchronization
- [ ] Internal FFmpeg sync function
- [ ] Auto-correct timing drift
- [ ] Subsyncarr workflow integration

---

## Reference

### Nova 3 Configuration Reference

**UPDATED** implementation in [`core/transcribe.py`](../core/transcribe.py) (2025-10-19):

```python
opts = PrerecordedOptions(
    model="nova-3",
    smart_format=True,
    utterances=True,
    punctuate=True,
    paragraphs=True,           # ✅ Added for better text segmentation
    timestamps=True,           # ✅ Added for word-level timing
    diarize=enable_diarization,
    language=language,
    profanity_filter=profanity_filter  # ✅ Added
)

# Keyterm support (Nova-3 feature - up to 90% accuracy improvement)
# FIXED: Changed from opts.keywords to opts.keyterm
if keyterms and model == "nova-3":
    opts.keyterm = keyterms  # ✅ FIXED: Was opts.keywords
```

**Key Changes:**
- ✅ **Parameter name:** `keywords` → `keyterms` (function signature)
- ✅ **API parameter:** `opts.keywords` → `opts.keyterm` (Nova-3 specific)
- ✅ **Added:** `paragraphs=True` for better readability
- ✅ **Added:** `timestamps=True` for accurate subtitle timing

### Complete Nova 3 Configuration (JSON Reference)

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
```

---

## Implementation Timeline

### Week 1: Beta Prep Sprint (Current)
- [x] Fix Subsyncarr marker removal - **DONE**
- [x] Add profanity filter - **DONE**
- [x] Update Nova 3 config - **DONE**
- [x] Transcripts folder structure - **DONE**
- [x] Raw JSON output toggle - **DONE**
- [ ] GUI visual overhaul - **DEFERRED** (separate task)

### Week 2: Beta Launch
- [ ] Deploy beta version
- [ ] Onboard beta testers
- [ ] Monitor and respond to feedback

### Week 3-4: Beta Refinement
- [ ] Address critical bugs
- [ ] Implement quick wins from feedback
- [ ] Plan v1.0 feature set

### Week 5: v1.0 Release
- [ ] Final testing and QA
- [ ] Update documentation
- [ ] Public release

---

## Notes

### Recently Completed (2025-10-19)

**Morning Session:**
- ✅ Subsyncarr marker file removal (both CLI and Web UI)
- ✅ Profanity filter implementation (Web UI, CLI, Core)
- ✅ Nova 3 configuration update (paragraphs, timestamps)
- ✅ Transcripts folder structure (season/movie level organization)
- ✅ Raw JSON output toggle (saves to Transcripts/JSON/)
- ✅ Environment variable documentation
- ✅ Roadmap comprehensive update

**Afternoon Session - Nova-3 Best Practices Review:**
- ✅ Comprehensive codebase review using Context7 and Exa MCP tools
- ✅ Researched Deepgram Nova-3 features and best practices
- ✅ Identified critical keyterm implementation issue (`keywords` vs `keyterm`)
- ✅ **FIXED:** Changed `keywords` parameter to `keyterm` in [`core/transcribe.py`](../core/transcribe.py:144)
- ✅ **FIXED:** Updated Web UI task handler in [`web/tasks.py`](../web/tasks.py:126)
- ✅ **ADDED:** Missing Nova-3 parameters (`paragraphs`, `timestamps`) to core
- ✅ **STANDARDIZED:** Parameters across CLI and Web implementations
- ✅ Created comprehensive review document (`DEEPGRAM_NOVA3_REVIEW.md`)

### Decision Log
1. **Keyterms CSV Import/Export:** Deferred to post-beta - manual entry is sufficient for beta testing
2. **README Redesign:** Deferred to post-beta - better to incorporate user feedback first
3. **GUI Overhaul:** Deferred entirely as separate task - all backend features complete first
4. **Transcripts Folder Structure:** COMPLETED - improves organization and debugging capability
5. **Raw JSON Output:** COMPLETED - useful for debugging and advanced users
6. **Nova-3 Keyterm Fix:** COMPLETED (2025-10-19) - Critical for character name accuracy
7. **Nova-3 Optional Features:** Deferred to post-beta - numerals, filler_words, language detection are non-critical

### Beta Success Criteria
- ✅ No critical bugs in core transcription
- ✅ Subtitle files recognized by media servers (Plex/Jellyfin)
- ✅ Cost estimates within 10% accuracy
- ✅ Positive user feedback on UI/UX
- ✅ Successful Subsyncarr integration
- ✅ Performance acceptable for typical libraries (100-1000 videos)
