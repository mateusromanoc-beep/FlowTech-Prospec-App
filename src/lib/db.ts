import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const db = drizzle(client, { schema });

// Helper to initialize database if needed (optional)
export const initDB = () => {
  // Drizzle Kit handles migrations normally, but we can do setup logic here
  console.log("Database initialized");
};
