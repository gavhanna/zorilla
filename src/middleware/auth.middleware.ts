

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        return res.status(401).json({ message: "Authentication required" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        (req as any).userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

export const authorize = (allowedRoles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const userId = (req as any).userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        try {
            const user = await db.query.users.findFirst({
                where: eq(users.id, userId),
            });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({ message: "Forbidden" });
            }

            next();
        } catch (error) {
            console.error("Authorization error:", error);
            res.status(500).json({ message: "Server error" });
        }
    };
};

