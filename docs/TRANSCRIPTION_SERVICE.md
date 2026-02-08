# Transcription Service Implementation Summary

This document describes the transcription service implementation using faster-whisper (Python).

## Overview

The transcription service uses **faster-whisper**, a Python implementation of OpenAI's Whisper model. It's more memory-efficient and faster than the original Whisper implementation.

## Architecture

The Node.js server calls a Python script (`transcribe.py`) as a child process. The Python script handles:
- Loading the Whisper model
- Processing audio files
- Returning JSON output with the transcript

This approach provides better reliability and easier maintenance than native Node.js bindings.

## Prerequisites

### 1. Python 3.8+ Required

Install Python if not already available:
```bash
# Fedora/RHEL
sudo dnf install python3 python3-pip

# Ubuntu/Debian
sudo apt install python3 python3-pip

# macOS
brew install python3
```

### 2. Install faster-whisper

```bash
# Install faster-whisper and dependencies
pip install faster-whisper

# Or with pip3
pip3 install faster-whisper

# Or in a virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate
pip install faster-whisper
```

### 3. Verify Installation

```bash
python3 transcribe.py --help
```

## What Was Implemented

### Database Schema Updates
- Added `transcriptProgress` field (0-100) for tracking transcription progress
- Added `errorMessage` field for storing error details
- Added `transcriptionModel` field to track which model was used

### New Files Created

#### `transcribe.py`
Python script that:
- Uses faster-whisper to transcribe audio
- Accepts command-line arguments for file path, model, language
- Outputs JSON with transcript, language, and duration
- Handles errors gracefully

#### `src/types/transcription.types.ts`
TypeScript types for the transcription system

#### `src/services/transcription.service.ts`
Service that:
- Spawns Python processes for transcription
- Parses JSON output
- Updates database with results
- Handles errors

#### `src/services/jobQueue.service.ts`
In-memory job queue for managing transcription jobs

#### `src/worker.ts`
Background worker that polls the queue and processes jobs

### Modified Files

- `src/controllers/recordingController.ts` - Queue jobs on upload
- `src/index.ts` - Auto-start worker with graceful shutdown
- `src/db/schema.ts` - Added transcription fields
- `.env.example` - Added configuration variables

## Environment Configuration

Add these variables to your `.env` file:

```env
# Transcription Service (faster-whisper)
WHISPER_MODEL_NAME=base                    # Model: tiny, base, small, medium, large-v1, large-v2, large-v3
TRANSCRIPTION_WORKER_ENABLED=true          # Enable/disable worker
TRANSCRIPTION_WORKER_INTERVAL_MS=2000      # Polling interval in milliseconds
PYTHON_PATH=python3                        # Optional: Path to Python executable
```

### Available Models

- `tiny` - Fastest, least accurate (~39M params)
- `base` - Good balance (~74M params) - **Recommended for MVP**
- `small` - Better accuracy (~244M params)
- `medium` - Even better (~769M params)
- `large-v1` - Best accuracy (v1) (~1.5B params)
- `large-v2` - Best accuracy (v2) (~1.5B params)
- `large-v3` - Best accuracy (v3) (~1.5B params)

Models are automatically downloaded to `~/.cache/huggingface/hub/` on first use.

## How It Works

### Data Flow

1. User uploads audio file via `POST /api/recordings/`
2. File is saved to disk
3. Recording created with `status: "pending"`
4. Recording ID added to job queue
5. Background worker picks up job
6. Node.js spawns Python process: `python3 transcribe.py <file_path>`
7. Python script loads faster-whisper model
8. Audio is transcribed
9. Python outputs JSON with transcript
10. Node.js parses JSON and saves to database
11. Status updated to `"done"` or `"error"`

### Recording Status Lifecycle

- `pending` - Awaiting transcription
- `recording` - Currently being transcribed
- `done` - Transcription complete
- `error` - Transcription failed (see `errorMessage` field)
- `deleted` - Soft deleted

## Testing

### 1. Manual Test of Python Script

```bash
# Test the Python script directly
python3 transcribe.py /path/to/audio.mp3 --model base

# Should output JSON like:
# {"success": true, "transcript": "...", "language": "en", "duration": 10.5}
```

### 2. Test Full Integration

1. Start the server: `npm run dev`
2. The worker will initialize automatically (check logs)
3. Upload an audio file via the API
4. Monitor the recording status changes:
   - Initially: `status: "pending"`
   - Then: `status: "recording"`
   - Finally: `status: "done"` or `"error"`

### Example API Call

```bash
curl -X POST http://localhost:5000/api/recordings/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=Test Recording" \
  -F "file=@/path/to/audio.mp3"
```

## Troubleshooting

### "python3: command not found"
**Solution**: Install Python or set `PYTHON_PATH` in `.env` to your Python executable:
```env
PYTHON_PATH=/usr/bin/python3.9
```

### "faster-whisper not installed"
**Solution**: Install faster-whisper:
```bash
pip install faster-whisper
```

### Worker fails to start
**Solution**: Check if Python and faster-whisper are installed:
```bash
python3 --version
python3 -c "import faster_whisper; print('OK')"
```

### Transcription stuck at "pending"
**Solution**:
- Check if worker is enabled: `TRANSCRIPTION_WORKER_ENABLED=true`
- Check server logs for worker initialization errors
- Verify `transcribe.py` exists in project root

### Transcription fails with "error" status
**Solution**:
- Check the `errorMessage` field in the recording
- Verify audio file format is supported (mp3, wav, mp4, webm, etc.)
- Check server logs for Python script errors
- Ensure sufficient disk space for model download

### Model download is slow
**Solution**: Models are cached after first download. To use a custom model path:
```env
WHISPER_MODEL_PATH=/path/to/models
```

### Out of memory errors
**Solution**: Use a smaller model:
```env
WHISPER_MODEL_NAME=tiny  # or base
```

## Performance Considerations

### Model Selection
- **tiny/base**: Suitable for real-time or batch processing on modest hardware
- **small/medium**: Better accuracy but slower and more memory intensive
- **large-v*: Best accuracy but requires significant RAM and CPU

### Hardware Acceleration
faster-whisper supports GPU acceleration. To enable, modify `transcribe.py`:
```python
model = WhisperModel(
    model_name,
    device="cuda",  # Use "cuda" for NVIDIA GPU
    compute_type="float16"  # Use float16 on GPU
)
```

### Concurrency
The MVP processes one transcription at a time. For multiple concurrent transcriptions, modify the worker to use a pool of workers.

## Limitations (MVP)

1. **No persistent job queue** - Jobs are lost on server restart
2. **No retry mechanism** - Failed transcriptions stay in error state
3. **No concurrent processing** - One transcription at a time
4. **No real-time progress updates** - Progress field exists but no WebSocket/SSE
5. **No audio transcoding** - Unsupported formats will fail
6. **CPU-bound** - No GPU acceleration by default

## Future Enhancements

1. **Persistent Queue**: Replace in-memory queue with BullMQ + Redis
2. **Retry Logic**: Automatically retry failed transcriptions
3. **Concurrent Processing**: Process multiple transcriptions in parallel
4. **Real-time Updates**: Add WebSocket or SSE for progress updates
5. **Audio Transcoding**: Convert unsupported formats automatically with ffmpeg
6. **GPU Acceleration**: Enable CUDA for faster processing
7. **Speaker Diarization**: Identify different speakers
8. **Language Selection**: Explicit language selection vs auto-detection
9. **Health Monitoring**: Add endpoint to check worker status
10. **Priority Queue**: Prioritize important recordings

## Migration from whisper-node

If you previously tried using `whisper-node`:

1. ✅ Uninstalled: `npm uninstall whisper-node`
2. ✅ Removed type declarations
3. ✅ Rewrote transcription service to use Python
4. ✅ Created `transcribe.py` script

No database changes needed - the schema is the same!

## Security Considerations

- The Python script accepts file paths as arguments - ensure uploads are validated
- Transcription runs as the same user as the Node.js process
- Consider running Python in a sandbox or container for production
- Set file permissions on `transcribe.py` to prevent modification

## License Notes

- faster-whisper is MIT licensed
- Whisper models are released under MIT license
- This transcription service implementation follows the same license
