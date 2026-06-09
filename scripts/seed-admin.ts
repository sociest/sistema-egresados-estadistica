// scripts/seed-admin.ts
// Solo crea el usuario admin inicial — NO borra nada
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/lib/schema";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";

dotenv.config({ path: ".env.production" });
dotenv.config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db   = drizzle(pool, { schema });

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPass  = process.env.ADMIN_PASSWORD;
  const adminCi    = process.env.ADMIN_CI ?? "admin";

  if (!adminEmail || !adminPass) {
    console.error("❌ ERROR: Define ADMIN_EMAIL y ADMIN_PASSWORD en tu .env");
    process.exit(1);
  }

  // Verificar si ya existe un admin
  const [existe] = await db
    .select({ id: schema.usuario.id })
    .from(schema.usuario)
    .where(eq(schema.usuario.rol, "admin"))
    .limit(1);

  if (existe) {
    console.log("⚠️  Ya existe un usuario admin. No se creó ninguno nuevo.");
    console.log("   Si quieres cambiar la contraseña, hazlo desde el panel de administración.");
    return;
  }

  await db.insert(schema.usuario).values({
    ci:                adminCi,
    correo:            adminEmail,
    passwordHash:      await bcrypt.hash(adminPass, 12),
    rol:               "admin",
    estado:            "activo",
    primerLogin:       false,
    correoVerificado:  true,
    celularVerificado: false,
  });

  console.log("✅ Usuario admin creado:");
  console.log(`   Correo/CI: ${adminEmail}`);
  console.log(`   CI:        ${adminCi}`);
  console.log("━".repeat(50));
  console.log("⚠️  Guarda estas credenciales en un lugar seguro.");
  console.log("━".repeat(50));
}

main()
  .catch(e => { console.error("❌ Error:", e); process.exit(1); })
  .finally(() => pool.end());