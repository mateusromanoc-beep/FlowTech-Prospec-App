import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database("sqlite.db");
export const db = drizzle(sqlite, { schema });

// Helper to initialize database if needed (optional)
export const initDB = () => {
  // Drizzle Kit handles migrations normally, but we can do setup logic here
  console.log("Database initialized");
};
