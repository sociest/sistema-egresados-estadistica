"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, LogIn, X,
  TrendingUp, Users, Briefcase, Award,
  ArrowRight, Search, MapPin, ChevronRight,
  GraduationCap, BarChart3, Globe2, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Avatar from "@/components/shared/Avatar";

/* ─────────────────────────────────────────────────────────────────────────────
   MODAL DE LOGIN
───────────────────────────────────────────────────────────────────────────── */
function LoginModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [show,     setShow]     = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [ci,       setCi]       = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [visible,  setVisible]  = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { cancelAnimationFrame(t); document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!ci.trim()) { setError("Ingresa tu CI"); return; }
    if (!password)  { setError("Ingresa tu contraseña"); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ correo: ci.trim(), password }) });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      if (json.data?.primerLogin) { sessionStorage.setItem("activacion_idUsuario", String(json.data.idUsuario)); router.push("/activar-cuenta"); return; }
      router.push(json.data.rol === "admin" ? "/dashboard" : "/mi-perfil");
      router.refresh();
    } finally { setLoading(false); }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,18,40,0.85)", backdropFilter: "blur(8px)", transition: "opacity 0.2s ease", opacity: visible ? 1 : 0 }}
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
        {/* Franja superior con gradiente */}
        <div style={{ height: "6px", background: "linear-gradient(90deg, #00447e 0%, #00A5A8 50%, #ea580c 100%)" }} />

        <div className="px-8 pt-7 pb-8">
          {/* Header */}
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
            <button onClick={onClose} className="p-2 rounded-xl transition-colors" style={{ color: "var(--placeholder)", background: "var(--humo)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--borde)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--humo)"}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label">Número de CI</label>
              <input type="text" value={ci} onChange={e => setCi(e.target.value)} autoComplete="username" autoFocus placeholder="Ej: 12345678" className="field" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Contraseña</label>
                <a href="/recuperar-password" className="text-xs font-medium" style={{ color: "var(--turquesa)" }}>¿Olvidaste tu contraseña?</a>
              </div>
              <div className="relative">
                <input type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" placeholder="••••••••" className="field pr-10" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--placeholder)" }}>
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <p className="error-box">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-1 text-sm font-bold tracking-wide">
              {loading ? <><span className="spinner" /> Ingresando...</> : <><LogIn className="w-4 h-4" /> Ingresar al sistema</>}
            </button>
          </form>

          <div className="mt-5 rounded-2xl px-4 py-3.5 text-xs" style={{ background: "var(--turquesa-pale)", border: "1px solid rgba(0,165,168,0.18)", color: "var(--gris-grafito)" }}>
            <strong style={{ color: "var(--turquesa-dark)" }}>¿Primera vez?</strong>{" "}
            Ingresa con tu número de CI como usuario y contraseña. Al acceder podrás configurar tu cuenta.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CARD DE EGRESADO
───────────────────────────────────────────────────────────────────────────── */
interface EgresadoData {
  id: number; nombres: string; apellidoPaterno: string | null; apellidoMaterno: string | null;
  tituloAcademico: string | null; empleoActual: string | null; ciudadActual: string | null;
  fotoUrl: string | null;
}

function EgresadoCard({ eg, delay }: { eg: EgresadoData; delay: number }) {
  const initials = `${(eg.apellidoPaterno ?? eg.apellidoMaterno ?? "")[0] ?? ""}${eg.nombres[0] ?? ""}`;
  const nombre   = [eg.apellidoPaterno, eg.apellidoMaterno].filter(Boolean).join(" ")
    ? `${[eg.apellidoPaterno, eg.apellidoMaterno].filter(Boolean).join(" ")}, ${eg.nombres}` : eg.nombres;
  const [cargo, empresa] = eg.empleoActual?.split(" — ") ?? [null, null];

  return (
    <div
      className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 group animate-fade-up"
      style={{
        background: "var(--blanco)", border: "1px solid var(--borde)",
        boxShadow: "var(--shadow-sm)", animationDelay: `${delay}s`, animationFillMode: "both",
      }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--turquesa)"; el.style.boxShadow = "var(--shadow-turq)"; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--borde)"; el.style.boxShadow = "var(--shadow-sm)"; }}
    >
      <div className="flex items-start gap-3">
        <Avatar
          fotoUrl={eg.fotoUrl}
          nombres={eg.nombres}
          apellidoPaterno={eg.apellidoPaterno}
          size="md"
          className="transition-transform duration-300 group-hover:scale-105"
        />
        <div className="min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>{nombre}</p>
          {cargo   && <p className="text-xs truncate mt-0.5" style={{ color: "var(--gris-grafito)" }}>{cargo}</p>}
          {empresa && <p className="text-xs truncate" style={{ color: "var(--placeholder)" }}>{empresa}</p>}
          {!eg.empleoActual && eg.tituloAcademico && <p className="text-xs truncate italic" style={{ color: "var(--placeholder)" }}>{eg.tituloAcademico}</p>}
        </div>
      </div>
      {eg.ciudadActual && (
        <div className="flex items-center gap-1 mt-3">
          <MapPin className="w-3 h-3 shrink-0" style={{ color: "var(--turquesa)" }} />
          <span className="text-xs" style={{ color: "var(--gris-grafito)" }}>{eg.ciudadActual}</span>
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-5 animate-pulse" style={{ background: "var(--blanco)", border: "1px solid var(--borde)" }}>
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl shrink-0" style={{ background: "var(--borde)" }} />
        <div className="flex-1 space-y-2">
          <div className="h-3 rounded-full w-3/4" style={{ background: "var(--borde)" }} />
          <div className="h-2.5 rounded-full w-1/2" style={{ background: "var(--humo)" }} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────────────────────────────────────── */
export default function LandingLoginPage() {
  const [egresados,     setEgresados]     = useState<EgresadoData[]>([]);
  const [loadingEg,     setLoadingEg]     = useState(true);
  const [noticiasPrev,  setNoticiasPrev]  = useState<any[]>([]);
  const [stats,         setStats]         = useState<{
    totalTitulados: number; totalEgresados: number; tasaEmpleabilidad: number;
    tiempoPromedioTitulacion: number; tiempoPromedioInsercion: number;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [counters,     setCounters]     = useState({ titulados: 0, empleabilidad: 0, meses: 0, egresados: 0 });

  useEffect(() => {
    fetch("/api/egresados/destacados").then(r => r.json()).then(j => { if (j.data) setEgresados(j.data); }).catch(() => {}).finally(() => setLoadingEg(false));
    fetch("/api/noticias?limite=3").then(r => r.json()).then(j => { if (j.data) setNoticiasPrev(j.data); }).catch(() => {});
    fetch("/api/stats/publicos").then(r => r.json()).then(j => {
      if (j.data) {
        setStats(j.data);
        // Animación de contadores
        const target = { titulados: j.data.totalTitulados, empleabilidad: j.data.tasaEmpleabilidad, meses: Math.round(j.data.tiempoPromedioInsercion || 0), egresados: j.data.totalEgresados };
        const steps = 40;
        let step = 0;
        const interval = setInterval(() => {
          step++;
          const t = step / steps;
          const ease = 1 - Math.pow(1 - t, 3);
          setCounters({ titulados: Math.round(target.titulados * ease), empleabilidad: Math.round(target.empleabilidad * ease), meses: Math.round(target.meses * ease), egresados: Math.round(target.egresados * ease) });
          if (step >= steps) clearInterval(interval);
        }, 30);
      }
    }).catch(() => {}).finally(() => setLoadingStats(false));
  }, []);

  return (
    <>

      {/* ══════════════════════════════════════════════════════════════════
          HERO — sección principal
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(160deg, #001d3d 0%, #003666 55%, #00447e 100%)", minHeight: "100vh" }}>

        {/* ── Decoración de fondo ── */}
        <div className="pointer-events-none absolute inset-0 select-none" aria-hidden="true">
          {/* Textura de puntos */}
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
          {/* Círculos decorativos grandes */}
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, #00A5A8 0%, transparent 70%)" }} />
          <div className="absolute -bottom-48 -left-48 w-[700px] h-[700px] rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle, #ea580c 0%, transparent 70%)" }} />
          {/* Líneas SVG decorativas */}
          <svg className="absolute right-0 top-0 h-full w-[55%] opacity-[0.05]" viewBox="0 0 800 900" fill="none" preserveAspectRatio="xMidYMid slice">
            <path d="M0 200 Q200 0 400 200 T800 200" stroke="white" strokeWidth="2" />
            <path d="M0 350 Q200 150 400 350 T800 350" stroke="#00A5A8" strokeWidth="1.5" />
            <path d="M0 500 Q200 300 400 500 T800 500" stroke="white" strokeWidth="1" opacity="0.5" />
            <path d="M0 650 Q200 450 400 650 T800 650" stroke="#ea580c" strokeWidth="1.5" opacity="0.6" />
          </svg>
          {/* Símbolo matemático σ decorativo */}
          <div className="absolute top-16 right-1/4 hidden lg:block text-[180px] font-black italic select-none opacity-[0.04]" style={{ fontFamily: "'Source Serif 4', serif", color: "white" }}>σ</div>
          {/* Grid de líneas */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" viewBox="0 0 1400 900" preserveAspectRatio="none" fill="none">
            {[...Array(8)].map((_, i) => <line key={i} x1={i * 200} y1="0" x2={i * 200} y2="900" stroke="white" strokeWidth="1" />)}
            {[...Array(5)].map((_, i) => <line key={i} x1="0" y1={i * 200} x2="1400" y2={i * 200} stroke="white" strokeWidth="1" />)}
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* ── Columna izquierda — texto ── */}
            <div className="animate-fade-up">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8"
                style={{ background: "rgba(0,165,168,0.15)", border: "1px solid rgba(0,165,168,0.30)", backdropFilter: "blur(8px)" }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#00A5A8" }} />
                <span className="font-bold uppercase tracking-[0.2em]" style={{ fontSize: "11px", color: "#4DD4D5" }}>Sistema de Seguimiento de Egresados</span>
              </div>

              {/* Título principal */}
              <h1 className="mb-6 leading-[0.95] font-black uppercase tracking-tighter" style={{ fontSize: "clamp(3.2rem, 6vw, 5.5rem)", color: "white" }}>
                Conectamos<br />
                <span className="font-serif italic lowercase tracking-normal" style={{ color: "#00A5A8", fontSize: "clamp(3rem, 5.5vw, 5rem)" }}>egresados y titulados</span>
                <br />
                <span style={{ color: "rgba(255,255,255,0.85)" }}>de estadística</span>
              </h1>

              {/* Descripción */}
              <p className="mb-10 font-medium leading-relaxed rounded-r-2xl border-l-4 py-4 pl-6 max-w-lg"
                style={{ fontSize: "16px", color: "rgba(255,255,255,0.72)", borderColor: "#ea580c", background: "rgba(255,255,255,0.05)" }}>
                La Carrera de Estadística de la UMSA mantiene un directorio actualizado de sus profesionales.
                Mantén tu perfil al día y sé visible ante empleadores y colegas del área.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => window.dispatchEvent(new CustomEvent("abrir-modal-login"))}
                  className="group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 hover:-translate-y-1"
                  style={{ background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)", color: "white", boxShadow: "0 8px 32px rgba(234,88,12,0.45)" }}>
                  
                  Soy egresado  Acceder
                  
                </button>
                <a href="/directorio"
                  className="group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 hover:-translate-y-1"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", border: "1.5px solid rgba(255,255,255,0.18)", backdropFilter: "blur(8px)" }}>
                  <Search className="w-4 h-4" />
                  Ver directorio
                </a>
              </div>

              
            </div>

            {/* ── Columna derecha — KPI cards ── */}
            <div className="grid grid-cols-2 gap-6 lg:pl-8 w-full max-w-[540px] justify-self-end">
              {loadingStats ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-[2.5rem] p-6 animate-pulse bg-white/10 border border-white/10 min-height-[240px]" />
              )) : [
                { icon: Users, value: counters.titulados, label: "Titulados registrados", caption: "Profesionales estadísticos en Bolivia", delay: "0s", accent: "#00A5A8", bg: "rgba(0,165,168,0.12)", glow: "rgba(0,165,168,0.15)" },
                { icon: Briefcase, value: `${counters.empleabilidad}%`, label: "Tasa de empleabilidad", caption: "De nuestros titulados con empleo activo", delay: "0.1s", accent: "#ea580c", bg: "rgba(234,88,12,0.12)", glow: "rgba(234,88,12,0.15)" },
                { icon: TrendingUp, value: counters.meses ? `${counters.meses}m` : "—", label: "Meses inserción laboral", caption: "Promedio hasta primer empleo", delay: "0.2s", accent: "#00447e", bg: "rgba(0,68,126,0.12)", glow: "rgba(0,68,126,0.15)" },
                { icon: Award, value: counters.egresados, label: "Egresados registrados", caption: "Seguimiento académico completo", delay: "0.3s", accent: "#16a34a", bg: "rgba(22,163,74,0.12)", glow: "rgba(22,163,74,0.15)" },
              ].map(({ icon: Icon, value, label, caption, delay, accent, bg, glow }, i) => (
                <div key={i}
                  className="relative rounded-[2.5rem] flex flex-col justify-between overflow-hidden animate-fade-up group"
                  style={{
                    background: "linear-gradient(135deg, #cecece 0%, #f8fafc 100%)",
                    border: `2px solid ${accent}20`,
                    minHeight: "245px",
                    animationDelay: delay,
                    animationFillMode: "both",
                    boxShadow: "0 10px 30px -10px rgba(0,29,61,0.3), 0 1px 3px rgba(0,0,0,0.05)",
                    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                    padding: "1.75rem 1.75rem 0 1.75rem",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = "translateY(-10px) scale(1.03)";
                    el.style.borderColor = accent;
                    el.style.boxShadow = `0 30px 50px -15px rgba(0,29,61,0.5), 0 0 30px ${glow}`;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = "translateY(0) scale(1)";
                    el.style.borderColor = `${accent}20`;
                    el.style.boxShadow = "0 10px 30px -10px rgba(0,29,61,0.3), 0 1px 3px rgba(0,0,0,0.05)";
                  }}
                >
                  {/* Número de fondo decorativo gigante */}
                  <div className="absolute right-2 -bottom-6 font-black leading-none pointer-events-none select-none transition-all duration-500 group-hover:scale-105 opacity-[0.04]"
                    style={{ color: accent, fontFamily: "'Source Serif 4', serif", fontSize: "140px" }}>
                    0{i + 1}
                  </div>

                  {/* Contenido */}
                  <div className="relative flex-1 z-10">
                    {/* Ícono animado */}
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                      style={{ background: bg, border: `1px solid ${accent}30` }}>
                      <Icon className="w-7 h-7" style={{ color: accent }} />
                    </div>

                    {/* Número principal grande */}
                    <p className="font-black leading-none mb-2.5"
                      style={{ fontSize: "56px", fontFamily: "'Source Serif 4', serif", letterSpacing: "-0.03em", color: "var(--azul-pizarra)" }}>
                      {value}
                    </p>

                    {/* Separador dinámico */}
                    <div className="rounded-full mb-3.5 transition-all duration-300 group-hover:w-16" style={{ width: "35px", height: "4px", background: accent }} />

                    {/* Etiqueta */}
                    <p className="font-black mb-1 tracking-tight uppercase" style={{ fontSize: "12.5px", color: "var(--azul-pizarra)" }}>{label}</p>

                    {/* Descripción */}
                    <p className="leading-relaxed mb-5 font-medium" style={{ fontSize: "11.5px", color: "var(--gris-grafito)" }}>{caption}</p>
                  </div>

                  {/* Línea de acento inferior completa */}
                  <div className="transition-all duration-300" 
                    style={{ height: "6px", background: accent, marginLeft: "-1.75rem", marginRight: "-1.75rem" }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ondas de transición */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: "80px" }}>
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-full" fill="none">
            <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="var(--blanco)" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECCIÓN — ¿Por qué actualizar tu perfil?
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24" style={{ background: "var(--blanco)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header de sección */}
          <div className="mb-16 max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-[2px] w-8 rounded-full bg-[#ea580c]" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ea580c]">¿Por qué actualizarlo?</span>
            </div>
            <h2 className="text-3xl font-black uppercase leading-none tracking-tighter md:text-5xl text-[#001d3d] mb-4">
              Tu perfil<br />
              <span className="font-serif italic lowercase tracking-normal text-[#00A5A8]">te abre</span>{" "}
              puertas
            </h2>
            <p className="text-sm font-medium italic leading-relaxed border-l-4 border-slate-200 pl-4 py-2 text-slate-500 max-w-xl">
              Un directorio activo beneficia a toda la comunidad de estadísticos de la UMSA. Cada perfil completo es una puerta de entrada a nuevas oportunidades.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
            {[
              {
                icon: Globe2,
                title: "Visibilidad profesional",
                desc: "Tu perfil aparece en el directorio público. Empleadores y proyectos pueden encontrarte directamente.",
                highlight: "Más arriba si tu perfil está completo",
                accent: "#00447e",
                bgAccent: "rgba(0,68,126,0.06)",
              },
              {
                icon: Users,
                title: "Red de egresados",
                desc: "Conecta con colegas que ya ejercen en tu área. Colaboraciones, referencias y oportunidades laborales.",
                highlight: "Comunidad activa de estadísticos",
                accent: "#00A5A8",
                bgAccent: "rgba(0,165,168,0.06)",
              },
              {
                icon: BarChart3,
                title: "Mejora la carrera",
                desc: "Los datos de empleabilidad ayudan a mejorar la currícula y los programas de formación.",
                highlight: "Impacto real en generaciones futuras",
                accent: "#ea580c",
                bgAccent: "rgba(234,88,12,0.06)",
              },
            ].map(({ icon: Icon, title, desc, highlight, accent, bgAccent }, i) => (
              <div key={i}
                className="group relative rounded-[3rem] border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden"
                style={{ borderBottomWidth: "4px", borderBottomColor: accent }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = accent; el.style.borderBottomColor = accent; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#e2e8f0"; el.style.borderBottomColor = accent; }}
              >
                {/* Fondo decorativo */}
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-x-4 -translate-y-4 opacity-40" style={{ background: bgAccent }} />

                <div className="relative">
                  <div className="flex size-14 items-center justify-center rounded-2xl mb-6 shadow-lg transition-all duration-300 group-hover:scale-110" style={{ background: bgAccent, border: `1px solid ${accent}22` }}>
                    <Icon className="w-7 h-7 transition-colors duration-300" style={{ color: accent }} />
                  </div>
                  <h3 className="font-black text-lg uppercase tracking-tight mb-3" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>{title}</h3>
                  <p className="text-sm font-medium leading-relaxed mb-5" style={{ color: "var(--gris-grafito)" }}>{desc}</p>
                  <div className="flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>{highlight}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA central */}
          <div className="text-center">
            <button onClick={() => window.dispatchEvent(new CustomEvent("abrir-modal-login"))}
              className="group inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 hover:-translate-y-1 hover:scale-105"
              style={{ background: "linear-gradient(135deg, #00447e 0%, #001d3d 100%)", color: "white", boxShadow: "0 8px 32px rgba(0,29,61,0.25)" }}>
              Actualizar mi perfil ahora
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECCIÓN — Directorio preview
      ══════════════════════════════════════════════════════════════════ */}
      <section id="directorio" className="py-24" style={{ background: "#f1f5f9" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-[2px] w-8 rounded-full bg-[#ea580c]" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ea580c]">Directorio público</span>
              </div>
              <h2 className="text-3xl font-black uppercase leading-none tracking-tighter md:text-4xl text-[#001d3d]">
                Egresados <span className="font-serif italic lowercase tracking-normal text-[#00A5A8]">destacados</span>
              </h2>
              <p className="text-sm font-medium italic leading-relaxed text-slate-500 mt-2 max-w-md">
                {loadingEg ? "Cargando..." : egresados.length > 0 ? "Estadísticos de la UMSA más recientemente actualizados" : "Aún no hay egresados en el directorio público"}
              </p>
            </div>
            <a href="/directorio"
              className="group flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-200 hover:-translate-y-0.5 shrink-0"
              style={{ background: "var(--blanco)", color: "var(--azul-pizarra)", border: "1.5px solid var(--borde)", boxShadow: "var(--shadow-sm)" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--turquesa)"; el.style.color = "var(--turquesa-dark)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--borde)"; el.style.color = "var(--azul-pizarra)"; }}>
              Ver directorio completo
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingEg
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : egresados.length > 0
                ? egresados.map((eg, i) => <EgresadoCard key={eg.id} eg={eg} delay={i * 0.06} />)
                : (
                  <div className="col-span-3 text-center py-16">
                    <p className="text-sm" style={{ color: "var(--placeholder)" }}>Ningún egresado ha activado aún su visibilidad en el directorio.</p>
                    <button onClick={() => window.dispatchEvent(new CustomEvent("abrir-modal-login"))} className="btn-primary btn-sm mt-4 inline-flex">Sé el primero — Activar mi perfil</button>
                  </div>
                )}
          </div>

          {/* Banner CTA oscuro */}
          <div className="mt-12 rounded-[3rem] overflow-hidden relative" style={{ background: "linear-gradient(160deg, #001d3d 0%, #003666 55%, #00447e 100%)" }}>
            {/* Decoración */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
              <svg className="absolute right-0 top-0 h-full w-1/2 opacity-[0.06]" viewBox="0 0 400 200" fill="none">
                <path d="M0 100 Q100 40 200 100 T400 100" stroke="white" strokeWidth="2" />
                <path d="M0 130 Q100 70 200 130 T400 130" stroke="#00A5A8" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="relative px-10 py-10 flex flex-col sm:flex-row items-center gap-8">
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs font-black uppercase tracking-[0.3em] mb-3" style={{ color: "rgba(255,255,255,0.50)" }}>
                  ¿Eres egresado o titulado?
                </p>
                <h3 className="text-2xl font-black uppercase leading-tight tracking-tighter text-white mb-2" style={{ fontFamily: "'Source Serif 4', serif" }}>
                  Aparece en este <span className="font-serif italic lowercase tracking-normal" style={{ color: "#00A5A8" }}>directorio</span>
                </h3>
                <p className="text-sm font-medium leading-relaxed" style={{ color: "rgba(255,255,255,0.60)" }}>
                  Los perfiles actualizados se muestran primero y son más visibles para empleadores y proyectos de investigación.
                </p>
              </div>
              <button onClick={() => window.dispatchEvent(new CustomEvent("abrir-modal-login"))}
                className="group flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 hover:-translate-y-1 hover:scale-105 shrink-0"
                style={{ background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)", color: "white", boxShadow: "0 8px 28px rgba(234,88,12,0.40)" }}>
                <LogIn className="w-4 h-4 transition-transform group-hover:scale-110" />
                Unirme al directorio
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECCIÓN — Noticias recientes
      ══════════════════════════════════════════════════════════════════ */}
      {noticiasPrev.length > 0 && (
        <section className="py-24" style={{ background: "var(--blanco)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-4 mb-12">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-[2px] w-8 rounded-full bg-[#ea580c]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ea580c]">Últimas novedades</span>
                </div>
                <h2 className="text-3xl font-black uppercase leading-none tracking-tighter md:text-4xl text-[#001d3d]">
                  Noticias <span className="font-serif italic lowercase tracking-normal text-[#00A5A8]">y eventos</span>
                </h2>
              </div>
              <a href="/noticias" className="text-xs font-black uppercase tracking-widest transition-colors hover:gap-3 flex items-center gap-2" style={{ color: "var(--turquesa-dark)" }}>
                Ver todas <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {noticiasPrev.map((n: any) => {
                const tipoLabel: Record<string, string> = { noticia_institucional: "Institucional", curso_evento: "Curso / Evento", noticia_social: "Social" };
                const tipoColor: Record<string, { bg: string; color: string }> = {
                  noticia_institucional: { bg: "var(--turquesa-light)", color: "var(--turquesa-dark)" },
                  curso_evento:          { bg: "rgba(139,92,246,0.10)",  color: "#7c3aed" },
                  noticia_social:        { bg: "var(--naranja-light)",   color: "var(--naranja)" },
                };
                const tc = tipoColor[n.tipo] ?? tipoColor.noticia_institucional;
                return (
                  <a key={n.id} href="/noticias"
                    className="group rounded-[3rem] border border-slate-200 bg-white p-7 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#00A5A8] hover:shadow-xl"
                    style={{ textDecoration: "none", borderBottomWidth: "4px", borderBottomColor: tc.color }}>
                    <span className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full w-fit" style={{ background: tc.bg, color: tc.color }}>
                      {tipoLabel[n.tipo] ?? n.tipo}
                    </span>
                    <p className="font-black text-base leading-snug uppercase tracking-tight" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>{n.titulo}</p>
                    <p className="text-xs font-medium leading-relaxed flex-1" style={{ color: "var(--gris-grafito)" }}>
                      {n.cuerpo.slice(0, 120)}{n.cuerpo.length > 120 ? "…" : ""}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs" style={{ color: "var(--placeholder)" }}>
                        {new Date(n.fecha).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                      <span className="text-xs font-black uppercase tracking-widest flex items-center gap-1 transition-all duration-200 group-hover:gap-2" style={{ color: tc.color }}>
                        Leer <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
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
