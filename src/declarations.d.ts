declare global {
    namespace Express {
        interface Request {
            userId?: string;
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
