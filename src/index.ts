import express from "express";
import userRoutes from "./routes/userRoutes";
import recordingRoutes from "./routes/recordingRoutes";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/recordings", recordingRoutes);

app.get("/", (req, res) => {
  res.send("Zorilla API is running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
