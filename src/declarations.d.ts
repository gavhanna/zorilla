import type { User } from './db/schema';

declare global {
    namespace Express {
        interface Request {
            userId?: string;
            user?: User;
        }
    }
}

declare module "../client/.output/server/index.mjs" {
    import type { RequestHandler } from "express";
    export const middleware: RequestHandler;
}

declare module 'morgan' {
    import type { RequestHandler } from 'express';
    function morgan(format: string): RequestHandler;
    export = morgan;
}

export {};
