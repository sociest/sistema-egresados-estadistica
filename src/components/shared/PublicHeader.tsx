"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";

interface PublicHeaderProps {
  isLoggedIn?: boolean;
  correo?: string;
}

export default function PublicHeader({ isLoggedIn, correo }: PublicHeaderProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
    router.push("/login");
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
          <div className="flex items-center justify-between h-16">

            {/* ── Brand ── */}
            <Link href={isLoggedIn ? "/mi-perfil" : "/"} className="flex items-center gap-2 sm:gap-3 shrink-0">
              <img
                src="/iconos/icono_estaditica.png"
                alt="Logo Carrera de Estadística"
                className="h-[34px] w-[34px] sm:h-[42px] sm:w-[42px] object-contain shrink-0"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.style.display = "none";
                  const next = img.nextElementSibling as HTMLElement | null;
                  if (next) next.style.display = "flex";
                }}
              />
              <div
                className="h-[34px] w-[34px] sm:h-[42px] sm:w-[42px] rounded-xl items-center justify-center shrink-0 text-lg font-bold"
                style={{ display: "none", background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--turquesa)", fontFamily: "'Source Serif 4', serif" }}
              >
                σ
              </div>
              <div className="hidden sm:block">
                <p className="font-bold text-[14px] sm:text-[16px] leading-tight text-white tracking-wide">
                  CARRERA DE ESTADÍSTICA
                </p>
                <p className="text-[10px] sm:text-[11px] leading-tight font-medium" style={{ color: "rgba(255,255,255,0.80)" }}>
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
            <div className="flex items-center gap-2">
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
        className="fixed top-16 right-0 bottom-0 z-50 w-64 md:hidden overflow-y-auto transition-transform duration-300"
        style={{ background: "linear-gradient(160deg, #00325a 0%, #003a6b 100%)", transform: mobileOpen ? "translateX(0)" : "translateX(100%)", borderLeft: "1px solid rgba(255,255,255,0.10)" }}
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
    </>
  );
}