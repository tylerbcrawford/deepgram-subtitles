# Project Roadmap

**Last Updated:** 2025-10-25

## 🎯 Current Status
**V1:** ✅ Released and in production testing  
**V2:** 🔄 Active development - LLM Keyterms feature

---

## 🚀 V2 Development Priorities

### 🥇 Priority 1: LLM-Enhanced Keyterms (Active Development)
**Status:** In Development | **Prompt:** [`keyterm-prompt-v1.md`](keyterm-prompt-v1.md)

Automatically generate optimal keyterm lists using LLM analysis of show/movie metadata.

**Implementation Plan:**
- [ ] LLM API integration (Claude/GPT) for keyterm generation
- [ ] Search authoritative sources (IMDb, Wikipedia, Fandom wikis, TMDB)
- [ ] Parse and format keyterms per Nova-3 best practices (20-50 terms)
- [ ] Auto-save to `Transcripts/Keyterms/` CSV format
- [ ] Web UI integration with "Generate Keyterms" button
- [ ] CLI support with `--auto-keyterms` flag
- [ ] Quality validation and user review workflow

**Benefits:**
- Eliminates manual keyterm research
- Ensures proper capitalization and formatting
- Dramatically improves transcription accuracy for character names
- Reduces setup time for new shows/movies

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

### Priority 4: Bazarr Auto-Fallback Workflow
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

### Priority 5: Subtitle Synchronization
**Effort:** Moderate-High | **Timeline:** 1-2 weeks

- [ ] Internal FFmpeg sync function
- [ ] Auto-correct timing drift
- [ ] Subsyncarr workflow integration

**Note:** Lower priority since Subsyncarr already handles this well.

---

### Priority 6: Translation (V3 Consideration)
**Effort:** High | **Timeline:** 2-3 weeks

- [ ] LLM-powered subtitle translation (Anthropic/OpenAI)
- [ ] Multi-language support with timing preservation

**Recommendation:** Defer to V3 unless V1 users specifically request it.

---

## 📅 V2 Release Plan

**Weeks 1-2:** LLM Keyterms (Priority 1)  
**Week 3:** Time Estimation + Nova-3 Enhancements (Priorities 2-3)  
**Week 4:** Bazarr Auto-Fallback (Priority 4)  
**V2 Release**

Then evaluate for subtitle synchronization and translation based on V1 user feedback.

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
