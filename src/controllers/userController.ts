import { Request, Response } from "express";
import { db } from "../db";
import { users } from "../db/schema";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const result = await db.query.users.findMany();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  res.json({ message: "Get user by ID" });
};

export const createUser = async (req: Request, res: Response) => {
  res.json({ message: "Create user" });
};
