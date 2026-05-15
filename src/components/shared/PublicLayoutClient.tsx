// src/components/shared/PublicLayoutClient.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, X, GraduationCap } from "lucide-react";

function LoginModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ci, setCi] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!ci.trim()) { setError("Ingresa tu CI"); return; }
    if (!password) { setError("Ingresa tu contraseña"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: ci.trim(), password }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      if (json.data?.primerLogin) {
        sessionStorage.setItem("activacion_idUsuario", String(json.data.idUsuario));
        router.push("/activar-cuenta");
        return;
      }
      router.push(json.data.rol === "admin" ? "/dashboard" : "/mi-perfil");
      router.refresh();
    } finally { setLoading(false); }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(0,18,40,0.85)",
        backdropFilter: "blur(8px)",
        transition: "opacity 0.2s ease",
        opacity: visible ? 1 : 0,
      }}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="w-full max-w-md overflow-hidden"
        style={{
          background: "var(--blanco)",
          borderRadius: "2rem",
          boxShadow: "0 30px 80px rgba(0,29,61,0.40), 0 0 0 1px rgba(0,68,126,0.12)",
          transition: "transform 0.3s cubic-bezier(.16,1,.3,1), opacity 0.25s ease",
          transform: visible ? "scale(1) translateY(0)" : "scale(0.94) translateY(16px)",
          opacity: visible ? 1 : 0,
        }}
      >
        <div style={{ height: "6px", background: "linear-gradient(90deg, #00447e 0%, #00A5A8 50%, #ea580c 100%)" }} />

        <div className="px-8 pt-7 pb-8">
          <div className="flex items-start justify-between mb-7">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--turquesa-light)" }}>
                  <GraduationCap className="w-5 h-5" style={{ color: "var(--turquesa-dark)" }} />
                </div>
                <div>
                  <p className="font-bold text-base leading-tight" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
                    Acceso al Sistema
                  </p>
                  <p className="text-xs" style={{ color: "var(--placeholder)" }}>Carrera de Estadística · UMSA</p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl transition-colors"
              style={{ color: "var(--placeholder)", background: "var(--humo)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--borde)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--humo)"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label">Número de CI</label>
              <input
                type="text"
                value={ci}
                onChange={e => setCi(e.target.value)}
                autoComplete="username"
                autoFocus
                placeholder="Ej: 12345678"
                className="field"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Contraseña</label>
                <a href="/recuperar-password" className="text-xs font-medium" style={{ color: "var(--turquesa)" }}>
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--placeholder)" }}
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <p className="error-box">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-1 text-sm font-bold tracking-wide"
            >
              {loading
                ? <><span className="spinner" /> Ingresando...</>
                : <><LogIn className="w-4 h-4" /> Ingresar al sistema</>}
            </button>
          </form>

          <div
            className="mt-5 rounded-2xl px-4 py-3.5 text-xs"
            style={{ background: "var(--turquesa-pale)", border: "1px solid rgba(0,165,168,0.18)", color: "var(--gris-grafito)" }}
          >
            <strong style={{ color: "var(--turquesa-dark)" }}>¿Primera vez?</strong>{" "}
            Ingresa con tu número de CI como usuario y contraseña. Al acceder podrás configurar tu cuenta.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicLayoutClient() {
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const handler = () => setModalOpen(true);
    window.addEventListener("abrir-modal-login", handler);
    return () => window.removeEventListener("abrir-modal-login", handler);
  }, []);

  if (!modalOpen) return null;
  return <LoginModal onClose={() => setModalOpen(false)} />;
}
