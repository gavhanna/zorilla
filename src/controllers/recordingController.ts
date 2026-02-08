import type { Request, Response } from "express";
import { db } from "../db";
import { recordings } from "../db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getJobQueue } from "../services/jobQueue.service";
import type { TranscriptionJob } from "../types/transcription.types";
import * as fs from "fs";

/**
 * Safely delete a file from disk if it exists
 */
function deleteFileIfExists(filePath: string): void {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${filePath}`);
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error);
      // Continue even if file deletion fails
    }
  }
}

export const getAllRecordings = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await db.query.recordings.findMany({
      where: eq(recordings.userId, user.id),
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recordings" });
  }
};

export const getRecordingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!id) {
      return res.status(400).json({ message: "Invalid recording ID" });
    }

    const recording = await db.query.recordings.findFirst({
      where: eq(recordings.id, id),
    });

    if (!recording) {
      return res.status(404).json({ message: "Recording not found" });
    }

    if (recording.userId !== user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(recording);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recording" });
  }
};

export const createRecording = async (req: Request, res: Response) => {
  try {
    const { title, transcript, geolocation } = req.body;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const file = (req as any).file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const [newRecording] = await db
      .insert(recordings)
      .values({
        title,
        transcript: transcript || null,
        filePath: file.path,
        geolocation: geolocation ? JSON.parse(geolocation) : null,
        userId: user.id,
        status: "pending",
      })
      .returning();

    if (!newRecording) {
      throw new Error("Failed to create recording");
    }

    // Add transcription job to queue
    const jobQueue = getJobQueue();
    const job: TranscriptionJob = {
      recordingId: newRecording.id,
      filePath: file.path,
      status: "pending",
      addedAt: new Date(),
    };
    jobQueue.add(job);

    res.status(201).json(newRecording);
  } catch (error) {
    console.error("Create recording error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteRecording = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!id) {
      return res.status(400).json({ message: "Invalid recording ID" });
    }

    const recording = await db.query.recordings.findFirst({
      where: eq(recordings.id, id),
    });

    if (!recording) {
      return res.status(404).json({ message: "Recording not found" });
    }

    if (recording.userId !== user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [deleted] = await db
      .update(recordings)
      .set({ status: "deleted" })
      .where(and(eq(recordings.id, id), eq(recordings.userId, user.id)))
      .returning();

    // Delete the audio file from disk
    if (deleted?.filePath) {
      deleteFileIfExists(deleted.filePath);
    }

    res.json(deleted);
  } catch (error) {
    console.error("Delete recording error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteRecordingsBatch = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Invalid recording IDs" });
    }

    const deleted = await db
      .update(recordings)
      .set({ status: "deleted" })
      .where(and(inArray(recordings.id, ids), eq(recordings.userId, user.id)))
      .returning();

    // Delete all audio files from disk
    for (const recording of deleted) {
      if (recording.filePath) {
        deleteFileIfExists(recording.filePath);
      }
    }

    res.json({
      deleted: deleted.length,
      recordings: deleted,
    });
  } catch (error) {
    console.error("Batch delete recordings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateRecording = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, transcript } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!id) {
      return res.status(400).json({ message: "Invalid recording ID" });
    }

    // First check if recording exists and belongs to user
    const recording = await db.query.recordings.findFirst({
      where: eq(recordings.id, id),
    });

    if (!recording) {
      return res.status(404).json({ message: "Recording not found" });
    }

    if (recording.userId !== user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Prepare update data
    const updateData: Partial<typeof recordings.$inferInsert> = {};
    if (title !== undefined) updateData.title = title;
    if (transcript !== undefined) updateData.transcript = transcript;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(recordings)
      .set(updateData)
      .where(eq(recordings.id, id))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error("Update recording error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
