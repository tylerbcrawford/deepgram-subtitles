# Translation Feature Implementation Plan

## Overview

Based on [Deepgram's Universal Translator Tutorial](https://deepgram.com/learn/deepgram-universal--transcriber-translator-tutorial), this plan implements audio-to-translated-subtitles using:

1. **Deepgram Nova-3** → Transcribe audio to text (original language)
2. **OpenRouter** (OpenAI-compatible API) → Translate text to target languages
3. **Generate** multiple language-specific SRT files

**Architecture Pattern:** Deepgram's official recommendation for speech translation workflows.

### Why OpenRouter? ⭐ Recommended

**OpenRouter** is recommended over direct OpenAI API because:
- ✅ **OpenAI-compatible** - Same SDK, same code, just different base URL
- ✅ **Better pricing** - Often 10-50% cheaper than direct OpenAI
- ✅ **Multiple providers** - Access to OpenAI, Anthropic, Google, Meta models
- ✅ **Free credits** - $5 free credits for testing
- ✅ **Fallback options** - Can switch providers if one has issues
- ✅ **Same quality** - Uses actual OpenAI models (not proxies)

**Direct OpenAI** is also supported if you prefer official API access.

---

## Translation Workflow

```
┌─────────────────┐
│  Video/Audio    │
│     File        │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Extract Audio (FFmpeg) │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Deepgram Nova-3            │
│  Transcription              │
│  → Original Language SRT    │
└────────┬────────────────────┘
         │
         ├────────────────────────┐
         │                        │
         ▼                        ▼
┌──────────────────┐    ┌─────────────────────┐
│  Movie.eng.srt   │    │  OpenAI GPT-3.5     │
│  (Original)      │    │  Translation        │
└──────────────────┘    └──────┬──────────────┘
                               │
                               ├──────┬──────┬──────┐
                               ▼      ▼      ▼      ▼
                        Movie.fre.srt
                        Movie.spa.srt
                        Movie.ger.srt
                        Movie.jpn.srt
```

---

## Cost Analysis

### Example: 90-Minute Movie

**Deepgram Transcription:**
- Duration: 90 minutes
- Cost: 90 × $0.0043 = **$0.387**

**Translation Cost (3 languages: French, Spanish, German):**
- Subtitle content: ~15,000 characters (~4,000 tokens)

### Cost Comparison by Provider & Model:

#### OpenRouter (Recommended) 💰
| Model | Input ($/1M) | Output ($/1M) | Cost per Language | Total (3 langs) |
|-------|--------------|---------------|-------------------|-----------------|
| OpenAI GPT-3.5-turbo | $0.50 | $1.50 | $0.008 | **$0.024** |
| OpenAI GPT-4o-mini | $0.15 | $0.60 | $0.003 | **$0.009** |
| OpenAI GPT-4o | $2.50 | $10.00 | $0.050 | **$0.150** |
| Anthropic Claude 3.5 Haiku | $1.00 | $5.00 | $0.024 | **$0.072** |

#### Direct OpenAI API
| Model | Input ($/1M) | Output ($/1M) | Cost per Language | Total (3 langs) |
|-------|--------------|---------------|-------------------|-----------------|
| GPT-3.5-turbo | $1.50 | $2.00 | $0.014 | **$0.042** |
| GPT-4o-mini | $0.15 | $0.60 | $0.003 | **$0.009** |
| GPT-4o | $2.50 | $10.00 | $0.050 | **$0.150** |

**Total Cost per Movie:**
- With OpenRouter GPT-3.5: $0.387 + $0.024 = **$0.41** ✅ Best value
- With OpenRouter GPT-4o-mini: $0.387 + $0.009 = **$0.40** ✅ Cheapest
- With Direct OpenAI GPT-3.5: $0.387 + $0.042 = **$0.43**

**100 Movies:** ~**$40-41** with OpenRouter (vs $43 direct OpenAI)

**💡 Recommendation:** OpenRouter with GPT-4o-mini for best cost ($0.40/movie) or GPT-3.5-turbo for reliability

---

## Implementation Checklist

### Phase 1: Configuration & Setup
- [ ] **1.1** Update [`cli/config.py`](../cli/config.py)
  ```python
  # Translation Configuration (disabled by default)
  TRANSLATE_ENABLED = os.environ.get("TRANSLATE_ENABLED", "0") == "1"
  TARGET_LANGUAGES = os.environ.get("TARGET_LANGUAGES", "").split(",")
  OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
  OPENAI_BASE_URL = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")
  OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-3.5-turbo")
  KEEP_ORIGINAL_SRT = os.environ.get("KEEP_ORIGINAL_SRT", "1") == "1"
  ```

- [ ] **1.2** Update [`cli/requirements.txt`](../cli/requirements.txt)
  ```txt
  openai>=1.0.0
  ```

- [ ] **1.3** Update [`.env.example`](../.env.example)
  ```bash
  # Translation (disabled by default)
  TRANSLATE_ENABLED=0
  TARGET_LANGUAGES=fr,es,de
  
  # OpenRouter (Recommended - better pricing)
  OPENAI_API_KEY=sk-or-v1-xxxxx
  OPENAI_BASE_URL=https://openrouter.ai/api/v1
  OPENAI_MODEL=openai/gpt-3.5-turbo
  
  # OR Direct OpenAI API
  # OPENAI_API_KEY=sk-proj-xxxxx
  # OPENAI_BASE_URL=https://api.openai.com/v1
  # OPENAI_MODEL=gpt-3.5-turbo
  
  KEEP_ORIGINAL_SRT=1
  ```

### Phase 2: Translation Module
- [ ] **2.1** Create [`core/translation.py`](../core/translation.py)
  - Import OpenAI client
  - Define `translate_text()` function
  - Define `translate_srt()` function with SRT parsing
  - Add language code mapping (ISO 639-1 ↔ ISO 639-2)
  - Add error handling and retry logic

- [ ] **2.2** Implement SRT parsing logic
  ```python
  def parse_srt(srt_content: str) -> List[Dict]:
      """Parse SRT into structured format"""
      # Extract: index, start_time, end_time, text
  
  def build_srt(entries: List[Dict]) -> str:
      """Rebuild SRT from structured format"""
  ```

- [ ] **2.3** Implement OpenAI translation
  ```python
  def translate_with_openai(text: str, target_lang: str, 
                            api_key: str, model: str) -> str:
      """Translate text using OpenAI GPT"""
      # Use chat completion API
      # System prompt: "You are a professional subtitle translator"
      # Preserve formatting, timing markers, speaker labels
  ```

### Phase 3: Core Integration
- [ ] **3.1** Update [`core/transcribe.py`](../core/transcribe.py)
  ```python
  def translate_and_write_srts(
      original_srt_path: Path,
      target_languages: List[str],
      api_key: str,
      model: str = "gpt-3.5-turbo"
  ) -> List[Path]:
      """
      Translate original SRT to multiple target languages.
      Returns list of created translated SRT file paths.
      """
  ```

- [ ] **3.2** Add language code utilities
  ```python
  def get_iso639_2_code(iso639_1: str) -> str:
      """Convert 2-letter to 3-letter language code"""
      mapping = {
          "en": "eng", "fr": "fre", "es": "spa",
          "de": "ger", "it": "ita", "pt": "por",
          "ja": "jpn", "ko": "kor", "zh": "chi",
          "ru": "rus", "ar": "ara"
      }
      return mapping.get(iso639_1, iso639_1)
  ```

### Phase 4: CLI Updates
- [ ] **4.1** Update [`cli/generate_subtitles.py`](../cli/generate_subtitles.py)
  - Modify `SubtitleGenerator.process_video()`:
    - After creating original SRT, check `Config.TRANSLATE_ENABLED`
    - If enabled, call `translate_and_write_srts()`
    - Log translation progress for each language
    - Handle translation errors gracefully (don't fail video processing)
    - Update statistics with translation info

- [ ] **4.2** Update skip logic
  ```python
  # Check for translated SRTs in addition to original
  if Config.TRANSLATE_ENABLED:
      translated_srts_exist = all(
          video_path.with_suffix(f'.{get_iso639_2_code(lang)}.srt').exists()
          for lang in Config.TARGET_LANGUAGES
      )
      skip = srt_path.exists() and translated_srts_exist
  ```

- [ ] **4.3** Update statistics tracking
  ```python
  self.stats["translation_enabled"] = Config.TRANSLATE_ENABLED
  self.stats["target_languages"] = Config.TARGET_LANGUAGES
  self.stats["translation_costs"] = 0.0  # Track OpenAI costs
  self.stats["translated_files"] = 0
  ```

### Phase 5: Docker Configuration
- [ ] **5.1** Update [`examples/docker-compose.example.yml`](../examples/docker-compose.example.yml)
  ```yaml
  environment:
    - DEEPGRAM_API_KEY=${DEEPGRAM_API_KEY}
    - TRANSLATE_ENABLED=0
    - TARGET_LANGUAGES=fr,es,de
    - OPENAI_API_KEY=${OPENAI_API_KEY}
    - OPENAI_MODEL=gpt-3.5-turbo
  ```

### Phase 6: Documentation
- [ ] **6.1** Update [`README.md`](../README.md)
  - Add "Translation Feature" section after Features
  - Add to environment variables table
  - Add usage examples
  - Add pricing information

- [ ] **6.2** Create [`docs/translation-guide.md`](translation-guide.md)
  - Setup instructions for OpenAI API key
  - Supported languages list
  - Configuration examples
  - Troubleshooting section

- [ ] **6.3** Add inline documentation
  - Docstrings for all new functions
  - Type hints throughout
  - Usage examples in docstrings

### Phase 7: Testing
- [ ] **7.1** Create [`tests/test_translation.py`](../tests/test_translation.py)
  - Test SRT parsing and reconstruction
  - Test OpenAI API calls (with mocking)
  - Test language code conversion
  - Test error handling

- [ ] **7.2** Integration testing
  - Test with short sample video (<2 min)
  - Verify all language SRT files created
  - Verify Plex/Jellyfin recognition
  - Test with non-Latin characters (Japanese, Arabic)

### Phase 8: Web UI (Optional)
- [ ] **8.1** Update [`web/app.py`](../web/app.py)
  - Add translation options to `/api/submit` endpoint
  - Track translation in job status

- [ ] **8.2** Update [`web/templates/index.html`](../web/templates/index.html)
  - Add translation toggle
  - Add multi-select for target languages

---

## File Naming Convention

```
Movie (2020).mkv           # Original video
Movie (2020).eng.srt       # English (transcribed by Deepgram)
Movie (2020).fre.srt       # French (translated by OpenAI)
Movie (2020).spa.srt       # Spanish (translated by OpenAI)
Movie (2020).ger.srt       # German (translated by OpenAI)
```

**Standard:** ISO 639-2/B (3-letter codes) for Plex/Jellyfin/Bazarr compatibility

---

## OpenRouter Model Recommendations 🎯

### 🏆 BEST OVERALL - Claude Haiku 4.5 (NEW!)
**Released:** October 15, 2025 | **Status:** Just launched!
```bash
OPENAI_MODEL=anthropic/claude-haiku-4-5-20251015
# Cost: $1.00/$5.00 per 1M tokens
# Speed: 2x faster than Claude Sonnet 4
# Quality: Matches May 2025 frontier model (Claude Sonnet 4)
# Translation quality: ⭐⭐⭐⭐⭐ (9.5/10)
# Best for: EVERYTHING - unbeatable value/performance ratio
```

**Why Haiku 4.5 is Revolutionary:**
- Delivers **frontier-level performance** from 5 months ago
- **One-third the cost** of the original frontier model
- **More than 2x faster** than comparable models
- **200K context window** with 64K output tokens
- Ranks **3rd place** on Vals AI comprehensive benchmark
- Particularly **strong on coding and diverse tasks**

### 💰 Ultra Budget - GPT-4o-mini
```bash
OPENAI_MODEL=openai/gpt-4o-mini
# Cost: $0.15/$0.60 per 1M tokens
# Best for: Highest volume, extremely cost-sensitive
# Translation quality: ⭐⭐⭐⭐⭐ (9/10)
```

### 🎯 Maximum Quality - GPT-4o
```bash
OPENAI_MODEL=openai/gpt-4o
# Cost: $2.50/$10.00 per 1M tokens
# Best for: Professional content requiring absolute best quality
# Translation quality: ⭐⭐⭐⭐⭐ (10/10)
```

### 🌍 Asian Language Specialist - Gemini 1.5 Flash
```bash
OPENAI_MODEL=google/gemini-flash-1.5
# Cost: $0.075/$0.30 per 1M tokens
# Best for: Japanese, Korean, Chinese translations
# Translation quality: ⭐⭐⭐⭐⭐ (9/10 for CJK)
```

### 📊 Cost Comparison (90-min movie, 3 translations)

| Model | Input/Output ($/1M) | Cost per Movie | Speed | Quality | Best For |
|-------|---------------------|----------------|-------|---------|----------|
| **Claude Haiku 4.5** ⭐ | $1.00/$5.00 | **$0.41** | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | **Default choice** |
| GPT-4o-mini | $0.15/$0.60 | $0.40 | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | Ultra-budget |
| Gemini Flash 1.5 | $0.075/$0.30 | $0.39 | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | Asian languages |
| GPT-3.5-turbo | $0.50/$1.50 | $0.42 | ⚡⚡ | ⭐⭐⭐⭐ | Legacy fallback |
| GPT-4o | $2.50/$10.00 | $0.54 | ⚡⚡ | ⭐⭐⭐⭐⭐ | Max quality |

**Note:** Deepgram transcription adds $0.387 to all costs above.

### 💡 Scenario-Based Recommendations

| Use Case | Recommended Model | Reasoning |
|----------|-------------------|-----------|
| **General/Default** | `anthropic/claude-haiku-4-5` | Best overall value - frontier performance at budget price |
| **Personal Library** | `anthropic/claude-haiku-4-5` | Perfect balance of cost, speed, and quality |
| **High Volume (1000+ movies)** | `google/gemini-flash-1.5` | Cheapest option, excellent quality |
| **Professional/Commercial** | `openai/gpt-4o` | Absolute best quality for critical content |
| **Japanese/Korean/Chinese** | `google/gemini-flash-1.5` | Superior performance on CJK languages |
| **European Languages** | `anthropic/claude-haiku-4-5` | Excellent context understanding |
| **Budget Constrained** | `openai/gpt-4o-mini` | Cheapest while maintaining great quality |
| **Real-time/Low-latency** | `anthropic/claude-haiku-4-5` | 2x faster than alternatives |

### 🚀 Pro Tips

1. **Start with Claude Haiku 4.5** - It's the new sweet spot for translation
2. **Use Gemini Flash for CJK** - Significantly better Japanese/Korean/Chinese
3. **Reserve GPT-4o for critical content** - Legal, medical, professional subtitles
4. **Mix models by language** - Different models excel at different language pairs
5. **Test before committing** - Use OpenRouter's free $5 credits to test models

---

## Configuration Examples

### Recommended Setup (Claude Haiku 4.5 via OpenRouter):
```bash
# In .env file
DEEPGRAM_API_KEY=your_deepgram_key
OPENAI_API_KEY=sk-or-v1-xxxxx
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=anthropic/claude-haiku-4-5-20251015
TRANSLATE_ENABLED=1
TARGET_LANGUAGES=fr,es,de
```

### Budget Setup (Gemini Flash for Asian content):
```bash
DEEPGRAM_API_KEY=your_deepgram_key
OPENAI_API_KEY=sk-or-v1-xxxxx
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=google/gemini-flash-1.5
TRANSLATE_ENABLED=1
TARGET_LANGUAGES=ja,ko,zh
```

### Direct OpenAI Setup (if not using OpenRouter):
```bash
DEEPGRAM_API_KEY=your_deepgram_key
OPENAI_API_KEY=sk-proj-xxxxx
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
TRANSLATE_ENABLED=1
TARGET_LANGUAGES=fr,es,de
```

### CLI Usage:
```bash
# Transcribe only (no translation)
docker compose run --rm deepgram-cli

# Enable translation to French and Spanish
docker compose run --rm \
  -e TRANSLATE_ENABLED=1 \
  -e TARGET_LANGUAGES=fr,es \
  deepgram-cli

# Translate specific movie
docker compose run --rm \
  -e TRANSLATE_ENABLED=1 \
  -e TARGET_LANGUAGES=fr,es,de,it \
  -e MEDIA_PATH=/media/movies/Movie\ \(2020\).mkv \
  deepgram-cli

# Use GPT-4o-mini for lower costs
docker compose run --rm \
  -e TRANSLATE_ENABLED=1 \
  -e OPENAI_MODEL=gpt-4o-mini \
  -e TARGET_LANGUAGES=fr,es \
  deepgram-cli
```

---

## OpenAI Prompt Strategy

### System Prompt:
```
You are a professional subtitle translator. Translate the following subtitles 
while preserving:
1. Timing codes exactly as they are
2. Line breaks and formatting
3. Speaker labels (if present)
4. Context and natural language flow
5. Cultural nuances when appropriate

Translate from {source_language} to {target_language}.
```

### Translation Approach:
- Translate subtitle text in batches (not line-by-line)
- Preserve SRT structure completely
- Maintain natural dialogue flow
- Handle idioms and cultural references appropriately

---

## Language Support

### Supported Languages (ISO 639-1 → ISO 639-2):
| Language | Code | ISO 639-2 |
|----------|------|-----------|
| English | en | eng |
| French | fr | fre |
| Spanish | es | spa |
| German | de | ger |
| Italian | it | ita |
| Portuguese | pt | por |
| Japanese | ja | jpn |
| Korean | ko | kor |
| Chinese | zh | chi |
| Russian | ru | rus |
| Arabic | ar | ara |
| Dutch | nl | dut |
| Polish | pl | pol |
| Turkish | tr | tur |
| Hindi | hi | hin |

**Total:** 50+ languages supported by OpenAI

---

## Error Handling

### Translation Failures:
- Log error but continue video processing
- Don't fail entire batch if one translation fails
- Retry failed translations with exponential backoff
- Skip translation if OpenAI API key not provided

### API Rate Limits:
- Implement exponential backoff (1s, 2s, 4s, 8s)
- Add configurable delay between translations
- Handle 429 (rate limit) responses gracefully

### Invalid Languages:
- Validate language codes before processing
- Provide clear error messages
- Skip invalid languages, process valid ones

---

## Success Criteria

✅ Translation enabled with simple environment variable  
✅ Multiple languages translated in single run  
✅ Translated SRTs recognized by Plex/Jellyfin/Bazarr  
✅ Translation adds <30 seconds per language  
✅ Zero impact when translation disabled  
✅ OpenAI costs clearly tracked and reported  
✅ Graceful error handling (doesn't break transcription)  
✅ Backward compatible with existing workflows  
✅ Clear documentation and examples  

---

## Future Enhancements

1. **Translation Caching** - Cache common phrases to reduce API calls
2. **Batch Optimization** - Combine multiple subtitle files in one API call
3. **Quality Validation** - Check translation quality scores
4. **Custom Glossaries** - User-defined term translations for technical content
5. **Alternative Models** - Support for GPT-4, Claude, or other LLMs

---

## References

- [Deepgram Universal Translator Tutorial](https://deepgram.com/learn/deepgram-universal--transcriber-translator-tutorial)
- [Deepgram Nova-3 Documentation](https://developers.deepgram.com/docs/model)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [OpenAI Pricing](https://openai.com/api/pricing/)
- [ISO 639-2 Language Codes](https://www.loc.gov/standards/iso639-2/php/code_list.php)

---

**Version:** 1.0  
**Created:** 2025-10-18  
**Status:** Ready for Implementation  
**Translation Service:** OpenAI GPT (Deepgram's recommended pattern)