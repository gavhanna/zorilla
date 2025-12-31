import { Router } from "express";
import * as userController from "../controllers/userController";
import { authMiddleware, authorize } from "../middleware/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/", authorize(["admin"]), userController.getAllUsers);
router.get("/:id", authorize(["admin"]), userController.getUserById);
router.post("/", authorize(["admin"]), userController.createUser);

export default router;
