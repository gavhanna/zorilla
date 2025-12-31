import { Router } from "express";
import * as recordingController from "../controllers/recordingController";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/", recordingController.getAllRecordings);
router.get("/:id", recordingController.getRecordingById);
router.post("/", recordingController.createRecording);

export default router;
