# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Zorilla is an open-source, self-hostable alternative to Google Recorder. It's a full-stack web application for recording audio and automatic AI-powered transcription.

**Tech Stack:**
- **Backend**: Node.js 24, Express 5, TypeScript, PostgreSQL with Drizzle ORM
- **Frontend**: React 19, TanStack Router (file-based routing), Vite 7, Tailwind CSS 4
- **Transcription**: Python with faster-whisper (can run in Docker or locally)
- **Auth**: JWT-based with bcrypt password hashing
- **Validation**: Zod schemas

## Development Commands

### Running the Application
```bash
npm run dev              # Start both API and client with hot-reload
npm run dev:api          # Start only API server (port 5000)
npm run dev:client       # Start only React client (port 3000)
```

### Building
```bash
npm run build            # Build both client and server for production
npm run build:client     # Build React frontend
npm run build:server     # Build TypeScript backend
npm start                # Run production server
```

### Database Operations
```bash
npm run db:generate      # Generate Drizzle migrations from schema changes
npm run db:push          # Push schema changes directly to database
npm run db:migrate       # Run pending database migrations
```

### Frontend Testing & Linting
```bash
cd client && npm run test    # Run Vitest tests
cd client && npm run lint    # Lint with Biome
cd client && npm run format  # Format with Biome
cd client && npm run check   # Run Biome check
```

## Architecture

### Backend Structure (MVC Pattern)

```
src/
├── controllers/          # Request handlers (auth, recording, user)
├── db/                  # Database setup
│   ├── index.ts         # Drizzle ORM instance
│   └── schema.ts        # Database schema (users, recordings tables)
├── middleware/          # Express middleware (auth, file upload)
├── routes/              # API routes definition
├── services/            # Business logic
│   ├── transcription.service.ts  # Python integration for AI
│   └── jobQueue.service.ts        # In-memory job queue
├── types/               # TypeScript types
├── worker.ts            # Background transcription worker
└── index.ts             # Express server entry point
```

**Key Pattern**: Routes → Controllers → Services → Database

### Frontend Structure

```
client/src/
├── components/          # React UI components
├── contexts/            # React contexts (AuthContext)
├── lib/                 # Utilities
│   ├── api.ts          # API client functions
│   └── utils.ts        # Helper utilities
├── routes/              # TanStack Router file-based routes
│   ├── __root.tsx      # Root layout
│   ├── index.tsx       # Home page
│   ├── record.tsx      # Recording interface
│   └── $recordingId.tsx # Individual recording view
├── types/               # Frontend TypeScript types
└── main.tsx            # App entry point
```

**Routing**: TanStack Router with file-based routing. Route tree auto-generated in `routeTree.gen.ts`.

### Database Schema

Two main tables in `src/db/schema.ts`:

**users**: id, name, email, password, role (admin/user), avatar, timestamps

**recordings**: id, title, transcript (JSONB), filePath, geolocation (JSONB), userId, status (pending/recording/done/error/deleted), transcriptProgress, errorMessage, transcriptionModel, timestamps

Use Drizzle ORM for queries. Relations defined with `drizzle-orm` relations.

### Authentication Flow

1. JWT tokens stored in localStorage (client)
2. Bearer token sent in `Authorization` header
3. `authMiddleware` validates token and attaches `req.user` and `req.userId`
4. `authorize(['admin'])` helper for role-based access

Middleware in `src/middleware/auth.middleware.ts`

### Transcription Architecture

**Two modes**: Docker (recommended) or local Python

**Flow**:
1. Upload → File saved to `data/` directory
2. Recording created with `status: "pending"`
3. Job added to in-memory queue
4. Background worker (`src/worker.ts`) polls queue
5. Python script (`transcribe.py`) spawned via child_process or docker exec
6. faster-whisper transcribes audio
7. Result saved to database, status updated to `"done"` or `"error"`

**Worker**: Auto-starts with server in `src/index.ts`, graceful shutdown on SIGTERM/SIGINT

**Environment variables** (see `.env.example`):
- `USE_DOCKER_FOR_TRANSCRIPTION=true` for Docker mode
- `WHISPER_MODEL_NAME=base` for model selection
- `TRANSCRIPTION_WORKER_ENABLED=true` to enable/disable

See `/docs/TRANSCRIPTION_SERVICE.md` for detailed setup.

### API Endpoints

**Auth** (`/api/auth/`):
- POST `/register` - User registration
- POST `/login` - Get JWT token

**Recordings** (`/api/recordings/`):
- GET `/` - List user's recordings
- POST `/` - Upload audio file (multipart/form-data)
- GET `/:id` - Get single recording
- PATCH `/:id` - Update title or transcript
- DELETE `/:id` - Soft delete (sets status to "deleted")

**Static files** (`/data/`): Audio files served from `data/` directory

### Frontend API Client

Located in `client/src/lib/api.ts`:

- `fetchRecordings()` - Get all recordings
- `fetchRecordingById(id)` - Get single recording
- `updateRecording(id, data)` - Update recording
- `deleteRecording(id)` - Delete recording
- `getAudioUrl(filePath)` - Get audio file URL
- `getAuthToken()` / `handleAuthError()` - Auth helpers

API base URL from `VITE_API_URL` env var (defaults to `http://localhost:5000`)

### File-Based Routing (TanStack Router)

Routes defined in `client/src/routes/`:
- `__root.tsx` - Root layout with auth context
- `index.tsx` - Home page (recordings list)
- `record.tsx` - Recording/new page
- `$recordingId.tsx` - Dynamic route for individual recordings

Route tree auto-generated. Use `<Link>` from `@tanstack/react-router` for navigation.

### Styling

- Tailwind CSS 4 with Vite plugin
- Mobile-first responsive design
- Dark mode not currently implemented
- No component library - custom components

### Configuration Files

- **Backend**: `tsconfig.json` (ES2022, strict mode)
- **Frontend**: `client/tsconfig.json` (ES2022, strict mode, path aliases: `@/*`)
- **Database**: `drizzle.config.ts`
- **Vite**: `client/vite.config.ts` (proxy `/api` to `:5000`)
- **Docker**: `Dockerfile` (multi-stage build)

## Key Conventions

### TypeScript

Strict mode enabled on both backend and frontend. Use type inference where possible.

**Backend types**: Infer from database schema:
```typescript
import type { Recording, NewRecording } from "../db/schema";
```

**Frontend types**: Defined in `client/src/types/types.ts`

### Validation

Use Zod for all API input validation in controllers. Example in `src/controllers/`.

### Error Handling

- API returns JSON errors with `message` field
- 401 errors clear token and redirect to `/` (client)
- 404 for missing recordings
- 500 for server errors

### File Upload

- Multer middleware in `src/middleware/upload.middleware.ts`
- Files saved to `data/` directory
- Database stores file path reference
- Audio files served statically at `/data/` route

### State Management

- **Auth**: React Context (`AuthContext` in `client/src/contexts/`)
- **Component state**: React hooks (useState, useEffect)
- No global state library (Zustand mentioned in plans but not implemented)

### Code Quality

- **Frontend**: Biome for linting and formatting
- **Backend**: TypeScript strict mode
- **Testing**: Vitest for frontend (no backend tests currently)

## Environment Setup

1. Copy `.env.example` to `.env`
2. Configure `DATABASE_URL` for PostgreSQL
3. Set `JWT_SECRET` for auth
4. Set up transcription:
   - **Docker mode**: Run `./setup-transcription-docker.sh` (see `/docs/DOCKER_TRANSCRIPTION.md`)
   - **Local mode**: `pip install faster-whisper` (see `/docs/TRANSCRIPTION_SERVICE.md`)
5. Run migrations: `npm run db:push`
6. Start dev server: `npm run dev`

## Deployment

Docker multi-stage build in `Dockerfile`:
- Stage 1: Build client and server
- Stage 2: Production Node.js 24 Alpine image
- Serves React static files and API
- Exposes port 5000

Transcription runs in separate Docker container (see `/docs/DOCKER_TRANSCRIPTION.md`)

## Important Notes

- **Job queue is in-memory** - Jobs lost on server restart (MVP limitation)
- **No persistent sessions** - JWT stored in localStorage
- **Soft deletes** - Recordings marked `"deleted"` in status field
- **Geolocation** - Stored as JSONB, not currently used in UI
- **Transcript format** - JSONB field, structure depends on faster-whisper output
- **Audio files** - Never deleted from disk in MVP (only database record soft-deleted)

## Common Patterns

### Adding a new API endpoint

1. Add route in `src/routes/`
2. Create controller function in `src/controllers/`
3. Add service layer logic in `src/services/` if needed
4. Use `authMiddleware` for protected routes
5. Add Zod validation schema
6. Update frontend API client in `client/src/lib/api.ts`

### Database migrations

1. Modify schema in `src/db/schema.ts`
2. Run `npm run db:generate` to create migration
3. Run `npm run db:push` to apply to database (dev)
4. Or `npm run db:migrate` for production migrations

### Adding a new frontend route

1. Create file in `client/src/routes/` (follow TanStack Router conventions)
2. Route tree auto-generates on restart
3. Use `<Link>` from `@tanstack/react-router` for navigation
4. Access route params via `useParams()` hook

### Running single test

```bash
cd client
npm run test -- RecordingCard
```
