# Multi-stage build for Zorilla - Single container with transcription built-in
FROM node:24-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY package-lock.json* ./

# Copy client package files
COPY client/package*.json ./client/

# Install all dependencies (including dev dependencies for builds)
RUN npm install --legacy-peer-deps

# Copy source files
COPY . .

# Build both client and server
RUN npm run build

# Production stage - includes both Node.js app and Python transcription
FROM node:24-alpine

# Install Python and build dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    pkgconf \
    ffmpeg-dev \
    ffmpeg \
    gcc \
    musl-dev \
    dumb-init \
    tzdata \
    && python3 -m pip install --no-cache-dir --break-system-packages --upgrade pip setuptools wheel

# Install faster-whisper for transcription
RUN python3 -m pip install --no-cache-dir --break-system-packages faster-whisper

# Create non-root user
RUN addgroup -g 1001 -S zorilla && \
    adduser -S -u 1001 -G zorilla zorilla

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY package-lock.json* ./

# Install only production Node.js dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy transcribe.py script
COPY transcribe.py ./transcribe.py

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/drizzle ./drizzle

# Create data directory with correct permissions
RUN mkdir -p /app/data && chown -R zorilla:zorilla /app

# Switch to non-root user
USER zorilla

# Set production environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

EXPOSE 5000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
