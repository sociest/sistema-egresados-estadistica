// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Rutas públicas sin autenticación (antes de cualquier verificación)
  const publicRoutes = [
    "/activar-cuenta",
    "/completar-contacto",
    "/recuperar-password",
    "/directorio",
    "/noticias",
    "/login",
  ];
  if (publicRoutes.some(r => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // 2. API: verificar sesión
  if (pathname.startsWith("/api/")) {
    if (
      pathname.startsWith("/api/auth/login") ||
      pathname.startsWith("/api/auth/solicitar-codigo") ||
      pathname.startsWith("/api/auth/cambiar-password") ||
      pathname.startsWith("/api/auth/agregar-contacto") ||
      pathname.startsWith("/api/auth/verificar-contacto") ||
      pathname.startsWith("/api/auth/activar-cuenta") ||
      pathname.startsWith("/api/egresados/destacados") ||
      pathname.startsWith("/api/egresados/directorio-publico") ||
      pathname.startsWith("/api/noticias") ||
      pathname.startsWith("/api/stats/publicos")
    ) return NextResponse.next();

    const token   = req.cookies.get("eg_token")?.value;
    const session = token ? await verifyToken(token) : null;
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const headers = new Headers(req.headers);
    headers.set("x-uid",  String(session.idUsuario));
    headers.set("x-rol",  session.rol);
    headers.set("x-egid", String(session.idEgresado ?? ""));
    return NextResponse.next({ request: { headers } });
  }

  // 3. Verificar sesión para todo lo demás
  const token   = req.cookies.get("eg_token")?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) return NextResponse.redirect(new URL("/login", req.url));

  // 4. Rutas exclusivas de ADMIN
  const adminRoutes = ["/dashboard", "/egresados", "/usuarios", "/reportes", "/verificaciones", "/sugerencias"];
  if (adminRoutes.some(r => pathname.startsWith(r)) && session.rol !== "admin") {
    return NextResponse.redirect(new URL("/mi-perfil", req.url));
  }

  // 5. Rutas exclusivas de EGRESADO
  // IMPORTANTE: /registro-inicial NO debe verificar idEgresado aquí
  const egresadoRoutes = ["/mi-perfil", "/editar-perfil", "/experiencia"];
  if (egresadoRoutes.some(r => pathname.startsWith(r)) && session.rol !== "egresado") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // /registro-inicial solo para egresados
  if (pathname.startsWith("/registro-inicial") && session.rol !== "egresado") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 6. Pasar con headers de sesión
  const headers = new Headers(req.headers);
  headers.set("x-uid",  String(session.idUsuario));
  headers.set("x-rol",  session.rol);
  headers.set("x-egid", String(session.idEgresado ?? ""));
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};