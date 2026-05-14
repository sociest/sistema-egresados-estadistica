"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, LogOut, ChevronDown, Search } from "lucide-react";

interface PublicHeaderProps {
  isLoggedIn?: boolean;
  correo?: string;
}

// ── Datos de navegación ───────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    label: "Académico",
    items: [
      { label: "Plan de Estudios",       href: "#",          badge: null,     title: "Próximamente" },
      { label: "Malla Curricular",       href: "#",          badge: null,     title: "Próximamente" },
      { label: "Calendario Académico",   href: "#",          badge: null,     title: "Próximamente" },
      { label: "Docentes",               href: "#",          badge: null,     title: "Próximamente" },
      { label: "Trámites y Servicios",   href: "#",          badge: null,     title: "Próximamente" },
    ],
  },
  {
    label: "Postgrado e IETA",
    items: [
      { label: "Maestría en Datos",      href: "#",          badge: "Nuevo",  title: "Próximamente" },
      { label: "Diplomados",             href: "#",          badge: null,     title: "Próximamente" },
      { label: "Cursos",                 href: "#",          badge: null,     title: "Próximamente" },
      { label: "Investigación IETA",     href: "#",          badge: null,     title: "Próximamente" },
      { label: "Repositorio",            href: "#",          badge: null,     title: "Próximamente" },
    ],
  },
  {
    label: "Comunidad",
    items: [
      { label: "Directorio de Egresados", href: "/directorio", badge: null,  title: null },
      { label: "Noticias y Eventos",      href: "/noticias",   badge: null,  title: null },
      { label: "Sugerencias",             href: "#",           badge: null,  title: "Próximamente" },
    ],
  },
];

// ── Dropdown desktop ──────────────────────────────────────────────────────────
function NavDropdown({
  label,
  items,
  isOpen,
  onOpen,
  onClose,
}: {
  label:   string;
  items:   { label: string; href: string; badge: string | null; title: string | null }[];
  isOpen:  boolean;
  onOpen:  () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      {/* Trigger */}
      <button
        type="button"
        className="flex items-center gap-0.5 px-2.5 py-2 rounded-lg text-[13px] font-semibold
                   transition-all whitespace-nowrap"
        style={
          isOpen
            ? { color: "white", background: "rgba(255,255,255,0.15)" }
            : { color: "rgba(255,255,255,0.85)" }
        }
        onMouseEnter={(e) =>
          !isOpen && ((e.currentTarget as HTMLElement).style.color = "white")
        }
        onMouseLeave={(e) =>
          !isOpen && ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)")
        }
      >
        {label}
        <ChevronDown
          className="w-3 h-3 opacity-70 transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 rounded-2xl p-2 z-50
                     animate-fade-in"
          style={{
            background: "var(--blanco)",
            boxShadow:  "0 20px 50px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,68,126,0.2)",
          }}
        >
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              title={item.title ?? undefined}
              className="group flex items-center justify-between gap-3 px-3 py-2.5
                         rounded-xl text-[13px] font-medium transition-all duration-200 relative overflow-hidden"
              style={{ color: "var(--azul-pizarra)" }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background  = "var(--turquesa)";
                el.style.color       = "white";
                el.style.transform   = "translateX(4px)";
                el.style.boxShadow   = "0 4px 12px rgba(0,165,168,0.40)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background  = "transparent";
                el.style.color       = "var(--azul-pizarra)";
                el.style.transform   = "translateX(0)";
                el.style.boxShadow   = "none";
              }}
            >
              <span className="flex items-center gap-2.5 flex-1 min-w-0">
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-200"
                  style={{ background: "rgba(0,165,168,0.4)" }}
                />
                <span className="truncate leading-snug">{item.label}</span>
              </span>
              {item.badge && (
                <span
                  className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black
                             text-white uppercase tracking-wide shadow-sm"
                  style={{ background: "var(--turquesa)" }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Búsqueda inline ───────────────────────────────────────────────────────────
function SearchBar() {
  const router  = useRouter();
  const [query, setQuery] = useState("");
  const [open,  setOpen]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/directorio?busqueda=${encodeURIComponent(query.trim())}`);
      setQuery("");
      setOpen(false);
    }
  };

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div className="relative">
      {open ? (
        <form onSubmit={handleSubmit} className="flex items-center">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={() => !query && setOpen(false)}
            placeholder="Buscar egresado…"
            className="w-[140px] sm:w-[180px] pl-3 pr-8 py-1.5 text-[12px] sm:text-[13px]
                       border rounded-lg outline-none transition-all"
            style={{
              borderColor:     "rgba(255,255,255,0.30)",
              background:      "rgba(255,255,255,0.20)",
              color:           "white",
            }}
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-2 top-1/2 -translate-y-1/2"
            style={{ color: "rgba(255,255,255,0.60)" }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg transition-colors"
          style={{ color: "rgba(255,255,255,0.70)" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "white")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.70)")
          }
          title="Buscar egresado"
        >
          <Search className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ── Botón SIA (acceso rápido externo) ─────────────────────────────────────────
function SiaButton() {
  return (
    
      <a
      href="https://sia.umsa.bo"
      target="_blank"
      rel="noopener noreferrer"
      className="hidden sm:flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2
                 rounded-lg text-[11px] md:text-[12px] font-bold transition-all
                 hover:scale-105 hover:shadow-lg whitespace-nowrap shadow-md"
      style={{ background: "linear-gradient(135deg, #ffffff 0%, #e8f4f8 100%)", color: "#00447e" }}
    >
      SIA UMSA
    </a>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function PublicHeader({ isLoggedIn, correo }: PublicHeaderProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const [scrolled,     setScrolled]     = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  // Scroll listener
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileOpen(false);
    setMobileExpanded(null);
  }, [pathname]);

  // Bloquear scroll al abrir menú móvil
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: "linear-gradient(135deg, #00447e 0%, #003a6b 50%, #00325a 100%)",
          boxShadow:  scrolled ? "0 2px 20px rgba(0,0,0,0.30)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Brand ── */}
            <Link href={isLoggedIn ? "/mi-perfil" : "/"} className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Logo imagen — si no existe, cae al fallback σ */}
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
              {/* Fallback */}
              <div
                className="h-[34px] w-[34px] sm:h-[42px] sm:w-[42px] rounded-xl
                           items-center justify-center shrink-0 text-lg font-bold"
                style={{
                  display:     "none",
                  background:  "rgba(255,255,255,0.10)",
                  border:      "1px solid rgba(255,255,255,0.15)",
                  color:       "var(--turquesa)",
                  fontFamily:  "'Source Serif 4', serif",
                }}
              >
                σ
              </div>
              {/* Texto — oculto en móvil muy pequeño */}
              <div className="hidden sm:block">
                <p className="font-bold text-[14px] sm:text-[16px] leading-tight text-white tracking-wide">
                  CARRERA DE ESTADÍSTICA
                </p>
                <p className="text-[10px] sm:text-[11px] leading-tight font-medium"
                   style={{ color: "rgba(255,255,255,0.80)" }}>
                  Facultad de Ciencias Puras y Naturales
                </p>
              </div>
            </Link>

            {/* ── Nav desktop ── */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <NavDropdown
                  key={item.label}
                  label={item.label}
                  items={item.items}
                  isOpen={openDropdown === item.label}
                  onOpen={() => setOpenDropdown(item.label)}
                  onClose={() => setOpenDropdown(null)}
                />
              ))}
            </nav>

            {/* ── Acciones derecha ── */}
            <div className="flex items-center gap-2">
              {/* Búsqueda */}
              <SearchBar />

              {/* SIA */}
              <SiaButton />

              {/* Login / Logout — desktop */}
              <div className="hidden md:flex items-center gap-2">
                {isLoggedIn ? (
                  <>
                    {correo && (
                      <span className="text-[11px] max-w-[120px] truncate"
                            style={{ color: "rgba(255,255,255,0.50)" }}>
                        {correo}
                      </span>
                    )}
                    <button
                      onClick={logout}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                                 transition-all"
                      style={{
                        background:   "rgba(255,255,255,0.08)",
                        color:        "rgba(255,255,255,0.80)",
                        border:       "1px solid rgba(255,255,255,0.12)",
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background   = "rgba(220,38,38,0.15)";
                        el.style.color        = "#f87171";
                        el.style.borderColor  = "rgba(220,38,38,0.30)";
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background   = "rgba(255,255,255,0.08)";
                        el.style.color        = "rgba(255,255,255,0.80)";
                        el.style.borderColor  = "rgba(255,255,255,0.12)";
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      Salir
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="px-5 py-2 rounded-xl text-[13px] font-bold transition-all
                               shadow-lg hover:scale-105"
                    style={{
                      background: "linear-gradient(135deg, #ea580c 0%, #ea580ccc 100%)",
                      color:      "white",
                    }}
                  >
                    Ingresar
                  </Link>
                )}
              </div>

              {/* Hamburguesa móvil */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="lg:hidden p-2 rounded-xl transition-colors"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color:      "rgba(255,255,255,0.85)",
                  border:     "1px solid rgba(255,255,255,0.12)",
                }}
                aria-label="Abrir menú"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Menú móvil (drawer) ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.50)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div
        className="fixed top-16 right-0 bottom-0 z-50 w-72 lg:hidden overflow-y-auto
                   transition-transform duration-300"
        style={{
          background:  "linear-gradient(160deg, #00325a 0%, #003a6b 100%)",
          transform:    mobileOpen ? "translateX(0)" : "translateX(100%)",
          borderLeft:  "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <div className="p-4 space-y-1">
          {NAV_ITEMS.map((section) => (
            <div key={section.label}>
              {/* Sección expandible */}
              <button
                type="button"
                onClick={() =>
                  setMobileExpanded((v) => (v === section.label ? null : section.label))
                }
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl
                           text-sm font-semibold transition-all"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                {section.label}
                <ChevronDown
                  className="w-4 h-4 transition-transform duration-200"
                  style={{
                    transform:
                      mobileExpanded === section.label ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>
              {mobileExpanded === section.label && (
                <div className="ml-3 mt-1 space-y-0.5 border-l pl-3"
                     style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  {section.items.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      title={item.title ?? undefined}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl
                                 text-[13px] transition-all"
                      style={{ color: "rgba(255,255,255,0.75)" }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.color = "white")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)")
                      }
                    >
                      <span>{item.label}</span>
                      {item.badge && (
                        <span
                          className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                          style={{ background: "var(--turquesa)" }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Separador */}
          <div className="my-3" style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }} />

          {/* SIA móvil */}
          <a
            href="https://sia.umsa.bo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                       text-sm font-bold transition-all"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #e8f4f8 100%)",
              color:      "#00447e",
            }}
          >
            SIA UMSA
          </a>

          {/* Login / Logout móvil */}
          {isLoggedIn ? (
            <button
              onClick={() => { setMobileOpen(false); logout(); }}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                         text-sm font-semibold transition-all"
              style={{
                background: "rgba(220,38,38,0.15)",
                color:      "#f87171",
                border:     "1px solid rgba(220,38,38,0.30)",
              }}
            >
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                         text-sm font-bold transition-all shadow-lg"
              style={{
                background: "linear-gradient(135deg, #ea580c 0%, #ea580ccc 100%)",
                color:      "white",
              }}
            >
              Ingresar
            </Link>
          )}
        </div>
      </div>
    </>
  );
}