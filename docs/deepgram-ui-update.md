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

- [x] Enhance keyterm prompting UI for Nova-3
  - Add helpful tooltip/info about keyterm best practices
  - Display character/token count for keyterms (500 token limit)
  - Add examples of good keyterms (product names, technical jargon, proper nouns)
  - Warn against generic common words
  - Note: Keyterms can improve accuracy up to 90% for important terminology
  - Support up to 100 keyterms per request
  - **Status:** Completed - Changed to textarea, added real-time token counter with warnings, tooltip with best practices
  - **Best Practices:**
    - Industry-specific terminology (medical terms, technical jargon)
    - Product and company names (brands, services)
    - Multi-word phrases (account number, customer service)
    - Proper nouns with capitalization (Deepgram, iPhone, Dr. Smith)
    - Avoid: generic words (the, and), overly broad terms, excessive keyterms

- [x] Add detailed job progress display
  - Show individual file progress with status indicators
  - Display which file is currently processing
  - Show completed files with success/error states
  - Real-time progress updates for each file in the batch
  - Visual progress bar or percentage for overall batch completion
  - **Status:** Completed - Color-coded file status (green=completed, blue=processing, orange=skipped, red=error, gray=pending), shows processing stages (extracting audio, transcribing, generating subtitles)

- [x] Enhance media selection interface
  - Replace text input with folder browser dialogue for easier navigation
  - Add toggle to switch between:
    - "Videos without subtitles only" (default)
    - "All videos" (for use with force regenerate)
  - Show list of videos (NOT auto-selected by default)
  - Add "Select All" and "Deselect All" buttons for batch operations
  - Better visual feedback for selected/unselected files
  - Improve user control over file selection
  - **Status:** Completed - Interactive directory browser with folder navigation, shows videos AND audio files with subtitle status indicators (⚠️=missing, ✓=has subtitles), checkboxes for file selection (not auto-selected), "Show all videos" enabled by default

- [x] Remove model dropdown (hardcode to Nova-3)
  - Remove the model selection dropdown from UI
  - Hardcode model to "nova-3" in backend
  - Display "Model: Nova-3" as static text or remove entirely
  - Simplify UI since only one model is supported
  - **Status:** Completed - Model dropdown removed, displays "Nova-3 (Latest)" as static text, backend hardcoded to nova-3

- [x] Add time and cost estimation display
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
  - **Status:** Completed - "Calculate Estimates" button provides pre-job cost/time projections, uses ffprobe for duration extraction, displays total files/duration/cost/processing time

- [x] Setup NGINX reverse proxy and configure subdomain
  - **Status:** Completed - nginx configuration created and deployed
  - **Subdomain:** `deepgram.800801.online`
  - **Configuration File:** `/etc/nginx/sites-available/deepgram-subdomain`
  - **Features:**
    - HTTPS enforcement with SSL termination
    - Basic authentication for external access (local network bypass)
    - WebSocket support for real-time updates
    - Extended timeouts (600s) for transcription operations
    - Large file upload support (500MB max)
    - HTTP/2 enabled
  - **Port Mapping:** Container port 5000 → Host port 5000
  - **Access:** https://deepgram.800801.online (requires Basic Auth from external networks)

## Phase 2: Visual Design

- [ ] Update UI based on visual design document specifications @ /home/tyler/Desktop/visual-design-guide.md

- [ ] Implement center-aligned layout with switchable light/dark mode

## Phase 3: Live Streaming

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
- ✅ **All Phase 1 features completed and tested!**
  - Enhanced keyterm UI with real-time token counter
  - Detailed job progress display with color-coded status
  - Interactive directory browser with file selection
  - Model hardcoded to Nova-3
  - Time and cost estimation with ffprobe integration
  - Tested successfully with real transcription job (4.87s processing time)

### Key Technical Details
- Keyterm feature is Nova-3 model only (monolingual transcription)
- Keyterms limited to 500 tokens per request
- Case-sensitive formatting preserved for proper nouns
- Multiple keyterms supported (comma-delimited in UI, array in API)
- Directory browser supports both video and audio files (.mp3, .wav, .flac, .ogg, .opus, .m4a, .aac, .wma)
- File selection handles special characters in filenames (quotes, apostrophes)
- Real-time token estimation using ~1.3 tokens per word average
- Cost estimation uses Nova-3 pricing: $0.0043/minute
- Processing time estimate: ~10% of video duration (configurable)

### New API Endpoints
- `/api/browse` - Directory and file browsing with subtitle status
- `/api/estimate` - Pre-job cost and time estimation
- Enhanced `/api/job/<rid>` - Returns child task progress for detailed tracking

### Files Modified
- `web/templates/index.html` - Enhanced UI with directory browser, keyterm counter, estimates display
- `web/static/app.js` - File selection state management, directory navigation, progress display
- `web/app.py` - New browse and estimate endpoints, hardcoded Nova-3
- `web/tasks.py` - Task progress tracking with state updates
- `core/transcribe.py` - Added audio file support, video duration extraction