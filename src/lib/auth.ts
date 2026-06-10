import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const COOKIE = "eg_token";

const getSecret = () => {
  const getEnv = (key: string) => process.env[key];
  return new TextEncoder().encode(
    getEnv("JWT_SECRET") || "dev_secret_cambia_en_produccion_32chars!!"
  );
};

export interface Session {
  idUsuario:         number;
  correo:            string;
  rol:               "admin" | "egresado";
  idEgresado:        number | null;
  ci?:               string | null;
  correoVerificado?: boolean;
  celularVerificado?: boolean;
}

export const hashPassword   = (p: string) => bcrypt.hash(p, 12);
export const verifyPassword = (p: string, h: string) => bcrypt.compare(p, h);

export async function signToken(s: Session): Promise<string> {
  return new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as Session;
  } catch (err) { 
    console.error("verifyToken error:", err);
    return null; 
  }
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function setSession(token: string) {
  const getEnv = (key: string) => process.env[key];
  const isProd = getEnv("NODE_ENV") === "production";
  const disableSecure = getEnv("DISABLE_SECURE_COOKIES") === "true";

  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure:   isProd && !disableSecure,
    sameSite: "lax",
    maxAge:   60 * 60 * 8,
    path:     "/",
  });
}

export function clearSession() {
  cookies().delete(COOKIE);
}