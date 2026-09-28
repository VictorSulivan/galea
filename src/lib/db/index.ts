import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Database = NeonHttpDatabase<typeof schema>;

let cached: Database | null = null;

export function getDb() {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL manquant. Relie le projet Neon dans .env.local.");
  }
  cached = drizzle(neon(url), { schema });
  return cached;
}

export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL && process.env.AUTH_SECRET);
}
