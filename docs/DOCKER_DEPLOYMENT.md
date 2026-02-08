# Docker Deployment Guide

This guide covers deploying Zorilla using Docker, including specific instructions for Unraid.

## Architecture

Zorilla requires:

1. **External PostgreSQL database** - User-managed (not included)
2. **zorilla** - Main application (Node.js) with built-in transcription (Python + faster-whisper)

---

## Prerequisites

### Required: PostgreSQL Database

You must have a PostgreSQL database (version 12 or higher) running and accessible. Options:

**For Unraid:**
- Use the PostgreSQL plugin from Community Applications
- Or run Postgres in a separate Docker container
- Or use a managed database service

**For development/testing:**
```bash
docker run -d \
  --name zorilla-db \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=zorilla \
  -p 5432:5432 \
  postgres:16-alpine
```

### Other Requirements

- Docker and Docker Compose installed
- For Unraid: Docker plugin enabled

---

## Quick Start

### 1. Prepare Database

Create your database and note the connection details:

```bash
# Example: Create database in PostgreSQL
createdb zorilla
```

### 2. Prepare Environment File

Copy the example environment file:

```bash
cp .env.docker.example .env
```

Edit `.env` and configure at minimum:

```bash
# Database connection to YOUR PostgreSQL database
DATABASE_URL=postgresql://user:password@your-host:5432/zorilla

# Security - CHANGE THESE!
JWT_SECRET=your-super-secret-jwt-key-here
ADMIN_PASSWORD=your-secure-admin-password

# Admin user
ADMIN_EMAIL=admin@example.com
```

### 3. Start the Application

```bash
docker-compose up -d
```

The application will be available at `http://localhost:5000`

### 4. Initial Setup

On first startup, the application will:
1. Automatically create the required database tables
2. Create the admin user with your specified credentials

### 5. Login

Use the admin credentials you set in `.env`:
- Email: `ADMIN_EMAIL`
- Password: `ADMIN_PASSWORD`

---

## Unraid Deployment

### Option 1: Quick Template (Recommended)

**Name:** `zorilla`

**Repository:** `ghcr.io/yourusername/zorilla:latest`

**Port:** `5000:5000`

**Environment Variables:**
```
DATABASE_URL=postgresql://zorilla:your-db-password@your-db-host:5432/zorilla
JWT_SECRET=your-super-secret-jwt-key-here
ENABLE_REGISTRATION=true
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-admin-password
ADMIN_NAME=Admin
WHISPER_MODEL_NAME=base
TRANSCRIPTION_WORKER_ENABLED=true
NODE_ENV=production
```

**Volumes:**
```
/mnt/user/appdata/zorilla/data:/app/data
```

**Extra Parameters:**
```
--health-cmd "node -e require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
--health-interval 30s
--health-timeout 10s
--health-retries 3
--health-start-period 40s
```

### Option 2: PostgreSQL on Unraid

If you want to run PostgreSQL on Unraid too:

1. Install "Postgres" from Community Applications
2. Configure with your preferences
3. Create a database named `zorilla`
4. Use connection string:
   ```
   DATABASE_URL=postgresql://zorilla:your-password@tower:5432/zorilla
   ```

---

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string to YOUR database | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for JWT tokens | `random-64-char-string` |
| `ADMIN_EMAIL` | Admin user email | `admin@example.com` |
| `ADMIN_PASSWORD` | Admin user password | `secure-password` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `ENABLE_REGISTRATION` | Allow new user signups | `true` |
| `ADMIN_NAME` | Admin user display name | `Admin` |
| `WHISPER_MODEL_NAME` | Whisper model size | `base` |
| `TRANSCRIPTION_WORKER_ENABLED` | Enable transcription | `true` |
| `TRANSCRIPTION_WORKER_INTERVAL_MS` | Worker poll interval | `2000` |
| `TRANSCRIPTION_TIMEOUT_MS` | Transcription timeout | `300000` (5 min) |
| `DATA_DIR` | Audio files storage | `./data` |
| `APP_PORT` | Application port | `5000` |

### Database Setup (Alternative to DATABASE_URL)

If you prefer to set individual database parameters instead of a connection string:

| Variable | Description |
|----------|-------------|
| `POSTGRES_USER` | Database user |
| `POSTGRES_PASSWORD` | Database password |
| `POSTGRES_DB` | Database name |
| `POSTGRES_HOST` | Database host |
| `POSTGRES_PORT` | Database port |

---

## Data Persistence

### Unraid Paths

```
/mnt/user/appdata/zorilla/
└── data/          # Audio files (stored in container)
```

### Backup Strategy

**Backup Audio Files:**
```bash
# From Unraid
tar -czf zorilla-backup-$(date +%Y%m%d).tar.gz /mnt/user/appdata/zorilla
```

**Backup Database (your responsibility):**
```bash
# Example for local Postgres
pg_dump -U zorilla zorilla > backup.sql

# Example for Docker Postgres
docker exec zorilla-db pg_dump -U zorilla zorilla > backup.sql
```

**Restore Database:**
```bash
cat backup.sql | psql -U zorilla zorilla
```

---

## Container Management

### Starting

```bash
docker-compose up -d
```

### Stopping

```bash
docker-compose down
```

### Viewing Logs

```bash
docker-compose logs -f
```

### Restarting

```bash
docker-compose restart
```

### Updating

```bash
# Pull latest image
docker pull ghcr.io/yourusername/zorilla:latest

# Recreate container
docker-compose up -d
```

---

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker logs zorilla
```

**Common issue - Database connection failed:**
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check network connectivity from container to database host
- Verify database user has proper permissions

### Transcription Not Working

1. Check container logs:
```bash
docker logs zorilla | grep -i transcr
```

2. Verify faster-whisper is installed:
```bash
docker exec zorilla python3 -c "import faster_whisper; print('OK')"
```

3. Check data directory:
```bash
docker exec zorilla ls -la /app/data
```

### Database Migration Issues

If tables don't exist on startup:

1. Check database connection:
```bash
docker exec zorilla node -e "console.log(process.env.DATABASE_URL)"
```

2. Manually run migrations:
```bash
docker exec zorilla npx drizzle-kit push
```

### Out of Memory Errors

- Reduce Whisper model size (use `tiny` or `base`)
- Increase container memory limit
- Check available RAM on host system

### Admin User Already Exists

Reset admin user:
```sql
-- Connect to your database and run:
DELETE FROM users WHERE email = 'admin@example.com';
```

Then restart the container to recreate the admin user.

---

## Resource Requirements

### Minimum Requirements

- **CPU**: 2 cores
- **RAM**: 4GB (2GB for base model, more for larger models)
- **Storage**: 10GB+ (for audio files)
- **Network**: Connectivity to PostgreSQL database

### Recommended for Better Performance

- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: SSD for audio files

### Model-Specific RAM Requirements

| Model | Minimum RAM | Recommended RAM |
|-------|-------------|-----------------|
| tiny | 512MB | 1GB |
| base | 1GB | 2GB |
| small | 2GB | 4GB |
| medium | 4GB | 8GB |
| large-v* | 8GB | 16GB |

---

## Security Best Practices

1. **Strong Passwords**: Use strong passwords for database and admin account
2. **JWT Secret**: Generate with `openssl rand -base64 64`
3. **Database Security**:
   - Use strong database password
   - Restrict network access to PostgreSQL
   - Use SSL/TLS for database connections if remote
4. **HTTPS**: Use a reverse proxy (nginx/traefik) for SSL
5. **Registration**: Set `ENABLE_REGISTRATION=false` after creating users
6. **Backups**: Regular backups of both database and audio files

---

## Building Locally

If you prefer to build locally:

```bash
docker build -t zorilla:latest .
docker-compose up -d
```

---

## Database Setup Examples

### Example 1: Docker PostgreSQL

```bash
# Run PostgreSQL
docker run -d \
  --name zorilla-db \
  -e POSTGRES_PASSWORD=changeme \
  -e POSTGRES_DB=zorilla \
  -p 5432:5432 \
  -v zorilla-db:/var/lib/postgresql/data \
  postgres:16-alpine

# Set DATABASE_URL in .env
DATABASE_URL=postgresql://postgres:changeme@localhost:5432/zorilla
```

### Example 2: Cloud SQL (GCP)

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/zorilla?host=/cloudsql/instance-connection
```

### Example 3: RDS (AWS)

```bash
DATABASE_URL=postgresql://user:password@instance.region.rds.amazonaws.com:5432/zorilla
```

---

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/zorilla/issues
- Documentation: `/docs` folder in repository
