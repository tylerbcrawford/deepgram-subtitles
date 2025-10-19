# Deepgram Nova-3 Implementation Review & Recommendations

**Date:** 2025-10-19  
**Project:** deepgram-subtitles  
**Reviewed Model:** Nova-3 (Deepgram's flagship speech-to-text model)  
**Use Case:** Movie and TV Show Subtitle Generation

---

## Executive Summary

This project successfully implements Deepgram's Nova-3 model for subtitle generation. The codebase is well-structured with good separation of concerns (core, CLI, Web UI). However, there are several opportunities to leverage Nova-3-specific features and best practices that could improve accuracy and functionality for movie and TV content.

**Overall Assessment:** ✅ Good foundation with room for optimization

---

## ✅ What's Working Well

### 1. **Correct Model Selection**
- ✅ Using Nova-3 (hardcoded in [`cli/config.py:30`](cli/config.py:30))
- ✅ Accurate pricing configured ($0.0043/minute)
- ✅ Proper model specification in all API calls

### 2. **Core Functionality**
- ✅ Smart format enabled (essential for Nova-3)
- ✅ Utterances support for natural conversation flow
- ✅ Punctuation and capitalization
- ✅ Speaker diarization with name mapping
- ✅ Multi-language support (29 languages)
- ✅ Proper error handling and logging

### 3. **Architecture**
- ✅ Shared core module ([`core/transcribe.py`](core/transcribe.py)) for reusability
- ✅ Separate CLI and Web UI implementations
- ✅ Docker-based deployment for consistency
- ✅ Celery workers for background processing
- ✅ Proper file organization and structure

### 4. **Features**
- ✅ Force regeneration support
- ✅ Batch processing
- ✅ Transcript generation with speaker labels
- ✅ Cost tracking and estimation
- ✅ Bazarr integration
- ✅ Subsyncarr integration (auto-removes sync markers)

---

## 🔧 Critical Issues to Fix

### 1. **Incorrect Keyterm Implementation**

**Issue:** Using `keywords` parameter instead of `keyterm` (Nova-3 specific feature)

**Current Code:** [`core/transcribe.py:143-144`](core/transcribe.py:143-144)
```python
# Add keywords if provided (Nova-3 feature)
if keywords and model == "nova-3":
    opts.keywords = keywords
```

**Problem:** 
- `keywords` is the old/general parameter
- `keyterm` is Nova-3's powerful new feature with up to 90% accuracy improvement
- Current implementation won't provide the advertised benefits for character names, show-specific terms, etc.

**Fix Required:**
```python
# Add keyterms if provided (Nova-3 feature - monolingual only)
if keywords and model == "nova-3":
    opts.keyterm = keywords  # Changed from opts.keywords
```

**Movie/TV Use Cases:**
- Character names (e.g., "Heisenberg", "Daenerys", "Chandler")
- Show-specific terminology (e.g., "TARDIS", "Vibranium", "Muggle")
- Location names (e.g., "Westeros", "Gotham", "Hogwarts")
- Proper nouns that might be misheard

**Impact:** 🔴 HIGH - This affects accuracy for character names and show-specific terminology

**Locations to Update:**
1. [`core/transcribe.py:143-144`](core/transcribe.py:143-144) - Core transcription function
2. [`web/tasks.py:126`](web/tasks.py:126) - Web task handler (uses `keywords` parameter)
3. Update parameter names throughout: `keywords` → `keyterms` for consistency

---

### 2. **Missing Nova-3 Best Practice Parameters**

**Issue:** Not using all recommended Nova-3 parameters

**Current Implementation:** [`core/transcribe.py:132-140`](core/transcribe.py:132-140)
```python
opts = PrerecordedOptions(
    model=model,
    smart_format=True,
    utterances=True,
    punctuate=True,
    diarize=diarize,
    language=language,
    profanity_filter=profanity_filter
)
```

**Recommended Nova-3 Configuration:**
```python
opts = PrerecordedOptions(
    model=model,
    smart_format=True,
    utterances=True,
    punctuate=True,
    paragraphs=True,        # NEW: Better text segmentation for Nova-3
    timestamps=True,        # NEW: Always get word-level timestamps
    diarize=diarize,
    language=language,
    profanity_filter=profanity_filter,
    filler_words=False      # OPTIONAL: Usually off for subtitle clarity
)
```

**Benefits:**
- `paragraphs`: Improves readability by splitting into logical paragraphs
- `timestamps`: Essential for accurate subtitle timing (word-level)
- `filler_words`: Typically disabled for subtitles (cleaner text)

**Impact:** 🟡 MEDIUM - Improves output quality but not critical

**Locations to Update:**
1. [`core/transcribe.py:132-140`](core/transcribe.py:132-140)
2. [`cli/generate_subtitles.py:121-131`](cli/generate_subtitles.py:121-131)

---

### 3. **Inconsistent Parameter Usage**

**Issue:** CLI implementation differs from core implementation

**CLI Code:** [`cli/generate_subtitles.py:121-131`](cli/generate_subtitles.py:121-131)
```python
options = PrerecordedOptions(
    model=Config.MODEL,
    smart_format=True,
    utterances=True,
    punctuate=True,
    paragraphs=True,        # ✅ Has this
    timestamps=True,         # ✅ Has this
    diarize=enable_diarization,
    language=Config.LANGUAGE,
    profanity_filter=Config.PROFANITY_FILTER
)
```

**Core Code:** [`core/transcribe.py:132-140`](core/transcribe.py:132-140)
```python
opts = PrerecordedOptions(
    model=model,
    smart_format=True,
    utterances=True,
    punctuate=True,
    diarize=diarize,        # ❌ Missing paragraphs
    language=language,       # ❌ Missing timestamps
    profanity_filter=profanity_filter
)
```

**Fix:** Standardize parameters across both implementations

**Impact:** 🟡 MEDIUM - Consistency and maintainability issue

---

## 💡 Enhancement Opportunities

### 1. **Add Numerals Formatting**

**Feature:** Convert written numbers to numeric format

**Example:**
- Input: "twenty twenty four"
- Output: "2024"
- Input: "three hundred"
- Output: "300"

**Implementation:**
```python
opts = PrerecordedOptions(
    # ... existing options ...
    numerals=True
)
```

**Movie/TV Use Cases:**
- Years and dates
- Episode numbers
- Addresses and room numbers
- Quantities

**Impact:** 🟢 LOW - Improves readability for numeric content

---

### 2. **Add Filler Words Control**

**Feature:** Optionally transcribe filler words (uh, um, etc.)

**Implementation:**
```python
# Add to .env
FILLER_WORDS = os.environ.get("FILLER_WORDS", "0") == "1"

# In transcription options
opts = PrerecordedOptions(
    # ... existing options ...
    filler_words=FILLER_WORDS
)
```

**Use Cases:**
- Natural dialogue in interviews/documentaries
- Character authenticity in dramatic scenes
- **Default OFF** for cleaner subtitle text

**Impact:** 🟢 LOW - Optional feature, usually disabled for subtitles

---

### 3. **Add Language Auto-Detection**

**Feature:** Automatically detect spoken language

**Implementation:**
```python
# For multilingual content
opts = PrerecordedOptions(
    # ... existing options ...
    detect_language=True
)
```

**Movie/TV Use Cases:**
- International films with mixed languages
- Shows with multilingual dialogue
- Foreign films without specified language

**Impact:** 🟢 LOW - Optional enhancement for international content

---

## 📋 Implementation Status

### Phase 1: Critical Fixes ✅ COMPLETED (2025-10-19)
1. ✅ **FIXED** `keywords` → `keyterm` parameter in [`core/transcribe.py:144`](core/transcribe.py:144)
2. ✅ **ADDED** `paragraphs=True` and `timestamps=True` to [`core/transcribe.py`](core/transcribe.py)
3. ✅ **STANDARDIZED** parameters between CLI and core implementations
4. ✅ **UPDATED** [`web/tasks.py:126`](web/tasks.py:126) to use `keyterms` parameter

**Changes Applied:**
- Changed function signature from `keywords` to `keyterms`
- Updated parameter assignment from `opts.keywords` to `opts.keyterm`
- Added missing Nova-3 recommended parameters
- Ensured consistency across all implementations

### Phase 2: Quality Enhancements (Future) 🎯
4. Add `numerals` parameter (better date/number formatting)
5. Add `filler_words` toggle (optional, default off)
6. Add language auto-detection (for international content)

---

## 🔍 Code Quality Observations

### Strengths
- ✅ Good separation of concerns
- ✅ Comprehensive error handling
- ✅ Detailed logging and cost tracking
- ✅ Well-documented functions
- ✅ Type hints in newer code
- ✅ Clean Docker setup
- ✅ Subsyncarr integration (removes sync markers)

### Areas for Improvement
- ⚠️ Parameter naming inconsistency (keywords vs keyterms)
- ⚠️ Duplicate code between CLI and Web implementations
- ⚠️ Could benefit from more unit tests

---

## 📊 Performance Considerations

### Current Performance
- ✅ Efficient batch processing
- ✅ Parallel worker support (Celery)
- ✅ Smart skipping of processed files
- ✅ Reasonable cost estimation
- ✅ Bazarr integration for automatic rescanning

### Optimization Opportunities
1. **Caching:** Consider caching audio extraction results
2. **Worker Scaling:** Document optimal worker concurrency settings
3. **Error Recovery:** Add retry logic for transient API failures

---

## 🛡️ Security & Best Practices

### Current Security
- ✅ API key stored in environment variables
- ✅ Path validation in Web UI
- ✅ Read-only media mounts where appropriate
- ✅ OAuth integration support

### Recommendations
1. Add rate limiting to Web API
2. Implement request timeouts
3. Add input validation for keyterms (token limit: 500)
4. Consider API key rotation support

---

## 📝 Documentation Updates Needed

1. **Update README.md:**
   - Clarify `keyterm` vs `keywords` difference
   - Add examples of good keyterms for movies/TV
   - Document new parameters (paragraphs, numerals, etc.)

2. **Update .env.example:**
   - Add `FILLER_WORDS` option
   - Add `NUMERALS` option
   - Clarify keyterm usage for character names

3. **Add Examples:**
   - Example keyterm lists for popular shows
   - Common character names that get misheard

---

## 🧪 Testing Recommendations

### Test Coverage Needed
1. Unit tests for [`core/transcribe.py`](core/transcribe.py)
2. Integration tests for keyterm handling
3. Web API endpoint tests
4. Speaker diarization accuracy tests

### Test Data
- Test with shows that have unique character names
- Test multilingual content (e.g., foreign films)
- Test edge cases (silent videos, corrupted audio)

---

## 🎯 Action Items Status

### Critical Fixes ✅ COMPLETED (2025-10-19)
- [x] Changed `keywords` to `keyterm` in [`core/transcribe.py:144`](core/transcribe.py:144)
- [x] Added `paragraphs=True` to [`core/transcribe.py:137`](core/transcribe.py:137)
- [x] Added `timestamps=True` to [`core/transcribe.py:138`](core/transcribe.py:138)
- [x] Updated parameter name in [`web/tasks.py:126`](web/tasks.py:126)
- [x] Reviewed and analyzed codebase with Context7 and Exa MCP tools

### Next Steps (Post-Beta)
- [ ] Test with sample videos to verify accuracy improvements
- [ ] Update README keyterm section with TV/movie examples
- [ ] Add Nova-3 best practices section to documentation
- [ ] Compare output quality with/without new parameters
- [ ] Add unit tests for keyterm handling

---

## 📈 Expected Improvements

After implementing recommended changes:

1. **Accuracy:** Up to 90% improvement for character names and show-specific terms (via keyterm)
2. **Readability:** Better paragraph segmentation for longer dialogue
3. **Timing:** More accurate word-level timestamps for subtitle sync
4. **Quality:** Better numeric and date formatting
5. **Consistency:** Unified implementation across CLI and Web UI

---

## 💡 Example Keyterm Lists for Popular Shows

### Breaking Bad
```python
keyterms = ["Heisenberg", "Saul Goodman", "Gus Fring", "Los Pollos Hermanos", 
            "methylamine", "Albuquerque", "DEA"]
```

### Game of Thrones
```python
keyterms = ["Westeros", "Daenerys Targaryen", "Jon Snow", "King's Landing", 
            "White Walkers", "Khaleesi", "Winterfell", "Stark", "Lannister"]
```

### The Office
```python
keyterms = ["Dunder Mifflin", "Scranton", "Michael Scott", "Dwight Schrute",
            "Pam Beesly", "Jim Halpert"]
```

**Pro Tip:** Focus on names that are easily misheard or unique to the show!

---

## 🔗 Useful Resources

1. [Nova-3 Model Documentation](https://developers.deepgram.com/docs/models-languages-overview#nova-3)
2. [Keyterm Prompting Guide](https://developers.deepgram.com/docs/keyterm)
3. [Python SDK Reference](https://github.com/deepgram/deepgram-python-sdk)
4. [Best Practices Guide](https://developers.deepgram.com/docs/best-practices)

---

## 💬 Summary

This is a **well-implemented project** that successfully uses Deepgram Nova-3 for movie and TV subtitle generation. The main opportunities for improvement are:

1. **Fix the keyterm parameter** (critical for character name accuracy)
2. **Add missing Nova-3 parameters** (paragraphs, timestamps)
3. **Standardize implementations** (CLI vs core)
4. **Add numerals formatting** (better date/number handling)

Implementing these changes will provide better accuracy for character names and show-specific terminology, while maintaining the current excellent architecture and functionality.

**Recommended Next Steps:**
1. Apply critical fixes (Phase 1) - Focus on keyterm fix first
2. Test improvements with real TV/movie content
3. Document changes with examples
4. Consider quality enhancements based on results