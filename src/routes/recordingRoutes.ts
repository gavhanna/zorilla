import { Router } from "express";
import * as recordingController from "../controllers/recordingController";
import { authMiddleware } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/", recordingController.getAllRecordings);
router.get("/:id", recordingController.getRecordingById);
router.post("/", upload.single("file"), recordingController.createRecording);

export default router;
