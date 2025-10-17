# Implementation Guide: Embedded Subtitle Detection

## Overview
This guide explains how to add detection of embedded subtitles in video files to provide users with more accurate information about which videos need subtitle generation.

## Prerequisites
- FFmpeg/FFprobe must be installed in the Docker container
- Python subprocess module (already available)
- Basic understanding of the current codebase structure

## Implementation Steps

### Step 1: Add Helper Function to `core/transcribe.py`

Add this function after the existing utility functions:

```python
def has_embedded_subtitles(video_path: Path) -> bool:
    """
    Check if a video file has embedded subtitle streams.
    
    Args:
        video_path: Path to the video file
        
    Returns:
        True if the video has embedded subtitles, False otherwise
    """
    import subprocess
    import json
    
    try:
        # Run ffprobe to get stream information
        result = subprocess.run(
            [
                'ffprobe',
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_streams',
                str(video_path)
            ],
            capture_output=True,
            text=True,
            timeout=5  # 5 second timeout per file
        )
        
        if result.returncode != 0:
            return False
            
        # Parse JSON output
        data = json.loads(result.stdout)
        streams = data.get('streams', [])
        
        # Check if any stream is a subtitle stream
        for stream in streams:
            if stream.get('codec_type') == 'subtitle':
                return True
                
        return False
        
    except (subprocess.TimeoutExpired, json.JSONDecodeError, Exception) as e:
        # Log error but don't crash - just assume no embedded subtitles
        print(f"Error checking embedded subtitles for {video_path}: {e}")
        return False
```

### Step 2: Update the `api_browse` Function in `web/app.py`

Modify the file iteration to include embedded subtitle detection:

```python
@app.get("/api/browse")
def api_browse():
    # ... existing code ...
    
    try:
        for item in sorted(path.iterdir()):
            if item.is_dir() and not item.name.startswith('.'):
                # ... existing directory code ...
            elif item.is_file() and is_media(item):
                has_srt = item.with_suffix(".srt").exists()
                has_embedded = has_embedded_subtitles(item) if not has_srt else False
                
                # Only include if showing all OR needs subtitles
                if show_all or (not has_srt and not has_embedded):
                    files.append({
                        "name": item.name,
                        "path": str(item),
                        "has_subtitles": has_srt,
                        "has_embedded_subtitles": has_embedded
                    })
    except PermissionError:
        abort(403, "Permission denied")
    
    # ... rest of function ...
```

### Step 3: Update JavaScript in `web/static/app.js`

Modify the `browseDirectories` function to handle the new status:

```javascript
// In the browseDirectories function, update the file rendering section:

data.files.forEach((file, index) => {
    const isSelected = selectedFiles.includes(file.path);
    let statusIcon;
    let statusTitle;
    
    if (file.has_subtitles) {
        statusIcon = '<span style="color: #4aff8e; font-size: 1.1em;" title="Has .srt subtitles">✓</span>';
        statusTitle = 'Has .srt subtitles';
    } else if (file.has_embedded_subtitles) {
        statusIcon = '<span style="color: #ffa500; font-size: 1.1em;" title="Has embedded subtitles">🎬</span>';
        statusTitle = 'Has embedded subtitles';
    } else {
        statusIcon = '<span style="color: #ff9a4a; font-size: 1.1em;" title="Missing subtitles">⚠️</span>';
        statusTitle = 'Missing subtitles';
    }
    
    // ... rest of file item rendering ...
});
```

### Step 4: Update the Legend in `web/templates/index.html`

Update the emoji legend to include the new status:

```html
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
    <div style="color: #888; font-size: 0.9em;">
        ⚠️ = Missing subtitles | 🎬 = Embedded subtitles | ✓ = Has .srt file
    </div>
    <!-- ... Select All / Select None links ... -->
</div>
```

### Step 5: Performance Optimization (Optional but Recommended)

Add caching to avoid re-checking files repeatedly:

```python
# In web/app.py, add at the top after imports:
from functools import lru_cache
from datetime import datetime

# Create a cache that expires
_subtitle_cache = {}
_cache_ttl = 300  # 5 minutes

def has_embedded_subtitles_cached(video_path: Path) -> bool:
    """Cached version of embedded subtitle detection."""
    path_str = str(video_path)
    current_time = datetime.now().timestamp()
    
    # Check if we have a cached result that's still valid
    if path_str in _subtitle_cache:
        cached_time, cached_result = _subtitle_cache[path_str]
        if current_time - cached_time < _cache_ttl:
            return cached_result
    
    # Get fresh result
    result = has_embedded_subtitles(video_path)
    _subtitle_cache[path_str] = (current_time, result)
    
    return result
```

Then use `has_embedded_subtitles_cached()` instead of `has_embedded_subtitles()` in the browse endpoint.

## Testing

1. **Test with video without subtitles:**
   - Should show ⚠️ icon

2. **Test with video with .srt file:**
   - Should show ✓ icon
   - Should NOT check for embedded subtitles (optimization)

3. **Test with video with embedded subtitles:**
   - Should show 🎬 icon

4. **Test performance:**
   - Browse a directory with 50+ videos
   - Should complete within reasonable time (< 10 seconds)

5. **Test error handling:**
   - Try with corrupted video file
   - Should not crash, just show ⚠️

## Dockerfile Updates

Ensure FFmpeg is installed in your Docker container. Add to `deepgram-subtitles/Dockerfile` or `web/Dockerfile`:

```dockerfile
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
```

## Performance Considerations

- **Initial directory scan:** May take 1-2 seconds per 10 videos
- **Caching:** Reduces repeat checks to near-instant
- **Timeout:** 5 seconds per file prevents hanging on corrupt files
- **Async option:** For very large directories (100+ files), consider async checking

## Future Enhancements

1. **Subtitle language detection:** Parse subtitle stream metadata to show language
2. **Multiple subtitle tracks:** Show count of available subtitle tracks
3. **Background processing:** Check subtitles in the background after initial directory load
4. **Database caching:** Store results in SQLite for persistence across restarts

## Rollback Plan

If issues arise, simply:
1. Remove the `has_embedded_subtitles()` function from `core/transcribe.py`
2. Revert the changes in `web/app.py` to not call the function
3. Revert the JavaScript changes to use 2 states instead of 3
4. Update the legend back to 2 icons

## Questions?

Key decision points:
- **Performance vs Accuracy:** Do you want to check every file or only on-demand?
- **Caching Strategy:** Memory cache (current session) or persistent (SQLite)?
- **User Preference:** Should users be able to toggle this feature on/off?

---

**Estimated Implementation Time:** 1-2 hours including testing
**Complexity:** Moderate
**Risk Level:** Low (isolated changes, easy to rollback)