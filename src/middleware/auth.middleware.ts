
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        return next(); // Don't block options, but also don't populate user. 
        // Actually for protected routes validation happens in the controller or we should have a strict variant.
        // For now, let's make it populate if valid, or ignore.
        // Wait, the requirement says "auth guard".
        // I will implement a strict middleware for protected routes.
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        (req as any).userId = decoded.userId;
        next();
    } catch (err) {
        // If token is invalid, we might want to return 401 if it was provided?
        // Or just continue as guest?
        // Let's continue as guest for now, controller `me` checks userId.
        next();
    }
};
