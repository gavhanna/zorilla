#!/bin/bash
# Setup script for Docker-based transcription service

set -e

echo "🐳 Setting up transcription service with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Fedora: sudo dnf install docker"
    echo "   Ubuntu: sudo apt install docker.io"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Build and start the transcription container
echo "🔨 Building transcription container..."
docker compose -f docker-compose.transcription.yml build

echo "🚀 Starting transcription container..."
docker compose -f docker-compose.transcription.yml up -d

# Wait for container to be ready
echo "⏳ Waiting for container to be ready..."
sleep 3

# Check if container is running
if docker ps | grep -q zorilla-transcription; then
    echo "✅ Transcription container is running!"
    echo ""
    echo "Container info:"
    docker ps --filter "name=zorilla-transcription" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "To view logs:"
    echo "  docker logs -f zorilla-transcription"
    echo ""
    echo "To stop the container:"
    echo "  docker compose -f docker-compose.transcription.yml down"
    echo ""
    echo "Your .env file should have:"
    echo "  USE_DOCKER_FOR_TRANSCRIPTION=true"
    echo ""
else
    echo "❌ Failed to start container. Check logs:"
    echo "  docker compose -f docker-compose.transcription.yml logs"
    exit 1
fi
