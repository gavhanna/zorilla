declare module "../client/.output/server/index.mjs" {
    import type { RequestHandler } from "express";
    export const middleware: RequestHandler;
}
