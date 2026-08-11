import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/server/env";
import * as schema from "./schema";

/**
 * Next dev reloads the module graph on every edit, which would open a new pool
 * each time and exhaust Postgres connections within a few saves.
 */
const globalForDb = globalThis as unknown as {
  conferenceDbClient?: postgres.Sql;
};

const client =
  globalForDb.conferenceDbClient ??
  postgres(env.DATABASE_URL, {
    max: env.NODE_ENV === "production" ? 10 : 1,
    prepare: false, // safe behind PgBouncer / Supabase transaction pooling
  });

if (env.NODE_ENV !== "production") globalForDb.conferenceDbClient = client;

export const db = drizzle(client, { schema });

export { schema };
export type Database = typeof db;
