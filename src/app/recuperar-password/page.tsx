"use client";
import { useState } from "react";
import Link from "next/link";
import { KeyRound, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type Paso = "ci" | "codigo" | "password" | "exito";

export default function RecuperarPasswordPage() {
  const [paso,    setPaso]    = useState<Paso>("ci");
  const [ci,      setCi]      = useState("");
  const [codigo,  setCodigo]  = useState("");
  const [pass1,   setPass1]   = useState("");
  const [pass2,   setPass2]   = useState("");
  const [show1,   setShow1]   = useState(false);
  const [show2,   setShow2]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const solicitarCodigo = async () => {
    if (!ci.trim()) { setError("Ingresa tu CI."); return; }
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/auth/solicitar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "reset_password", ci: ci.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      // Siempre avanzar al paso de código (siempre se envía al correo)
      setPaso("codigo");
    } finally { setLoading(false); }
  };

  const cambiarPassword = async () => {
    setError(null);
    if (pass1.length < 8) { setError("Mínimo 8 caracteres."); return; }
    if (pass1 !== pass2)  { setError("Las contraseñas no coinciden."); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/cambiar-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ci:                ci.trim(),
          codigo,
          nuevaPassword:     pass1,
          confirmarPassword: pass2,
          tipo:              "reset_password",
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      setPaso("exito");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                          bg-amber-500/20 border border-amber-500/30 mb-4">
            <KeyRound className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Recuperar contraseña</h1>
          <p className="text-slate-500 text-sm">
            {paso === "ci"       && "Ingresa tu número de CI"}
            {paso === "codigo"   && "Ingresa el código enviado a tu correo"}
            {paso === "password" && "Elige tu nueva contraseña"}
            {paso === "exito"    && "¡Contraseña actualizada!"}
          </p>
        </div>

        <div className="card space-y-5">

          {/* Paso 1: CI */}
          {paso === "ci" && (
            <>
              <div>
                <label className="label">Número de CI</label>
                <input
                  type="text"
                  value={ci}
                  onChange={e => setCi(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && solicitarCodigo()}
                  placeholder="Ej: 12345678"
                  className="field"
                  autoFocus
                />
              </div>
              <p className="text-xs text-slate-500 text-center">
                Si tienes un correo verificado, recibirás un código para restablecer tu contraseña
              </p>
              {error && <p className="error-box">{error}</p>}
              <button onClick={solicitarCodigo} disabled={loading || !ci.trim()} className="btn-primary w-full py-3">
                {loading ? <><span className="spinner" /> Enviando...</> : "Continuar"}
              </button>
              <Link href="/login" className="btn-ghost w-full text-sm flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Volver al login
              </Link>
            </>
          )}

          {/* Paso 2: código */}
          {paso === "codigo" && (
            <>
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{ background: "var(--turquesa-pale)", border: "1px solid rgba(0,165,168,0.20)" }}
              >
                Si tu CI tiene un correo verificado, ya recibiste el código. Revisa tu bandeja de entrada.
              </div>
              <div>
                <label className="label">Código de verificación</label>
                <input
                  type="text" inputMode="numeric" maxLength={6}
                  value={codigo}
                  onChange={e => setCodigo(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="field text-center text-2xl tracking-[0.5em] font-mono"
                  autoFocus
                />
              </div>
              {error && <p className="error-box">{error}</p>}
              <button
                onClick={() => {
                  if (codigo.length === 6) { setError(null); setPaso("password"); }
                  else setError("El código debe tener 6 dígitos");
                }}
                disabled={codigo.length !== 6}
                className="btn-primary w-full py-3"
              >
                Verificar código
              </button>
              <button
                onClick={() => { setPaso("ci"); setCodigo(""); setError(null); }}
                className="btn-ghost w-full text-sm"
              >
                <ArrowLeft className="w-4 h-4 inline mr-1" /> Volver
              </button>
            </>
          )}

          {/* Paso 3: nueva contraseña */}
          {paso === "password" && (
            <>
              <div>
                <label className="label">Nueva contraseña</label>
                <div className="relative">
                  <input type={show1 ? "text" : "password"} value={pass1}
                    onChange={e => setPass1(e.target.value)} placeholder="Mínimo 8 caracteres"
                    className="field pr-10" autoFocus />
                  <button type="button" onClick={() => setShow1(!show1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                    {show1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirmar contraseña</label>
                <div className="relative">
                  <input type={show2 ? "text" : "password"} value={pass2}
                    onChange={e => setPass2(e.target.value)} placeholder="Repite la contraseña"
                    className={cn("field pr-10", pass2 && pass1 !== pass2 && "field-err")} />
                  <button type="button" onClick={() => setShow2(!show2)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                    {show2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pass2 && pass1 !== pass2 && <p className="hint">Las contraseñas no coinciden</p>}
              </div>
              {pass1.length > 0 && (
                <div className="space-y-1">
                  {[
                    { ok: pass1.length >= 8, txt: "Mínimo 8 caracteres" },
                    { ok: /[A-Z]/.test(pass1) && /[a-z]/.test(pass1), txt: "Mayúscula y minúscula" },
                    { ok: /[0-9]/.test(pass1), txt: "Al menos un número" },
                  ].map(({ ok: cumple, txt }) => (
                    <p key={txt} className={cn("text-xs flex items-center gap-1.5",
                      cumple ? "text-emerald-400" : "text-slate-500")}>
                      <span>{cumple ? "✓" : "○"}</span> {txt}
                    </p>
                  ))}
                </div>
              )}
              {error && <p className="error-box">{error}</p>}
              <button
                onClick={cambiarPassword}
                disabled={loading || pass1.length < 8 || pass1 !== pass2
                  || !/[A-Z]/.test(pass1) || !/[a-z]/.test(pass1) || !/[0-9]/.test(pass1)}
                className="btn-primary w-full py-3">
                {loading ? <><span className="spinner" /> Actualizando...</> : "Cambiar contraseña"}
              </button>
            </>
          )}

          {/* Paso 4: éxito */}
          {paso === "exito" && (
            <>
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl
                                flex items-center justify-center mx-auto mb-4">
                  <span className="text-emerald-400 text-3xl">✓</span>
                </div>
                <p className="text-white font-semibold mb-1">¡Listo!</p>
                <p className="text-slate-500 text-sm">Tu contraseña fue actualizada.</p>
              </div>
              <Link href="/login" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                Ir al login
              </Link>
            </>
          )}
        </div>

        <p className="text-center mt-6 text-slate-700 text-xs">Universidad Mayor de San Andrés · FCPN</p>
      </div>
    </div>
  );
}