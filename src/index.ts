import express from "express";
import morgan from "morgan";
import userRoutes from "./routes/userRoutes";
import recordingRoutes from "./routes/recordingRoutes";
import authRoutes from "./routes/auth.routes";

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(morgan("dev"));

app.use("/api/users", userRoutes);
app.use("/api/recordings", recordingRoutes);
app.use("/api/auth", authRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
