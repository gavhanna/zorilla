# Docker Transcription Service Setup

This guide explains how to run the faster-whisper transcription service in a Docker container.

## Quick Start (Development)

### 1. Run the Setup Script

```bash
./setup-transcription-docker.sh
```

This will:
- Check if Docker is installed
- Create the required Docker network
- Build and start the transcription container
- Verify it's running

### 2. Configure Environment

Add to your `.env` file:

```env
USE_DOCKER_FOR_TRANSCRIPTION=true
DOCKER_TRANSCRIPTION_CONTAINER=zorilla-transcription
```

### 3. Start Your Server

```bash
npm run dev
```

You should see:
```
Server is running on port 5000
✓ Transcription service initialized (using Docker container: zorilla-transcription)
✓ Transcription worker started successfully
```

## Manual Setup

If you prefer to do it manually:

### 1. Create Docker Network

```bash
docker network create zorilla-network
```

### 2. Build the Container

```bash
docker compose -f docker compose.transcription.yml build
```

### 3. Start the Container

```bash
docker compose -f docker compose.transcription.yml up -d
```

### 4. Verify It's Running

```bash
docker ps | grep zorilla-transcription
```

## Docker Container Details

The transcription container includes:
- Python 3.12
- faster-whisper library
- ffmpeg for audio processing
- The transcribe.py script

### Volumes

- `./data:/audio:ro` - Mounts your data directory so the container can access uploaded audio files

### Architecture

```
Node.js Server → docker exec → Container → transcribe.py → faster-whisper
```

## Management Commands

### View Logs

```bash
docker logs -f zorilla-transcription
```

### Stop Container

```bash
docker compose -f docker compose.transcription.yml down
```

### Restart Container

```bash
docker compose -f docker compose.transcription.yml restart
```

### Rebuild After Changes

```bash
docker compose -f docker compose.transcription.yml up -d --build
```

### Test the Container

```bash
docker exec zorilla-transcription python3 /app/transcribe.py --help
```

## Troubleshooting

### "docker: command not found"

Install Docker:
```bash
# Fedora
sudo dnf install docker

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (optional, to avoid sudo)
sudo usermod -aG docker $USER
# Log out and back in for this to take effect
```

### "Network zorilla-network not found"

Create the network:
```bash
docker network create zorilla-network
```

### Container exits immediately

Check logs:
```bash
docker logs zorilla-transcription
```

### "Permission denied" accessing audio files

Make sure the `data` directory exists and has proper permissions:
```bash
ls -la data/
```

### "Failed to connect to Docker"

Make sure Docker is running:
```bash
sudo systemctl status docker
# Start if needed
sudo systemctl start docker
```

## Switching Between Docker and Local Python

You can easily switch between Docker and local Python:

### Use Docker (Recommended for Development)

```env
USE_DOCKER_FOR_TRANSCRIPTION=true
```

### Use Local Python (Requires faster-whisper installed)

```env
USE_DOCKER_FOR_TRANSCRIPTION=false
# or just don't set it
```

Then install faster-whisper:
```bash
pip install faster-whisper
```

## Production Deployment (GitHub Container Registry)

For production, you can build and push the image to GHCR:

### 1. Build Image

```bash
docker build -f Dockerfile.transcription -t ghcr.io/YOUR_USERNAME/zorilla-transcription:latest .
```

### 2. Push to GHCR

```bash
docker push ghcr.io/YOUR_USERNAME/zorilla-transcription:latest
```

### 3. Pull in Production

```bash
docker pull ghcr.io/YOUR_USERNAME/zorilla-transcription:latest
docker run -d --name zorilla-transcription \
  -v ./data:/audio:ro \
  --network zorilla-network \
  ghcr.io/YOUR_USERNAME/zorilla-transcription:latest \
  tail -f /dev/null
```

See `.github/workflows/transcription.yml` for automated builds.

## CI/CD Pipeline

The GitHub Actions workflow automatically builds and pushes the image when you push to the main branch.

**Workflow:**
1. Triggers on push to `main`
2. Builds the transcription image
3. Pushes to `ghcr.io/YOUR_USERNAME/zorilla-transcription:latest`

**To enable:**
1. Update `.github/workflows/transcription.yml` with your username
2. Add `GHCR_TOKEN` secret to your GitHub repo
3. Push to `main` branch

## Environment Variables

### Docker Mode

```env
USE_DOCKER_FOR_TRANSCRIPTION=true          # Required: Enable Docker mode
DOCKER_TRANSCRIPTION_CONTAINER=zorilla-transcription  # Optional: Container name
WHISPER_MODEL_NAME=base                    # Optional: Model size
```

### Local Python Mode

```env
USE_DOCKER_FOR_TRANSCRIPTION=false         # Disable Docker
PYTHON_PATH=python3                        # Optional: Python executable path
WHISPER_MODEL_NAME=base                    # Optional: Model size
```

## Advantages of Docker Mode

✅ **Isolated Dependencies** - No need to install Python packages on host
✅ **Consistent Environment** - Same in dev and prod
✅ **Easy to Deploy** - Just pull and run the container
✅ **No Host Pollution** - Keeps your system clean
✅ **Scalable** - Easy to run multiple instances
✅ **Version Control** - Tag and version your images

## Next Steps

Once the transcription container is running:

1. Start your Node.js server: `npm run dev`
2. Upload an audio file via the API
3. The file will be transcribed automatically
4. Check the recording status in the database or via API

See `TRANSCRIPTION_SERVICE.md` for more details on the transcription workflow.
