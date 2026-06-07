"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Users, FileBarChart,
  UserCog, LogOut, GraduationCap, ChevronRight,
  Menu, X, Newspaper, Activity,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",      label: "Dashboard",  icon: LayoutDashboard },
  { href: "/egresados",      label: "Egresados",  icon: Users },
  { href: "/reportes",       label: "Reportes",   icon: FileBarChart },
  { href: "/usuarios",       label: "Usuarios",   icon: UserCog },
  { href: "/noticias-admin", label: "Noticias",   icon: Newspaper },
  { href: "/actividad",      label: "Actividad",  icon: Activity },
];

function SidebarContent({ correo, onClose }: { correo?: string; onClose?: () => void }) {
  const pathname = usePathname();
  const router   = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
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
          
          {/* Contenedor del Logo (se agregó overflow-hidden por si la imagen es grande) */}
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
            >
            
            {/* AQUÍ SE REEMPLAZÓ EL SPAN POR LA IMAGEN */}
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
        {correo && (
          <div className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 mb-1"
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

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f1f5f9" }}>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col relative"
        style={{ background: "linear-gradient(170deg, #001d3d 0%, #002a52 50%, #00325a 100%)" }}>
        <SidebarContent correo={correo} />
      </aside>

      {/* Sidebar móvil */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col lg:hidden transition-transform duration-300"
        style={{
          background: "linear-gradient(170deg, #001d3d 0%, #002a52 50%, #00325a 100%)",
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        }}>
        <SidebarContent correo={correo} onClose={() => setSidebarOpen(false)} />
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

          <div className="hidden lg:flex items-center gap-2">
            <div className="h-[2px] w-5 rounded-full" style={{ background: "#ea580c" }} />
            <span className="text-[15px] font-black uppercase tracking-[0.3em]" style={{ color: "white" }}>
              Panel de Administración
            </span>
          </div>

          <div className="flex items-center gap-2">
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
    </div>
  );
}