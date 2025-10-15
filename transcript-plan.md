
---

## Goal

Extend your current subtitle automation so it can optionally generate **speaker-labeled transcripts** (separate from SRT) using Deepgram, **but only when explicitly enabled**. Default behavior remains unchanged.

---

## Requirements

* Do **not** modify or interfere with existing `.srt` generation.
* Speaker transcript generation must be **OFF by default**.
* Can be enabled manually per-run.
* Support **speaker name mapping via CSV** (`speaker_id → character name`).
* Clean, maintainable, minimal integration.
* Running environment: **Linux + ffmpeg + jq + curl**.

---

## Deliverables

1. **New script**: `dg_transcript.sh` (Deepgram diarized transcript generator).
2. **Optional directory**: `speaker_maps/` for per-show speaker CSV files.
3. **Feature flag in main script** (`ENABLE_TRANSCRIPT` environment variable).
4. Updated main script with optional transcript block (disabled by default).

---

## Directory Layout

```
/home/<user>/mediaserver/scripts/
  ├─ generate_subtitles.sh          # your current script
  ├─ dg_transcript.sh               # new script to add
  └─ speaker_maps/                  # optional speaker map CSV storage
      ├─ Breaking Bad/speakers.csv
      └─ The Sopranos/speakers.csv
```

---

## Dependencies

Install if missing:

```bash
sudo apt install ffmpeg jq curl -y
```

Export Deepgram API key:

```bash
export DEEPGRAM_API_KEY="dg_xxx"
```

You can also add it permanently to:
`~/.bashrc`, `~/.profile`, or your `systemd` service env block.

---

## Step 1 – Add `dg_transcript.sh`

Copy the exact script from the previous message into:
/home/<user>/mediaserver/scripts/dg_transcript.sh
Then make executable:

```bash
chmod +x /home/<user>/mediaserver/scripts/dg_transcript.sh
```

---

## Step 2 – Speaker Map CSV (optional per show)

Location example:

```
/home/<user>/mediaserver/scripts/speaker_maps/Breaking Bad/speakers.csv
```

Format:

```
speaker_id,name
0,Walter
1,Jesse
2,Skyler
```

---

## Step 3 – Modify Subtitle Script With Optional Toggle

At the bottom of `generate_subtitles.sh`, right after `.srt` is created, add:

```bash
# ===== Optional Deepgram Transcript (disabled by default) =====
if [[ "${ENABLE_TRANSCRIPT:-0}" == "1" ]]; then
    echo "🗣️  Transcript feature enabled — generating diarized transcript..."

    SHOW_NAME="$(basename "$(dirname "$(dirname "$EPISODE_PATH")")")"
    MAP_BASE="/home/<user>/mediaserver/scripts/speaker_maps/${SHOW_NAME}"
    MAP_FILE=""

    if [[ -f "${MAP_BASE}/speakers.csv" ]]; then
        MAP_FILE="--map ${MAP_BASE}/speakers.csv"
    fi

    /home/<user>/mediaserver/scripts/dg_transcript.sh "$EPISODE_PATH" $MAP_FILE

else
    echo "🔇 Transcript disabled (use ENABLE_TRANSCRIPT=1 to enable)"
fi
```

✅ This ensures the transcript runs **only when enabled**.

---

## Step 4 – Usage

### Default behavior (unchanged):

```bash
./generate_subtitles.sh "/path/episode.mkv"
```

### Enable transcript manually per file:

```bash
ENABLE_TRANSCRIPT=1 ./generate_subtitles.sh "/path/episode.mkv"
```

### With speaker name mapping:

```bash
ENABLE_TRANSCRIPT=1 ./generate_subtitles.sh "/TV/Breaking Bad/S01E01.mkv"
```

Produces:

```
S01E01.srt                      ✅ (same as today)
S01E01.transcript.speakers.txt  ✅ (new)
S01E01.deepgram.json            (debug JSON)
```

---

## Acceptance Criteria

Feature is complete when:
✅ Subtitle script still produces `.srt` as usual
✅ Transcript generation is **optional**
✅ No transcript unless explicitly requested
✅ Errors do not break SRT pipeline
✅ Speaker CSV works per show

---

## Rollback Plan

Remove the new transcript block + delete `dg_transcript.sh`. Your SRT system continues unchanged.

---