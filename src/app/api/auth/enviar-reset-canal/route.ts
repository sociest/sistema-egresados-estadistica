import { err } from "@/lib/utils";

// Este endpoint fue deprecado. El reset de contraseña ahora siempre
// usa el correo verificado, directamente desde /api/auth/solicitar-codigo
export async function POST() {
  return err("Endpoint deprecado. Usa /api/auth/solicitar-codigo con tipo: reset_password", 410);
}