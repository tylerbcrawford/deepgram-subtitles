# Deepgram UI Update Plan

## Phase 1: Feature Updates

- [x] Add all language options to dropdown menu
  - Include full language names (e.g., English, French, Spanish, etc.)
  - Set English as the default language
  - **Status:** Completed - Added 29 Deepgram-supported languages with regional variants

- [x] Enable transcript generation option
  - Add subsection for optional speaker map names input
  - Add input field for custom key terms (Nova-3 model)
  - **Status:** Completed - Collapsible section with speaker map and key terms inputs, backend generates .txt files with speaker labels

- [x] Add checkbox for force regenerate option
  - **Status:** Completed - Checkbox added with backend logic to overwrite existing subtitles

- [x] Add job cancellation functionality
  - **Status:** Completed (Bonus Feature) - Cancel button for in-progress jobs with REVOKED state handling

- [ ] Enhance keyterm prompting UI for Nova-3
  - Add helpful tooltip/info about keyterm best practices
  - Display character/token count for keyterms (500 token limit)
  - Add examples of good keyterms (product names, technical jargon, proper nouns)
  - Warn against generic common words
  - Note: Keyterms can improve accuracy up to 90% for important terminology
  - Support up to 100 keyterms per request
  - **Best Practices:**
    - Industry-specific terminology (medical terms, technical jargon)
    - Product and company names (brands, services)
    - Multi-word phrases (account number, customer service)
    - Proper nouns with capitalization (Deepgram, iPhone, Dr. Smith)
    - Avoid: generic words (the, and), overly broad terms, excessive keyterms

- [ ] Add detailed job progress display
  - Show individual file progress with status indicators
  - Display which file is currently processing
  - Show completed files with success/error states
  - Real-time progress updates for each file in the batch
  - Visual progress bar or percentage for overall batch completion

- [ ] Enhance media selection interface
  - Replace text input with folder browser dialogue for easier navigation
  - Add toggle to switch between:
    - "Videos without subtitles only" (default)
    - "All videos" (for use with force regenerate)
  - Show list of videos (NOT auto-selected by default)
  - Add "Select All" and "Deselect All" buttons for batch operations
  - Better visual feedback for selected/unselected files
  - Improve user control over file selection

- [ ] Add time and cost estimation display
  - **Pre-job estimates** (before starting transcription):
    - Estimated cost per video based on duration
    - Estimated total cost for selected batch
    - Estimated time to complete entire batch
    - Estimated time per video
  - **During-job tracking** (while processing):
    - Total time remaining for batch completion
    - Current video processing time
    - Real-time cost accumulation
    - Average time per video (updated as processing)
  - Use Nova-3 pricing: $0.0043 per minute of audio
  - Extract video duration metadata for accurate estimates

- [ ] Setup NGINX reverse proxy and configure subdomain

## Phase 2: Visual Design & Live Streaming

- [ ] Update UI based on visual design document specifications @ /home/tyler/Desktop/visual-design-guide.md

- [ ] Implement center-aligned layout with switchable light/dark mode

- [ ] Configure real-time streaming support
  - Setup for in-person transcription
  - Enable live translation capabilities

---

## Implementation Notes

### Phase 1 Completion Status
- ✅ Core features implemented and tested (language dropdown, transcript generation, force regenerate, job cancellation)
- ✅ Backend fully functional with new parameters (force_regenerate, enable_transcript, speaker_map, key_terms)
- ✅ Fixed critical docker volume permissions issue (removed :ro flag from worker media mount)
- ✅ Task routing configured correctly to transcribe queue
- ✅ Verified working: Transcription jobs processing successfully with subtitle file generation
- 🔄 In Progress: Enhanced keyterm UI and detailed progress tracking

### Key Technical Details
- Keyterm feature is Nova-3 model only (monolingual transcription)
- Keyterms limited to 500 tokens per request
- Case-sensitive formatting preserved for proper nouns
- Multiple keyterms supported (space-delimited or repeated parameter)