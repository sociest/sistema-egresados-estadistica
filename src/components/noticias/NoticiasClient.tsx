// src/components/noticias/NoticiasClient.tsx
"use client";
import { useRouter } from "next/navigation";
import { Calendar, BookOpen, Newspaper, Users, ArrowRight, Rss } from "lucide-react";
import { fmtDateLong } from "@/lib/utils";

interface Noticia {
  id: number; titulo: string; cuerpo: string; tipo: string;
  fecha: string; imagenUrl: string | null; publicado: boolean;
}
interface Props { noticias: Noticia[]; tipoFiltro?: string; }

const TIPO_META: Record<string, { label: string; icon: any; bg: string; color: string; border: string; accent: string }> = {
  noticia_institucional: { label: "Institucional", icon: Newspaper, bg: "var(--turquesa-light)", color: "var(--turquesa-dark)", border: "#99e6e7",              accent: "#00A5A8" },
  curso_evento:          { label: "Curso / Evento", icon: BookOpen,  bg: "rgba(139,92,246,0.10)", color: "#7c3aed",              border: "rgba(139,92,246,0.30)", accent: "#7c3aed" },
  noticia_social:        { label: "Social",         icon: Users,     bg: "var(--naranja-light)",  color: "var(--naranja)",        border: "#fed7aa",              accent: "#ea580c" },
};

function NoticiaCard({ noticia, index }: { noticia: Noticia; index: number }) {
  const meta = TIPO_META[noticia.tipo] ?? TIPO_META.noticia_institucional;
  const Icon = meta.icon;
  const extracto = noticia.cuerpo.length > 180 ? noticia.cuerpo.slice(0, 180) + "…" : noticia.cuerpo;

  return (
    <article
      className="group rounded-[2.5rem] overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-fade-up"
      style={{ background: "var(--blanco)", border: "1px solid var(--borde)", boxShadow: "var(--shadow-sm)", borderBottomWidth: "4px", borderBottomColor: meta.accent, animationDelay: `${index * 0.06}s`, animationFillMode: "both" }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = meta.accent; el.style.borderBottomColor = meta.accent; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--borde)"; el.style.borderBottomColor = meta.accent; }}
    >
      {/* Imagen o franja */}
      {noticia.imagenUrl ? (
        <div className="h-48 overflow-hidden">
          <img src={noticia.imagenUrl} alt={noticia.titulo}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      ) : (
        <div className="h-2 w-full" style={{ background: `linear-gradient(90deg, ${meta.accent}, ${meta.accent}88)` }} />
      )}

      <div className="flex flex-col flex-1 p-7">
        {/* Badge + fecha */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full"
            style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
            <Icon className="w-3 h-3" />
            {meta.label}
          </span>
          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--placeholder)" }}>
            <Calendar className="w-3 h-3" />
            {fmtDateLong(noticia.fecha)}
          </span>
        </div>

        {/* Título */}
        <h2 className="font-black text-base uppercase tracking-tight leading-snug mb-3"
          style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
          {noticia.titulo}
        </h2>

        {/* Extracto */}
        <p className="text-sm font-medium leading-relaxed flex-1 italic" style={{ color: "var(--gris-grafito)" }}>
          {extracto}
        </p>

        {/* Leer más */}
        {noticia.cuerpo.length > 180 && (
          <div className="flex items-center gap-1.5 mt-4 text-xs font-black uppercase tracking-widest transition-all duration-200 group-hover:gap-3" style={{ color: meta.color }}>
            Leer más <ArrowRight className="w-3 h-3" />
          </div>
        )}
      </div>
    </article>
  );
}

export default function NoticiasClient({ noticias, tipoFiltro }: Props) {

  
  const router = useRouter();

  const buildUrl = (tipo?: string) => tipo ? `/noticias?tipo=${tipo}` : "/noticias";

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(160deg, #001d3d 0%, #003666 55%, #00447e 100%)", paddingBottom: "80px" }}>
        <div className="pointer-events-none absolute inset-0 select-none" aria-hidden="true">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
          <svg className="absolute right-0 top-0 h-full w-[50%] opacity-[0.05]" viewBox="0 0 600 400" fill="none">
            <path d="M0 120 Q150 40 300 120 T600 120" stroke="white" strokeWidth="2" />
            <path d="M0 240 Q150 160 300 240 T600 240" stroke="#ea580c" strokeWidth="1.5" />
          </svg>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-8 text-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-6"
            style={{ background: "rgba(0,165,168,0.15)", border: "1px solid rgba(0,165,168,0.30)" }}>
            <Rss className="w-3.5 h-3.5" style={{ color: "#4DD4D5" }} />
            <span className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: "#4DD4D5" }}>Noticias y Eventos</span>
          </div>

          <h1 className="font-black uppercase tracking-tighter leading-[0.95] text-white mb-4"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>
            Novedades de<br />
            <span className="font-serif italic lowercase tracking-normal" style={{ color: "#00A5A8", fontSize: "clamp(2.8rem, 5.5vw, 4.5rem)" }}>la carrera</span>
          </h1>
          <p className="text-base font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
            Entérate de las últimas noticias, cursos y eventos de la Carrera de Estadística UMSA
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-16" fill="none">
            <path d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,20 1440,30 L1440,60 L0,60 Z" fill="var(--blanco)" />
          </svg>
        </div>
      </section>

      {/* ── Filtros ── */}
      <section style={{ background: "var(--blanco)", borderBottom: "1px solid var(--borde)" }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap gap-2 items-center">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] mr-1" style={{ color: "var(--placeholder)" }}>Filtrar:</span>
          <button onClick={() => router.push(buildUrl())}
            className="text-xs px-4 py-2 rounded-full font-black uppercase tracking-widest transition-all"
            style={!tipoFiltro ? { background: "var(--turquesa)", color: "white", border: "none" } : { background: "var(--humo)", color: "var(--gris-grafito)", border: "1px solid var(--borde)" }}>
            Todos ({noticias.length})
          </button>
          {Object.entries(TIPO_META).map(([key, meta]) => {
            const count = noticias.filter(n => n.tipo === key).length;
            const active = tipoFiltro === key;
            return (
              <button key={key} onClick={() => router.push(buildUrl(key))}
                className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-full font-black uppercase tracking-widest transition-all"
                style={active ? { background: meta.color, color: "white", border: "none" } : { background: "var(--humo)", color: "var(--gris-grafito)", border: "1px solid var(--borde)" }}>
                <meta.icon className="w-3 h-3" />
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Grid de noticias ── */}
      <section style={{ background: "#f1f5f9" }} className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          {noticias.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--borde)" }}>
                <Newspaper className="w-8 h-8" style={{ color: "var(--placeholder)" }} />
              </div>
              <p className="text-lg font-black uppercase tracking-tight" style={{ color: "var(--gris-grafito)", fontFamily: "'Source Serif 4', serif" }}>Sin publicaciones</p>
              <p className="text-sm mt-2" style={{ color: "var(--placeholder)" }}>
                {tipoFiltro ? "No hay publicaciones de este tipo aún." : "Pronto habrá novedades."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {noticias.map((n, i) => <NoticiaCard key={n.id} noticia={n} index={i} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}