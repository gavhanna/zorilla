import type { Request, Response } from "express";
import { db } from "../db";
import { recordings } from "../db/schema";
import { eq, and, inArray } from "drizzle-orm";

export const getAllRecordings = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
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
    const user = (req as any).user;

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
    const user = (req as any).user;
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
        status: "done",
      })
      .returning();

    if (!newRecording) {
      throw new Error("Failed to create recording");
    }

    res.status(201).json(newRecording);
  } catch (error) {
    console.error("Create recording error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteRecording = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

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

    res.json(deleted);
  } catch (error) {
    console.error("Delete recording error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteRecordingsBatch = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    const user = (req as any).user;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Invalid recording IDs" });
    }

    const deleted = await db
      .update(recordings)
      .set({ status: "deleted" })
      .where(and(inArray(recordings.id, ids), eq(recordings.userId, user.id)))
      .returning();

    res.json({
      deleted: deleted.length,
      recordings: deleted,
    });
  } catch (error) {
    console.error("Batch delete recordings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
