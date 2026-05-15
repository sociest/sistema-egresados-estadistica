// src/components/directorio/DirectorioClient.tsx
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, MapPin, Briefcase, X, ChevronLeft, ChevronRight, GraduationCap, Users, ArrowRight, LogIn } from "lucide-react";

interface Egresado {
  id: number; nombres: string; apellidoPaterno: string | null; apellidoMaterno: string | null;
  tituloAcademico: string | null; anioTitulacion: number | null;
  correoElectronico: string | null; celular: string | null;
  empleoActual: string | null; ciudadActual: string | null; sectorActual: string | null;
}

interface Props {
  egresados: Egresado[]; total: number; page: number; totalPages: number;
  searchParams: Record<string, string | undefined>;
}

const SECTOR_STYLE: Record<string, React.CSSProperties> = {
  Publico:       { background: "rgba(59,130,246,0.08)",  color: "#2563eb", border: "1px solid rgba(59,130,246,0.20)" },
  Privado:       { background: "rgba(139,92,246,0.08)",  color: "#7c3aed", border: "1px solid rgba(139,92,246,0.20)" },
  Independiente: { background: "rgba(245,158,11,0.08)",  color: "#d97706", border: "1px solid rgba(245,158,11,0.20)" },
  ONG:           { background: "rgba(16,185,129,0.08)",  color: "#059669", border: "1px solid rgba(16,185,129,0.20)" },
  Otro:          { background: "var(--humo)",            color: "var(--gris-grafito)", border: "1px solid var(--borde)" },
};

const abrirModal = () => window.dispatchEvent(new CustomEvent("abrir-modal-login"));

function EgresadoCard({ eg }: { eg: Egresado }) {
  const initials = `${(eg.apellidoPaterno ?? eg.apellidoMaterno ?? "")[0]}${eg.nombres[0]}`;
  const nombre   = [eg.apellidoPaterno, eg.apellidoMaterno].filter(Boolean).join(" ")
    ? `${[eg.apellidoPaterno, eg.apellidoMaterno].filter(Boolean).join(" ")}, ${eg.nombres}` : eg.nombres;

  return (
    <div
      className="rounded-[2.5rem] p-5 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1"
      style={{ background: "var(--blanco)", border: "1px solid var(--borde)", boxShadow: "var(--shadow-sm)" }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--turquesa)"; el.style.boxShadow = "var(--shadow-turq)"; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--borde)"; el.style.boxShadow = "var(--shadow-sm)"; }}
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 transition-transform duration-300 hover:scale-105"
          style={{ background: "var(--turquesa-light)", color: "var(--turquesa-dark)", fontFamily: "'Source Serif 4', serif" }}>
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm leading-tight truncate" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>{nombre}</p>
          {eg.tituloAcademico && <p className="text-xs mt-0.5 truncate italic" style={{ color: "var(--gris-grafito)" }}>{eg.tituloAcademico}</p>}
        </div>
      </div>

      {eg.empleoActual && (
        <div className="flex items-start gap-2">
          <Briefcase className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "var(--turquesa)" }} />
          <p className="text-xs leading-snug" style={{ color: "var(--azul-pizarra)" }}>{eg.empleoActual}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {eg.ciudadActual && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--humo)", color: "var(--gris-grafito)", border: "1px solid var(--borde)" }}>
            <MapPin className="w-3 h-3" /> {eg.ciudadActual}
          </span>
        )}
        {eg.sectorActual && SECTOR_STYLE[eg.sectorActual] && (
          <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium" style={SECTOR_STYLE[eg.sectorActual]}>{eg.sectorActual}</span>
        )}
      </div>

      {eg.correoElectronico && (
        <a href={`mailto:${eg.correoElectronico}`} className="text-xs truncate transition-colors" style={{ color: "var(--turquesa-dark)" }}>
          {eg.correoElectronico}
        </a>
      )}
    </div>
  );
}

export default function DirectorioClient({ egresados, total, page, totalPages, searchParams }: Props) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState(searchParams.busqueda ?? "");

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const merged = { ...searchParams, ...overrides };
    const p = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v); });
    return `/directorio?${p}`;
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl({ busqueda: busqueda || undefined, page: undefined }));
  };

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(160deg, #001d3d 0%, #003666 55%, #00447e 100%)", paddingBottom: "80px" }}>
        <div className="pointer-events-none absolute inset-0 select-none" aria-hidden="true">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
          <svg className="absolute right-0 top-0 h-full w-[50%] opacity-[0.05]" viewBox="0 0 600 500" fill="none" preserveAspectRatio="xMidYMid slice">
            <path d="M0 150 Q150 50 300 150 T600 150" stroke="white" strokeWidth="2" />
            <path d="M0 280 Q150 180 300 280 T600 280" stroke="#00A5A8" strokeWidth="1.5" />
          </svg>
          <div className="absolute top-12 right-1/4 hidden lg:block text-[160px] font-black italic select-none opacity-[0.03]" style={{ fontFamily: "'Source Serif 4', serif", color: "white" }}>σ</div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-8 text-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-6"
            style={{ background: "rgba(0,165,168,0.15)", border: "1px solid rgba(0,165,168,0.30)" }}>
            <Users className="w-3.5 h-3.5" style={{ color: "#4DD4D5" }} />
            <span className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: "#4DD4D5" }}>Directorio de Egresados</span>
          </div>

          <h1 className="font-black uppercase tracking-tighter leading-[0.95] text-white mb-4"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontFamily: "inherit" }}>
            Estadísticos de la<br />
            <span className="font-serif italic lowercase tracking-normal" style={{ color: "#00A5A8", fontSize: "clamp(2.8rem, 5.5vw, 4.5rem)" }}>UMSA en acción</span>
          </h1>

          <p className="text-base font-medium mb-8" style={{ color: "rgba(255,255,255,0.65)" }}>
            <span className="font-black text-white">{total}</span> egresado{total !== 1 ? "s" : ""} comparte{total !== 1 ? "n" : ""} su perfil profesional
          </p>

          <form onSubmit={onSearch} className="flex gap-2 max-w-lg mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.40)" }} />
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre…"
                style={{ width: "100%", background: "rgba(255,255,255,0.10)", border: "1.5px solid rgba(255,255,255,0.18)", borderRadius: "1rem", padding: "0.75rem 0.875rem 0.75rem 2.5rem", color: "white", fontSize: "0.875rem", outline: "none", backdropFilter: "blur(8px)" }}
              />
              {busqueda && (
                <button type="button" onClick={() => { setBusqueda(""); router.push(buildUrl({ busqueda: undefined, page: undefined })); }}
                  style={{ position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.50)" }}>
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button type="submit"
              className="px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-wider transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)", color: "white", boxShadow: "0 4px 16px rgba(234,88,12,0.40)" }}>
              Buscar
            </button>
          </form>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-16" fill="none">
            <path d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,20 1440,30 L1440,60 L0,60 Z" fill="var(--blanco)" />
          </svg>
        </div>
      </section>

      {/* ── Filtros rápidos de sector ── */}
      <section style={{ background: "var(--blanco)", borderBottom: "1px solid var(--borde)" }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap gap-2 items-center">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] mr-1" style={{ color: "var(--placeholder)" }}>Sector:</span>
          {["Publico", "Privado", "Independiente", "ONG"].map(s => (
            <button key={s} onClick={() => router.push(buildUrl({ sector: searchParams.sector === s ? undefined : s, page: undefined }))}
              className="text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-widest transition-all duration-200"
              style={searchParams.sector === s ? { ...SECTOR_STYLE[s], fontWeight: 700 } : { background: "var(--humo)", color: "var(--gris-grafito)", border: "1px solid var(--borde)" }}>
              {s}
            </button>
          ))}
          {(searchParams.sector || searchParams.busqueda) && (
            <button onClick={() => router.push("/directorio")} className="text-xs px-3 py-1.5 rounded-full flex items-center gap-1 transition-all hover:text-red-500" style={{ color: "var(--gris-grafito)" }}>
              <X className="w-3 h-3" /> Limpiar
            </button>
          )}
        </div>
      </section>

      {/* ── Grid de egresados ── */}
      <section style={{ background: "#f1f5f9" }} className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          {egresados.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--borde)" }}>
                <Search className="w-8 h-8" style={{ color: "var(--placeholder)" }} />
              </div>
              <p className="text-lg font-black uppercase tracking-tight" style={{ color: "var(--gris-grafito)", fontFamily: "'Source Serif 4', serif" }}>Sin resultados</p>
              <p className="text-sm mt-2" style={{ color: "var(--placeholder)" }}>Prueba con otros términos de búsqueda</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {egresados.map(eg => <EgresadoCard key={eg.id} eg={eg} />)}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-3">
                  {page > 1 && (
                    <a href={buildUrl({ page: String(page - 1) })}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all hover:-translate-y-0.5"
                      style={{ background: "var(--blanco)", border: "1.5px solid var(--borde)", color: "var(--azul-pizarra)", boxShadow: "var(--shadow-sm)" }}>
                      <ChevronLeft className="w-4 h-4" /> Anterior
                    </a>
                  )}
                  <div className="px-5 py-2.5 rounded-2xl text-sm font-bold" style={{ background: "var(--turquesa-light)", color: "var(--turquesa-dark)", border: "1px solid rgba(0,165,168,0.25)" }}>
                    {page} / {totalPages}
                  </div>
                  {page < totalPages && (
                    <a href={buildUrl({ page: String(page + 1) })}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all hover:-translate-y-0.5"
                      style={{ background: "var(--blanco)", border: "1.5px solid var(--borde)", color: "var(--azul-pizarra)", boxShadow: "var(--shadow-sm)" }}>
                      Siguiente <ChevronRight className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── Banner CTA dentro del grid (aparece al final de la lista) ── */}
      <section style={{ background: "#f1f5f9", paddingBottom: "3rem" }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="mt-4 rounded-[3rem] overflow-hidden relative" style={{ background: "linear-gradient(160deg, #001d3d 0%, #003666 55%, #00447e 100%)" }}>
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
              <button
                onClick={abrirModal}
                className="group flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 hover:-translate-y-1 hover:scale-105 shrink-0"
                style={{ background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)", color: "white", boxShadow: "0 8px 28px rgba(234,88,12,0.40)" }}>
                <LogIn className="w-4 h-4 transition-transform group-hover:scale-110" />
                Unirme al directorio
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section style={{ background: "var(--blanco)", borderTop: "1px solid var(--borde)" }} className="py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-[2px] w-8 rounded-full" style={{ background: "#ea580c" }} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: "#ea580c" }}>¿No apareces?</span>
            <div className="h-[2px] w-8 rounded-full" style={{ background: "#ea580c" }} />
          </div>
          <h2 className="text-2xl font-black uppercase leading-tight tracking-tighter mb-3" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
            Eres egresado y no<br />
            <span className="font-serif italic lowercase tracking-normal" style={{ color: "var(--turquesa)" }}>apareces aquí</span>
          </h2>
          <p className="mb-8 text-sm font-medium italic leading-relaxed border-l-4 border-slate-200 pl-4 py-2 text-slate-500 max-w-md mx-auto">
            Activa tu perfil en el directorio desde tu cuenta. Los perfiles más completos y actualizados aparecen primero.
          </p>
          <button
            onClick={abrirModal}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all hover:-translate-y-1 hover:scale-105"
            style={{ background: "linear-gradient(135deg, #00447e 0%, #001d3d 100%)", boxShadow: "0 8px 28px rgba(0,29,61,0.25)" }}>
            <LogIn className="w-4 h-4" />
            Activar mi perfil en el directorio
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </>
  );
}