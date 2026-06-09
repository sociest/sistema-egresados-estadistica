import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, types } from "pg";
import * as schema from "./schema";

// Evitar que el driver pg convierta timestamps a hora local del servidor.
// Los leemos como string y los convertimos nosotros con la zona horaria correcta.
types.setTypeParser(types.builtins.TIMESTAMP, (val: string) => {
  // El valor llega como "2024-01-15 13:28:46.123" (sin zona horaria)
  // Lo tratamos como UTC para que la conversión posterior sea correcta
  return new Date(val + "Z");
});

types.setTypeParser(types.builtins.TIMESTAMPTZ, (val: string) => {
  return new Date(val);
});

declare global { var _pgPool: Pool | undefined; }

const pool: Pool = global._pgPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});
if (process.env.NODE_ENV !== "production") global._pgPool = pool;

export const db = drizzle(pool, { schema });