"use client";
import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, PieChart, Pie, Legend,
} from "recharts";
import { Download, Table2, BarChart2, Loader2, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { cn, fmtDate } from "@/lib/utils";
import { MODALIDADES_TITULACION } from "@/lib/schema";

const COLORS = ["#0ea5e9","#10b981","#f59e0b","#8b5cf6","#ef4444","#06b6d4","#f97316"];
const TT = { contentStyle:{ backgroundColor:"#1e293b", border:"1px solid #334155", borderRadius:"10px", color:"#e2e8f0", fontSize:"12px" } };

export default function ReportesClient() {
  const [vista,          setVista]          = useState<"tabla" | "grafico">("tabla");
  const [loading,        setLoading]        = useState(false);
  const [data,           setData]           = useState<any>(null);
  const [filtrosOpen,    setFiltrosOpen]    = useState(false);

  // Filtros básicos
  const [anio,           setAnio]           = useState("");
  const [conEmpleo,      setConEmpleo]      = useState("");
  const [genero,         setGenero]         = useState("");
  // Filtros nuevos — Bloque 6
  const [tipo,           setTipo]           = useState("");
  const [modalidad,      setModalidad]      = useState("");
  const [sector,         setSector]         = useState("");
  const [ciudad,         setCiudad]         = useState("");
  const [tienePostgrado, setTienePostgrado] = useState("");
  const [anioTitDesde,   setAnioTitDesde]   = useState("");
  const [anioTitHasta,   setAnioTitHasta]   = useState("");

  const years = Array.from({ length: new Date().getFullYear() - 1997 }, (_, i) => 1998 + i).reverse();

  const buildParams = () => {
    const p = new URLSearchParams();
    if (anio)           p.set("anioEgreso",          anio);
    if (conEmpleo)      p.set("conEmpleo",            conEmpleo);
    if (genero)         p.set("genero",               genero);
    if (tipo)           p.set("tipo",                 tipo);
    if (modalidad)      p.set("modalidad",            modalidad);
    if (sector)         p.set("sector",               sector);
    if (ciudad)         p.set("ciudad",               ciudad);
    if (tienePostgrado) p.set("tienePostgrado",       tienePostgrado);
    if (anioTitDesde)   p.set("anioTitulacionDesde",  anioTitDesde);
    if (anioTitHasta)   p.set("anioTitulacionHasta",  anioTitHasta);
    return p;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/reportes?${buildParams()}`);
      const json = await res.json();
      setData(json.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch("/api/reportes");
        const json = await res.json();
        setData(json.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const exportExcel = () => {
    const p = buildParams();
    p.set("exportar", "excel");
    window.open(`/api/reportes?${p}`, "_blank");
  };

  const limpiarFiltros = () => {
    setAnio(""); setConEmpleo(""); setGenero("");
    setTipo(""); setModalidad(""); setSector("");
    setCiudad(""); setTienePostgrado("");
    setAnioTitDesde(""); setAnioTitHasta("");
  };

  const filtrosActivos = [anio, conEmpleo, genero, tipo, modalidad, sector, ciudad, tienePostgrado, anioTitDesde, anioTitHasta].filter(Boolean).length;

  const fieldCss: React.CSSProperties = {
    width: "100%",
    background: "var(--humo)",
    border: "1.5px solid var(--borde)",
    borderRadius: "0.75rem",
    padding: "0.5rem 0.875rem",
    fontSize: "0.8rem",
    color: "var(--azul-pizarra)",
    outline: "none",
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label style={{ display:"block", fontSize:"0.7rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", color:"var(--gris-grafito)", marginBottom:"0.375rem" }}>
        {label}
      </label>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Panel de filtros ── */}
      <div className="card" style={{ background: "var(--blanco)" }}>
        {/* Fila principal */}
        <div className="flex flex-wrap gap-3 items-end">
          <div style={{ minWidth: "130px" }}>
            <Field label="Año Egreso">
              <select value={anio} onChange={e => setAnio(e.target.value)} style={fieldCss}>
                <option value="">Todos</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ minWidth: "130px" }}>
            <Field label="Tipo">
              <select value={tipo} onChange={e => setTipo(e.target.value)} style={fieldCss}>
                <option value="">Todos</option>
                <option value="Titulado">Titulado</option>
                <option value="Egresado">Egresado</option>
              </select>
            </Field>
          </div>
          <div style={{ minWidth: "130px" }}>
            <Field label="Estado Laboral">
              <select value={conEmpleo} onChange={e => setConEmpleo(e.target.value)} style={fieldCss}>
                <option value="">Todos</option>
                <option value="true">Con empleo</option>
                <option value="false">Sin empleo</option>
              </select>
            </Field>
          </div>

          {/* Toggle filtros avanzados */}
          <button
            type="button"
            onClick={() => setFiltrosOpen(v => !v)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 0.875rem", borderRadius: "0.5rem",
              fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
              background: filtrosOpen ? "var(--turquesa-pale)" : "var(--humo)",
              border: `1.5px solid ${filtrosOpen ? "var(--turquesa)" : "var(--borde)"}`,
              color: filtrosOpen ? "var(--turquesa-dark)" : "var(--gris-grafito)",
              position: "relative",
            }}
          >
            <SlidersHorizontal style={{ width: "0.875rem", height: "0.875rem" }} />
            Más filtros
            {filtrosActivos > 0 && (
              <span style={{
                position: "absolute", top: "-6px", right: "-6px",
                width: "18px", height: "18px", borderRadius: "9999px",
                background: "var(--turquesa)", color: "white",
                fontSize: "0.65rem", fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {filtrosActivos}
              </span>
            )}
            <ChevronDown style={{ width: "0.875rem", height: "0.875rem", transform: filtrosOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>

          <button onClick={fetchData} className="btn-primary btn-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ver resultados"}
          </button>
          <button onClick={exportExcel} className="btn-slate btn-sm flex items-center gap-2">
            <Download className="w-3.5 h-3.5" />
            Exportar Excel
            {filtrosActivos > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: "var(--turquesa)", color: "white", fontSize: "0.6rem" }}>
                con filtros
              </span>
            )}
          </button>
          {filtrosActivos > 0 && (
            <button onClick={limpiarFiltros} className="btn-ghost btn-sm flex items-center gap-1.5">
              <X className="w-3.5 h-3.5" /> Limpiar
            </button>
          )}
        </div>

        {/* Filtros avanzados */}
        {filtrosOpen && (
          <div className="mt-4 pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            style={{ borderTop: "1px solid var(--borde)" }}>
            <Field label="Género">
              <select value={genero} onChange={e => setGenero(e.target.value)} style={fieldCss}>
                <option value="">Todos</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </Field>
            <Field label="Modalidad Titulación">
              <select value={modalidad} onChange={e => setModalidad(e.target.value)} style={fieldCss}>
                <option value="">Todas</option>
                {MODALIDADES_TITULACION.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Sector Laboral">
              <select value={sector} onChange={e => setSector(e.target.value)} style={fieldCss}>
                <option value="">Todos</option>
                <option value="Publico">Público</option>
                <option value="Privado">Privado</option>
                <option value="Independiente">Independiente</option>
                <option value="ONG">ONG</option>
                <option value="Otro">Otro</option>
              </select>
            </Field>
            <Field label="Ciudad / Región Trabajo">
              <input
                value={ciudad}
                onChange={e => setCiudad(e.target.value)}
                placeholder="Ej: La Paz"
                style={fieldCss}
              />
            </Field>
            <Field label="Postgrado">
              <select value={tienePostgrado} onChange={e => setTienePostgrado(e.target.value)} style={fieldCss}>
                <option value="">Todos</option>
                <option value="true">Con postgrado</option>
                <option value="false">Sin postgrado</option>
              </select>
            </Field>
            <Field label="Año titulación desde">
              <select value={anioTitDesde} onChange={e => setAnioTitDesde(e.target.value)} style={fieldCss}>
                <option value="">Todos</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
            <Field label="Año titulación hasta">
              <select value={anioTitHasta} onChange={e => setAnioTitHasta(e.target.value)} style={fieldCss}>
                <option value="">Todos</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
          </div>
        )}
      </div>

      {data && (
        <>
          {/* Resumen y toggle de vista */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p style={{ color: "var(--gris-grafito)", fontSize: "0.875rem" }}>
              <span style={{ color: "var(--azul-pizarra)", fontWeight: 700, fontSize: "1.125rem" }}>
                {data.total}
              </span>{" "}
              egresados ·{" "}
              <span style={{ color: "var(--verde)", fontWeight: 600 }}>{data.conEmpleo}</span> con empleo ·{" "}
              <span style={{ color: "var(--gris-grafito)" }}>{data.sinEmpleo}</span> sin empleo
            </p>
            <div className="flex gap-1 rounded-xl p-1" style={{ background: "var(--humo)", border: "1px solid var(--borde)" }}>
              <button onClick={() => setVista("tabla")}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all")}
                style={vista === "tabla"
                  ? { background: "var(--blanco)", color: "var(--azul-pizarra)", boxShadow: "var(--shadow-sm)" }
                  : { color: "var(--gris-grafito)" }}>
                <Table2 className="w-3.5 h-3.5" /> Tabla
              </button>
              <button onClick={() => setVista("grafico")}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all")}
                style={vista === "grafico"
                  ? { background: "var(--blanco)", color: "var(--azul-pizarra)", boxShadow: "var(--shadow-sm)" }
                  : { color: "var(--gris-grafito)" }}>
                <BarChart2 className="w-3.5 h-3.5" /> Gráfico
              </button>
            </div>
          </div>

          {/* ── Vista tabla ── */}
          {vista === "tabla" && (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Apellidos, Nombres</th>
                    <th>CI</th>
                    <th>Tipo</th>
                    <th>Modalidad</th>
                    <th>Semestre Ingreso</th>
                    <th>Semestre Egreso</th>
                    <th>Año Titulación</th>
                    <th>Área Especialización</th>
                    <th>Residencia</th>
                    <th>Empleo</th>
                    <th>Postgrado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.filas?.map((r: any) => (
                    <tr key={r.id}>
                      <td>
                        <p className="font-semibold text-sm" style={{ color: "var(--azul-pizarra)" }}>
                          {[r.apellidoPaterno, r.apellidoMaterno].filter(Boolean).join(" ") || r.nombres}, {r.nombres}
                        </p>
                      </td>
                      <td>
                        <span className="font-mono text-sm" style={{ color: "var(--gris-grafito)" }}>{r.ci}</span>
                      </td>
                      <td>
                        <span className="badge" style={r.tipo === "Titulado" ? {
                          background: "var(--turquesa-light)", color: "var(--turquesa-dark)", border: "1px solid #99e6e7",
                        } : {
                          background: "var(--naranja-light)", color: "var(--naranja)", border: "1px solid #fed7aa",
                        }}>
                          {r.tipo}
                        </span>
                      </td>
                      <td className="text-sm" style={{ color: "var(--gris-grafito)" }}>
                        {r.modalidadTitulacion ?? "—"}
                      </td>
                      <td className="text-sm" style={{ color: "var(--gris-grafito)" }}>
                        {r.semestreIngreso ? `${r.semestreIngreso}/${r.anioIngreso}` : (r.anioIngreso ?? "—")}
                      </td>
                      <td className="text-sm" style={{ color: "var(--gris-grafito)" }}>
                        {r.semestreEgreso ? `${r.semestreEgreso}/${r.anioEgreso}` : (r.anioEgreso ?? "—")}
                      </td>
                      <td className="text-sm" style={{ color: "var(--gris-grafito)" }}>
                        {r.anioTitulacion ?? "—"}
                      </td>
                      <td className="text-sm" style={{ color: "var(--gris-grafito)", maxWidth: "150px" }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                          {r.areaEspecializacion ?? "—"}
                        </span>
                      </td>
                      <td className="text-sm" style={{ color: "var(--gris-grafito)" }}>
                        {r.lugarResidencia ?? "—"}
                      </td>
                      <td>
                        <span className="badge" style={r.tieneEmpleo ? {
                          background: "var(--verde-light)", color: "var(--verde)", border: "1px solid #86efac",
                        } : {
                          background: "var(--humo)", color: "var(--placeholder)", border: "1px solid var(--borde)",
                        }}>
                          {r.tieneEmpleo ? "Empleado" : "Sin empleo"}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={r.tienePostgrado ? {
                          background: "rgba(59,130,246,0.08)", color: "#2563eb", border: "1px solid rgba(59,130,246,0.20)",
                        } : {
                          background: "var(--humo)", color: "var(--placeholder)", border: "1px solid var(--borde)",
                        }}>
                          {r.tienePostgrado ? "Con postgrado" : "Sin postgrado"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Vista gráfico ── */}
          {vista === "grafico" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Egresados por año */}
              <div className="card" style={{ background: "var(--blanco)" }}>
                <h3 className="font-bold mb-1" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
                  Egresados por Año de Titulación
                </h3>
                <p className="text-xs mb-5" style={{ color: "var(--placeholder)" }}>Total titulados por año</p>
                {data.porAnio?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.porAnio} barSize={22}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--borde)" />
                      <XAxis dataKey="anio" tick={{ fill:"var(--gris-grafito)", fontSize:11 }} axisLine={false} />
                      <YAxis tick={{ fill:"var(--gris-grafito)", fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip {...TT} />
                      <Bar dataKey="cantidad" fill="#0ea5e9" radius={[4,4,0,0]} name="Egresados" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[220px]">
                    <p className="text-sm" style={{ color: "var(--placeholder)" }}>Sin datos</p>
                  </div>
                )}
              </div>

              {/* Distribución por género */}
              <div className="card" style={{ background: "var(--blanco)" }}>
                <h3 className="font-bold mb-1" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
                  Distribución por Género
                </h3>
                <p className="text-xs mb-5" style={{ color: "var(--placeholder)" }}>Composición por género</p>
                {data.porGenero?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={data.porGenero} dataKey="cantidad" nameKey="genero"
                        cx="50%" cy="50%" outerRadius={80}
                        label={({ genero, percent }: any) => `${genero} ${(percent * 100).toFixed(0)}%`}>
                        {(data.porGenero ?? []).map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
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

              {/* Empleabilidad por año */}
              <div className="card" style={{ background: "var(--blanco)" }}>
                <h3 className="font-bold mb-1" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
                  Empleabilidad por Año de Egreso
                </h3>
                <p className="text-xs mb-5" style={{ color: "var(--placeholder)" }}>Total vs con empleo actual</p>
                {data.empleabilidad?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={data.empleabilidad}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--borde)" />
                      <XAxis dataKey="anio" tick={{ fill:"var(--gris-grafito)", fontSize:11 }} axisLine={false} />
                      <YAxis tick={{ fill:"var(--gris-grafito)", fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip {...TT} />
                      <Legend wrapperStyle={{ fontSize: "11px", color: "var(--gris-grafito)" }} />
                      <Line type="monotone" dataKey="total"     stroke="var(--gris-grafito)" strokeWidth={2} dot={false} name="Total" />
                      <Line type="monotone" dataKey="conEmpleo" stroke="var(--verde)"        strokeWidth={2.5}
                        dot={{ r:3, fill:"var(--verde)" }} name="Con empleo" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[220px]">
                    <p className="text-sm" style={{ color: "var(--placeholder)" }}>Sin datos</p>
                  </div>
                )}
              </div>

              {/* Titulados vs Egresados */}
              <div className="card" style={{ background: "var(--blanco)" }}>
                <h3 className="font-bold mb-1" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
                  Titulados vs Egresados
                </h3>
                <p className="text-xs mb-5" style={{ color: "var(--placeholder)" }}>Distribución por tipo</p>
                {(data.porTipo ?? []).length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={data.porTipo} dataKey="cantidad" nameKey="tipo"
                        cx="50%" cy="50%" outerRadius={80}
                        label={({ tipo, percent }: any) => `${tipo} ${(percent * 100).toFixed(0)}%`}>
                        <Cell fill="#00A5A8" />
                        <Cell fill="#f59e0b" />
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
          )}
        </>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--turquesa)" }} />
        </div>
      )}
    </div>
  );
}