# Transcription Service Setup Guide

Your transcription service can run in **two modes**:

## 🐳 Docker Mode (Recommended for Development)

**Advantages:**
- ✅ No Python installation needed
- ✅ Isolated dependencies
- ✅ Same environment as production
- ✅ Easy to set up

### Quick Start (3 commands)

```bash
# 1. Run the setup script
./setup-transcription-docker.sh

# 2. Add to your .env file
echo "USE_DOCKER_FOR_TRANSCRIPTION=true" >> .env

# 3. Start your server
npm run dev
```

That's it! Your uploads will be automatically transcribed.

### What the Script Does

- Checks if Docker is installed
- Creates `zorilla-network` Docker network
- Builds the transcription container
- Starts it in the background
- Verifies it's running

### Manual Docker Setup

```bash
# Create network
docker network create zorilla-network

# Build and start
docker compose -f docker compose.transcription.yml up -d

# Verify it's running
docker ps | grep zorilla-transcription
```

### Docker Commands

```bash
# View logs
docker logs -f zorilla-transcription

# Stop container
docker compose -f docker compose.transcription.yml down

# Restart
docker compose -f docker compose.transcription.yml restart

# Test transcription
docker exec zorilla-transcription python3 /app/transcribe.py --help
```

---

## 🐍 Local Python Mode (Alternative)

**Use this if:**
- You don't want to use Docker
- You're comfortable with Python
- You want faster transcription (no Docker overhead)

### Setup

```bash
# 1. Install pip (if needed)
sudo dnf install python3-pip

# 2. Install faster-whisper
pip3 install faster-whisper

# 3. Make sure .env does NOT have USE_DOCKER_FOR_TRANSCRIPTION=true
# (or leave it unset)

# 4. Start server
npm run dev
```

---

## 🔧 Configuration

### Environment Variables

Add to your `.env`:

```env
# Transcription Service
USE_DOCKER_FOR_TRANSCRIPTION=true          # Use Docker (true) or local Python (false/unset)
DOCKER_TRANSCRIPTION_CONTAINER=zorilla-transcription  # Container name

WHISPER_MODEL_NAME=base                    # Model: tiny, base, small, medium, large-v1, large-v2, large-v3
TRANSCRIPTION_WORKER_ENABLED=true          # Enable/disable worker
TRANSCRIPTION_WORKER_INTERVAL_MS=2000      # Polling interval (milliseconds)
```

### Model Selection

- `tiny` - Fastest, ~39M params, good for quick tests
- `base` - **Recommended**, ~74M params, good balance
- `small` - Better accuracy, ~244M params
- `medium` - Even better, ~769M params
- `large-v1/v2/v3` - Best accuracy, ~1.5B params

Models are auto-downloaded on first use.

---

## 📊 How It Works

### Architecture (Docker Mode)

```
User uploads audio
    ↓
Node.js saves file to disk
    ↓
Recording created (status: "pending")
    ↓
Added to job queue
    ↓
Worker picks up job
    ↓
Node.js runs: docker exec zorilla-transcription python3 transcribe.py /audio/path
    ↓
Container transcribes with faster-whisper
    ↓
Returns transcript as JSON
    ↓
Node.js saves to database
    ↓
Status updated to "done"
```

### Recording Status Flow

1. **pending** - Awaiting transcription
2. **recording** - Currently being transcribed
3. **done** - Transcription complete
4. **error** - Something went wrong (check `errorMessage` field)

---

## 🧪 Testing

### 1. Test Docker Container

```bash
docker exec zorilla-transcription python3 /app/transcribe.py --help
```

### 2. Test Full Flow

```bash
# Start server
npm run dev

# Upload a file (you'll need a valid JWT token)
curl -X POST http://localhost:5000/api/recordings/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Test" \
  -F "file=@test-audio.mp3"

# Check the recording (it should show status changing)
curl http://localhost:5000/api/recordings/RECORDING_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Monitor Logs

```bash
# Server logs
npm run dev

# Transcription container logs
docker logs -f zorilla-transcription
```

---

## 🚀 Production Deployment

### Option 1: Use Pre-built Image from GHCR

```bash
# Pull image
docker pull ghcr.io/YOUR_USERNAME/zorilla-transcription:latest

# Run container
docker run -d --name zorilla-transcription \
  -v /path/to/zorilla/data:/audio:ro \
  --network zorilla-network \
  ghcr.io/YOUR_USERNAME/zorilla-transcription:latest \
  tail -f /dev/null
```

### Option 2: Build Locally

```bash
docker build -f Dockerfile.transcription -t zorilla-transcription:prod .
docker run -d --name zorilla-transcription \
  -v /path/to/zorilla/data:/audio:ro \
  --network zorilla-network \
  zorilla-transcription:prod \
  tail -f /dev/null
```

### GitHub Actions (CI/CD)

The `.github/workflows/transcription.yml` workflow automatically builds and pushes to GHCR when you push to `main`.

**To enable:**
1. Update workflow with your GitHub username
2. Repository Settings → Actions → General → Workflow permissions → "Read and write permissions"
3. Push to `main`

---

## 📚 Documentation

- **`DOCKER_TRANSCRIPTION.md`** - Detailed Docker setup guide
- **`TRANSCRIPTION_SERVICE.md`** - Full transcription service documentation
- **`transcribe.py`** - Python script source (well-commented)

---

## ❓ Troubleshooting

### "Docker not available"

```bash
# Install Docker
sudo dnf install docker
sudo systemctl start docker
sudo usermod -aG docker $USER
# Log out and back in
```

### "Container not running"

```bash
# Check status
docker ps -a | grep zorilla-transcription

# View logs
docker logs zorilla-transcription

# Restart
docker compose -f docker compose.transcription.yml restart
```

### "faster-whisper not installed" (local mode)

```bash
pip3 install faster-whisper
```

### Transcription stuck at "pending"

```bash
# Check worker is enabled in .env
grep TRANSCRIPTION_WORKER_ENABLED .env

# Check server logs for errors
# Check container logs
docker logs zorilla-transcription
```

### "Permission denied" on audio files

```bash
# Ensure data directory exists with proper permissions
mkdir -p data
chmod 755 data
```

---

## 🎯 Quick Decision Guide

| Your Situation | Recommended Mode |
|----------------|------------------|
| Local development | **Docker** |
| Quick testing | **Docker** |
| Production deployment | **Docker (GHCR image)** |
| No Docker available | **Local Python** |
| Want to avoid overhead | **Local Python** |

---

## 🔄 Switching Modes

Simply change your `.env` file:

```bash
# Switch to Docker
sed -i 's/USE_DOCKER_FOR_TRANSCRIPTION=false/USE_DOCKER_FOR_TRANSCRIPTION=true/' .env

# Switch to Local Python
sed -i 's/USE_DOCKER_FOR_TRANSCRIPTION=true/USE_DOCKER_FOR_TRANSCRIPTION=false/' .env
# or just remove the line

# Restart server
npm run dev
```

---

## ✅ Verification

You'll know it's working when you see:

**Docker Mode:**
```
Server is running on port 5000
✓ Transcription service initialized (using Docker container: zorilla-transcription)
✓ Transcription worker started successfully
```

**Local Python Mode:**
```
Server is running on port 5000
✓ Transcription service initialized (using local Python)
✓ Transcription worker started successfully
```

Upload an audio file and watch the status change from `pending` → `recording` → `done`!
