import express from "express";
import { authenticateUser, requireAdmin } from "../auth";
import userRoutes from "./users";

const router = express.Router();

// Apply shared middleware to all admin routes
router.use(authenticateUser);
router.use(requireAdmin);

// Mount domain-specific routes
router.use("/users", userRoutes);

export default router;
