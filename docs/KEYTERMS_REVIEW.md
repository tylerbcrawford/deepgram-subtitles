# Keyterms Feature - Comprehensive Review & Testing Guide

## Overview

The keyterms feature allows users to improve transcription accuracy by up to 90% for important terminology. This document provides a comprehensive review of the implementation, CSV format, and testing procedures.

## Implementation Summary

### Core Functionality (core/transcribe.py)

#### `load_keyterms_from_csv(video_path: Path) -> Optional[List[str]]`

**Purpose:** Load keyterms from CSV file associated with a video

**Logic:**
1. Determines the show/movie name from the video path
   - TV Shows: `/media/tv/Show Name/Season 01/episode.mkv` → "Show Name"
   - Movies: `/media/movies/Movie (2024)/movie.mkv` → "Movie (2024)"
2. Looks for CSV at: `Transcripts/Keyterms/{show_or_movie_name}_keyterms.csv`
3. Reads CSV line by line, skipping:
   - Empty lines
   - Lines starting with `#` (comments)
4. Returns list of keyterms or `None` if file doesn't exist

**Example:**
```python
video_path = Path("/media/tv/Breaking Bad/Season 01/S01E01.mkv")
keyterms = load_keyterms_from_csv(video_path)
# Returns: ['Walter White', 'Jesse Pinkman', 'Heisenberg', ...]
```

#### `save_keyterms_to_csv(video_path: Path, keyterms: List[str]) -> bool`

**Purpose:** Save keyterms to CSV file for reuse

**Logic:**
1. Determines show/movie name from video path (same as load)
2. Creates `Transcripts/Keyterms/` folder if it doesn't exist
3. Writes keyterms to CSV: `{show_or_movie_name}_keyterms.csv`
4. One keyterm per line, strips whitespace
5. Returns `True` on success, `False` on error

**Example:**
```python
video_path = Path("/media/tv/Breaking Bad/Season 01/S01E01.mkv")
keyterms = ['Walter White', 'Jesse Pinkman', 'Heisenberg']
save_keyterms_to_csv(video_path, keyterms)
# Creates: Transcripts/Keyterms/Breaking Bad_keyterms.csv
```

### CSV File Format

#### Format Specification

```csv
Walter White
Jesse Pinkman
Heisenberg
Los Pollos Hermanos
Albuquerque
methylamine
```

**Rules:**
- **Encoding:** UTF-8 (supports international characters)
- **Format:** One keyterm per line
- **No header:** File should NOT have a header row
- **Whitespace:** Leading/trailing spaces are automatically trimmed
- **Empty lines:** Ignored
- **Comments:** Lines starting with `#` are ignored
- **Case-sensitive:** Preserve proper capitalization (e.g., "iPhone" not "iphone")

#### Valid Examples

**Simple keyterms:**
```csv
Tony Soprano
Christopher Moltisanti
Bada Bing
```

**With comments:**
```csv
# Main characters
Tony Soprano
Christopher Moltisanti
# Locations
Bada Bing
Newark
```

**Mixed content:**
```csv
# Character names
Walter White
Jesse Pinkman

# Scientific terms
methylamine
pseudoephedrine

# Organizations
DEA
Los Pollos Hermanos
```

#### Invalid Examples

**❌ With header row (WRONG):**
```csv
keyterm
Walter White
Jesse Pinkman
```

**❌ Multiple columns (WRONG):**
```csv
Walter White,main character
Jesse Pinkman,main character
```

### CLI Implementation (cli/generate_subtitles.py)

**Auto-loading (Line 235-237):**
```python
# Auto-load keyterms from CSV if available
keyterms = load_keyterms_from_csv(video_path)
if keyterms:
    self.log(f"  📋 Auto-loaded {len(keyterms)} keyterms from CSV")
```

**Behavior:**
- Automatically loads keyterms before transcription
- No manual configuration needed
- Falls back to no keyterms if CSV doesn't exist
- Logs when keyterms are loaded

**CLI does NOT save keyterms** - only reads them

### Web UI Implementation

#### Frontend (web/static/app.js)

**Keyterms input (Line 574-579):**
```javascript
const keyTerms = document.getElementById('keyTerms').value.trim();
if (keyTerms) {
    requestBody.keyterms = keyTerms.split(',').map(t => t.trim()).filter(t => t.length > 0);
    // Auto-save keyterms whenever they are provided
    requestBody.auto_save_keyterms = true;
}
```

**Behavior:**
1. Gets comma-separated keyterms from text input
2. Splits by comma, trims whitespace, filters empty strings
3. Automatically sets `auto_save_keyterms = true` when keyterms are provided
4. User does NOT need to check a separate "save" checkbox

**Template (web/templates/index.html):**
```html
<label for="keyTerms">Keyterm Prompting (optional)</label>
<input type="text" id="keyTerms" placeholder="e.g., Deepgram, iPhone, customer service">
<small>Keyterms are auto-loaded and auto-saved from CSV if available</small>
```

#### Backend (web/app.py)

**API endpoint (Line 272-274):**
```python
keyterms = body.get("keyterms")
save_raw_json = body.get("save_raw_json", False)
auto_save_keyterms = body.get("auto_save_keyterms", False)
```

**Passes to worker:**
```python
async_result = make_batch(
    files, model, language,
    profanity_filter=profanity_filter,
    force_regenerate=force_regenerate,
    enable_transcript=enable_transcript,
    speaker_map=speaker_map,
    keyterms=keyterms,
    save_raw_json=save_raw_json,
    auto_save_keyterms=auto_save_keyterms
)
```

#### Worker (web/tasks.py)

**Auto-load (Line 118-122):**
```python
# Auto-load keyterms from CSV if no keyterms provided
if not keyterms:
    csv_keyterms = load_keyterms_from_csv(vp)
    if csv_keyterms:
        keyterms = csv_keyterms
        print(f"Auto-loaded {len(keyterms)} keyterms from CSV")
```

**Auto-save (Line 152-159):**
```python
# Save keyterms to CSV if enabled and keyterms were provided
if auto_save_keyterms and keyterms:
    self.update_state(state='PROGRESS', meta={'current_file': vp.name, 'stage': 'saving_keyterms'})
    try:
        if save_keyterms_to_csv(vp, keyterms):
            print(f"Saved {len(keyterms)} keyterms to CSV")
    except Exception as e:
        print(f"Warning: Failed to save keyterms: {e}")
```

**Behavior:**
1. If no keyterms provided in request, auto-loads from CSV
2. Transcribes with keyterms (if available)
3. After successful transcription, saves keyterms to CSV (if auto_save_keyterms is true)
4. Saves happen AFTER transcription, not before
5. Non-blocking - errors don't fail the transcription

## Testing Procedures

### Test 1: CSV Format Reading

**Objective:** Verify correct CSV parsing

**Setup:**
```bash
mkdir -p /media/tv/Test\ Show/Season\ 01/Transcripts/Keyterms/
cat > /media/tv/Test\ Show/Season\ 01/Transcripts/Keyterms/Test\ Show_keyterms.csv << 'EOF'
# Main characters
Alice Anderson
Bob Brown

# Technical terms
API
microservice

# Empty lines and trailing spaces test
Charlie Chan  

EOF
```

**Test:**
```python
from pathlib import Path
from core.transcribe import load_keyterms_from_csv

video = Path("/media/tv/Test Show/Season 01/episode.mkv")
keyterms = load_keyterms_from_csv(video)
print(f"Loaded keyterms: {keyterms}")
```

**Expected Result:**
```python
['Alice Anderson', 'Bob Brown', 'API', 'microservice', 'Charlie Chan']
```

**Pass Criteria:**
- Comments are ignored
- Empty lines are ignored
- Trailing spaces are trimmed
- Order is preserved

### Test 2: CLI Auto-Loading

**Objective:** Verify CLI automatically loads keyterms

**Setup:**
1. Create keyterms CSV as in Test 1
2. Place a test video in `/media/tv/Test Show/Season 01/`

**Test:**
```bash
docker compose run --rm \
  -e MEDIA_PATH="/media/tv/Test Show/Season 01" \
  -e BATCH_SIZE=1 \
  deepgram-cli
```

**Expected Output:**
```
🎬 Processing: episode.mkv
  📋 Auto-loaded 5 keyterms from CSV
  ⏱️  Duration: 5.2 min | Cost: $0.02
  📢 Extracting audio...
  🧠 Transcribing (nova-3)...
```

**Pass Criteria:**
- Log message shows "Auto-loaded X keyterms from CSV"
- Number matches keyterms in file
- Transcription completes successfully

### Test 3: Web UI Manual Entry + Auto-Save

**Objective:** Verify Web UI saves keyterms when transcribe is pressed

**Setup:**
1. Start Web UI services
2. Navigate to a show without existing keyterms CSV

**Test Steps:**
1. Select a video file
2. Enter in keyterms field: `Alice, Bob, Charlie, API`
3. Click "Transcribe"
4. Wait for completion
5. Check filesystem for CSV file

**Verification:**
```bash
cat /media/tv/YourShow/Season\ 01/Transcripts/Keyterms/YourShow_keyterms.csv
```

**Expected CSV Content:**
```csv
Alice
Bob
Charlie
API
```

**Pass Criteria:**
- CSV file is created in correct location
- Filename matches show name
- Each keyterm on separate line
- Comma-separated input properly parsed
- Whitespace properly trimmed

### Test 4: Web UI Auto-Load from CSV

**Objective:** Verify Web UI loads existing keyterms

**Setup:**
1. Create keyterms CSV manually
2. Browse to directory in Web UI

**Test:**
1. Navigate to show directory with existing keyterms CSV
2. Select a video
3. Check if keyterms appear in input field

**Expected:**
- Keyterms should NOT auto-populate in the input field (by design)
- But they WILL be auto-loaded during transcription if input is empty
- This allows users to override or add to existing keyterms

**Verification:**
Check worker logs for "Auto-loaded X keyterms from CSV"

### Test 5: Unicode Character Support

**Objective:** Verify UTF-8 encoding support

**Setup:**
```bash
cat > /media/tv/Test/Transcripts/Keyterms/Test_keyterms.csv << 'EOF'
François
Müller
北京
日本語
Ñoño
EOF
```

**Test:**
Process a video with these keyterms

**Expected:**
- All characters preserved correctly
- No encoding errors
- Keyterms passed correctly to Deepgram API

### Test 6: Show Name Extraction

**Objective:** Verify correct show name parsing from paths

**Test Cases:**

| Video Path | Expected CSV Name |
|------------|-------------------|
| `/media/tv/Breaking Bad/S01/ep.mkv` | `Breaking Bad_keyterms.csv` |
| `/media/tv/The Office (US)/Season 01/ep.mkv` | `The Office (US)_keyterms.csv` |
| `/media/movies/Inception (2010)/movie.mkv` | `Inception (2010)_keyterms.csv` |
| `/media/tv/Show/Season 1/ep.mkv` | `Show_keyterms.csv` |

**Test:**
```python
from pathlib import Path
from core.transcribe import save_keyterms_to_csv

for path, expected in test_cases:
    video = Path(path)
    save_keyterms_to_csv(video, ['test'])
    # Check if correct CSV was created
```

### Test 7: Keyterms Reuse Across Episodes

**Objective:** Verify same keyterms file used for all episodes

**Setup:**
1. Process Episode 1 with keyterms in Web UI
2. Verify CSV created
3. Process Episode 2 (leave keyterms field empty)
4. Check that Episode 2 used same CSV

**Expected Behavior:**
- Episode 1: Creates CSV with entered keyterms
- Episode 2: Auto-loads keyterms from CSV created by Episode 1
- Both episodes use same keyterms

**Verification:**
Check worker logs for both episodes:
```
Episode 1: (no auto-load message, saves to CSV)
Episode 2: Auto-loaded X keyterms from CSV
```

### Test 8: API Endpoints

**Objective:** Test upload/download API endpoints

**Upload Test:**
```bash
# Create test CSV
cat > test_keyterms.csv << 'EOF'
Test1
Test2
Test3
EOF

# Upload
curl -X POST http://localhost:5000/api/keyterms/upload \
  -F "file=@test_keyterms.csv" \
  -F "video_path=/media/tv/Show/episode.mkv"
```

**Download Test:**
```bash
curl "http://localhost:5000/api/keyterms/download?video_path=/media/tv/Show/episode.mkv" \
  -o downloaded_keyterms.csv

# Verify contents
cat downloaded_keyterms.csv
```

**Pass Criteria:**
- Upload returns success
- Downloaded file matches uploaded file
- CSV created in correct location

## Common Issues & Solutions

### Issue 1: Keyterms Not Loading

**Symptoms:**
- No "Auto-loaded" message in logs
- Transcription runs without keyterms

**Diagnosis:**
1. Check CSV exists: `ls Transcripts/Keyterms/*.csv`
2. Verify filename matches show name exactly
3. Check file permissions (readable)
4. Verify UTF-8 encoding

**Solution:**
```bash
# Check file exists and is readable
cat Transcripts/Keyterms/"Show Name_keyterms.csv"

# Fix permissions
chmod 644 Transcripts/Keyterms/*.csv

# Verify encoding
file Transcripts/Keyterms/*.csv
# Should show: UTF-8 Unicode text
```

### Issue 2: Keyterms Not Saving from Web UI

**Symptoms:**
- Enter keyterms in Web UI
- Transcription completes
- No CSV file created

**Diagnosis:**
1. Check worker logs for save message
2. Verify write permissions on media directory
3. Check if `Transcripts/` folder exists

**Solution:**
```bash
# Check permissions
ls -la /media/tv/Show/

# Create folder with correct permissions
mkdir -p /media/tv/Show/Transcripts/Keyterms/
chmod 755 /media/tv/Show/Transcripts/Keyterms/
```

### Issue 3: Wrong Filename Generated

**Symptoms:**
- CSV created with incorrect show name
- Example: `Season 01_keyterms.csv` instead of `Show Name_keyterms.csv`

**Cause:**
Video path doesn't match expected structure

**Solution:**
Ensure media is organized correctly:
```
/media/tv/Show Name/Season 01/episode.mkv  ✓ Correct
/media/tv/Season 01/episode.mkv            ✗ Wrong (missing show name)
```

### Issue 4: Keyterms Not Improving Accuracy

**Symptoms:**
- Keyterms loaded successfully
- No improvement in transcription accuracy

**Diagnosis:**
1. Verify using Nova-3 model (keyterms only work with Nova-3)
2. Check language is monolingual (not `multi`)
3. Count keyterms (should be 20-50, not 200+)
4. Verify keyterms are specific enough

**Solution:**
- Use Nova-3 model (default)
- Set language to single code: `en`, not `multi`
- Reduce keyterm count if too many
- Make keyterms more specific (full names vs first names)

## Feature Limitations

1. **Model:** Only works with Nova-3 (Nova-2 doesn't support keyterms)
2. **Language:** Only works with monolingual transcription (single language code)
3. **Token Limit:** Maximum 500 tokens (~400 words) per request
4. **CSV Format:** Simple format only (no multi-column CSVs)
5. **Sharing:** One CSV per show/movie (not per episode)

## Conclusion

The keyterms feature is fully implemented and working as designed:

✅ **CSV Reading:** Both CLI and Web UI auto-load from CSV
✅ **CSV Writing:** Web UI auto-saves when transcribe is pressed with keyterms
✅ **Format:** Simple one-term-per-line CSV with comment support
✅ **Location:** Stored alongside media in `Transcripts/Keyterms/`
✅ **Reusability:** Shared across all episodes of a show
✅ **API:** Upload/download endpoints available

The feature requires no manual configuration and works automatically once CSV files are in place.