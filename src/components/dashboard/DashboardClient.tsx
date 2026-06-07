"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import {
  GraduationCap, Users, TrendingUp, Clock, Briefcase,
  Filter, RefreshCw, FileDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Modo = "titulados" | "egresados" | "ambos";

const COLORS = ["#00A5A8","#10b981","#f59e0b","#8b5cf6","#ef4444","#06b6d4","#f97316","#84cc16"];
const TT = {
  contentStyle: {
    backgroundColor: "#1e293b", border: "1px solid #334155",
    borderRadius: "10px", color: "#e2e8f0", fontSize: "12px",
  },
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color, bg }: {
  label: string; value: string | number; sub?: string;
  icon: any; color: string; bg: string;
}) {
  return (
    <div className="rounded-2xl p-5 flex items-start gap-4"
      style={{ background: "var(--blanco)", border: "1px solid var(--borde)", boxShadow: "var(--shadow-sm)" }}>
      <div className={`p-3 rounded-xl shrink-0 border ${bg}`} style={{ marginTop: "2px" }}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none"
          style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
          {value}
        </p>
        <p className="text-xs font-medium uppercase tracking-wide leading-tight mt-1"
          style={{ color: "var(--gris-grafito)" }}>
          {label}
        </p>
        {sub && (
          <p className="text-xs leading-tight mt-1" style={{ color: "var(--placeholder)" }}>{sub}</p>
        )}
      </div>
    </div>
  );
}

// ── KPI Card Género ───────────────────────────────────────────────────────────
function KpiCardGenero({ masculino, femenino, otro, total }: {
  masculino: number; femenino: number; otro: number; total: number;
}) {
  const conGenero = masculino + femenino + otro;
  const pctM = conGenero > 0 ? Math.round((masculino / conGenero) * 100) : 0;
  const pctF = conGenero > 0 ? Math.round((femenino  / conGenero) * 100) : 0;
  const pctO = conGenero > 0 ? Math.round((otro      / conGenero) * 100) : 0;

  return (
    <div className="rounded-2xl p-5 col-span-2 lg:col-span-1"
      style={{ background: "var(--blanco)", border: "1px solid var(--borde)", boxShadow: "var(--shadow-sm)" }}>
      <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: "var(--gris-grafito)" }}>
        Distribución por género
      </p>
      <p className="text-xs mb-3" style={{ color: "var(--placeholder)" }}>
        {conGenero} con género registrado
      </p>

      {/* Barra apilada */}
      <div className="flex h-2 rounded-full overflow-hidden mb-3" style={{ background: "var(--borde)" }}>
        {masculino > 0 && (
          <div style={{ width: `${pctM}%`, background: "#3b82f6", transition: "width 0.5s" }} />
        )}
        {femenino > 0 && (
          <div style={{ width: `${pctF}%`, background: "#ec4899", transition: "width 0.5s" }} />
        )}
        {otro > 0 && (
          <div style={{ width: `${pctO}%`, background: "var(--placeholder)", transition: "width 0.5s" }} />
        )}
      </div>

      {/* Valores */}
      <div className="flex gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: "#3b82f6" }} />
          <div>
            <p className="text-lg font-bold leading-none" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
              {masculino}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--gris-grafito)" }}>
              Masc. ({pctM}%)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: "#ec4899" }} />
          <div>
            <p className="text-lg font-bold leading-none" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
              {femenino}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--gris-grafito)" }}>
              Fem. ({pctF}%)
            </p>
          </div>
        </div>
        {otro > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: "var(--placeholder)" }} />
            <div>
              <p className="text-lg font-bold leading-none" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
                {otro}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--gris-grafito)" }}>
                Otro ({pctO}%)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tooltip personalizado ─────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "10px 14px", fontSize: "12px", color: "#e2e8f0" }}>
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
}

// ── Tabla geográfica ──────────────────────────────────────────────────────────
function TablaGeo({ data, titulo }: { data: any[]; titulo: string }) {
  const max = Math.max(...data.map(r => r.cantidad), 1);
  return (
    <div>
      <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--azul-pizarra)" }}>{titulo}</h4>
      <div className="space-y-2">
        {data.slice(0, 10).map((r, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs w-5 text-right shrink-0" style={{ color: "var(--placeholder)" }}>{i + 1}</span>
            <span className="text-xs flex-1 truncate" style={{ color: "var(--azul-pizarra)" }}>{r.ciudad ?? r.region ?? "—"}</span>
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-1.5 rounded-full" style={{ width: `${Math.round((r.cantidad / max) * 80)}px`, minWidth: "4px", background: "var(--turquesa)", opacity: 0.7 }} />
              <span className="text-xs font-semibold w-6 text-right" style={{ color: "var(--gris-grafito)" }}>{r.cantidad}</span>
            </div>
          </div>
        ))}
        {data.length === 0 && <p className="text-xs text-center py-4" style={{ color: "var(--placeholder)" }}>Sin datos</p>}
      </div>
    </div>
  );
}

// ── Tabla cohorte ─────────────────────────────────────────────────────────────
function TablaCohorte({ data }: { data: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table style={{ width: "100%", fontSize: "0.8rem", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1.5px solid var(--borde)" }}>
            {["Cohorte", "Total", "Titulados", "Egresados", "Con empleo", "% Titulados"].map(h => (
              <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "var(--gris-grafito)", fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i} style={{ borderTop: "1px solid var(--borde-suave)" }}>
              <td style={{ padding: "8px 10px", fontWeight: 600, color: "var(--azul-pizarra)" }}>{r.cohorte}</td>
              <td style={{ padding: "8px 10px", color: "var(--gris-grafito)" }}>{r.total}</td>
              <td style={{ padding: "8px 10px" }}>
                <span style={{ background: "var(--turquesa-light)", color: "var(--turquesa-dark)", padding: "2px 8px", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 600 }}>{r.titulados}</span>
              </td>
              <td style={{ padding: "8px 10px" }}>
                <span style={{ background: "var(--naranja-light)", color: "var(--naranja)", padding: "2px 8px", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 600 }}>{r.egresados}</span>
              </td>
              <td style={{ padding: "8px 10px", color: "var(--verde)" }}>{r.conEmpleo}</td>
              <td style={{ padding: "8px 10px" }}>
                <div className="flex items-center gap-2">
                  <div style={{ height: "6px", borderRadius: "3px", background: "var(--borde)", flex: 1, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "var(--turquesa)", width: `${Math.min(r.pctTitulados ?? 0, 100)}%` }} />
                  </div>
                  <span style={{ color: "var(--azul-pizarra)", fontWeight: 600, fontSize: "0.72rem", width: "36px" }}>{(r.pctTitulados ?? 0).toFixed(1)}%</span>
                </div>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr><td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "var(--placeholder)" }}>Sin datos de cohortes</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Selector de modo ──────────────────────────────────────────────────────────
function SelectorModo({ modo, onChange }: { modo: Modo; onChange: (m: Modo) => void }) {
  const modos: { key: Modo; label: string; icon: string }[] = [
    { key: "titulados", label: "Titulados",  icon: "🎓" },
    { key: "egresados", label: "Egresados",  icon: "📋" },
    { key: "ambos",     label: "Ambos",       icon: "📊" },
  ];
  return (
    <div className="flex rounded-2xl p-1 gap-1" style={{ background: "var(--humo)", border: "1px solid var(--borde)", width: "fit-content" }}>
      {modos.map(m => (
        <button key={m.key} onClick={() => onChange(m.key)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={modo === m.key ? {
            background: "var(--blanco)", color: "var(--azul-pizarra)",
            boxShadow: "var(--shadow-sm)", border: "1px solid var(--borde)",
          } : {
            background: "transparent", color: "var(--gris-grafito)", border: "1px solid transparent",
          }}>
          <span>{m.icon}</span>
          <span className="hidden sm:inline">{m.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Panel de filtros ──────────────────────────────────────────────────────────
function PanelFiltros({ modo, filtros, onChange, onApply, onReset, loading }: {
  modo: Modo;
  filtros: Record<string, string>;
  onChange: (k: string, v: string) => void;
  onApply: () => void;
  onReset: () => void;
  loading: boolean;
}) {
  const years = Array.from({ length: new Date().getFullYear() - 1997 }, (_, i) => 1998 + i).reverse();
  const fieldCss: React.CSSProperties = {
    background: "var(--humo)", border: "1.5px solid var(--borde)", borderRadius: "0.625rem",
    padding: "0.375rem 0.75rem", fontSize: "0.8rem", color: "var(--azul-pizarra)", outline: "none",
  };
  const LabelFiltro = ({ children }: { children: React.ReactNode }) => (
    <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", color: "var(--gris-grafito)", marginBottom: "4px" }}>
      {children}
    </label>
  );

  const hayFiltros = Object.values(filtros).some(Boolean);

  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--blanco)", border: "1px solid var(--borde)", boxShadow: "var(--shadow-sm)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4" style={{ color: "var(--turquesa)" }} />
        <p className="text-sm font-semibold" style={{ color: "var(--azul-pizarra)" }}>
          Filtros — afectan todos los gráficos y KPIs
        </p>
      </div>
      <div className="flex flex-wrap gap-3 items-end">

        {/* Año titulación desde/hasta — titulados y ambos */}
        {(modo === "titulados" || modo === "ambos") && (
          <>
            <div>
              <LabelFiltro>Año titulación desde</LabelFiltro>
              <select value={filtros.anioTitulacionDesde ?? ""} onChange={e => onChange("anioTitulacionDesde", e.target.value)} style={fieldCss}>
                <option value="">Todos</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <LabelFiltro>Hasta</LabelFiltro>
              <select value={filtros.anioTitulacionHasta ?? ""} onChange={e => onChange("anioTitulacionHasta", e.target.value)} style={fieldCss}>
                <option value="">Todos</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </>
        )}

        {/* Año egreso desde/hasta — solo egresados */}
        {modo === "egresados" && (
          <>
            <div>
              <LabelFiltro>Año egreso desde</LabelFiltro>
              <select value={filtros.anioEgresoDesde ?? ""} onChange={e => onChange("anioEgresoDesde", e.target.value)} style={fieldCss}>
                <option value="">Todos</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <LabelFiltro>Hasta</LabelFiltro>
              <select value={filtros.anioEgresoHasta ?? ""} onChange={e => onChange("anioEgresoHasta", e.target.value)} style={fieldCss}>
                <option value="">Todos</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </>
        )}

        {/* Sector — todos los modos */}
        <div>
          <LabelFiltro>Sector laboral</LabelFiltro>
          <select value={filtros.sector ?? ""} onChange={e => onChange("sector", e.target.value)} style={fieldCss}>
            <option value="">Todos</option>
            <option value="Publico">Público</option>
            <option value="Privado">Privado</option>
            <option value="Independiente">Independiente</option>
            <option value="ONG">ONG</option>
          </select>
        </div>

        {/* Modalidad — titulados y ambos */}
        {(modo === "titulados" || modo === "ambos") && (
          <div>
            <LabelFiltro>Modalidad titulación</LabelFiltro>
            <select value={filtros.modalidad ?? ""} onChange={e => onChange("modalidad", e.target.value)} style={fieldCss}>
              <option value="">Todas</option>
              <option value="Tesis">Tesis</option>
              <option value="Proyecto de grado">Proyecto de grado</option>
              <option value="Trabajo dirigido">Trabajo dirigido</option>
              <option value="Examen de grado">Examen de grado</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
        )}

        <div className="flex items-end gap-2">
          <button onClick={onApply} disabled={loading} className="btn-primary btn-sm flex items-center gap-1.5 h-[38px]">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Aplicar
          </button>
          {hayFiltros && (
            <button onClick={onReset} className="btn-sm h-[38px] px-4 text-xs font-medium rounded-lg border flex items-center"
              style={{ borderColor: "var(--borde)", color: "var(--gris-grafito)", background: "var(--blanco)" }}>
              Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function DashboardClient() {
  const [modo,    setModo]    = useState<Modo>("ambos");
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [filtros, setFiltros] = useState<Record<string, string>>({});

  const setFiltro = (k: string, v: string) => setFiltros(f => ({ ...f, [k]: v }));

  const resetFiltros = () => {
    setFiltros({});
  };

  const buildParams = useCallback((f: Record<string, string>, m: Modo) => {
    const p = new URLSearchParams();
    p.set("modo", m);
    Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v); });
    return p;
  }, []);

  const fetchData = useCallback(async (f: Record<string, string>, m: Modo) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/dashboard?${buildParams(f, m)}`);
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      setData(json.data);
    } catch { setError("Error al cargar datos"); }
    finally { setLoading(false); }
  }, [buildParams]);

  // Al cambiar de modo, limpiar filtros y recargar
  const handleModoChange = (nuevoModo: Modo) => {
    setModo(nuevoModo);
    setFiltros({});
    fetchData({}, nuevoModo);
  };

  useEffect(() => { fetchData({}, "ambos"); }, [fetchData]);

  // ── Exportar PDF ──────────────────────────────────────────────────────────
  const exportarPDF = async () => {
    if (!data) return;
    const { default: jsPDF } = await import("jspdf");
    const fechaGen = new Date().toLocaleDateString("es-BO", { day: "2-digit", month: "long", year: "numeric" });
    const modoLabel = { titulados: "Titulados", egresados: "Egresados", ambos: "Ambos" }[modo];
    const filtrosDesc = Object.entries(filtros).filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`).join(", ") || "Sin filtros";

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW  = pdf.internal.pageSize.getWidth();
    const pageH  = pdf.internal.pageSize.getHeight();
    const margin = 14;
    let y = 0;

    const addHeader = (isFirst: boolean) => {
      pdf.setFillColor(0, 165, 168);
      pdf.rect(0, 0, pageW, 18, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(13); pdf.setFont("helvetica", "bold");
      pdf.text("Carrera de Estadística — UMSA", margin, 12);
      pdf.setFontSize(8); pdf.setFont("helvetica", "normal");
      pdf.text("Universidad Mayor de San Andrés", pageW - margin, 12, { align: "right" });

      if (isFirst) {
        pdf.setTextColor(30, 41, 59);
        pdf.setFontSize(15); pdf.setFont("helvetica", "bold");
        pdf.text(`Dashboard — ${modoLabel}`, margin, 30);
        pdf.setDrawColor(0, 165, 168); pdf.setLineWidth(0.5);
        pdf.line(margin, 33, pageW - margin, 33);
        pdf.setFontSize(8); pdf.setFont("helvetica", "normal"); pdf.setTextColor(71, 85, 105);
        pdf.text(`Fecha: ${fechaGen}`, margin, 40);
        pdf.text(`Modo: ${modoLabel} · Filtros: ${filtrosDesc}`, margin, 46);
      }
    };

    const addFooter = () => {
      const n = (pdf as any).internal.getNumberOfPages();
      pdf.setFontSize(7); pdf.setFont("helvetica", "normal"); pdf.setTextColor(148, 163, 184);
      pdf.text(
        `Sistema de Seguimiento de Egresados · UMSA · ${modoLabel} · ${fechaGen} · Pág. ${n}`,
        pageW / 2, pageH - 6, { align: "center" }
      );
    };

    const checkPage = (needed: number) => {
      if (y + needed > pageH - 16) {
        addFooter();
        pdf.addPage();
        addHeader(false);
        y = 22;
      }
    };

    const sectionTitle = (title: string) => {
      checkPage(20);
      pdf.setFontSize(11); pdf.setFont("helvetica", "bold"); pdf.setTextColor(30, 41, 59);
      pdf.text(title, margin, y);
      y += 6;
    };

    const tableHeader = (cols: { label: string; x: number }[]) => {
      pdf.setFillColor(0, 165, 168);
      pdf.rect(margin, y - 4, pageW - margin * 2, 8, "F");
      pdf.setTextColor(255, 255, 255); pdf.setFontSize(8); pdf.setFont("helvetica", "bold");
      cols.forEach(c => pdf.text(c.label, c.x, y + 1));
      y += 8;
    };

    const tableRow = (cells: { text: string; x: number }[], idx: number) => {
      checkPage(8);
      pdf.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
      pdf.rect(margin, y - 4, pageW - margin * 2, 7, "F");
      pdf.setTextColor(30, 41, 59); pdf.setFont("helvetica", "normal"); pdf.setFontSize(8);
      cells.forEach(c => pdf.text(c.text, c.x, y + 0.5));
      y += 7;
    };

    // ── Página 1 ──────────────────────────────────────────────────────────────
    addHeader(true);
    y = 52;

    // ── KPIs ─────────────────────────────────────────────────────────────────
    const kpis = data.kpis ?? {};
    sectionTitle("Indicadores Clave");

    const generoTotal = (kpis.masculino ?? 0) + (kpis.femenino ?? 0) + (kpis.otro ?? 0);
    const pctMpdf = generoTotal > 0 ? Math.round(((kpis.masculino ?? 0) / generoTotal) * 100) : 0;
    const pctFpdf = generoTotal > 0 ? Math.round(((kpis.femenino  ?? 0) / generoTotal) * 100) : 0;

    const kpiData: [string, string][] = [
      ["Total registrados",        String(kpis.totalRegistrados ?? 0)],
      ["Con empleo activo",        String(kpis.conEmpleo ?? 0)],
      ["Tasa de empleabilidad",    `${kpis.tasaEmpleabilidad ?? 0}%`],
      ["Inserción laboral",        kpis.tiempoPromedioInsercion ? `${kpis.tiempoPromedioInsercion} meses` : "—"],
      ...(modo !== "egresados"
        ? [["Egreso → Titulación", kpis.tiempoPromedioTitulacion ? `${kpis.tiempoPromedioTitulacion} meses` : "—"] as [string, string]]
        : []),
      ["Masculino", `${kpis.masculino ?? 0} (${pctMpdf}%)`],
      ["Femenino",  `${kpis.femenino  ?? 0} (${pctFpdf}%)`],
      ...((kpis.otro ?? 0) > 0
        ? [["Otro / No especif.", String(kpis.otro)] as [string, string]]
        : []),
    ];

    const colW = (pageW - margin * 2) / 2;
    kpiData.forEach(([label, value], i) => {
      const col = i % 2; const row = Math.floor(i / 2);
      const x = margin + col * colW; const yy = y + row * 14;
      pdf.setFillColor(248, 250, 252); pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(x, yy - 4, colW - 4, 12, 2, 2, "FD");
      pdf.setFontSize(7); pdf.setFont("helvetica", "normal"); pdf.setTextColor(100, 116, 139);
      pdf.text(label, x + 4, yy - 1);
      pdf.setFontSize(11); pdf.setFont("helvetica", "bold"); pdf.setTextColor(0, 165, 168);
      pdf.text(value, x + 4, yy + 5);
    });
    y += Math.ceil(kpiData.length / 2) * 14 + 10;

    // ── Separador ─────────────────────────────────────────────────────────────
    pdf.setDrawColor(226, 232, 240); pdf.setLineWidth(0.3);
    pdf.line(margin, y, pageW - margin, y);
    y += 8;

    const g = data.graficos ?? {};

    // ── Tabla 1: Por año ──────────────────────────────────────────────────────
    const porAnio: any[] = g.porAnio ?? [];
    if (porAnio.length > 0) {
      const titleAnio = modo === "titulados" ? "Titulados por Año de Titulación"
        : modo === "egresados" ? "Egresados por Año de Egreso"
        : "Graduados por Año";
      sectionTitle(titleAnio);

      if (modo === "ambos") {
        tableHeader([
          { label: "Año",       x: margin + 2  },
          { label: "Total",     x: margin + 22 },
          { label: "Titulados", x: margin + 42 },
          { label: "Egresados", x: margin + 68 },
        ]);
        porAnio.slice(-15).forEach((r: any, i: number) => {
          tableRow([
            { text: String(r.anio ?? "—"), x: margin + 2  },
            { text: String(r.total ?? 0),  x: margin + 22 },
            { text: String(r.titulados ?? 0), x: margin + 42 },
            { text: String(r.egresados ?? 0), x: margin + 68 },
          ], i);
        });
      } else {
        tableHeader([
          { label: "Año",   x: margin + 2  },
          { label: "Total", x: margin + 22 },
        ]);
        porAnio.slice(-15).forEach((r: any, i: number) => {
          tableRow([
            { text: String(r.anio ?? "—"), x: margin + 2  },
            { text: String(r.total ?? 0),  x: margin + 22 },
          ], i);
        });
      }
      y += 6;
    }

    // ── Tabla 2: Sector laboral ───────────────────────────────────────────────
    const porSector: any[] = g.porSector ?? [];
    if (porSector.length > 0) {
      checkPage(30);
      sectionTitle("Distribución por Sector Laboral");
      const totalSector = porSector.reduce((acc: number, r: any) => acc + r.cantidad, 0);
      tableHeader([
        { label: "Sector",     x: margin + 2   },
        { label: "Cantidad",   x: margin + 90  },
        { label: "% del total", x: margin + 120 },
      ]);
      porSector.forEach((r: any, i: number) => {
        const pct = totalSector > 0 ? ((r.cantidad / totalSector) * 100).toFixed(1) : "0";
        tableRow([
          { text: String(r.sector ?? "—"), x: margin + 2   },
          { text: String(r.cantidad),       x: margin + 90  },
          { text: `${pct}%`,                x: margin + 120 },
        ], i);
      });
      y += 6;
    }

    // ── Tabla 3: Modalidad (solo titulados y ambos) ───────────────────────────
    const porModalidad: any[] = g.porModalidad ?? [];
    if (modo !== "egresados" && porModalidad.length > 0) {
      checkPage(30);
      sectionTitle("Distribución por Modalidad de Titulación");
      tableHeader([
        { label: "Modalidad", x: margin + 2   },
        { label: "Cantidad",  x: margin + 100 },
      ]);
      porModalidad.forEach((r: any, i: number) => {
        tableRow([
          { text: String(r.modalidad ?? "—"), x: margin + 2   },
          { text: String(r.cantidad),          x: margin + 100 },
        ], i);
      });
      y += 6;
    }

    // ── Tabla 4: Distribución geográfica ─────────────────────────────────────
    const geoCiudad: any[] = g.geoCiudad ?? [];
    const geoRegion: any[]  = g.geoRegion ?? [];

    if (geoCiudad.length > 0 || geoRegion.length > 0) {
      checkPage(30);
      sectionTitle("Distribución Geográfica");

      const colGeo = (pageW - margin * 2) / 2 - 2;
      const xRegion = margin + colGeo + 4;

      // Encabezados de las dos columnas
      pdf.setFillColor(0, 165, 168);
      pdf.rect(margin,   y - 4, colGeo, 8, "F");
      pdf.rect(xRegion,  y - 4, colGeo, 8, "F");
      pdf.setTextColor(255, 255, 255); pdf.setFontSize(8); pdf.setFont("helvetica", "bold");
      pdf.text("Ciudad de trabajo",      margin + 2,   y + 1);
      pdf.text("Lugar de residencia",    xRegion + 2,  y + 1);
      y += 8;

      const maxFilas = Math.max(geoCiudad.length, geoRegion.length);
      for (let i = 0; i < Math.min(maxFilas, 10); i++) {
        checkPage(8);
        const ciudad = geoCiudad[i];
        const region = geoRegion[i];
        const bg = i % 2 === 0 ? [248, 250, 252] : [255, 255, 255];

        pdf.setFillColor(bg[0], bg[1], bg[2]);
        pdf.rect(margin,  y - 4, colGeo, 7, "F");
        pdf.rect(xRegion, y - 4, colGeo, 7, "F");
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(8);

        if (ciudad) {
          pdf.setTextColor(30, 41, 59);
          pdf.text(`${i + 1}. ${String(ciudad.ciudad ?? "—")}`, margin + 2, y + 0.5);
          pdf.setTextColor(0, 165, 168); pdf.setFont("helvetica", "bold");
          pdf.text(String(ciudad.cantidad), margin + colGeo - 10, y + 0.5);
        }
        if (region) {
          pdf.setTextColor(30, 41, 59); pdf.setFont("helvetica", "normal");
          pdf.text(`${i + 1}. ${String(region.region ?? "—")}`, xRegion + 2, y + 0.5);
          pdf.setTextColor(0, 165, 168); pdf.setFont("helvetica", "bold");
          pdf.text(String(region.cantidad), xRegion + colGeo - 10, y + 0.5);
        }
        y += 7;
      }
      y += 6;
    }

    // ── Tabla 5: Comparativo cohorte ──────────────────────────────────────────
    const cohorte: any[] = g.cohorteComparativo ?? [];
    if (cohorte.length > 0) {
      checkPage(30);
      sectionTitle("Comparativo por Cohorte de Ingreso");
      const chCols = [18, 16, 20, 22, 26, 22];
      tableHeader([
        { label: "Cohorte",     x: margin + 2                                          },
        { label: "Total",       x: margin + 2  + chCols[0]                             },
        { label: "Titulados",   x: margin + 2  + chCols[0] + chCols[1]                 },
        { label: "Egresados",   x: margin + 2  + chCols[0] + chCols[1] + chCols[2]     },
        { label: "Con empleo",  x: margin + 2  + chCols[0] + chCols[1] + chCols[2] + chCols[3]     },
        { label: "% Titulados", x: margin + 2  + chCols[0] + chCols[1] + chCols[2] + chCols[3] + chCols[4] },
      ]);
      cohorte.slice(0, 20).forEach((r: any, i: number) => {
        let xc = margin + 2;
        tableRow([
          { text: String(r.cohorte ?? "—"),                   x: xc                   },
          { text: String(r.total ?? 0),                        x: xc + chCols[0]       },
          { text: String(r.titulados ?? 0),                    x: xc + chCols[0] + chCols[1]                         },
          { text: String(r.egresados ?? 0),                    x: xc + chCols[0] + chCols[1] + chCols[2]             },
          { text: String(r.conEmpleo ?? 0),                    x: xc + chCols[0] + chCols[1] + chCols[2] + chCols[3] },
          { text: `${(r.pctTitulados ?? 0).toFixed(1)}%`,      x: xc + chCols[0] + chCols[1] + chCols[2] + chCols[3] + chCols[4] },
        ], i);
      });
      y += 6;
    }

    // ── Pie de página en todas las páginas ────────────────────────────────────
    addFooter();
    const totalPages = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(7); pdf.setFont("helvetica", "normal"); pdf.setTextColor(148, 163, 184);
      pdf.text(
        `Sistema de Seguimiento de Egresados · UMSA · ${modoLabel} · ${fechaGen} · Pág. ${i}/${totalPages}`,
        pageW / 2, pageH - 6, { align: "center" }
      );
    }

    pdf.save(`dashboard_${modo}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const kpis = data?.kpis ?? {};
  const g    = data?.graficos ?? {};

  // ── Renderizar KPIs según modo ────────────────────────────────────────────
  const renderKpis = () => {
    const base = [
      {
        label: "Total registrados",
        value: kpis.totalRegistrados ?? 0,
        sub: modo === "titulados" ? "Titulados activos" : modo === "egresados" ? "Egresados sin título" : "Titulados + Egresados",
        icon: modo === "egresados" ? Users : GraduationCap,
        color: "text-primary-500", bg: "bg-primary-500/10 border-primary-500/20",
      },
      {
        label: "Con empleo activo",
        value: kpis.conEmpleo ?? 0,
        sub: `${kpis.tasaEmpleabilidad ?? 0}% de empleabilidad`,
        icon: Briefcase,
        color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20",
      },
      {
        label: "Tasa de empleabilidad",
        value: `${kpis.tasaEmpleabilidad ?? 0}%`,
        sub: modo === "titulados" ? "De titulados con empleo" : modo === "egresados" ? "De egresados con empleo" : "Global",
        icon: TrendingUp,
        color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20",
      },
      {
        label: "Inserción laboral",
        value: kpis.tiempoPromedioInsercion ? `${kpis.tiempoPromedioInsercion}m` : "—",
        sub: modo === "egresados" ? "Meses egreso → primer empleo" : "Meses titulación → primer empleo",
        icon: Clock,
        color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/20",
      },
    ];

    if (modo !== "egresados") {
      base.push({
        label: "Egreso → Titulación",
        value: kpis.tiempoPromedioTitulacion ? `${kpis.tiempoPromedioTitulacion}m` : "—",
        sub: "Tiempo promedio en meses",
        icon: TrendingUp,
        color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20",
      });
    }

    return base;
  };

  // ── Renderizar gráficos según modo ────────────────────────────────────────
  const renderGraficos = () => {
    const tituloAnio = modo === "titulados" ? "Titulados por año de titulación"
      : modo === "egresados" ? "Egresados por año de egreso"
      : "Graduados por año";

    return (
      <>
        {/* Fila 1: Por año + Sector */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico por año */}
          <div className="rounded-2xl p-5" style={{ background: "var(--blanco)", border: "1px solid var(--borde)", boxShadow: "var(--shadow-sm)" }}>
            <h3 className="font-bold mb-1" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>{tituloAnio}</h3>
            <p className="text-xs mb-4" style={{ color: "var(--placeholder)" }}>
              {modo === "ambos" ? "Comparativo titulados vs egresados por año" : `Total por año`}
            </p>
            {g.porAnio?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={g.porAnio} barSize={modo === "ambos" ? 14 : 18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--borde)" />
                  <XAxis dataKey="anio" tick={{ fill: "var(--gris-grafito)", fontSize: 11 }} axisLine={false} />
                  <YAxis tick={{ fill: "var(--gris-grafito)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  {modo === "ambos" ? (
                    <>
                      <Legend wrapperStyle={{ fontSize: "11px", color: "var(--gris-grafito)" }} />
                      <Bar dataKey="titulados" name="Titulados" fill="#00A5A8" radius={[3,3,0,0]} />
                      <Bar dataKey="egresados" name="Egresados" fill="#f59e0b" radius={[3,3,0,0]} />
                    </>
                  ) : (
                    <Bar dataKey="total" name={modo === "titulados" ? "Titulados" : "Egresados"} fill="#00A5A8" radius={[3,3,0,0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px]">
                <p className="text-sm" style={{ color: "var(--placeholder)" }}>Sin datos</p>
              </div>
            )}
          </div>

          {/* Sector laboral */}
          <div className="rounded-2xl p-5" style={{ background: "var(--blanco)", border: "1px solid var(--borde)", boxShadow: "var(--shadow-sm)" }}>
            <h3 className="font-bold mb-1" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>Sector laboral</h3>
            <p className="text-xs mb-4" style={{ color: "var(--placeholder)" }}>Distribución de empleos actuales</p>
            {g.porSector?.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={g.porSector} dataKey="cantidad" nameKey="sector" cx="50%" cy="50%" outerRadius={85}
                    label={({ sector: s, percent }: any) => `${s} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {g.porSector.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...TT} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px]">
                <p className="text-sm" style={{ color: "var(--placeholder)" }}>Sin datos</p>
              </div>
            )}
          </div>
        </div>

        {/* Fila 2: Modalidad (si aplica) + Geografía */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Modalidad — solo titulados y ambos */}
          {modo !== "egresados" && (
            <div className="rounded-2xl p-5" style={{ background: "var(--blanco)", border: "1px solid var(--borde)", boxShadow: "var(--shadow-sm)" }}>
              <h3 className="font-bold mb-1" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>Modalidad de titulación</h3>
              <p className="text-xs mb-4" style={{ color: "var(--placeholder)" }}>Cantidad por cada modalidad</p>
              {g.porModalidad?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={g.porModalidad} layout="vertical" barSize={22}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--borde)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "var(--gris-grafito)", fontSize: 11 }} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="modalidad" tick={{ fill: "var(--gris-grafito)", fontSize: 10 }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip {...TT} />
                    <Bar dataKey="cantidad" name="Egresados" radius={[0,4,4,0]}>
                      {g.porModalidad.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px]">
                  <p className="text-sm" style={{ color: "var(--placeholder)" }}>Sin datos de modalidad</p>
                </div>
              )}
            </div>
          )}

          {/* Distribución geográfica */}
          <div className={cn("rounded-2xl p-5", modo === "egresados" && "lg:col-span-2")}
            style={{ background: "var(--blanco)", border: "1px solid var(--borde)", boxShadow: "var(--shadow-sm)" }}>
            <h3 className="font-bold mb-1" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>Distribución geográfica</h3>
            <p className="text-xs mb-4" style={{ color: "var(--placeholder)" }}>Ciudad de trabajo y lugar de residencia</p>
            <div className="grid grid-cols-2 gap-6">
              <TablaGeo data={g.geoCiudad ?? []} titulo="Ciudad de trabajo" />
              <TablaGeo data={(g.geoRegion ?? []).map((r: any) => ({ ...r, ciudad: r.region }))} titulo="Lugar de residencia" />
            </div>
          </div>
        </div>

        {/* Tabla cohorte */}
        <div className="rounded-2xl p-5" style={{ background: "var(--blanco)", border: "1px solid var(--borde)", boxShadow: "var(--shadow-sm)" }}>
          <h3 className="font-bold mb-1" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>Comparativo por cohorte de ingreso</h3>
          <p className="text-xs mb-4" style={{ color: "var(--placeholder)" }}>Últimas 20 cohortes</p>
          <TablaCohorte data={g.cohorteComparativo ?? []} />
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Selector de modo ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SelectorModo modo={modo} onChange={handleModoChange} />
        <button
          onClick={exportarPDF}
          disabled={!data || loading}
          className="btn-sm px-4 flex items-center gap-2 rounded-lg border"
          style={{ borderColor: "var(--borde)", color: "var(--azul-pizarra)", background: "var(--blanco)" }}
          title={`Exportar dashboard (${modo}) como PDF`}
        >
          <FileDown className="w-4 h-4" style={{ color: "var(--turquesa)" }} />
          Exportar PDF
        </button>
      </div>

      {/* ── Loading / Error ── */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin" style={{ color: "var(--turquesa)" }} />
            <p className="text-sm" style={{ color: "var(--gris-grafito)" }}>Cargando estadísticas…</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#dc2626" }}>
          {error}
        </div>
      )}

      {!loading && data && (
        <>
          {/* ── KPIs ── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {renderKpis().map((kpi, i) => (
              <KpiCard key={i} {...kpi} />
            ))}
            <KpiCardGenero
              masculino={kpis.masculino ?? 0}
              femenino={kpis.femenino  ?? 0}
              otro={kpis.otro          ?? 0}
              total={kpis.totalRegistrados ?? 0}
            />
          </div>

          {/* ── Separador ── */}
          <div className="flex items-center gap-3">
            <div style={{ flex: 1, height: "1px", background: "var(--borde)" }} />
            <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
              style={{ background: "var(--turquesa-pale)", color: "var(--turquesa-dark)", border: "1px solid rgba(0,165,168,0.20)" }}>
              Gráficos y análisis
            </span>
            <div style={{ flex: 1, height: "1px", background: "var(--borde)" }} />
          </div>

          {/* ── Panel de filtros ── */}
          <PanelFiltros
            modo={modo}
            filtros={filtros}
            onChange={setFiltro}
            onApply={() => fetchData(filtros, modo)}
            onReset={() => { resetFiltros(); fetchData({}, modo); }}
            loading={loading}
          />

          {/* ── Gráficos ── */}
          {renderGraficos()}
        </>
      )}
    </div>
  );
}