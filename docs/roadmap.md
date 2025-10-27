# Project Roadmap

**Last Updated:** 2025-10-27

## 🎯 Current Status
**V1:** ✅ Released and in production testing
**V2:** ✅ Core features complete - Ready for testing

---

## ⚠️ Important System Info

**Primary Docker Compose Location:** `/home/tyler/Desktop/docker-compose.yml`

*This is the main docker-compose file for the entire system. Always reference this path when working with Docker services.*

---

## 🚀 Active Development

### 🔄 Priority 5: Language Update (CURRENT PRIORITY)
**Effort:** Moderate | **Timeline:** 3-5 days

Expand language support by implementing intelligent model routing and multi-language detection.

**Default Behavior:**
- Monolingual English Nova-3 model with keyterms (default to leverage keyterm feature)
- Intelligent routing to Nova-2 or Nova-3 multi-language based on user selection

**Implementation Tasks:**
- [ ] Add Nova-2 fallback for languages not supported by Nova-3
  - [ ] Implement model routing logic based on user-selected language
  - [ ] Route Nova-2-only languages (Korean, Chinese variants, etc.) to Nova-2
  - [ ] See [`docs/nova-languages.csv`](nova-languages.csv) for complete language mapping
- [ ] Add Nova-3 "Multi" language support
  - [ ] Implement `language="multi"` parameter for code-switching audio
  - [ ] Add "Multi" option to language dropdown for Nova-3 multi-language detection
  - [ ] Support mixed-language content (e.g., English-Spanish conversations)
- [ ] Update UI with language selection options
  - [ ] Language dropdown with explicit user selection (no auto-detect)
  - [ ] Display which model will be used for selected language
  - [ ] Include "Multi" option in dropdown for Nova-3 multi-language detection
  - [ ] Default to English (monolingual Nova-3) to maximize keyterm benefits
  - [ ] Gray out/disable Nova-3-specific features (keyterms, etc.) when Nova-2 is selected
  - [ ] Dynamically show/hide UI elements based on selected model capabilities
- [ ] **Nova V2 Keywords Integration**
  - [ ] Find a way to work Nova V2 Keywords into the Keyterms Nova-3 terms box
  - [ ] Update UI dynamically when Nova-2 model is selected
  - [ ] Show appropriate keyterms options based on selected model
  - [ ] Hide or gray out Nova-3-only features when Nova-2 is active
- [ ] **Profanity Filter Enhancement**
  - [ ] Change profanity filter from dropdown to radio button with 3 options
  - [ ] Options: Off, Tag, Remove
  - [ ] Update both GUI and CLI to support radio button interface

**Language Coverage:**
- **Nova-3 Exclusive:** 15 languages (English, Spanish, French, German, Dutch, Swedish, Danish, Italian, Portuguese, Japanese, Russian, Hindi, Indonesian, Norwegian, Turkish)
- **Nova-2 Fallback:** 22 additional languages (Korean, Chinese variants, Catalan, Bulgarian, Estonian, Finnish, and more)
- **Multi-Language:** Nova-3 code-switching for mixed-language content

**Benefits:**
- Comprehensive language support across 37+ languages
- Intelligent routing ensures best model for each language
- Support for multilingual content without manual switching

---

## 📅 V2 Final Tasks

### 🎯 What's Left for V2 Release

**Critical Path:**
1. **Language Update (Priority 5)** - See detailed implementation tasks above
2. **Testing Phase:** Comprehensive testing of LLM features
3. **CLI/GUI Feature Parity Verification**
   - Verify CLI offers exact same features as GUI version
   - Ensure both can perform same capabilities and access same variables as choices
   - Some users will only use CLI - must have full feature parity
4. **Documentation Update:** Update README with LLM setup instructions
5. **Environment Setup:** Add API key configuration to `.env.example`

**Branding and Identity:**
- [ ] New project name: **Subgeneratorr**
- [ ] Update README with story-focused approach
  - Brief technical stack overview near beginning
  - Focus on the story: built to fill subtitle gaps in Radarr/Sonarr libraries
  - Explain Bazarr finds most subtitles, but hundreds of episodes were missing
  - Describe Deepgram Nova-3 keyterms testing success with $200 free credits
  - Highlight LLM-powered keyterms generation feature
- [ ] Add disclaimer: not affiliated with Deepgram or any LLM providers
- [ ] Emphasize: free and open source project for media accessibility
- [ ] Target audience: movie buffs who care about subtitles
- [ ] Move deep technical writing to separate document

**Minor Issue to Address:**
- [ ] Fix batch processing status display (Priority 4 Known Issue)
  - Status update polling works but UI doesn't reflect real-time progress during processing
  - Low impact - transcriptions work correctly, just missing visual feedback

**Target V2 Release:** After language update, testing, and documentation completion

---

## 🚀 V3 Future Development

### Priority 6: Docker Container Consolidation
**Effort:** Moderate | **Timeline:** 1 week

Simplify deployment and improve user experience by consolidating services.

**Implementation Tasks:**
- [ ] Condense everything to work in one Docker container
- [ ] Combine CLI and Web services into single container
- [ ] Streamline configuration and setup
- [ ] Simplify docker-compose.yml structure
- [ ] Reduce resource overhead
- [ ] Improve startup time and reliability

**Benefits:**
- Cleaner and easier UX
- Simpler installation process
- Reduced complexity for end users
- Lower resource requirements
- Easier maintenance and updates

---

### Priority 7: Advanced File Input Interface
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

### Priority 8: Translation
**Effort:** High | **Timeline:** 2-3 weeks

- [ ] LLM-powered subtitle translation (Anthropic/OpenAI)
- [ ] Multi-language support with timing preservation

**Note:** Deferred to V3 unless V1/V2 users specifically request it.

---

### Priority 9: Bazarr Auto-Fallback Workflow
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

### Priority 10: Subtitle Synchronization
**Effort:** Moderate-High | **Timeline:** 1-2 weeks

- [ ] Internal FFmpeg sync function
- [ ] Auto-correct timing drift
- [ ] Subsyncarr workflow integration

**Note:** Lower priority since Subsyncarr already handles this well.

---

## ✅ Completed Work

### V2 Completed Features (2025-10-26 - 2025-10-27)

#### Priority 3: Nova-3 Quality Enhancements ✅
**Completed:** 2025-10-27 | **Effort:** Low | **Timeline:** 1-2 days

Optional Nova-3 features implemented as UI toggles in advanced settings:
- ✅ Added `numerals=True` parameter (convert "twenty twenty four" → "2024")
- ✅ Added `filler_words` toggle (optional transcription of "uh", "um" - default OFF)
- ✅ Added `detect_language=True` (auto-detect language for international content)
- ✅ Added `measurements=True` (convert "fifty meters" → "50m")
- ✅ **Adjusted Nova cost estimator to match actual API charges**
  - Fixed estimates that were ~25% lower than actual charges
  - Updated Nova-3 pricing: $0.0057/min (was $0.0043/min)
  - Added Nova-2 pricing constant: $0.0043/min for future language routing
- ✅ Completed manual testing of all enhancement parameters

**Benefits Achieved:**
- Improved number and date transcription
- Better handling of international content
- More accurate technical/scientific content
- Accurate cost predictions prevent budget surprises

---

#### Priority 4: File Selector UX Refinement ✅
**Completed:** 2025-10-27 | **Effort:** Low | **Timeline:** 1-2 days
**Status:** Implementation complete with one minor UI polish issue remaining

Comprehensive file selection workflow improvements across four areas:

**📁 Folder Navigation & Filtering:**
- ✅ Smart folder filtering (only show folders with videos, enabled by default)
- ✅ Cleaned up folder/file tree display
- ✅ Improved folder hierarchy with count display in filter bar

**✅ File Selection & Scope:**
- ✅ Single-click "Select All Files in Folder" button with clear visual feedback
- ✅ Automatic selection clearing when navigating folders
- ✅ Restricted operations to one folder at a time for clarity
- ✅ Enhanced selection state visibility with simplified workflow

**🎨 UI Layout & Mobile Optimization:**
- ✅ Reorganized control layout (Audio Language selection prioritized at top)
- ✅ Responsive design for mobile screens (< 768px)
- ✅ Touch-friendly controls (48px+ touch targets)
- ✅ Extra small device support (< 375px)
- ✅ Tablet optimization (769px - 1024px)

**📊 Batch Processing Feedback:**
- ✅ Persistent "Processing..." banner throughout batch operations
- ✅ Real-time progress indicators with percentages
- ✅ Animated loading dots indicator
- ✅ Detailed completion stats (processed, skipped, failed)

**Known Minor Issue:**
- ⚠️ UI shows "⏳ Queued" throughout entire batch, then jumps to "✓ Complete"
- Expected: Should show "⚙️ Processing..." with real-time progress updates
- Backend: ✅ Works perfectly - transcriptions complete in 5-13 seconds per file
- Frontend: Status polling may complete too fast to catch STARTED state
- Impact: Low - transcriptions work correctly, just missing intermediate visual feedback

**Benefits Achieved:**
- Clearer, more predictable file selection behavior
- Faster batch processing of entire folders
- Reduced user confusion and errors
- Improved mobile experience with touch-friendly controls
- Continuous visual feedback during long operations

---

#### Keyterms Input Persistence Fix ✅
**Completed:** 2025-10-26

Field clearing, auto-loading from CSV, proper sizing

---

#### LLM-Enhanced Keyterms ✅
**Completed:** 2025-10-26

Automatic keyterm generation using Claude/GPT with cost estimation, web UI integration, real-time progress tracking

---

#### Time Estimation Accuracy ✅
**Completed:** 2025-10-26

Updated from 0.1x to 0.0109x based on real data (9x improvement) - Nova-3 processes at ~92x real-time speed

---

### V1 Completed Features (Production)

#### Core Transcription System ✅
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
