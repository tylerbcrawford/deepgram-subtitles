# Speaker Maps

This directory stores speaker mapping files for shows and movies that enable character name labeling in generated transcripts.

## Directory Structure

Organize speaker maps by show/movie name:

```
speaker_maps/
├── Breaking Bad/
│   └── speakers.csv
├── The Sopranos/
│   └── speakers.csv
└── Movie Title (2024)/
    └── speakers.csv
```

## CSV Format

Each `speakers.csv` file should follow this format:

```csv
speaker_id,name
0,Walter
1,Jesse
2,Skyler
3,Hank
```

- **speaker_id**: The numeric ID assigned by Deepgram (0, 1, 2, etc.)
- **name**: The character/speaker name to display in the transcript

## How to Create Speaker Maps

1. Generate a transcript without a speaker map first to see the speaker IDs
2. Create a directory matching your show/movie name
3. Create a `speakers.csv` file with the mappings
4. Reprocess with `ENABLE_TRANSCRIPT=1` to apply the mappings

## Example Speaker Map

For a show called "The Office":

```bash
mkdir -p speaker_maps/"The Office"
```

Create `speaker_maps/The Office/speakers.csv`:

```csv
speaker_id,name
0,Michael Scott
1,Jim Halpert
2,Pam Beesly
3,Dwight Schrute
```

## Notes

- Speaker IDs are assigned based on voice characteristics
- IDs may vary between episodes
- You may need to adjust mappings per season or episode range
- The directory name must match the show/movie directory name in your media library