"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, Users, FileBarChart,
  UserCog, LogOut, ChevronRight,
  Menu, X, Newspaper, Activity,
  Sun, Moon, Play, BookOpen
} from "lucide-react";

const NAV = [
  { href: "/dashboard",      label: "Dashboard",  icon: LayoutDashboard },
  { href: "/egresados",      label: "Egresados",  icon: Users },
  { href: "/reportes",       label: "Reportes",   icon: FileBarChart },
  { href: "/usuarios",       label: "Usuarios",   icon: UserCog },
  { href: "/noticias-admin", label: "Noticias",   icon: Newspaper },
  { href: "/actividad",      label: "Actividad",  icon: Activity },
];

function SidebarContent({
  correo,
  onClose,
  darkMode,
  onToggleDark,
}: {
  correo?: string;
  onClose?: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
}) {
  const pathname = usePathname();
  const router   = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/Titulados_y_Egresados");
    router.refresh();
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "linear-gradient(170deg, #001d3d 0%, #002a52 50%, #00325a 100%)" }}>

      {/* Patrón de puntos decorativo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      {/* Logo */}
      <div className="relative px-5 py-6 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src={"/iconos/icono_estaditica.png"}
              alt="Logo Estadística"
              className="w-8 h-8 object-contain"
            />
          </div>
          <div>
            <p className="font-black text-sm leading-tight uppercase tracking-wide text-white"
              style={{ fontFamily: "'Source Serif 4', serif" }}>Estadística</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: "rgba(255,255,255,0.45)" }}>Panel Admin · UMSA</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-xl"
            style={{ color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.07)" }}>
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="relative flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const active = item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all group"
              style={active ? {
                background: "rgba(0,165,168,0.18)",
                color: "#4DD4D5",
                border: "1px solid rgba(0,165,168,0.30)",
              } : {
                color: "rgba(255,255,255,0.65)",
                border: "1px solid transparent",
              }}
              onMouseEnter={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.06)"; el.style.color = "rgba(255,255,255,0.90)"; } }}
              onMouseLeave={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = "rgba(255,255,255,0.65)"; } }}
            >
              <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: active ? "rgba(0,165,168,0.25)" : "rgba(255,255,255,0.06)" }}>
                <item.icon className="w-3.5 h-3.5" style={{ color: active ? "#4DD4D5" : undefined }} />
              </div>
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3" style={{ color: "#4DD4D5" }} />}
            </Link>
          );
        })}
      </nav>

      {/* Footer sidebar */}
      <div className="relative p-4 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>

        {/* Toggle modo oscuro */}
        <button
          onClick={onToggleDark}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all"
          style={{ color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.05)" }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.10)"; el.style.color = "white"; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.05)"; el.style.color = "rgba(255,255,255,0.65)"; }}
        >
          {darkMode
            ? <><Sun className="w-4 h-4 text-yellow-300" /> Modo claro</>
            : <><Moon className="w-4 h-4 text-blue-300" /> Modo oscuro</>
          }
        </button>

        {correo && (
          <div className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(0,165,168,0.20)" }}>
              <span className="text-xs font-black" style={{ color: "#4DD4D5" }}>
                {correo[0]?.toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.40)" }}>Sesión activa</p>
              <p className="text-xs font-medium truncate" style={{ color: "rgba(255,255,255,0.75)" }}>{correo}</p>
            </div>
          </div>
        )}

        <button onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all"
          style={{ color: "rgba(255,255,255,0.55)", border: "1px solid transparent" }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(220,38,38,0.12)"; el.style.color = "#f87171"; el.style.borderColor = "rgba(220,38,38,0.25)"; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = "rgba(255,255,255,0.55)"; el.style.borderColor = "transparent"; }}>
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children, correo }: { children: React.ReactNode; correo?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false); // Estado para controlar el modal del video

  // Cargar preferencia guardada al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin_dark_mode");
      if (saved === "true") setDarkMode(true);
    } catch {}
  }, []);

  // Aplicar/quitar atributo en el contenedor del admin al cambiar
  const toggleDark = () => {
    setDarkMode(prev => {
      const next = !prev;
      try { localStorage.setItem("admin_dark_mode", String(next)); } catch {}
      return next;
    });
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: darkMode ? "#0f172a" : "#f1f5f9" }}
      data-theme-admin={darkMode ? "dark" : "light"}
    >

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col relative"
        style={{ background: "linear-gradient(170deg, #001d3d 0%, #002a52 50%, #00325a 100%)" }}>
        <SidebarContent correo={correo} darkMode={darkMode} onToggleDark={toggleDark} />
      </aside>

      {/* Sidebar móvil */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col lg:hidden transition-transform duration-300"
        style={{
          background: "linear-gradient(170deg, #001d3d 0%, #002a52 50%, #00325a 100%)",
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        }}>
        <SidebarContent correo={correo} onClose={() => setSidebarOpen(false)} darkMode={darkMode} onToggleDark={toggleDark} />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div className="h-14 flex items-center justify-between px-4 lg:px-6 shrink-0"
          style={{ background: "linear-gradient(170deg, #001d3d 0%, #002a52 50%, #00325a 100%)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>

          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl transition-colors"
            style={{ color: "rgba(255,255,255,0.80)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <Menu className="w-5 h-5" />
          </button>

          {/* Contenedor del título + Botón de Tutorial */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-[2px] w-5 rounded-full" style={{ background: "#ea580c" }} />
              <span className="text-[15px] font-black uppercase tracking-[0.3em]" style={{ color: "white" }}>
                Panel de Administración
              </span>
            </div>

           {/* Botón de Tutorial */}
            <button
              onClick={() => setVideoOpen(true)}
              className="hidden lg:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider transition-all"
              style={{ 
                background: "rgba(234, 88, 12, 0.15)", 
                color: "#ff7a33", 
                border: "1px solid rgba(234, 88, 12, 0.3)" 
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(234, 88, 12, 0.25)"; el.style.color = "#ff9457"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(234, 88, 12, 0.15)"; el.style.color = "#ff7a33"; }}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Tutorial
            </button>

            {/* Botón Manual Admin */}
              <a
              href="/documentos/Manual_Administrador_SistemaEgresados.pdf"
              download
              className="hidden lg:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider transition-all"
              style={{ 
                background: "rgba(14, 165, 233, 0.15)", 
                color: "#38bdf8", 
                border: "1px solid rgba(14, 165, 233, 0.3)",
                textDecoration: "none",
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(14, 165, 233, 0.25)"; el.style.color = "#7dd3fc"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(14, 165, 233, 0.15)"; el.style.color = "#38bdf8"; }}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Manual
            </a>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón tutorial visible en móviles */}
            <button
              onClick={() => setVideoOpen(true)}
              className="lg:hidden p-2 rounded-xl transition-all"
              style={{ background: "rgba(234, 88, 12, 0.15)", border: "1px solid rgba(234, 88, 12, 0.3)", color: "#ff7a33" }}
              title="Ver Tutorial"
            >
              <Play className="w-4 h-4 fill-current" />
            </button>

            {/* Botón Manual visible en móviles */}
              <a
              href="/documentos/Manual_Administrador_SistemaEgresados.pdf"
              download
              className="lg:hidden p-2 rounded-xl transition-all"
              style={{ background: "rgba(14, 165, 233, 0.15)", border: "1px solid rgba(14, 165, 233, 0.3)", color: "#38bdf8", textDecoration: "none" }}
              title="Descargar Manual"
            >
              <BookOpen className="w-4 h-4" />
            </a>

            {/* Toggle en topbar para móvil/visible siempre */}
            <button
              onClick={toggleDark}
              className="p-2 rounded-xl transition-all"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.80)" }}
              title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              {darkMode
                ? <Sun className="w-4 h-4 text-yellow-300" />
                : <Moon className="w-4 h-4 text-blue-300" />
              }
            </button>

            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-black uppercase tracking-widest"
              style={{ background: "rgba(0,165,168,0.20)", color: "#4DD4D5", border: "1px solid rgba(0,165,168,0.30)" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#4DD4D5" }} />
              En línea
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 xl:p-8" style={{ background: "var(--fondo)" }}>
          <div className="max-w-7xl mx-auto animate-fade-up">
            {children}
          </div>
        </main>
      </div>

      {/* MODAL DEL VIDEO TUTORIAL */}
      {videoOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div 
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl transition-all border border-white/10"
            style={{ background: darkMode ? "#1e293b" : "#ffffff" }}
          >
            {/* Cabecera del Video */}
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-orange-500 fill-current" />
                <span className="font-bold text-sm uppercase tracking-wider" style={{ color: darkMode ? "#fff" : "#0f172a" }}>
                  Video Tutorial de Uso
                </span>
              </div>
              <button 
                onClick={() => setVideoOpen(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ 
                  color: darkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                  background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenedor del Video en formato tarjeta grande */}
            <div className="aspect-video w-full bg-black flex items-center justify-center">
              <video 
                controls 
                autoPlay
                muted
                className="w-full h-full object-contain"
                style={{ background: "black" }}
              >
                <source src="/videos/Video_Tutorial_Administrador.mp4" type="video/mp4" />
                Tu navegador no soporta el elemento video.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}