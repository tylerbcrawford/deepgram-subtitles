# Project Roadmap

**Last Updated:** 2025-10-30

## 🎯 Current Status
**V1:** ✅ Released and in production
**V2:** 🚧 In progress - GUI refresh complete, documentation and polish remaining

---

## ⚠️ Important System Info

**Primary Docker Compose Location:** `/home/tyler/Desktop/docker-compose.yml`

*This is the main docker-compose file for the entire system. Always reference this path when working with Docker services.*

---

## 📅 V2 Final Tasks

### 🎯 What's Left for V2 Release

**Critical Path:**
1. ✅ **Priority 5: GUI Refresh** - Complete
2. **Priority 6: Documentation & Branding** - Update README and environment setup
3. **Priority 7: UI/UX Polish Pass** - Final design refinement
4. **CLI/GUI Feature Parity Verification** - Ensure both interfaces offer same features
5. **Comprehensive Testing** - Full testing of all features

---

### 📝 Priority 6: Documentation & Branding
**Effort:** Low | **Timeline:** 2-3 hours

Rebrand project and update documentation with story-focused approach for V2 release.

**Branding Updates:**
- [ ] Rename project to **Subgeneratorr**
  - [ ] Update title and branding in README
  - [ ] Update any remaining references in documentation
  - [ ] Ensure consistent naming across all user-facing text

**README Rewrite:**
- [ ] Lead with the origin story
  - Why it was built: filling subtitle gaps in Radarr/Sonarr libraries
  - Bazarr finds most subtitles, but hundreds of episodes were missing
  - Deepgram Nova-3 keyterms testing yielded excellent results with $200 free credits
  - LLM-powered keyterms generation makes accurate transcription accessible
- [ ] Keep technical stack overview near top but concise
- [ ] Target audience: media enthusiasts who care about subtitles and accessibility
- [ ] Add disclaimer: not affiliated with Deepgram or any LLM providers
- [ ] Emphasize: free and open source project for media accessibility
- [ ] Move deep technical implementation details to separate `docs/technical.md` file

**Environment Setup:**
- [ ] Add LLM API key configuration to `.env.example`
  - [ ] Add `ANTHROPIC_API_KEY` (optional, for keyterms generation)
  - [ ] Add `OPENAI_API_KEY` (optional, for keyterms generation)
  - [ ] Document that LLM keys are optional features

**Benefits:**
- Clear project identity and memorable name
- Story-driven README that connects with users
- Better documentation organization
- Complete setup instructions

---

### 🎨 Priority 7: UI/UX Polish Pass
**Effort:** Low | **Timeline:** 2-3 hours

Final design review and refinement for V2 release.

**Implementation Tasks:**
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

**Known Issue to Address:**
- [ ] Fix batch processing status display
  - Status update polling works but UI doesn't reflect real-time progress during processing
  - Low impact - transcriptions work correctly, just missing visual feedback

**Benefits:**
- Polished, professional interface
- Consistent visual experience across devices
- Better feedback during batch operations

---

**Target V2 Release:** After Priority 6 (Documentation & Branding), Priority 7 (UI/UX Polish), CLI/GUI feature parity verification, and comprehensive testing

---

## 🚀 V3 Future Development

### Priority 8: Language Update
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

### Priority 9: Docker Container Consolidation
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

### Priority 10: Advanced File Input Interface
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

### Priority 11: Translation
**Effort:** High | **Timeline:** 2-3 weeks

- [ ] LLM-powered subtitle translation (Anthropic/OpenAI)
- [ ] Multi-language support with timing preservation

**Note:** Deferred to V3 unless V1/V2 users specifically request it.

---

### Priority 12: Bazarr Auto-Fallback Workflow
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

### Priority 13: Subtitle Synchronization
**Effort:** Moderate-High | **Timeline:** 1-2 weeks

- [ ] Internal FFmpeg sync function
- [ ] Auto-correct timing drift
- [ ] Subsyncarr workflow integration

**Note:** Lower priority since Subsyncarr already handles this well.

---

## ✅ Completed Work

### Priority 5: GUI Refresh ✅
**Completed:** 2025-10-30

Comprehensive GUI refresh based on Dieter Rams' design principles. Complete overhaul of interface hierarchy, organization, and styling.

**Key Achievements:**
- Removed visual clutter (media filepath box, folder labels)
- Reorganized audio language dropdown (centered, top of card)
- Converted profanity filter to radio buttons
- Created unified Transcript Options section
- Exposed all hidden features (diarization, utterances, paragraphs)
- Applied consistent card styling throughout
- Improved mobile responsiveness
- Renamed to "Subgeneratorr"

**Benefits:** Clean interface following "less, but better" philosophy, all features exposed, sensible defaults, better mobile experience

---

### Priority 3: Nova-3 Quality Enhancements ✅
**Completed:** 2025-10-27

Added optional Nova-3 features as UI toggles: numerals conversion, filler words removal, language detection, measurements conversion. Adjusted cost estimator to match actual API charges.

---

### Priority 4: File Selector UX Refinement ✅
**Completed:** 2025-10-27

Comprehensive file selection improvements: smart folder filtering, single-click "Select All", mobile optimization, batch processing feedback.

---

### V2 Features (2025-10-26)
- ✅ LLM-Enhanced Keyterms (Claude/GPT integration)
- ✅ Keyterms Input Persistence Fix
- ✅ Time Estimation Accuracy (0.0109x real-time)

---

### V1 Core Features (Production)
- ✅ Nova-3 transcription model
- ✅ Profanity filter (off/tag/remove)
- ✅ Keyterms CSV management
- ✅ Speaker maps with auto-detection
- ✅ Batch processing with cost estimation
- ✅ Force regenerate with Subsyncarr cleanup
- ✅ CLI and Web UI

---

## 📝 Reference

### Nova 3 Configuration

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
