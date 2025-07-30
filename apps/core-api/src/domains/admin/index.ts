import { authenticateUser, requireAdmin } from "@/domains/auth";
import express from "express";
import projectRoutes from "./projects";
import userRoutes from "./users";

const router = express.Router();

// Apply shared middleware to all admin routes
router.use(authenticateUser);
router.use(requireAdmin);

// Mount domain-specific routes
router.use("/users", userRoutes);
router.use("/projects", projectRoutes);

export default router;
