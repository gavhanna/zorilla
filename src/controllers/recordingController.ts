import { Request, Response } from "express";
import { db } from "../db";
import { recordings } from "../db/schema";

export const getAllRecordings = async (req: Request, res: Response) => {
  try {
    const result = await db.query.recordings.findMany();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recordings" });
  }
};

export const getRecordingById = async (req: Request, res: Response) => {
  res.json({ message: "Get recording by ID" });
};

export const createRecording = async (req: Request, res: Response) => {
  res.json({ message: "Create recording" });
};
