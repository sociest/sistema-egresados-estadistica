"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Users, FileBarChart,
  UserCog, LogOut, GraduationCap, ChevronRight,
  MessageSquare, Menu, X, Newspaper,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard",      label: "Dashboard",      icon: LayoutDashboard },
  { href: "/egresados",      label: "Egresados",      icon: Users },
  { href: "/reportes",       label: "Reportes",       icon: FileBarChart },
  { href: "/usuarios",       label: "Usuarios",       icon: UserCog },
  { href: "/noticias-admin", label: "Noticias",        icon: Newspaper },
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
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className="px-5 py-5 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "rgba(0,165,168,0.15)",
              border: "1px solid rgba(0,165,168,0.30)",
            }}
          >
            <span
              className="text-lg font-bold"
              style={{ color: "var(--turquesa)", fontFamily: "'Source Serif 4', serif" }}
            >
              σ
            </span>
          </div>
          <div>
            <p
              className="font-bold text-sm leading-tight"
              style={{ color: "white", fontFamily: "'Source Serif 4', serif" }}
            >
              Estadística
            </p>
            <p className="text-xs leading-tight" style={{ color: "rgba(255,255,255,0.50)" }}>
              Panel de Administración
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg"
            style={{ color: "rgba(255,255,255,0.60)" }}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const active = item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={active ? {
                background: "rgba(0,165,168,0.15)",
                color: "var(--turquesa)",
                border: "1px solid rgba(0,165,168,0.25)",
              } : {
                color: "rgba(255,255,255,0.70)",
                border: "1px solid transparent",
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.90)";
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.70)";
                }
              }}
            >
              <item.icon
                className="w-4 h-4 shrink-0"
                style={{ color: active ? "var(--turquesa)" : undefined }}
              />
              <span className="flex-1">{item.label}</span>
              {active && (
                <ChevronRight className="w-3 h-3" style={{ color: "var(--turquesa)" }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer sidebar */}
      <div
        className="p-4 space-y-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        {correo && (
          <div
            className="rounded-xl px-3 py-2"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Sesión como</p>
            <p className="text-xs font-medium truncate" style={{ color: "rgba(255,255,255,0.80)" }}>
              {correo}
            </p>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
          style={{ color: "rgba(255,255,255,0.60)" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.10)";
            (e.currentTarget as HTMLElement).style.color = "#f87171";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.60)";
          }}
        >
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
  correo,
}: {
  children: React.ReactNode;
  correo?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--humo)" }}>

      {/* ── Overlay móvil ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.50)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar desktop (fijo) ── */}
      <aside
        className="hidden lg:flex w-60 shrink-0 flex-col"
        style={{ background: "var(--marino)" }}
      >
        <SidebarContent correo={correo} />
      </aside>

      {/* ── Sidebar móvil (drawer) ── */}
      <aside
        className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col lg:hidden transition-transform duration-300"
        style={{
          background: "var(--marino)",
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <SidebarContent correo={correo} onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div
          className="h-14 flex items-center justify-between px-4 lg:px-6 shrink-0"
          style={{
            background: "var(--blanco)",
            borderBottom: "1px solid var(--borde)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {/* Botón hamburguesa — solo móvil */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl transition-colors"
            style={{
              color: "var(--gris-grafito)",
              background: "var(--humo)",
              border: "1px solid var(--borde)",
            }}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden lg:block" />

          <div
            className="text-xs px-3 py-1.5 rounded-full font-medium"
            style={{
              background: "var(--turquesa-pale)",
              color: "var(--turquesa-dark)",
              border: "1px solid rgba(0,165,168,0.20)",
            }}
          >
            ● Sistema en línea
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 xl:p-8">
          <div className="max-w-7xl mx-auto animate-fade-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}