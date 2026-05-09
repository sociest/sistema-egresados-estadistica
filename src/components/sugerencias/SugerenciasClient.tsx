"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Eye, Trash2, User, UserX, CheckCircle } from "lucide-react";
import { cn, fmtDate } from "@/lib/utils";

interface Sugerencia {
  id:              number;
  tipo:            string;
  mensaje:         string;
  esAnonima:       boolean;
  leida:           boolean;
  creadoEn:        Date | string;
  nombres:         string | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
}

const TIPO_COLOR: Record<string, React.CSSProperties> = {
  "Sugerencia general": {
    background: "var(--turquesa-pale)",
    color: "var(--turquesa-dark)",
    border: "1px solid rgba(0,165,168,0.20)",
  },
  "Sugerencia para el sistema": {
    background: "rgba(139,92,246,0.08)",
    color: "#7c3aed",
    border: "1px solid rgba(139,92,246,0.20)",
  },
  "Especializacion recomendada": {
    background: "var(--naranja-light)",
    color: "var(--naranja)",
    border: "1px solid #fed7aa",
  },
};

export default function SugerenciasClient({ sugerencias }: { sugerencias: Sugerencia[] }) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<"todas" | "noLeidas" | "leidas">("todas");
  const [procesando, setProcesando] = useState<number | null>(null);
  const [expandida, setExpandida]   = useState<number | null>(null);

  const marcarLeida = async (id: number) => {
    setProcesando(id);
    try {
      await fetch(`/api/sugerencias/${id}`, { method: "PATCH" });
      router.refresh();
    } finally { setProcesando(null); }
  };

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar esta sugerencia?")) return;
    setProcesando(id);
    try {
      await fetch(`/api/sugerencias/${id}`, { method: "DELETE" });
      router.refresh();
    } finally { setProcesando(null); }
  };

  const filtradas = sugerencias.filter(s => {
    if (filtro === "noLeidas") return !s.leida;
    if (filtro === "leidas")   return s.leida;
    return true;
  });

  if (sugerencias.length === 0) return (
    <div
      className="card text-center py-16"
      style={{ background: "var(--blanco)" }}
    >
      <MessageSquare className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--borde)" }} />
      <p className="font-semibold" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
        Sin sugerencias aún
      </p>
      <p className="text-sm mt-1" style={{ color: "var(--gris-grafito)" }}>
        Las sugerencias de los egresados aparecerán aquí
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2">
        {(["todas", "noLeidas", "leidas"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className="btn-sm font-medium transition-all"
            style={filtro === f ? {
              background: "var(--turquesa)",
              color: "white",
              border: "none",
              padding: "0.375rem 0.875rem",
              borderRadius: "0.5rem",
            } : {
              background: "var(--humo)",
              color: "var(--gris-grafito)",
              border: "1px solid var(--borde)",
              padding: "0.375rem 0.875rem",
              borderRadius: "0.5rem",
            }}
          >
            {f === "todas" ? "Todas" : f === "noLeidas" ? "No leídas" : "Leídas"}
            {f === "noLeidas" && sugerencias.filter(s => !s.leida).length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-xs"
                style={{ background: "rgba(255,255,255,0.3)", fontSize: "0.65rem" }}>
                {sugerencias.filter(s => !s.leida).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <div className="card text-center py-10" style={{ background: "var(--blanco)" }}>
          <p className="text-sm" style={{ color: "var(--placeholder)" }}>
            No hay sugerencias en esta categoría
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map(s => (
            <div
              key={s.id}
              className="card transition-all"
              style={{
                background: s.leida ? "var(--blanco)" : "var(--turquesa-pale)",
                border: s.leida ? "1px solid var(--borde)" : "1px solid rgba(0,165,168,0.25)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={TIPO_COLOR[s.tipo] ?? TIPO_COLOR["Sugerencia general"]}
                    >
                      {s.tipo}
                    </span>
                    {!s.leida && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: "var(--turquesa)", color: "white" }}
                      >
                        Nueva
                      </span>
                    )}
                    <span className="text-xs" style={{ color: "var(--placeholder)" }}>
                      {fmtDate(typeof s.creadoEn === "string" ? s.creadoEn : new Date(s.creadoEn).toISOString())}
                    </span>
                  </div>

                  {/* Remitente */}
                  <div className="flex items-center gap-1.5 mb-2">
                    {s.esAnonima ? (
                      <>
                        <UserX className="w-3.5 h-3.5" style={{ color: "var(--placeholder)" }} />
                        <span className="text-xs italic" style={{ color: "var(--placeholder)" }}>Anónimo</span>
                      </>
                    ) : (
                      <>
                        <User className="w-3.5 h-3.5" style={{ color: "var(--gris-grafito)" }} />
                        <span className="text-xs font-medium" style={{ color: "var(--azul-pizarra)" }}>
                          {s.apellidoPaterno ?? "Desconocido"}, {s.nombres ?? ""}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Mensaje */}
                  <p
                    className={cn(
                      "text-sm leading-relaxed",
                      expandida !== s.id && "line-clamp-3"
                    )}
                    style={{ color: "var(--azul-pizarra)" }}
                  >
                    {s.mensaje}
                  </p>
                  {s.mensaje.length > 200 && (
                    <button
                      onClick={() => setExpandida(expandida === s.id ? null : s.id)}
                      className="text-xs mt-1 font-medium"
                      style={{ color: "var(--turquesa-dark)" }}
                    >
                      {expandida === s.id ? "Ver menos" : "Ver más"}
                    </button>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex flex-col gap-2 shrink-0">
                  {!s.leida && (
                    <button
                      onClick={() => marcarLeida(s.id)}
                      disabled={procesando === s.id}
                      className="btn-sm flex items-center gap-1.5 font-semibold"
                      style={{
                        background: "var(--verde-light)",
                        color: "var(--verde)",
                        border: "1px solid #86efac",
                        padding: "0.375rem 0.75rem",
                        borderRadius: "0.5rem",
                        fontSize: "0.75rem",
                      }}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Marcar leída
                    </button>
                  )}
                  {s.leida && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: "var(--verde)" }}>
                      <CheckCircle className="w-3.5 h-3.5" /> Leída
                    </span>
                  )}
                  <button
                    onClick={() => eliminar(s.id)}
                    disabled={procesando === s.id}
                    className="btn-danger btn-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}