import nodemailer from "nodemailer";

// Si no hay credenciales configuradas, usar consola (modo desarrollo)
const DEV_MODE = !process.env.EMAIL_USER || !process.env.EMAIL_PASS;

const FROM = process.env.EMAIL_FROM ?? process.env.EMAIL_USER ?? "sistema@estadistica.bo";

function getTransporter() {
  if (DEV_MODE) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
}

// Helper interno: enviar o loguear en consola
async function enviar(opts: {
  to: string;
  subject: string;
  html: string;
  codigo: string; // para mostrarlo en consola en dev
}) {
const transporter = getTransporter();
if (DEV_MODE || !transporter) {

    // ── Modo desarrollo: imprimir en consola ──────────────────────────────
    console.log("\n" + "=".repeat(60));
    console.log("📧 [EMAIL DEV MODE] — no se envió correo real");
    console.log(`Para:    ${opts.to}`);
    console.log(`Asunto:  ${opts.subject}`);
    console.log(`Código:  >>>  ${opts.codigo}  <<<`);
    console.log("=".repeat(60) + "\n");
    return;
  }

  await transporter.sendMail({
    from: FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}

// ── Plantilla base ────────────────────────────────────────────────────────────
function baseTemplate(titulo: string, contenido: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155">
    <div style="background:#0284c7;padding:28px 32px">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:600">🎓 Carrera de Estadística</h1>
      <p style="margin:6px 0 0;color:#bae6fd;font-size:13px">Universidad Mayor de San Andrés</p>
    </div>
    <div style="padding:32px">
      <h2 style="margin:0 0 16px;color:#f1f5f9;font-size:18px;font-weight:600">${titulo}</h2>
      ${contenido}
    </div>
    <div style="padding:16px 32px;border-top:1px solid #334155;text-align:center">
      <p style="margin:0;color:#475569;font-size:12px">Correo generado automáticamente. No respondas.</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Email: primer login ───────────────────────────────────────────────────────
export async function sendPrimerLoginEmail(opts: {
  to: string;
  nombres: string;
  codigo: string;
}): Promise<void> {
  const contenido = `
    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px">
      Hola <strong style="color:#e2e8f0">${opts.nombres}</strong>, tu cuenta ha sido creada.
      Ingresa el siguiente código para activarla:
    </p>
    <div style="background:#0f172a;border:1px solid #0284c7;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px">
      <p style="margin:0 0 8px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:2px">Código de verificación</p>
      <p style="margin:0;color:#38bdf8;font-size:36px;font-weight:700;letter-spacing:8px;font-family:monospace">${opts.codigo}</p>
      <p style="margin:12px 0 0;color:#64748b;font-size:12px">Válido por 30 minutos</p>
    </div>`;

  await enviar({
    to: opts.to,
    subject: "Activa tu cuenta — Sistema de Egresados Estadística UMSA",
    html: baseTemplate("Activación de cuenta", contenido),
    codigo: opts.codigo,
  });
}

// ── Email: recuperar contraseña ───────────────────────────────────────────────
export async function sendResetPasswordEmail(opts: {
  to: string;
  nombres: string;
  codigo: string;
}): Promise<void> {
  const contenido = `
    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px">
      Hola <strong style="color:#e2e8f0">${opts.nombres}</strong>, usa este código para restablecer tu contraseña:
    </p>
    <div style="background:#0f172a;border:1px solid #f59e0b;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px">
      <p style="margin:0 0 8px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:2px">Código de recuperación</p>
      <p style="margin:0;color:#fbbf24;font-size:36px;font-weight:700;letter-spacing:8px;font-family:monospace">${opts.codigo}</p>
      <p style="margin:12px 0 0;color:#64748b;font-size:12px">Válido por 15 minutos</p>
    </div>`;

  await enviar({
    to: opts.to,
    subject: "Recuperar contraseña — Sistema de Egresados Estadística UMSA",
    html: baseTemplate("Recuperación de contraseña", contenido),
    codigo: opts.codigo,
  });
}

export async function sendVerificacionContactoEmail(opts: {
  to: string;
  nombres: string;
  codigo: string;
}): Promise<void> {
  const contenido = `
    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px">
      Hola <strong style="color:#e2e8f0">${opts.nombres}</strong>, usa este código para verificar tu correo electrónico:
    </p>
    <div style="background:#0f172a;border:1px solid #0284c7;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px">
      <p style="margin:0 0 8px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:2px">Código de verificación</p>
      <p style="margin:0;color:#38bdf8;font-size:36px;font-weight:700;letter-spacing:8px;font-family:monospace">${opts.codigo}</p>
      <p style="margin:12px 0 0;color:#64748b;font-size:12px">Válido por 15 minutos</p>
    </div>`;

  await enviar({
    to:      opts.to,
    subject: "Verifica tu correo — Sistema de Egresados Estadística UMSA",
    html:    baseTemplate("Verificación de correo", contenido),
    codigo:  opts.codigo,
  });
}