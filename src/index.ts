import express from "express";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import userRoutes from "./routes/userRoutes";
import recordingRoutes from "./routes/recordingRoutes";
import authRoutes from "./routes/auth.routes";

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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
