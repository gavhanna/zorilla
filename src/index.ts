import express from "express";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import userRoutes from "./routes/userRoutes";
import recordingRoutes from "./routes/recordingRoutes";
import authRoutes from "./routes/auth.routes";
import { startTranscriptionWorker, stopTranscriptionWorker } from "./worker";

const app = express();
const port = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

app.use(express.json());
app.use(morgan("dev"));

// CORS only in development
if (!isProduction) {
  app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
  }));
}

// Serve static files from data directory (for audio files)
app.use('/data', express.static(path.join(__dirname, '../data')));

// API routes
app.use("/api/users", userRoutes);
app.use("/api/recordings", recordingRoutes);
app.use("/api/auth", authRoutes);

// Serve React static files in production
if (isProduction) {
  const clientPath = path.join(__dirname, "../client/dist");
  app.use(express.static(clientPath));

  // SPA fallback - serve index.html for non-API routes
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
}

const server = app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);

  // Start the transcription worker (if enabled)
  const workerEnabled = process.env.TRANSCRIPTION_WORKER_ENABLED !== 'false';

  if (workerEnabled) {
    try {
      await startTranscriptionWorker();
      console.log("✓ Transcription worker started successfully");
    } catch (error) {
      console.error("\n✗ Failed to start transcription worker:");
      console.error("  " + (error instanceof Error ? error.message : String(error)));
      console.error("\nTo enable transcription:");
      console.error("  1. Install pip: sudo dnf install -y python3-pip");
      console.error("  2. Install faster-whisper: pip3 install faster-whisper");
      console.error("  3. Restart the server");
      console.error("\nOr disable the worker by setting TRANSCRIPTION_WORKER_ENABLED=false in .env\n");
      console.error("The server will continue running, but transcription will be disabled.\n");
      // Server continues running even if worker fails to start
    }
  } else {
    console.log("Transcription worker disabled (TRANSCRIPTION_WORKER_ENABLED=false)");
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  stopTranscriptionWorker();
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  stopTranscriptionWorker();
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});
