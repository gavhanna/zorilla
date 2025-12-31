import { Router } from "express";
import * as recordingController from "../controllers/recordingController";

const router = Router();

router.get("/", recordingController.getAllRecordings);
router.get("/:id", recordingController.getRecordingById);
router.post("/", recordingController.createRecording);

export default router;
