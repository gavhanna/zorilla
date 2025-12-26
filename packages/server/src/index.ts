import { Elysia } from "elysia";
import home from "./controllers/home";
import db from "./db";

const app = new Elysia({
  prefix: "/api/v1",
  normalize: true,
}).get("/", home).listen(5000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
