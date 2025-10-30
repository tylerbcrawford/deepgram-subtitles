# Project Roadmap

**Last Updated:** 2025-10-30

## 🎯 Current Status
**V1:** ✅ Released and in production testing
**V2:** ✅ Core features complete - Ready for testing

---

## ⚠️ Important System Info

**Primary Docker Compose Location:** `/home/tyler/Desktop/docker-compose.yml`

*This is the main docker-compose file for the entire system. Always reference this path when working with Docker services.*

---

## 📅 V2 Final Tasks

### 🎯 What's Left for V2 Release

**Critical Path:**
1. **GUI Refresh (Priority 5)** - See detailed implementation tasks below
2. **Testing Phase:** Comprehensive testing of all features including GUI updates
3. **CLI/GUI Feature Parity Verification**
   - Verify CLI offers exact same features as GUI version
   - Ensure both can perform same capabilities and access same variables as choices
   - Some users will only use CLI - must have full feature parity
4. **Documentation Update:** Update README with branding and LLM setup instructions
5. **Environment Setup:** Add API key configuration to `.env.example`

---

### 🔄 Priority 5: GUI Refresh (CURRENT PRIORITY)
**Effort:** Moderate | **Timeline:** 3-5 days

Final polish pass on the web GUI to ensure a cohesive, professional interface with all features properly exposed and organized.

**Implementation Tasks:**
- [ ] **1. Remove media filepath box**
  - Media folder is mounted by default, no need to show filepath
  - Clean up top section of interface
- [ ] **2. Move "show folders with videos only" checkbox to advanced options**
  - Should be selected by default on startup/refresh
  - Declutter main interface
- [ ] **3. Remove "5 folders" label**
  - Unnecessary visual noise
- [ ] **4. Reorganize audio language dropdown**
  - Remove blue border styling
  - Remove "-- critical setting" text
  - Move to top of main card (above file selector)
  - Center the title and dropdown content
- [ ] **5. Reorganize advanced options**
  - Regroup and rename sections for clarity
  - Create logical groupings of related features
- [ ] **6. Convert profanity filter to radio buttons**
  - Change from dropdown to radio button group
  - Three options: Off, Tag, Remove
  - Match font/style with other checkboxes
  - Move into Nova-3 Quality Enhancements section
  - Default to Off on startup/reset
- [ ] **7. Create "Transcript Options" section**
  - Group "Generate transcript" and "Save Raw JSON"
  - Style consistently with Nova-3 Quality section
  - Use same card/border styling
- [ ] **8. Update filler words option**
  - Change "Include filler words" to "Remove filler words"
  - Check by default on startup/reset
  - Part of default options (user can adjust)
- [ ] **9. Set default checkboxes**
  - "Converting measurements" - checked by default
  - "Converting numbers" - checked by default
- [ ] **10. Review auto-detect language**
  - Verify necessity given Multi feature in language dropdown
  - Check against plan and roadmap
  - Remove or adjust as needed
- [ ] **11. Fix AI Keyterms button**
  - Reduce button width (match Transcribe button size)
  - Change text to "Generate Keyterms" only (no emoji)
- [ ] **12. Add consistent card styling**
  - AI Keyterms section already has card/border (keep as reference)
  - Add same card/border to "Nova-3 Quality Enhancements"
  - Add same card/border to "Transcript Options"
  - Ensure visual consistency across all sections
- [ ] **13. Rename button**
  - Change "Select All in Folder" to "Select All"
- [ ] **14. Fix mobile view issues**
  - "Batch Subtitle" smaller header not visible
  - Reduce space between "Subtitle Generator" title and sticky menu
  - Improve responsive behavior
- [ ] **15. Expose all hidden features**
  - Review app for implemented but unexposed features
  - Add diarization, utterances, paragraphs to GUI as checkboxes
  - Apply current defaults and check boxes on startup
  - Make all features accessible to users
- [ ] **16. Overall polish and cohesion**
  - Bring all features into GUI
  - Set best default settings
  - Allow user overrides in Advanced Options
  - Sort into "Transcript Options" or "Nova-3 Quality Enhancements"
  - Ensure cohesive look with overall project design

**Benefits:**
- Clean, professional interface with clear visual hierarchy
- All features properly exposed and accessible
- Consistent styling and organization
- Improved mobile experience
- Better user experience with sensible defaults

---

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

**UI/UX Polish Pass:**
- [ ] **Final Design Review and Refinement**
  - [ ] Complete once-over of GUI and mobile layouts
  - [ ] Fix and reorganize elements to prioritize visual hierarchy
  - [ ] Review all text and copy for conciseness and clarity
  - [ ] Verify all progress indicators work correctly
  - [ ] Improve banner integration to prevent text overlap
    - Banners currently cover text in some scenarios
    - Need better z-index management and positioning
  - [ ] Make overall design more harmonious and cohesive
  - [ ] Final manual evaluation and adjustments across all breakpoints
  - [ ] Test visual consistency between desktop, tablet, and mobile views

**Minor Issue to Address:**
- [ ] Fix batch processing status display (Priority 4 Known Issue)
  - Status update polling works but UI doesn't reflect real-time progress during processing
  - Low impact - transcriptions work correctly, just missing visual feedback

**Target V2 Release:** After GUI refresh, testing, documentation, and branding updates

---

## 🚀 V3 Future Development

### Priority 6: Language Update
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
  - [ ] Update profanity filter radio button implementation for new languages
  - [ ] Ensure radio button interface works with both Nova-2 and Nova-3
  - [ ] Options: Off, Tag, Remove

**Language Coverage:**
- **Nova-3 Exclusive:** 15 languages (English, Spanish, French, German, Dutch, Swedish, Danish, Italian, Portuguese, Japanese, Russian, Hindi, Indonesian, Norwegian, Turkish)
- **Nova-2 Fallback:** 22 additional languages (Korean, Chinese variants, Catalan, Bulgarian, Estonian, Finnish, and more)
- **Multi-Language:** Nova-3 code-switching for mixed-language content

**Benefits:**
- Comprehensive language support across 37+ languages
- Intelligent routing ensures best model for each language
- Support for multilingual content without manual switching

---

### Priority 7: Docker Container Consolidation
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

### Priority 8: Advanced File Input Interface
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

### Priority 9: Translation
**Effort:** High | **Timeline:** 2-3 weeks

- [ ] LLM-powered subtitle translation (Anthropic/OpenAI)
- [ ] Multi-language support with timing preservation

**Note:** Deferred to V3 unless V1/V2 users specifically request it.

---

### Priority 10: Bazarr Auto-Fallback Workflow
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

### Priority 11: Subtitle Synchronization
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
