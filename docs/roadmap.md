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

## 🚀 V2 Development Priorities

### 🥉 Priority 3: Nova-3 Quality Enhancements
**Effort:** Low | **Timeline:** 1-2 days total
**Status:** ✅ Complete

Optional Nova-3 features for specific use cases. Each should be implemented as a UI toggle in advanced settings:
- [x] Add `numerals=True` parameter (convert "twenty twenty four" → "2024")
- [x] Add `filler_words` toggle (optional transcription of "uh", "um" - default OFF for subtitles)
- [x] Add `detect_language=True` (auto-detect language for international content)
- [x] Add `measurements=True` (convert "fifty meters" → "50m" for sports/science content)
- [x] **Adjust Nova cost estimator to match actual API charges**
  - [x] Current estimates are ~25% lower than actual charges (e.g., estimated $0.71 vs actual $0.94)
  - [x] Test data: Nova-3 with keyterms batch
  - [x] Implement different rate calculations for Nova-2 vs Nova-3
  - [x] Update cost calculation formula based on real-world data
  - [x] Updated Nova-3 pricing: $0.0057/min (was $0.0043/min)
  - [x] Added Nova-2 pricing constant: $0.0043/min for future language routing
- [x] **Manual testing required**
  - [x] Test each enhancement parameter with sample videos
  - [x] Verify UI toggles work correctly
  - [x] Confirm cost estimation accuracy with actual API usage
  - [x] Validate CLI environment variables

**Benefits:**
- Improved number and date transcription
- Better handling of international content
- More accurate technical/scientific content
- Accurate cost predictions prevent budget surprises

---

### 🔧 Priority 4: File Selector UX Refinement
**Effort:** Low | **Timeline:** 1-2 days
**Status:** ⚠️ Implementation Complete - UI Status Update Issue Discovered

Improve file selection workflow to be more intuitive and prevent confusion with folder navigation.

**Known Issue - Status Display During Batch Processing:**
- **Symptom:** UI shows "⏳ Queued - Waiting to start..." throughout entire batch, then jumps to "✓ Complete" at end
- **Expected:** Should show "⚙️ Processing..." with real-time progress (e.g., "3 / 10 completed • 2 active (30%)")
- **Backend Status:** ✅ Working perfectly - transcriptions complete successfully in 5-13 seconds per file
- **Frontend Status:** ❌ [`updateJobDisplay()`](web/static/app.js:891-941) not receiving state updates or not rendering them
- **Impact:** Low - transcriptions work correctly, just missing visual progress feedback during processing
- **Investigation Needed:**
  - Check if [`/api/job`](web/app.py:322-384) endpoint returning correct state during STARTED phase
  - Verify [`checkJobStatus()`](web/static/app.js:823-866) polling is calling update function
  - Console shows no errors, Network tab shows no failed requests
  - May be timing issue where status polls complete too fast to catch STARTED state
  - Consider adding debug logging to track state transitions

**Completed Improvements:**

#### 📁 Group A: Folder Navigation & Filtering
Smart folder filtering to reduce clutter and improve discovery of video files.

- [x] Implement smart folder filtering
  - [x] Add toggle to only show folders that contain videos
  - [x] Enable "show folders with videos only" by default
  - [x] Add checkbox toggle for "show all folders" option
- [x] Clean up folder/file tree display
  - [x] Reduce visual clutter in video selector
  - [x] Improve folder hierarchy display
  - [x] Show folder count in filter bar

#### ✅ Group B: File Selection & Scope
Enforce single-folder operations and improve selection clarity.

- [x] Add bulk selection features
  - [x] Single-click "Select All Files in Folder" button
  - [x] Clear visual feedback when folder is fully selected
- [x] Enforce folder scope for operations
  - [x] Automatically clear file selection when navigating to different folder
  - [x] Restrict operations to one folder at a time
  - [x] Track current folder for selection scope
- [x] Improve selection state visibility
  - [x] Clear indication of which folder files belong to
  - [x] Better visual feedback for selected files
  - [x] Simplified "Clear Selection" workflow

#### 🎨 Group C: UI Layout & Mobile Optimization
Prioritize critical controls and ensure mobile compatibility.

- [x] Reorganize control layout
  - [x] Move "Audio Language" selection to top of card with priority styling
  - [x] Prioritize language selection as it's a critical program feature
  - [x] Ensure language selection is immediately visible and accessible
- [x] Optimize for mobile devices
  - [x] Improve responsive design for mobile screens (< 768px)
  - [x] Ensure all controls are touch-friendly (48px+ touch targets)
  - [x] Test and optimize layout for various screen sizes
  - [x] Add extra small device support (< 375px)
  - [x] Add tablet optimization (769px - 1024px)

#### 📊 Group D: Batch Processing Feedback
Real-time progress indicators and persistent status messages.

- [x] Fix processing banner display
  - [x] Keep "Processing..." banner visible throughout entire batch operation
  - [x] Show persistent toast notification during batch processing
  - [x] Ensure banner persists until completion message displays
- [x] Improve job status indicators
  - [x] Show meaningful status in sticky menu (not just "waiting")
  - [x] Display actual job progress with percentage
  - [x] Show real-time progress: completed/total files with active count
  - [x] Add animated loading dots indicator
  - [x] Show detailed completion stats (processed, skipped, failed)

**Benefits Achieved:**
- Clearer, more predictable file selection behavior
- Faster batch processing of entire folders
- Reduced user confusion and errors
- Better alignment with typical media library organization
- Continuous visual feedback during long batch operations
- Accurate job status information at all times
- Improved mobile experience with touch-friendly controls

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

## 📅 V2 Status & Next Steps

### 🔄 Remaining for V2 Release
- [ ] **Testing Phase:** Comprehensive testing of LLM features
- [ ] **CLI/GUI Feature Parity Verification**
  - [ ] Verify CLI offers exact same features as GUI version
  - [ ] Ensure both can perform same capabilities and access same variables as choices
  - [ ] Some users will only use CLI - must have full feature parity
- [ ] **Documentation Update:** Update README with LLM setup instructions
- [ ] **Environment Setup:** Add API key configuration to `.env.example`
- [ ] **Branding and Identity Development**
  - [ ] New project name: **Subgeneratorr**
  - [ ] Update README with story-focused approach
    - [ ] Brief technical stack overview near beginning
    - [ ] Focus on the story: built to fill subtitle gaps in Radarr/Sonarr libraries
    - [ ] Explain Bazarr finds most subtitles, but hundreds of episodes were missing
    - [ ] Describe Deepgram Nova-3 keyterms testing success with $200 free credits
    - [ ] Highlight LLM-powered keyterms generation feature
  - [ ] Add disclaimer: not affiliated with Deepgram or any LLM providers
  - [ ] Emphasize: free and open source project for media accessibility
  - [ ] Target audience: movie buffs who care about subtitles
  - [ ] Move deep technical writing to separate document
- [ ] Nova-3 Quality Enhancements (Priority 3)
- [ ] File Selector UX Refinement (Priority 4)
- [ ] Language Update (Priority 5)

**Target V2 Release:** After testing and documentation completion

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
