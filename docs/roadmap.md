# Project Roadmap

**Last Updated:** 2025-10-26

## 🎯 Current Status
**V1:** ✅ Released and in production testing
**V2:** ✅ Core features complete - Ready for testing

---

## 🚀 V2 Development Priorities

### ✅ COMPLETED: Keyterms Input Persistence Fix
**Status:** ✅ Completed (2025-10-26) | **Effort:** Low

**Implementation:**
- ✅ Keyterms field clears on page load ([`web/static/app.js:18`](../web/static/app.js:18))
- ✅ Keyterms field clears on directory navigation ([`web/static/app.js:172`](../web/static/app.js:172))
- ✅ Auto-loading from CSV implemented ([`web/static/app.js:352-402`](../web/static/app.js:352-402))
- ✅ Backend API endpoint for loading keyterms ([`web/app.py:447-481`](../web/app.py:447-481))
- ✅ Textarea with proper sizing (7 rows) ([`web/templates/index.html:114`](../web/templates/index.html:114))

**Result:** Users can now navigate between videos without keyterm persistence issues, and keyterms auto-load correctly from CSV files.

---

### ✅ COMPLETED: LLM-Enhanced Keyterms
**Status:** ✅ Completed (2025-10-26) | **Prompt:** [`keyterm-prompt-v1.md`](keyterm-prompt-v1.md)

Automatically generate optimal keyterm lists using LLM analysis of show/movie metadata.

**Architecture:**
✅ **Separate Script Implementation** - Implemented as [`core/keyterm_search.py`](../core/keyterm_search.py), independent from core transcription

**Completed Implementation:**
- ✅ [`core/keyterm_search.py`](../core/keyterm_search.py) - Full KeytermSearcher class with LLM integration (425 lines)
- ✅ LLM API integration - Both Anthropic Claude and OpenAI GPT support
- ✅ Cost estimation before generation
- ✅ Keyterm parsing and formatting per Nova-3 best practices
- ✅ Auto-save to `Transcripts/Keyterms/` CSV format
- ✅ Web UI integration ([`web/templates/index.html:159-192`](../web/templates/index.html:159-192))
- ✅ Async Celery task ([`web/tasks.py:232-348`](../web/tasks.py:232-348))
- ✅ API endpoints ([`web/app.py:544-715`](../web/app.py:544-715))
- ✅ Frontend implementation ([`web/static/app.js:874-1143`](../web/static/app.js:874-1143))

**Features Delivered:**
- Provider selection (Anthropic/OpenAI)
- Model selection (Claude Sonnet 4.5, Claude Haiku 4.5, GPT-5, GPT-5 Mini)
- Cost estimation before generation
- Preserve/merge with existing keyterms option
- Real-time progress tracking via SSE
- API key status indicator
- Success notifications with cost and token count

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

## 📅 V2 Status & Next Steps

### ✅ Completed (2025-10-26)
- ✅ Keyterms UI bug fixes (Phase 0)
- ✅ LLM keyterm generation (Priority 1)
- ✅ Core module implementation
- ✅ Web API and Celery tasks
- ✅ Full frontend integration

### 🔄 Remaining for V2 Release
- [ ] **Testing Phase:** Comprehensive testing of LLM features
- [ ] **Documentation Update:** Update README with LLM setup instructions
- [ ] **Environment Setup:** Add API key configuration to `.env.example`
- [ ] Time Estimation Accuracy improvements (Priority 2)
- [ ] Nova-3 Quality Enhancements (Priority 3)

**Target V2 Release:** After testing and documentation completion

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
3. **Keyterms Bug Fix:** ✅ COMPLETED (2025-10-26) - Field persistence, auto-loading, and sizing fixed
4. **LLM Keyterms:** ✅ COMPLETED (2025-10-26) - Full implementation with UI, API, and Celery tasks
5. **Nova-3 Enhancements:** 🎯 PRIORITY 3 (Next) - Deferred until after V2 testing
6. **README:** ⏸️ DEFERRED - Will update with LLM setup instructions before V2 release

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
