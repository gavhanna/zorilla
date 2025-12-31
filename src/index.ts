import express from "express";
import path from "path";
import userRoutes from "./routes/userRoutes";
import recordingRoutes from "./routes/recordingRoutes";
import authRoutes from "./routes/auth.routes";

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/recordings", recordingRoutes);
app.use("/api/auth", authRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(process.cwd(), "client/.output/public")));

  import("../client/.output/server/index.mjs").then((mod) => {
    app.use(mod.middleware);
  });
} else {
  console.log("Running in development mode: Client middleware skipped. Use Vite dev server.");
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
