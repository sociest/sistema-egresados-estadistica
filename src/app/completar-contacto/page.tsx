"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, CheckCircle, ArrowRight, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

type Paso = "ingresar" | "verificar" | "listo";

export default function CompletarContactoPage() {
  const router   = useRouter();
  const [paso,   setPaso]   = useState<Paso>("ingresar");
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error,  setError]  = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [correoVerificado, setCorreoVerificado] = useState(false);

  const enviarCodigo = async () => {
    setError(null);
    if (!correo.trim()) { setError("Ingresa tu correo"); return; }

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/solicitar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "verificar_correo", correo: correo.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      setPaso("verificar");
    } finally { setLoading(false); }
  };

  const verificarCodigo = async () => {
    setError(null);
    if (codigo.length !== 6) { setError("El código debe tener 6 dígitos"); return; }

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/verificar-contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "verificar_correo", codigo }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }

      setCorreoVerificado(true);
      setCodigo("");
      setPaso("listo");
    } finally { setLoading(false); }
  };

  const continuar = () => {
    router.push("/activar-cuenta");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-up">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                          bg-primary-600/20 border border-primary-500/30 mb-4">
            <Shield className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Agrega tu correo</h1>
          <p className="text-slate-400 text-sm">
            Necesitas un correo verificado para recuperar tu cuenta y cambiar tu contraseña
          </p>
        </div>

        <div className="card space-y-5">

          {/* Paso: ingresar correo */}
          {paso === "ingresar" && (
            <>
              <div>
                <label className="label flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> Correo electrónico
                </label>
                <input
                  type="email"
                  value={correo}
                  onChange={e => setCorreo(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && enviarCodigo()}
                  placeholder="tu@correo.com"
                  className="field"
                  autoFocus
                />
              </div>
              <p className="text-xs text-slate-500 text-center">
                Te enviaremos un código para confirmar tu dirección de correo
              </p>
              {error && <p className="error-box">{error}</p>}
              <button
                onClick={enviarCodigo}
                disabled={loading || !correo.trim()}
                className="btn-primary w-full py-3"
              >
                {loading ? <><span className="spinner" /> Enviando...</> : "Enviar código de verificación"}
              </button>
            </>
          )}

          {/* Paso: verificar código */}
          {paso === "verificar" && (
            <>
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{ background: "var(--turquesa-pale)", border: "1px solid rgba(0,165,168,0.20)" }}
              >
                Código enviado a <strong>{correo}</strong>
              </div>
              <div>
                <label className="label">Código de verificación</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={codigo}
                  onChange={e => setCodigo(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="field text-center text-2xl tracking-[0.5em] font-mono"
                  autoFocus
                />
              </div>
              {error && <p className="error-box">{error}</p>}
              <button
                onClick={verificarCodigo}
                disabled={loading || codigo.length !== 6}
                className="btn-primary w-full py-3"
              >
                {loading ? <><span className="spinner" /> Verificando...</> : "Verificar"}
              </button>
              <button
                onClick={() => { setPaso("ingresar"); setError(null); setCodigo(""); }}
                className="btn-ghost w-full text-sm"
              >
                Cambiar correo
              </button>
            </>
          )}

          {/* Paso: listo */}
          {paso === "listo" && (
            <>
              <div className="rounded-xl p-4 text-center"
                style={{ background: "var(--verde-light)", border: "1px solid #86efac" }}>
                <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--verde)" }} />
                <p className="font-semibold text-sm" style={{ color: "var(--verde)" }}>
                  Correo verificado
                </p>
                <p className="text-xs mt-1 text-slate-500">{correo}</p>
              </div>

              <button
                onClick={continuar}
                className="btn-primary w-full py-3"
              >
                Continuar a cambiar contraseña <ArrowRight className="w-4 h-4 inline ml-1" />
              </button>
            </>
          )}
        </div>

        <p className="text-center mt-6 text-slate-700 text-xs">
          Universidad Mayor de San Andrés · FCPN
        </p>
      </div>
    </div>
  );
}