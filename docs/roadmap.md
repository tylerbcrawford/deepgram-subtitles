# Project Roadmap

**Last Updated:** 2025-10-26

## 🎯 Current Status
**V1:** ✅ Released and in production testing
**V2:** ✅ Core features complete - Ready for testing

---

## ⚠️ Important System Info

**Primary Docker Compose Location:** `/home/tyler/Desktop/docker-compose.yml`

*This is the main docker-compose file for the entire system. Always reference this path when working with Docker services.*

---

## 🚀 V2 Development Priorities

### 🥉 Priority 3: Nova-3 Quality Enhancements
**Effort:** Low | **Timeline:** 1-2 days total

Optional Nova-3 features for specific use cases. Each should be implemented as a UI toggle in advanced settings:
- [ ] Add `numerals=True` parameter (convert "twenty twenty four" → "2024")
- [ ] Add `filler_words` toggle (optional transcription of "uh", "um" - default OFF for subtitles)
- [ ] Add `detect_language=True` (auto-detect language for international content)
- [ ] Add `measurements=True` (convert "fifty meters" → "50m" for sports/science content)
- [ ] **Adjust Nova cost estimator to match actual API charges**
  - [ ] Current estimates are ~25% lower than actual charges (e.g., estimated $0.71 vs actual $0.94)
  - [ ] Test data: Nova-3 with keyterms batch
  - [ ] Implement different rate calculations for Nova-2 vs Nova-3
  - [ ] Conduct additional batch tests to gather more data points
  - [ ] Update cost calculation formula based on real-world data

**Benefits:**
- Improved number and date transcription
- Better handling of international content
- More accurate technical/scientific content
- Accurate cost predictions prevent budget surprises

---

### 🔧 Priority 4: File Selector UX Refinement
**Effort:** Low | **Timeline:** 1-2 days

Improve file selection workflow to be more intuitive and prevent confusion with folder navigation.

**Current Issues:**
- Files remain selected when navigating away from their folder
- No quick way to select an entire folder at once
- Confusing state when file selection persists across folder changes

**Implementation Tasks:**
- [ ] Add "Select All Files in Folder" button/option
  - [ ] Single-click operation to select all videos in current folder
  - [ ] Clear visual feedback when folder is fully selected
- [ ] Enforce folder scope for file operations
  - [ ] Automatically clear file selection when navigating to different folder
  - [ ] Restrict operations to one folder at a time
  - [ ] Show warning if user attempts cross-folder operations
- [ ] Improve selection state visibility
  - [ ] Clear indication of which folder files belong to
  - [ ] Better visual feedback for selected files
  - [ ] Simplified "Clear Selection" workflow
- [ ] Refine batch processing banners and alerts
  - [ ] Fix large blank gap between start and completion messages during batch processing
  - [ ] Keep "Processing..." banner visible throughout entire batch operation
  - [ ] Ensure banner persists until completion message displays
  - [ ] Fix "Job waiting" indicator in sticky menu to show meaningful processing status
  - [ ] Display actual job progress instead of static "waiting" message

**Benefits:**
- Clearer, more predictable file selection behavior
- Faster batch processing of entire folders
- Reduced user confusion and errors
- Better alignment with typical media library organization
- Continuous visual feedback during long batch operations
- Accurate job status information at all times

---

### 🔄 Priority 5: Language Update
**Effort:** Moderate | **Timeline:** 3-5 days

Expand language support by implementing intelligent model routing and multi-language detection.

**Default Behavior:**
- Monolingual English Nova-3 model with keyterms (default to leverage keyterm feature)
- Intelligent routing to Nova-2 or Nova-3 multi-language based on user selection

**Implementation Tasks:**
- [ ] Add Nova-2 fallback for languages not supported by Nova-3
  - [ ] Implement language detection and model routing logic
  - [ ] Route Nova-2-only languages (Korean, Chinese variants, etc.) to Nova-2
  - [ ] See [`docs/nova-languages.csv`](nova-languages.csv) for complete language mapping
- [ ] Add Nova-3 "Multi" language support
  - [ ] Implement `language="multi"` parameter for code-switching audio
  - [ ] Enable automatic language detection within single audio files
  - [ ] Support mixed-language content (e.g., English-Spanish conversations)
- [ ] Update UI with language selection options
  - [ ] Language dropdown or auto-detect option
  - [ ] Display which model will be used for selected language
  - [ ] Show multi-language option for Nova-3
  - [ ] Default to English (monolingual Nova-3) to maximize keyterm benefits
  - [ ] Gray out/disable Nova-3-specific features (keyterms, etc.) when Nova-2 is selected
  - [ ] Dynamically show/hide UI elements based on selected model capabilities

**Language Coverage:**
- **Nova-3 Exclusive:** 15 languages (English, Spanish, French, German, Dutch, Swedish, Danish, Italian, Portuguese, Japanese, Russian, Hindi, Indonesian, Norwegian, Turkish)
- **Nova-2 Fallback:** 22 additional languages (Korean, Chinese variants, Catalan, Bulgarian, Estonian, Finnish, and more)
- **Multi-Language:** Nova-3 code-switching for mixed-language content

**Benefits:**
- Comprehensive language support across 37+ languages
- Intelligent routing ensures best model for each language
- Support for multilingual content without manual switching

---

## 📅 V2 Status & Next Steps

### 🔄 Remaining for V2 Release
- [ ] **Testing Phase:** Comprehensive testing of LLM features
- [ ] **Documentation Update:** Update README with LLM setup instructions
- [ ] **Environment Setup:** Add API key configuration to `.env.example`
- [ ] Nova-3 Quality Enhancements (Priority 3)
- [ ] File Selector UX Refinement (Priority 4)
- [ ] Language Update (Priority 5)

**Target V2 Release:** After testing and documentation completion

---

## 🚀 V3 Future Development

### Priority 6: Advanced File Input Interface
**Effort:** Moderate | **Timeline:** 1 week

Modern drag-and-drop interface for flexible file selection across multiple folders.

**Implementation Tasks:**
- [ ] Drag-and-drop file upload interface
  - [ ] Support dropping individual files or entire folders
  - [ ] Visual feedback during drag operation
  - [ ] File validation (video formats only)
- [ ] Multi-folder file list management
  - [ ] Allow adding files from different locations
  - [ ] Show file paths with folder organization
  - [ ] Remove individual files or entire folders from list
- [ ] Batch operation enhancements
  - [ ] Process files from multiple folders in one operation
  - [ ] Queue management with priority ordering
  - [ ] Progress tracking per file/folder

**Benefits:**
- More flexible workflow for diverse library structures
- Faster selection of scattered files
- Better support for custom organizational schemes
- Modern, intuitive interface

---

### Priority 7: Translation
**Effort:** High | **Timeline:** 2-3 weeks

- [ ] LLM-powered subtitle translation (Anthropic/OpenAI)
- [ ] Multi-language support with timing preservation

**Note:** Deferred to V3 unless V1/V2 users specifically request it.

---

### Priority 8: Bazarr Auto-Fallback Workflow
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

### Priority 9: Subtitle Synchronization
**Effort:** Moderate-High | **Timeline:** 1-2 weeks

- [ ] Internal FFmpeg sync function
- [ ] Auto-correct timing drift
- [ ] Subsyncarr workflow integration

**Note:** Lower priority since Subsyncarr already handles this well.

---

## ✅ V2 Completed Tasks (2025-10-26)

### Keyterms Input Persistence Fix
Field clearing, auto-loading from CSV, proper sizing

### LLM-Enhanced Keyterms
Automatic keyterm generation using Claude/GPT with cost estimation, web UI integration, real-time progress tracking

### Time Estimation Accuracy
Updated from 0.1x to 0.0109x based on real data (9x improvement) - Nova-3 processes at ~92x real-time speed

---

## ✅ V1 Completed Features

### Core Transcription
- Nova-3 model with full configuration
- Profanity filter (off/tag/remove)
- Keyterms CSV management
- Speaker maps with auto-detection
- Batch processing with cost estimation
- Force regenerate with Subsyncarr cleanup
- CLI and Web UI

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

For detailed implementation history, see git commit log.
