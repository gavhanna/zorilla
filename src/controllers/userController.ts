import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { z, ZodError } from "zod";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
  role: z.enum(["admin", "user"]).optional(),
});

export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const result = await db.query.users.findMany();
    const usersWithoutPasswords = result.map(({ password, ...user }) => user);
    res.json(usersWithoutPasswords);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = createUserSchema.parse(req.body);

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        role: role || "user",
      })
      .returning();

    if (!newUser) {
      throw new Error("Failed to create user");
    }

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: error });
    }
    console.error("Create user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
