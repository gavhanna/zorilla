# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY package-lock.json* ./

# Copy client package files
COPY client/package*.json ./client/

# Install all dependencies (including dev dependencies for builds)
RUN npm ci

# Copy source files
COPY . .

# Build both client and server
RUN npm run build

# Production stage
FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY package-lock.json* ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built server files
COPY --from=builder /app/dist ./dist

# Copy built client files
COPY --from=builder /app/client/dist ./client/dist

# Copy node_modules from builder (for any runtime-only dependencies)
COPY --from=builder /app/node_modules ./node_modules

# Set production environment
ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "dist/index.js"]
