import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// Lazy initialization - só conecta na primeira requisição, não durante o build
let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!_db) {
    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL || "file:local.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    _db = drizzle(client, { schema });
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});

// Helper to initialize database if needed (optional)
export const initDB = () => {
  // Drizzle Kit handles migrations normally, but we can do setup logic here
  console.log("Database initialized");
};
