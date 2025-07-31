import { z } from "zod";

// MongoDB ObjectId validation schema
export const ObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");
