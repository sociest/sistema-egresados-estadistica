"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, LogIn, X, ChevronRight,
  TrendingUp, Users, Briefcase, Award,
  Star, ArrowRight, Search, MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Modal de login ────────────────────────────────────────────────────── */
function LoginModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [show,  setShow]  = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [ci,       setCi]       = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [visible,  setVisible]  = useState(false);

  useEffect(() => {
    // Pequeño delay para que la animación de entrada sea visible
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
    if (!password)  { setError("Ingresa tu contraseña"); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/login", {
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
        background: "rgba(30,43,59,0.75)",
        backdropFilter: "blur(6px)",
        transition: "opacity 0.2s ease",
        opacity: visible ? 1 : 0,
      }}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: "var(--blanco)",
          boxShadow: "0 25px 60px rgba(30,43,59,0.30), 0 10px 20px rgba(30,43,59,0.12)",
          transition: "transform 0.25s cubic-bezier(.16,1,.3,1), opacity 0.25s ease",
          transform: visible ? "scale(1) translateY(0)" : "scale(0.95) translateY(12px)",
          opacity: visible ? 1 : 0,
        }}
      >
        {/* Header del modal */}
        <div
          className="px-8 py-6 flex items-center justify-between"
          style={{ background: "var(--marino)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div>
            <p className="text-white font-bold text-lg" style={{ fontFamily: "'Source Serif 4', serif" }}>
              Acceso Egresados
            </p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
              Sistema de Seguimiento · UMSA
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
            style={{ color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.07)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.14)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-8 py-7">
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
                <a href="/recuperar-password" className="text-xs font-medium transition-colors" style={{ color: "var(--turquesa)" }}>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "var(--placeholder)" }}
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <p className="error-box">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading
                ? <><span className="spinner" /> Ingresando...</>
                : <><LogIn className="w-4 h-4" /> Ingresar</>}
            </button>
          </form>

          <div
            className="mt-5 rounded-xl px-4 py-3 text-xs"
            style={{ background: "var(--turquesa-pale)", border: "1px solid rgba(0,165,168,0.15)", color: "var(--grafito)" }}
          >
            <strong style={{ color: "var(--turquesa-dark)" }}>¿Primera vez?</strong>{" "}
            Ingresa con tu número de CI como usuario y contraseña. Al acceder podrás configurar tu cuenta.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Tarjeta de egresado ───────────────────────────────────────────────── */
interface EgresadoData {
  id:                 number;
  nombres:            string;
  apellidoPaterno:    string | null;
  apellidoMaterno:    string | null;
  tituloAcademico:    string | null;
  empleoActual:       string | null;
  ciudadActual:       string | null;
}

function EgresadoCard({ eg }: { eg: EgresadoData }) {
  const initials = `${(eg.apellidoPaterno ?? eg.apellidoMaterno ?? "")[0] ?? ""}${eg.nombres[0] ?? ""}`;
  const nombre = [eg.apellidoPaterno, eg.apellidoMaterno].filter(Boolean).join(" ")
    ? `${[eg.apellidoPaterno, eg.apellidoMaterno].filter(Boolean).join(" ")}, ${eg.nombres}`
    : eg.nombres;

  const [cargo, empresa] = eg.empleoActual?.split(" — ") ?? [null, null];

  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: "var(--blanco)", border: "1px solid var(--borde)", boxShadow: "var(--shadow-sm)" }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--turquesa)";
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-turq)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--borde)";
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm"
          style={{ background: "var(--turquesa-light)", color: "var(--turquesa-dark)" }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: "var(--azul-pizarra)" }}>
            {nombre}
          </p>
          {cargo   && <p className="text-xs truncate" style={{ color: "var(--grafito)" }}>{cargo}</p>}
          {empresa && <p className="text-xs truncate" style={{ color: "var(--placeholder)" }}>{empresa}</p>}
          {!eg.empleoActual && eg.tituloAcademico && (
            <p className="text-xs truncate italic" style={{ color: "var(--placeholder)" }}>{eg.tituloAcademico}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {eg.ciudadActual && (
          <span
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
            style={{ background: "var(--humo)", color: "var(--grafito)", border: "1px solid var(--borde)" }}
          >
            <MapPin className="w-3 h-3" /> {eg.ciudadActual}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Skeleton card ─────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--blanco)", border: "1px solid var(--borde)" }}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl shrink-0" style={{ background: "var(--borde)" }} />
        <div className="flex-1 space-y-2">
          <div className="h-3 rounded-full w-3/4" style={{ background: "var(--borde)" }} />
          <div className="h-2.5 rounded-full w-1/2" style={{ background: "var(--humo)" }} />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <div className="h-5 rounded-full w-16" style={{ background: "var(--humo)" }} />
        <div className="h-5 rounded-full w-20" style={{ background: "var(--humo)" }} />
      </div>
    </div>
  );
}

/* ─── Página principal ──────────────────────────────────────────────────── */
export default function LandingLoginPage() {
  const [modalOpen,    setModalOpen]    = useState(false);
  const [egresados,    setEgresados]    = useState<EgresadoData[]>([]);
  const [loadingEg,    setLoadingEg]    = useState(true);
  const [noticiasPrev, setNoticiasPrev] = useState<any[]>([]);
  const [stats,        setStats]        = useState<{
    totalTitulados:           number;
    totalEgresados:           number;
    tasaEmpleabilidad:        number;
    tiempoPromedioTitulacion: number;
    tiempoPromedioInsercion:  number;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetch("/api/egresados/destacados")
      .then(r => r.json())
      .then(j => { if (j.data) setEgresados(j.data); })
      .catch(() => {})
      .finally(() => setLoadingEg(false));

    fetch("/api/noticias?limite=3")
      .then(r => r.json())
      .then(j => { if (j.data) setNoticiasPrev(j.data); })
      .catch(() => {});

    fetch("/api/stats/publicos")
      .then(r => r.json())
      .then(j => { if (j.data) setStats(j.data); })
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  const kpiItems = [
    {
      icon: Users,
      value: stats ? `${stats.totalTitulados}` : "—",
      label: "Titulados registrados",
      caption: "Profesionales estadísticos aportando al desarrollo del país",
      delay: "0s",
    },
    {
      icon: Briefcase,
      value: stats ? `${stats.tasaEmpleabilidad}%` : "—",
      label: "Tasa de empleabilidad",
      caption: "Nuestros egresados destacan en el ámbito laboral",
      delay: "0.08s",
    },
    {
      icon: TrendingUp,
      value: stats?.tiempoPromedioTitulacion ? `${stats.tiempoPromedioTitulacion}m` : "—",
      label: "Meses egreso → titulación",
      caption: "Seguimiento real al avance académico y profesional",
      delay: "0.16s",
    },
    {
      icon: Award,
      value: stats?.tiempoPromedioInsercion ? `${stats.tiempoPromedioInsercion}m` : "—",
      label: "Meses hasta primer empleo",
      caption: "Impulsando la inserción laboral de nuestros titulados",
      delay: "0.24s",
    },
  ];

  return (
    <>
      {modalOpen && <LoginModal onClose={() => setModalOpen(false)} />}

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, var(--marino) 0%, #1a3555 60%, #0f2440 100%)`,
          minHeight: "calc(100vh - 64px)",
        }}
      >
        {/* Decoración SVG de fondo — círculos concéntricos + cuadrícula */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
          {/* Círculos concéntricos esquina superior derecha */}
          <svg
            className="absolute top-0 right-0 w-[600px] h-[600px]"
            style={{ opacity: 0.04 }}
            viewBox="0 0 600 600"
            fill="none"
          >
            <circle cx="400" cy="200" r="300" stroke="white" strokeWidth="1" />
            <circle cx="400" cy="200" r="220" stroke="white" strokeWidth="1" />
            <circle cx="400" cy="200" r="140" stroke="white" strokeWidth="1" />
            <circle cx="400" cy="200" r="60"  stroke="white" strokeWidth="1" />
            <line x1="0"   y1="200" x2="600" y2="200" stroke="white" strokeWidth="0.5" />
            <line x1="400" y1="0"   x2="400" y2="600" stroke="white" strokeWidth="0.5" />
          </svg>

          {/* Cuadrícula de puntos */}
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ opacity: 0.035 }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>

          {/* Onda inferior */}
          <svg
            className="absolute bottom-0 left-0 w-full"
            style={{ opacity: 0.06 }}
            viewBox="0 0 1400 200"
            preserveAspectRatio="none"
          >
            <path
              d="M0,200 C100,200 200,20 350,20 C500,20 550,180 700,180 C850,180 900,20 1050,20 C1200,20 1300,200 1400,200 Z"
              fill="white"
            />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Texto izquierda */}
            <div className="animate-fade-up">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
                style={{ background: "rgba(0,165,168,0.15)", color: "var(--turquesa)", border: "1px solid rgba(0,165,168,0.25)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                Sistema de Seguimiento de Egresados
              </div>

              <h1
                className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6"
                style={{ fontFamily: "'Source Serif 4', serif", letterSpacing: "-0.02em" }}
              >
                Conectamos egresados,{" "}
                <span style={{ color: "var(--turquesa)" }}>impulsamos carreras</span>
              </h1>

              <p className="text-lg mb-8 leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                La Carrera de Estadística mantiene un directorio actualizado de sus egresados.
                Mantén tu perfil al día y aparece en nuestro directorio — visible para empleadores
                y colegas del área.
              </p>

              {/* CTAs — el principal debe estar above the fold en móvil */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: "var(--turquesa)",
                    color: "white",
                    boxShadow: "0 4px 20px rgba(0,165,168,0.35)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "var(--turquesa-dark)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,165,168,0.45)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "var(--turquesa)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,165,168,0.35)";
                  }}
                >
                  <LogIn className="w-4 h-4" />
                  Soy egresado — Acceder
                </button>

                
                 <a href="/directorio"
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.85)",
                    border: "1px solid rgba(255,255,255,0.14)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.14)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  }}
                >
                  <Search className="w-4 h-4" />
                  Ver directorio
                </a>
              </div>
            </div>

            {/* KPI cards con entrada escalonada */}
            <div className="grid grid-cols-2 gap-4">
              {loadingStats ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-5 animate-pulse"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
                  >
                    <div className="w-10 h-10 rounded-xl mb-3" style={{ background: "rgba(255,255,255,0.08)" }} />
                    <div className="h-8 rounded-lg mb-2 w-3/4" style={{ background: "rgba(255,255,255,0.08)" }} />
                    <div className="h-3 rounded-lg w-full" style={{ background: "rgba(255,255,255,0.05)" }} />
                  </div>
                ))
              ) : (
                kpiItems.map(({ icon: Icon, value, label, caption, delay }, i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-6 flex flex-col justify-between min-h-[200px] relative overflow-hidden animate-fade-up"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      backdropFilter: "blur(10px)",
                      animationDelay: delay,
                      animationFillMode: "both",
                    }}
                  >
                    {/* Número decorativo de fondo */}
                    <div
                      className="absolute -right-4 -bottom-4 text-[100px] font-bold pointer-events-none select-none leading-none"
                      style={{ color: "rgba(255,255,255,0.03)" }}
                    >
                      0{i + 1}
                    </div>

                    <div>
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                        style={{ background: "rgba(0,165,168,0.15)" }}
                      >
                        <Icon className="w-5 h-5" style={{ color: "var(--turquesa)" }} />
                      </div>

                      <p
                        className="text-4xl font-bold text-white leading-none mb-2"
                        style={{ fontFamily: "'Source Serif 4', serif" }}
                      >
                        {value}
                      </p>

                      <p className="text-sm font-semibold mb-2" style={{ color: "rgba(255,255,255,0.88)" }}>
                        {label}
                      </p>

                      <div className="w-10 h-1 rounded-full mb-3" style={{ background: "var(--turquesa)" }} />

                      <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.50)" }}>
                        {caption}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── POR QUÉ ACTUALIZAR TU PERFIL ─────────────────────────────────── */}
      <section className="py-20" style={{ background: "var(--blanco)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ background: "var(--turquesa-light)", color: "var(--turquesa-dark)" }}
            >
              ¿Por qué actualizarlo?
            </span>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}
            >
              Tu perfil actualizado te abre puertas
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: "var(--grafito)" }}>
              Un directorio activo beneficia a toda la comunidad de estadísticos de la UMSA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                emoji: "🔍",
                title: "Visibilidad profesional",
                desc: "Tu perfil aparece en el directorio público. Empleadores y proyectos pueden encontrarte directamente.",
                highlight: "Más arriba si tu perfil está completo",
              },
              {
                emoji: "🤝",
                title: "Red de egresados",
                desc: "Conecta con colegas que ya ejercen en tu área. Colaboraciones, referencias y oportunidades laborales.",
                highlight: "Comunidad activa de estadísticos",
              },
              {
                emoji: "📊",
                title: "Ayudas a la carrera",
                desc: "Los datos de empleabilidad ayudan a mejorar la currícula y los programas de formación.",
                highlight: "Impacto real en generaciones futuras",
              },
            ].map(({ emoji, title, desc, highlight }, i) => (
              <div
                key={i}
                className="rounded-2xl p-7 transition-all duration-200 group"
                style={{
                  background: "var(--humo)",
                  border: "1px solid var(--borde)",
                  boxShadow: "var(--shadow-sm)",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(-4px)";
                  el.style.boxShadow = "var(--shadow-turq)";
                  el.style.borderColor = "var(--turquesa)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "var(--shadow-sm)";
                  el.style.borderColor = "var(--borde)";
                }}
              >
                {/* Ícono más grande */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 text-2xl transition-transform duration-200 group-hover:scale-110"
                  style={{ background: "var(--turquesa-light)" }}
                >
                  {emoji}
                </div>
                <h3
                  className="font-bold text-lg mb-2"
                  style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}
                >
                  {title}
                </h3>
                <p className="text-sm mb-5 leading-relaxed" style={{ color: "var(--grafito)" }}>
                  {desc}
                </p>
                <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--turquesa-dark)" }}>
                  <Star className="w-3.5 h-3.5" />
                  {highlight}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: "var(--marino)",
                color: "white",
                boxShadow: "0 4px 16px rgba(30,43,59,0.20)",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "var(--marino-mid)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(30,43,59,0.28)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "var(--marino)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(30,43,59,0.20)";
              }}
            >
              Actualizar mi perfil ahora
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── DIRECTORIO PREVIEW ───────────────────────────────────────────── */}
      <section id="directorio" className="py-20" style={{ background: "var(--humo)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
            <div>
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3"
                style={{ background: "var(--turquesa-light)", color: "var(--turquesa-dark)" }}
              >
                Directorio público
              </span>
              <h2 className="text-3xl font-bold" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
                Egresados destacados
              </h2>
              <p className="text-sm mt-1" style={{ color: "var(--grafito)" }}>
                {loadingEg
                  ? "Cargando…"
                  : egresados.length > 0
                    ? "Estadísticos de la UMSA más recientemente actualizados"
                    : "Aún no hay egresados en el directorio público"}
              </p>
            </div>

            <a
              href="/directorio"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shrink-0 transition-all"
              style={{
                background: "var(--blanco)",
                color: "var(--azul-pizarra)",
                border: "1.5px solid var(--borde)",
                boxShadow: "var(--shadow-sm)",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--turquesa)";
                (e.currentTarget as HTMLElement).style.color = "var(--turquesa-dark)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--borde)";
                (e.currentTarget as HTMLElement).style.color = "var(--azul-pizarra)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              Ver directorio completo
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Grid de egresados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingEg
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={cn("animate-fade-up")} style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "both" }}>
                    <SkeletonCard />
                  </div>
                ))
              : egresados.length > 0
                ? egresados.map((eg, i) => (
                    <div key={eg.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "both" }}>
                      <EgresadoCard eg={eg} />
                    </div>
                  ))
                : (
                  <div className="col-span-3 text-center py-12">
                    <p className="text-sm" style={{ color: "var(--placeholder)" }}>
                      Ningún egresado ha activado aún su visibilidad en el directorio.
                    </p>
                    <button
                      onClick={() => setModalOpen(true)}
                      className="mt-4 btn-primary btn-sm inline-flex"
                    >
                      Sé el primero — Activar mi perfil
                    </button>
                  </div>
                )
            }
          </div>

          {/* CTA para egresados */}
          <div
            className="mt-10 rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6"
            style={{
              background: `linear-gradient(135deg, var(--marino) 0%, #1a3555 100%)`,
              border: "1px solid rgba(0,165,168,0.20)",
            }}
          >
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Source Serif 4', serif" }}>
                ¿Eres egresado o titulado de la carrera?
              </h3>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                Aparece en este directorio. Los perfiles actualizados se muestran primero
                y son más visibles para empleadores y proyectos de investigación.
              </p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm shrink-0 transition-all"
              style={{ background: "var(--turquesa)", color: "white", boxShadow: "0 4px 16px rgba(0,165,168,0.35)" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "var(--turquesa-dark)";
                (e.currentTarget as HTMLElement).style.transform = "scale(1.03)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "var(--turquesa)";
                (e.currentTarget as HTMLElement).style.transform = "scale(1)";
              }}
            >
              <LogIn className="w-4 h-4" />
              Unirme al directorio
            </button>
          </div>
        </div>
      </section>

      {/* ── Noticias recientes ── */}
      {noticiasPrev.length > 0 && (
        <section className="py-16" style={{ background: "var(--blanco)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3"
                  style={{ background: "var(--turquesa-light)", color: "var(--turquesa-dark)" }}
                >
                  Últimas novedades
                </span>
                <h2
                  className="text-3xl font-bold"
                  style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}
                >
                  Noticias y Eventos
                </h2>
              </div>
              <a
                href="/noticias"
                className="text-sm font-semibold transition-colors"
                style={{ color: "var(--turquesa-dark)" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--turquesa)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--turquesa-dark)"}
              >
                Ver todas →
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {noticiasPrev.map((n: any) => {
                const tipoLabel: Record<string, string> = {
                  noticia_institucional: "Institucional",
                  curso_evento:          "Curso / Evento",
                  noticia_social:        "Social",
                };
                const tipoColor: Record<string, { bg: string; color: string }> = {
                  noticia_institucional: { bg: "var(--turquesa-light)",         color: "var(--turquesa-dark)" },
                  curso_evento:          { bg: "rgba(139,92,246,0.10)",         color: "#7c3aed" },
                  noticia_social:        { bg: "var(--naranja-light)",          color: "var(--naranja)" },
                };
                const tc = tipoColor[n.tipo] ?? tipoColor.noticia_institucional;

                return (
                  <a
                    key={n.id}
                    href="/noticias"
                    className="rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-1"
                    style={{
                      background: "var(--humo)",
                      border: "1px solid var(--borde)",
                      boxShadow: "var(--shadow-sm)",
                      textDecoration: "none",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--turquesa)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-turq)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--borde)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
                    }}
                  >
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full w-fit"
                      style={{ background: tc.bg, color: tc.color }}
                    >
                      {tipoLabel[n.tipo] ?? n.tipo}
                    </span>
                    <p
                      className="font-bold text-sm leading-snug"
                      style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}
                    >
                      {n.titulo}
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--grafito)" }}>
                      {n.cuerpo.slice(0, 120)}{n.cuerpo.length > 120 ? "…" : ""}
                    </p>
                    <p className="text-xs mt-auto" style={{ color: "var(--placeholder)" }}>
                      {new Date(n.fecha).toLocaleDateString("es-BO", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </p>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}