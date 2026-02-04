import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: ".env" });

const envSchema = z.object({
  PORT: z.string().default("3000"),
  MONGO_URI: z.string(),
  JWT_SECRET: z.string(),
  NODE_ENV: z.string().optional(),
});

export const env = envSchema.parse(process.env);
