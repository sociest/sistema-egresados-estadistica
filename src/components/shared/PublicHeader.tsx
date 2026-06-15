"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, LogOut, Play, BookOpen } from "lucide-react";

interface PublicHeaderProps {
  isLoggedIn?: boolean;
  correo?: string;
}

export default function PublicHeader({ isLoggedIn, correo }: PublicHeaderProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [videoOpen,  setVideoOpen]  = useState(false); // Estado para controlar el modal de video

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/Titulados_y_Egresados");
    router.refresh();
  };

  // Abre el modal de login disparando un evento global
  const abrirModal = () => {
    window.dispatchEvent(new CustomEvent("abrir-modal-login"));
    setMobileOpen(false);
  };

  const NAV_LINKS = [
    { label: "Noticias",   href: "/noticias"   },
    { label: "Directorio", href: "/directorio" },
  ];

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: "linear-gradient(135deg, #00447e 0%, #003a6b 50%, #00325a 100%)",
          boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.30)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* ── Brand ── */}
            <Link href={isLoggedIn ? "/mi-perfil" : "/"} className="flex items-center gap-2 sm:gap-3 shrink-0">
              <img
                src="/iconos/icono_estaditica.png"
                alt="Logo Carrera de Estadística"
                className="h-[44px] w-[44px] sm:h-[56px] sm:w-[56px] object-contain shrink-0"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.style.display = "none";
                  const next = img.nextElementSibling as HTMLElement | null;
                  if (next) next.style.display = "flex";
                }}
              />
              <div
                className="h-[44px] w-[44px] sm:h-[56px] sm:w-[56px] rounded-xl items-center justify-center shrink-0 text-lg font-bold"
                style={{ display: "none", background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--turquesa)", fontFamily: "'Source Serif 4', serif" }}
              >
                σ
              </div>
              <div className="hidden sm:block">
                <p className="font-bold text-[16px] sm:text-[20px] leading-tight text-white tracking-wide">
                  CARRERA DE ESTADÍSTICA
                </p>
                <p className="text-[11px] sm:text-[13px] leading-tight font-medium" style={{ color: "rgba(255,255,255,0.80)" }}>
                  Facultad de Ciencias Puras y Naturales
                </p>
              </div>
            </Link>

            {/* ── Nav desktop ── */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 rounded-lg text-[14px] font-semibold transition-all"
                  style={{ color: pathname.startsWith(link.href) ? "white" : "rgba(255,255,255,0.80)", background: pathname.startsWith(link.href) ? "rgba(255,255,255,0.15)" : "transparent" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "white"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)"; }}
                  onMouseLeave={e => {
                    const active = pathname.startsWith(link.href);
                    (e.currentTarget as HTMLElement).style.color = active ? "white" : "rgba(255,255,255,0.80)";
                    (e.currentTarget as HTMLElement).style.background = active ? "rgba(255,255,255,0.15)" : "transparent";
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* ── Acciones derecha ── */}
            <div className="flex items-center gap-3">
              
              {/* Botón de Tutorial Desktop (A la izquierda de las acciones de sesión) */}
              {/* Botón Tutorial Desktop */}
            <button
              onClick={() => setVideoOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold uppercase tracking-wider transition-all"
              style={{ 
                background: "rgba(255, 255, 255, 0.08)", 
                color: "rgba(255, 255, 255, 0.9)", 
                border: "1px solid rgba(255, 255, 255, 0.15)" 
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255, 255, 255, 0.15)"; el.style.color = "#fff"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255, 255, 255, 0.08)"; el.style.color = "rgba(255, 255, 255, 0.9)"; }}
            >
              <Play className="w-3.5 h-3.5 fill-current text-orange-500" />
              Tutorial
            </button>

            {/* Botón Manual Desktop */}
              <a
              href="/documentos/Manual_Egresado_SistemaEgresados.pdf"
              download
              className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold uppercase tracking-wider transition-all"
              style={{ 
                background: "rgba(255, 255, 255, 0.08)", 
                color: "rgba(255, 255, 255, 0.9)", 
                border: "1px solid rgba(255, 255, 255, 0.15)",
                textDecoration: "none",
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255, 255, 255, 0.15)"; el.style.color = "#fff"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255, 255, 255, 0.08)"; el.style.color = "rgba(255, 255, 255, 0.9)"; }}
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              Manual
            </a>

              {isLoggedIn ? (
                <>
                  {correo && (
                    <span className="hidden sm:block text-[11px] max-w-[120px] truncate" style={{ color: "rgba(255,255,255,0.50)" }}>
                      {correo}
                    </span>
                  )}
                  <button
                    onClick={logout}
                    className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.80)", border: "1px solid rgba(255,255,255,0.12)" }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(220,38,38,0.15)"; el.style.color = "#f87171"; el.style.borderColor = "rgba(220,38,38,0.30)"; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.08)"; el.style.color = "rgba(255,255,255,0.80)"; el.style.borderColor = "rgba(255,255,255,0.12)"; }}
                  >
                    <LogOut className="w-4 h-4" /> Salir
                  </button>
                </>
              ) : (
                <button
                  onClick={abrirModal}
                  className="hidden md:flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold transition-all shadow-lg hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #ea580c 0%, #ea580ccc 100%)", color: "white" }}
                >
                  Ingresar
                </button>
              )}

              {/* Icono de Play directo para pantallas móviles */}
              <button
                onClick={() => setVideoOpen(true)}
                className="md:hidden p-2 rounded-xl transition-colors"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.12)" }}
                title="Ver Tutorial"
              >
                <Play className="w-4 h-4 fill-current text-orange-500" />
              </button>

              {/* Hamburguesa móvil */}
              <button
                onClick={() => setMobileOpen(v => !v)}
                className="md:hidden p-2 rounded-xl transition-colors"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Menú móvil ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" style={{ background: "rgba(0,0,0,0.50)" }} onClick={() => setMobileOpen(false)} />
      )}
      <div
        className="fixed inset-y-0 right-0 z-50 w-64 flex flex-col lg:hidden transition-transform duration-300"
        style={{
          background: "linear-gradient(160deg, #00325a 0%, #003a6b 100%)",
          transform: mobileOpen ? "translateX(0)" : "translateX(100%)",
          borderLeft: "1px solid rgba(255,255,255,0.10)",
        }}
>
        <div className="p-4 space-y-2">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center px-3 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              {link.label}
            </Link>
          ))}

          <div className="my-3" style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }} />

          {/* Botón Tutorial dentro del menú móvil */}
          <button
            onClick={() => { setMobileOpen(false); setVideoOpen(true); }}
            className="flex items-center justify-center gap-2 w-full py-2.5 mb-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            <Play className="w-4 h-4 fill-current text-orange-500" /> Tutorial
          </button>

          {/* Botón Manual dentro del menú móvil */}
          <a
            href="/documentos/Manual_Egresado_SistemaEgresados.pdf"
            download
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-2.5 mb-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.15)", textDecoration: "none" }}
          >
            <BookOpen className="w-4 h-4 text-sky-400" /> Manual
          </a>

          {isLoggedIn ? (
            <button
              onClick={() => { setMobileOpen(false); logout(); }}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(220,38,38,0.15)", color: "#f87171", border: "1px solid rgba(220,38,38,0.30)" }}
            >
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          ) : (
            <button
              onClick={abrirModal}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold shadow-lg"
              style={{ background: "linear-gradient(135deg, #ea580c 0%, #ea580ccc 100%)", color: "white" }}
            >
              Ingresar
            </button>
          )}
        </div>
      </div>

      {/* MODAL DEL VIDEO TUTORIAL PÚBLICO */}
      {videoOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl transition-all border border-white/10 bg-[#00325a]">
            {/* Cabecera del Video */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-orange-500 fill-current" />
                <span className="font-bold text-sm uppercase tracking-wider text-white">
                  Video Tutorial de la Plataforma
                </span>
              </div>
              <button 
                onClick={() => setVideoOpen(false)}
                className="p-1.5 rounded-lg transition-colors text-white/60 bg-white/5 hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenedor del Video en formato tarjeta grande */}
            <div className="aspect-video w-full bg-black flex items-center justify-center">
              <video 
                controls 
                autoPlay
                playsInline
                crossOrigin="anonymous"
                preload="metadata"
                className="w-full h-full object-contain"
                style={{ background: "black" }}
                onError={(e) => console.error("Video error:", e)}
              >
                <source src="/videos/Video_Tutorial_Egresado_Titulado.mp4" type="video/mp4" />
                Tu navegador no soporta el elemento video.
              </video>
            </div>
          </div>
        </div>
      )}
    </>
  );
}