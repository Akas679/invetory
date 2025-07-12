import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// PostgreSQL database connection
const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Configure postgres connection with minimal settings
const sql = postgres(connectionString, {
  max: 1,
  prepare: false,
});

export const db = drizzle(sql, { schema });