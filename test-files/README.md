# Test Files

This directory contains sample files used for testing the file upload functionality.

## sample-audio.mp3
A minimal test file for recording upload tests. For proper testing, replace this with an actual audio file.

To create a real test file:
```bash
# On Linux with ffmpeg installed
ffmpeg -f lavfi -i sine=frequency=1000:duration=5 -c:a mp3 -b:a 64k sample-audio.mp3
```
