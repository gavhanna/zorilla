import { Elysia } from "elysia";
import home from "./controllers/home";
import usersRoutes from "./routes/users";
import recordingsRoutes from "./routes/recordings";
import authRoutes from "./routes/auth";

const app = new Elysia({
  prefix: "/api/v1",
  normalize: true,
})
  .get("/", home)
  .use(usersRoutes)
  .use(recordingsRoutes)
  .use(authRoutes)
  .listen(5000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
