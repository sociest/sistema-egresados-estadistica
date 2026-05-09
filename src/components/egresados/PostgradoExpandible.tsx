"use client";
import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const ESTADO_STYLE: Record<string, React.CSSProperties> = {
  "En curso":   { background: "rgba(59,130,246,0.08)", color: "#2563eb", border: "1px solid rgba(59,130,246,0.20)" },
  "Finalizado": { background: "var(--verde-light)", color: "var(--verde)", border: "1px solid #86efac" },
  "Abandonado": { background: "var(--humo)", color: "var(--placeholder)", border: "1px solid var(--borde)" },
};

const TIPO_ORDEN = ["Postdoctorado", "Doctorado", "Maestria", "Especialidad", "Diplomado", "Otro"];

export default function PostgradoExpandible({ postgrados }: { postgrados: any[] }) {
  const [expandido, setExpandido] = useState<number | null>(null);

  const ordenados = [...postgrados].sort(
    (a, b) => TIPO_ORDEN.indexOf(a.tipo) - TIPO_ORDEN.indexOf(b.tipo)
  );

  return (
    <div className="space-y-2">
      {ordenados.map(p => {
        const abierto = expandido === p.id;
        return (
          <div
            key={p.id}
            className="rounded-xl border overflow-hidden"
            style={{ background: "var(--humo)", borderColor: "var(--borde)" }}
          >
            <div className="flex items-start justify-between gap-2 p-3">
              <div className="flex gap-2 flex-1 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "var(--borde)" }}
                >
                  <BookOpen className="w-3.5 h-3.5" style={{ color: "var(--gris-grafito)" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--azul-pizarra)" }}>
                    {p.tipo}
                  </p>
                  <p className="text-xs truncate" style={{ color: "var(--gris-grafito)" }}>
                    {p.institucion}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExpandido(abierto ? null : p.id)}
                className="shrink-0 p-1.5 rounded-lg transition-all"
                style={{
                  background: abierto ? "var(--turquesa-light)" : "var(--borde-suave)",
                  color: abierto ? "var(--turquesa-dark)" : "var(--gris-grafito)",
                }}
              >
                {abierto
                  ? <ChevronUp className="w-3.5 h-3.5" />
                  : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {abierto && (
              <div
                className="px-3 pb-3 space-y-2"
                style={{ borderTop: "1px solid var(--borde)" }}
              >
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <DetalleItem label="País">{p.pais}</DetalleItem>
                  <DetalleItem label="Inicio">{p.anioInicio}</DetalleItem>
                  {p.anioFin && (
                    <DetalleItem label="Finalización">{p.anioFin}</DetalleItem>
                  )}
                  <DetalleItem label="Estado">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={ESTADO_STYLE[p.estado] ?? ESTADO_STYLE["Abandonado"]}
                    >
                      {p.estado}
                    </span>
                  </DetalleItem>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DetalleItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide mb-0.5"
        style={{ color: "var(--placeholder)" }}>
        {label}
      </p>
      <p className="text-xs" style={{ color: "var(--azul-pizarra)" }}>{children}</p>
    </div>
  );
}