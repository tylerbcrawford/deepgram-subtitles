# Project Roadmap

**Last Updated:** 2025-11-07

## 🎯 Current Status
**V1:** ✅ Released and in production
**V2:** 🚧 In progress - GUI refresh, documentation, and Nova-3 expansion complete
**Next Step:** Priority 7 - UI/UX Polish Pass

---

## ⚠️ Important System Info

**Primary Docker Compose Location:** `/home/tyler/Desktop/docker-compose.yml`

*This is the main docker-compose file for the entire system. Always reference this path when working with Docker services.*

---

## 📊 Current Progress Summary

**Completed for V2:**
- ✅ Priority 5: GUI Refresh (2025-10-30)
- ✅ Priority 6: Documentation & Branding (2025-11-01)
- ✅ Priority 6.5: Nova-3 Language Expansion Documentation (2025-11-07)

**V2 Remaining Tasks:**
- 🔜 Priority 7: UI/UX Polish Pass - Ready to start
- ⏳ Priority 8: CLI/GUI Feature Parity Verification
- ⏳ Priority 9: Comprehensive Testing
- 🚀 V2 Release

---

## 📅 V2 Remaining Tasks

### 🎨 Priority 7: UI/UX Polish Pass (NEXT)
**Effort:** Low | **Timeline:** 2-3 hours
**Status:** 🔜 Ready to start

Final design review and refinement for V2 release.

**Implementation Tasks:**
- [ ] Complete visual review of GUI across all breakpoints
  - [ ] Desktop layout (1920px, 1440px, 1024px)
  - [ ] Tablet layout (768px, 834px)
  - [ ] Mobile layout (375px, 414px)
- [ ] Review and refine visual hierarchy
  - [ ] Ensure most important elements stand out (Transcribe button, status, file selection)
  - [ ] Check spacing, alignment, and visual weight of all elements
  - [ ] Verify color contrast meets accessibility standards
- [ ] Text and copy review
  - [ ] Check all labels, buttons, and help text for clarity
  - [ ] Ensure consistent terminology throughout UI
  - [ ] Remove any redundant or verbose text
- [ ] Status and progress indicators
  - [ ] Verify unified status area displays correctly
  - [ ] Test progress bar during batch processing
  - [ ] Check if real-time progress updates work during transcription
  - [ ] Ensure status messages are clear and actionable
- [ ] Fix any banner/notification overlap issues
  - [ ] Review z-index hierarchy for modals, toasts, and notifications
  - [ ] Test notification positioning doesn't cover critical UI elements
- [ ] Final cohesion and harmony pass
  - [ ] Ensure consistent styling across all cards and sections
  - [ ] Verify theme (dark/light) works correctly throughout
  - [ ] Check animations and transitions are smooth

**Known Issues to Verify:**
- [ ] Batch processing status display
  - Reports suggest UI doesn't show real-time progress during processing
  - Verify if this is still an issue or has been resolved
  - If broken: Fix SSE updates or polling mechanism
  - If working: Mark as resolved

**Benefits:**
- Polished, professional interface ready for V2 release
- Consistent visual experience across all devices
- Better user feedback during batch operations
- Accessible and clear UI for all users

---

### 🌐 Priority 7.5: Language Options UX Enhancement
**Effort:** Low | **Timeline:** 2-3 hours
**Status:** ⏳ After Priority 7

Enhance language detection and code-switching features to surface valuable metadata and improve feature conflict handling.

**Evaluation Summary:**
Both auto-detect language (35 languages) and multi-language code-switching (10 languages) are valuable Nova-3 differentiators worth keeping. These features work perfectly with the batch/pre-recorded architecture, but currently the rich metadata from Deepgram responses isn't displayed to users.

**Current Features:**
- **Auto-detect language** (`detect_language`): Identifies dominant language from 35+ supported languages, returns confidence score
- **Multi-language code-switching** (`language=multi`): Nova-3's breakthrough feature for real-time transcription across 10 languages (Spanglish, Hinglish, etc.), returns word-level language tags

**Implementation Tasks:**
- [ ] Improve keyterms conflict handling
  - [ ] Auto-disable keyterm generation when multi-language is enabled
  - [ ] Remove confirmation dialog (replace with clear tooltip/explanation)
  - [ ] Update UI state automatically when toggling multi-language
- [ ] Add visual indicators for active language overrides
  - [ ] Badge/icon showing when auto-detect is active
  - [ ] Badge showing when multi-language is active (overrides dropdown)
  - [ ] Make language state clear without being intrusive
- [ ] Display detection results after transcription
  - [ ] Show detected language + confidence score in results area
  - [ ] For code-switching: show language breakdown (e.g., "English 67%, Spanish 33%")
  - [ ] Make this information copyable/exportable
- [ ] Include language metadata in saved results
  - [ ] Add to transcript output files when available
  - [ ] Include in raw JSON when that option is enabled
  - [ ] Preserve word-level language tags from code-switching
- [ ] Enhance help text with concrete examples
  - [ ] Add use cases: "Spanglish, Hinglish, bilingual meetings"
  - [ ] List 10 supported code-switching languages (EN/ES/FR/DE/HI/RU/PT/JA/IT/NL)
  - [ ] Show 35 auto-detect supported languages
  - [ ] Clarify difference between auto-detect (unknown single language) vs code-switching (known bilingual content)
- [ ] Optional: Add language restriction for auto-detect
  - [ ] Multi-select to constrain detection to specific languages
  - [ ] Example: Only detect between English/Spanish/French
  - [ ] Reduces false positives for known language sets

**Design Principles:**
- Keep language options in Advanced Options section (not promoted to main UI)
- Make visual feedback subtle (not prominent/loud)
- Focus on surfacing hidden API metadata that's already being returned
- Handle feature conflicts gracefully without blocking user workflows

**Technical Notes:**
- Language detection is pre-recorded only (not streaming) - perfect for this application
- Code-switching returns word-level language data we're not currently displaying
- Model auto-fallback: Nova-3 → Nova-2 → Nova-1 → Enhanced → Base
- Multi-language incompatible with keyterms (Nova-3 monolingual-only feature)

**Benefits:**
- Better user understanding of what languages were detected
- Reduced friction between keyterms and multi-language features
- Showcases Nova-3's unique code-switching capabilities
- Provides valuable metadata for international users and content analysts
- Differentiates from competitors who don't expose these features

---

### 🔍 Priority 8: CLI/GUI Feature Parity Verification
**Effort:** Low | **Timeline:** 1-2 hours
**Status:** ⏳ After Priority 7

Ensure both CLI and Web UI offer the same features and functionality.

**Implementation Tasks:**
- [ ] Create feature comparison matrix
  - [ ] List all CLI options and flags
  - [ ] List all Web UI options and settings
  - [ ] Identify any missing features in either interface
- [ ] Core transcription features
  - [ ] Verify language selection works in both CLI and Web UI
  - [ ] Verify profanity filter options (off/tag/remove) available in both
  - [ ] Verify force regenerate works in both interfaces
  - [ ] Verify transcript generation toggle exists in both
- [ ] Advanced features
  - [ ] Verify keyterms CSV loading works in both CLI and Web UI
  - [ ] Verify speaker maps auto-detection in both interfaces
  - [ ] Check Nova-3 quality options (numerals, measurements, filler words, detect language) in both
  - [ ] Verify diarization, utterances, paragraphs options in both
- [ ] LLM-powered keyterm generation
  - [ ] Confirm this is Web UI exclusive (by design)
  - [ ] Document in technical docs as Web UI-only feature
- [ ] Batch processing
  - [ ] Verify batch size limits work in CLI
  - [ ] Verify batch processing in Web UI with parallel workers
  - [ ] Test file list processing in both interfaces
- [ ] Documentation parity
  - [ ] Ensure README documents both CLI and Web UI usage
  - [ ] Verify all features are documented in technical.md
  - [ ] Add any missing usage examples

**Expected Findings:**
- Most features should already have parity from previous work
- LLM keyterm generation is intentionally Web UI-only
- Document any intentional differences between CLI and Web UI

**Benefits:**
- Consistent user experience across both interfaces
- Clear documentation of any interface-specific features
- Confidence that users can choose CLI or Web UI based on preference

---

### ✅ Priority 9: Comprehensive Testing
**Effort:** Moderate | **Timeline:** 2-4 hours
**Status:** ⏳ After Priority 8

Final testing pass before V2 release.

**Implementation Tasks:**
- [ ] Functional testing
  - [ ] Test single file transcription (CLI and Web UI)
  - [ ] Test batch processing with multiple files
  - [ ] Test force regenerate functionality
  - [ ] Test transcript generation with speaker maps
  - [ ] Test keyterms CSV auto-loading
  - [ ] Test LLM keyterm generation (Web UI)
- [ ] Cross-platform testing
  - [ ] Test on Linux (Docker Engine)
  - [ ] Test on macOS (Docker Desktop)
  - [ ] Test on Windows (Docker Desktop with WSL2)
- [ ] Browser testing (Web UI)
  - [ ] Test on Chrome/Chromium
  - [ ] Test on Firefox
  - [ ] Test on Safari (macOS)
  - [ ] Test on mobile browsers (iOS Safari, Chrome Mobile)
- [ ] Responsive design testing (Web UI)
  - [ ] Test desktop layouts (1920px, 1440px, 1024px)
  - [ ] Test tablet layouts (768px, 834px)
  - [ ] Test mobile layouts (375px, 414px)
  - [ ] Test landscape and portrait orientations
- [ ] Edge cases and error handling
  - [ ] Test with missing API key
  - [ ] Test with invalid file paths
  - [ ] Test with unsupported file formats
  - [ ] Test with very large files
  - [ ] Test with network interruptions
  - [ ] Test with insufficient API credits
- [ ] Integration testing
  - [ ] Verify .eng.srt files recognized by Plex
  - [ ] Verify .eng.srt files recognized by Jellyfin
  - [ ] Test Bazarr integration (if configured)
- [ ] Documentation validation
  - [ ] Follow README Quick Start guide
  - [ ] Verify all docker-compose examples work
  - [ ] Test all CLI command examples
  - [ ] Verify all links work in documentation

**Success Criteria:**
- All core features work as expected
- No critical bugs found
- Documentation is accurate and complete
- Ready for V2 release

**Benefits:**
- High confidence in V2 release quality
- Reduced post-release bug reports
- Better user experience for V2 users

---

### 🚀 V2 Release
**Status:** ⏳ After Priority 9

Final steps for V2 release.

**Release Checklist:**
- [ ] All Priority 7, 8, and 9 tasks completed
- [ ] README.md finalized with V2 features
- [ ] docs/technical.md is complete and accurate
- [ ] docs/roadmap.md updated to show V2 complete
- [ ] Git tag V2 release with version number
- [ ] Create GitHub release with changelog
- [ ] Update any deployment documentation
- [ ] Announce V2 release (if applicable)

**Changelog Highlights:**
- Subgeneratorr rebrand with user-focused documentation
- Comprehensive GUI refresh based on Dieter Rams principles
- LLM-powered keyterm generation (optional)
- Enhanced Nova-3 quality options
- Nova-3 language expansion to 26 languages (from 15)
- Improved file selector UX
- Mobile-responsive design
- Complete technical documentation

---

## 🚀 V3 Future Development

### Priority 10: Language Update
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

**Language Coverage (Updated 2025-11-07):**
- **Nova-3 Now Supports:** 26 languages including English, Spanish, French, German, Dutch, Swedish, Danish, Italian, Portuguese, Norwegian, Turkish, Indonesian, Bulgarian, Czech, Finnish, Hindi, Hungarian, Japanese, Korean, Polish, Russian, Ukrainian, Vietnamese
- **Nova-2 Fallback Still Needed For:** Chinese variants, Catalan, Estonian, and other languages not yet in Nova-3
- **Multi-Language:** Nova-3 code-switching for mixed-language content

**Note:** With Nova-3's recent expansion, many languages previously requiring Nova-2 (Korean, Japanese, Russian, Hindi, Bulgarian, Czech, Finnish, Hungarian, Polish, Ukrainian, Vietnamese) now have native Nova-3 support with keyterm prompting.

**Benefits:**
- Comprehensive language support across 37+ languages
- Intelligent routing ensures best model for each language
- Support for multilingual content without manual switching

---

### Priority 11: Docker Container Consolidation
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

### Priority 12: Advanced File Input Interface
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

### Priority 13: Translation
**Effort:** High | **Timeline:** 2-3 weeks

- [ ] LLM-powered subtitle translation (Anthropic/OpenAI)
- [ ] Multi-language support with timing preservation

**Note:** Deferred to V3 unless V1/V2 users specifically request it.

---

### Priority 14: Bazarr Auto-Fallback Workflow
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

### Priority 15: Subtitle Synchronization
**Effort:** Moderate-High | **Timeline:** 1-2 weeks

- [ ] Internal FFmpeg sync function
- [ ] Auto-correct timing drift
- [ ] Subsyncarr workflow integration

**Note:** Lower priority since Subsyncarr already handles this well.

---

## ✅ Completed Work

### Priority 6.5: Nova-3 Language Expansion Documentation ✅
**Completed:** 2025-11-07

Documentation of Nova-3's expanded language support with 11 new languages.

**Key Achievements:**
- Documented Nova-3 expansion to 26 total languages (from original 15)
- Added 11 new languages: Bulgarian, Czech, Finnish, Hindi, Hungarian, Japanese, Korean, Polish, Russian, Ukrainian, Vietnamese
- Covered linguistic improvements across Eastern Europe, South Asia, East Asia, and Southeast Asia
- Documented keyterm prompting availability for all new languages
- Recorded WER (Word Error Rate) improvements over Nova-2 for all new languages
- Added technical details about handling tonal languages, compound words, non-Latin scripts, and code-switching
- Positioned Nova-3 as ready for global multi-language expansion

**Language Coverage Impact:**
- **Eastern Europe/Eurasia:** Bulgarian, Czech, Hungarian, Polish, Russian, Ukrainian
- **Nordics/Baltics:** Finnish
- **South Asia:** Hindi
- **East Asia:** Japanese, Korean
- **Southeast Asia:** Vietnamese

**Technical Highlights:**
- Streaming mode shows strongest WER reductions (up to 27% improvement for Korean, Czech, Hindi)
- Native support for agglutinative languages (Hungarian, Finnish)
- Improved tonal language handling (Vietnamese)
- Better syllabic rhythm tracking (Japanese)
- Enhanced code-switching support (Hindi-English)

**Benefits:** Global reach expansion, better accuracy for non-Western languages, native handling of complex linguistic structures, keyterm prompting across all languages

---

### Priority 6: Documentation & Branding ✅
**Completed:** 2025-11-01

Complete project rebrand and documentation overhaul with user-focused story-driven approach.

**Key Achievements:**
- Rebranded project to "Subgeneratorr"
- Rewrote README with origin story (Bazarr gaps, Deepgram testing, LLM-powered keyterms)
- Created concise, Trailarr-inspired README structure
- Moved deep technical details to new `docs/technical.md` file
- Enhanced `.env.example` with clear LLM API key documentation
- Emphasized optional nature of LLM features
- Added disclaimer about project independence
- Targeted media enthusiasts who care about subtitle coverage and accessibility

**Benefits:** Clear project identity, story-driven documentation that connects with users, better documentation organization, complete setup instructions

---

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
