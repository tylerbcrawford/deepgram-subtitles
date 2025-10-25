# Project Roadmap

**Last Updated:** 2025-10-25

## 🎯 Current Status
**V1:** ✅ Released and in production testing  
**V2:** 🔄 Active development - LLM Keyterms feature

---

## 🚀 V2 Development Priorities

### 🐛 Bug Fix: Keyterms Input Persistence (NEXT TASK)
**Status:** High Priority | **Effort:** Low | **Timeline:** 1-2 hours

**Issue:**
When navigating back to the main folder (refresh or home button), keyterms from the previous translation session remain in the input field. This creates confusion and potential errors when starting a new transcription.

**Expected Behavior:**
- Keyterms input should clear when:
  - User refreshes the page
  - User navigates back to main folder/home
  - User switches to a different show/folder
- Each new transcription session should start with a clean keyterms field

**Impact:**
- User might accidentally apply wrong keyterms to different shows
- Reduces user experience quality
- Could lead to incorrect transcription results

**Fix Location:**
- [`web/static/app.js`](../web/static/app.js) - State management and navigation handling
- Clear keyterms field on folder navigation events
- Reset input state when returning to root directory

**Related Documentation:**
- [`keyterms-guide.md`](keyterms-guide.md) - Full keyterms feature documentation

---

### 🥇 Priority 1: LLM-Enhanced Keyterms (Active Development)
**Status:** In Development | **Prompt:** [`keyterm-prompt-v1.md`](keyterm-prompt-v1.md)

Automatically generate optimal keyterm lists using LLM analysis of show/movie metadata.

**Architecture Decision (2025-10-25):**
✅ **Separate Script Implementation** - LLM keyterm generation will be implemented as `core/keyterm_search.py`, independent from `core/transcribe.py`

**Rationale:**
- **Single Responsibility:** Keeps transcription logic separate from intelligence layer
- **Performance:** Transcription doesn't wait for expensive LLM API calls
- **Cost Control:** Users decide when to incur LLM costs
- **Reusability:** Generate keyterms once, use for entire season
- **Flexibility:** Easy to switch LLM providers or add new sources
- **Maintainability:** Isolated testing without affecting critical transcription path

**Implementation Plan:**
- [ ] Create `core/keyterm_search.py` module with KeytermSearcher class
- [ ] LLM API integration (Claude/GPT) for keyterm generation
- [ ] Search authoritative sources (IMDb, Wikipedia, Fandom wikis, TMDB)
- [ ] Parse and format keyterms per Nova-3 best practices (20-50 terms)
- [ ] Auto-save to `Transcripts/Keyterms/` CSV format
- [ ] Create `cli/generate_keyterms.py` CLI tool
- [ ] Web UI integration with "Generate Keyterms with AI" button
- [ ] Add async Celery task in `web/tasks.py`
- [ ] Quality validation and user review workflow

**Module Structure:**
```
core/
├── transcribe.py          # Existing (no changes to core logic)
├── keyterm_search.py      # NEW: LLM-based keyterm generation
└── keyterm_utils.py       # Optional: shared utilities

cli/
├── generate_subtitles.py  # Existing CLI
└── generate_keyterms.py   # NEW: CLI tool for keyterm generation

web/
├── app.py                 # Add /api/keyterms/generate endpoint
└── tasks.py               # Add generate_keyterms_llm task
```

**Benefits:**
- Eliminates manual keyterm research
- Ensures proper capitalization and formatting
- Dramatically improves transcription accuracy for character names
- Reduces setup time for new shows/movies
- Optional feature - doesn't impact core transcription performance
- Can run independently or be integrated into workflows

---

### 🥈 Priority 2: Time Estimation Accuracy
**Effort:** Low | **Timeline:** 2-3 days

- [ ] Refine transcription time estimation algorithm (currently overestimates processing duration)
- [ ] Improve cost calculation accuracy based on actual processing patterns
- [ ] Add historical processing time tracking for better predictions

**Benefits:**
- More accurate cost and time predictions
- Better user experience with realistic expectations
- Can leverage V1 real-world data for improvements

---

### 🥉 Priority 3: Nova-3 Quality Enhancements
**Effort:** Low | **Timeline:** 1-2 days total

From Nova-3 review - optional improvements for specific use cases:
- [ ] Add `numerals=True` parameter (convert "twenty twenty four" → "2024")
- [ ] Add `filler_words` toggle (optional transcription of "uh", "um" - default OFF for subtitles)
- [ ] Add `detect_language=True` (auto-detect language for international content)
- [ ] Add `measurements=True` (convert "fifty meters" → "50m" for sports/science content)

**Benefits:**
- Improved number and date transcription
- Better handling of international content
- More accurate technical/scientific content

---

---

## 📅 V2 Release Plan

**Weeks 1-2:** LLM Keyterms (Priority 1)
**Week 3:** Time Estimation + Nova-3 Enhancements (Priorities 2-3)
**V2 Release**

---

## 🚀 V3 Future Development

### Priority 4: Translation
**Effort:** High | **Timeline:** 2-3 weeks

- [ ] LLM-powered subtitle translation (Anthropic/OpenAI)
- [ ] Multi-language support with timing preservation

**Note:** Deferred to V3 unless V1/V2 users specifically request it.

---

### Priority 5: Bazarr Auto-Fallback Workflow
**Effort:** Moderate | **Timeline:** 1 week

**Current:** Manual trigger after 24h wait
**Planned:** Automatic fallback via webhook or scheduled scan

- [ ] Test Bazarr rescan integration
- [ ] Document manual workflow
- [ ] Implement scheduled scan with age filter (recommended)

**Implementation Options:**
- **A:** Bazarr custom post-processing script
- **B:** Webhook integration (`POST /api/webhook/bazarr`)
- **C:** Scheduled scan with age filter (recommended)

---

### Priority 6: Subtitle Synchronization
**Effort:** Moderate-High | **Timeline:** 1-2 weeks

- [ ] Internal FFmpeg sync function
- [ ] Auto-correct timing drift
- [ ] Subsyncarr workflow integration

**Note:** Lower priority since Subsyncarr already handles this well.

---

## ✅ V1 Completed Features

### Core Features
- ✅ Nova-3 model with full configuration
- ✅ Profanity filter (3 modes: off/tag/remove)
- ✅ Keyterms CSV management with auto-load
- ✅ Speaker maps with auto-detection
- ✅ Batch processing with cost estimation
- ✅ Force regenerate with Subsyncarr cleanup
- ✅ Transcript generation with speaker diarization
- ✅ CLI and Web UI fully functional
- ✅ GUI updated and stable

### Documentation
- ✅ Comprehensive README with all V1 features
- [ ] README redesign (deferred - current docs are functional)

---

## 📝 Reference

### Nova 3 Configuration (Current Implementation)

```python
opts = PrerecordedOptions(
    model="nova-3",
    smart_format=True,
    utterances=True,
    punctuate=True,
    paragraphs=True,
    timestamps=True,
    diarize=enable_diarization,
    language=language,
    profanity_filter=profanity_filter
)

if keyterms and model == "nova-3":
    opts.keyterm = keyterms
```

### Environment Variables

```bash
DEEPGRAM_API_KEY=required
PROFANITY_FILTER=off|tag|remove
SAVE_RAW_JSON=0|1
ENABLE_TRANSCRIPT=0|1
FORCE_REGENERATE=0|1
```

---

## 🎯 Decision Log

1. **Beta Testing:** ✅ COMPLETED (2025-10-25) - Successfully completed, moving to V1 production
2. **GUI Updates:** ✅ COMPLETED (2025-10-25) - Updated and sufficient for V1
3. **LLM Keyterms:** 🚀 PRIORITY 1 (2025-10-25) - Top priority for V2, prompt created
4. **Nova-3 Enhancements:** 🎯 PRIORITY 3 (2025-10-25) - Moved up from low priority
5. **README:** ⏸️ DEFERRED - Current version comprehensive, wait for V1 feedback

---

## 📊 V1 Success Criteria (Achieved)

- ✅ No critical bugs in core transcription
- ✅ Subtitle files recognized by media servers (Plex/Jellyfin)
- ✅ Cost estimates within 10% accuracy
- ✅ Positive user feedback on UI/UX
- ✅ Successful Subsyncarr integration
- ✅ Performance acceptable for typical libraries (100-1000 videos)

---

For detailed implementation history, see git commit log.
