
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { z, ZodError } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.email(),
    password: z.string().min(6),
    role: z.enum(["admin", "user"]).optional(),
});

const loginSchema = z.object({
    email: z.email(),
    password: z.string(),
});

export const register = async (req: Request, res: Response) => {
    if (process.env.ENABLE_REGISTRATION === "false") {
        return res.status(403).json({ message: "Registration is disabled" });
    }

    try {
        const { name, email, password, role } = registerSchema.parse(req.body);

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
                role: role || 'user',
            })
            .returning();

        if (!newUser) {
            throw new Error("Failed to create user");
        }

        const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: "7d" });

        // Exclude password from response
        const { password: _, ...userWithoutPassword } = newUser;

        res.status(201).json({ user: userWithoutPassword, token });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        console.error("Register error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

        const { password: _, ...userWithoutPassword } = user;

        res.json({ user: userWithoutPassword, token });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ errors: (error as any).errors });
        }
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const me = async (req: Request, res: Response) => {
    try {
        // req.userId should be populated by middleware
        const userId = (req as any).userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, userId)
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const { password: _, ...userWithoutPassword } = user;

        res.json({ user: userWithoutPassword });
    } catch (error) {
        console.error("Me error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
