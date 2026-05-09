"use client";
import { useState } from "react";
import { Building2, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { cn, fmtDate } from "@/lib/utils";

export default function HistorialExpandible({ historial }: { historial: any[] }) {
  const [expandido, setExpandido] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {historial.map(h => {
        const abierto = expandido === h.id;
        return (
          <div
            key={h.id}
            className="rounded-xl border overflow-hidden"
            style={h.fechaFin === null ? {
              background: "rgba(26,107,26,0.05)",
              borderColor: "#86efac",
            } : {
              background: "var(--humo)",
              borderColor: "var(--borde)",
            }}
          >
            {/* Fila principal siempre visible */}
            <div className="flex items-start justify-between gap-3 p-4">
              <div className="flex gap-3 flex-1 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--borde)" }}
                >
                  <Building2 className="w-4 h-4" style={{ color: "var(--gris-grafito)" }} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm" style={{ color: "var(--azul-pizarra)" }}>
                    {h.cargo}
                  </p>
                  <p className="text-sm" style={{ color: "var(--gris-grafito)" }}>{h.empresa}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--placeholder)" }}>
                    {fmtDate(h.fechaInicio)} — {h.fechaFin ? fmtDate(h.fechaFin) : "presente"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="badge"
                  style={h.fechaFin === null ? {
                    background: "var(--verde-light)", color: "var(--verde)",
                    border: "1px solid #86efac",
                  } : {
                    background: "var(--humo)", color: "var(--placeholder)",
                    border: "1px solid var(--borde)",
                  }}
                >
                  {h.fechaFin === null ? "Actual" : "Finalizado"}
                </span>
                <button
                  onClick={() => setExpandido(abierto ? null : h.id)}
                  className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all"
                  style={{
                    background: abierto ? "var(--turquesa-light)" : "var(--borde-suave)",
                    color: abierto ? "var(--turquesa-dark)" : "var(--gris-grafito)",
                    border: `1px solid ${abierto ? "#99e6e7" : "var(--borde)"}`,
                  }}
                >
                  {abierto ? (
                    <><ChevronUp className="w-3.5 h-3.5" /> Ocultar</>
                  ) : (
                    <><ChevronDown className="w-3.5 h-3.5" /> Ver detalle</>
                  )}
                </button>
              </div>
            </div>

            {/* Panel expandible */}
            {abierto && (
              <div
                className="px-4 pb-4 grid grid-cols-2 gap-3"
                style={{ borderTop: "1px solid var(--borde)" }}
              >
                {h.area && (
                  <DetalleItem label="Área">{h.area}</DetalleItem>
                )}
                {h.tipoContrato && (
                  <DetalleItem label="Tipo de contrato">{h.tipoContrato}</DetalleItem>
                )}
                {h.ciudadRegionTrabajo && (
                  <DetalleItem label="Ciudad / Región">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {h.ciudadRegionTrabajo}
                    </span>
                  </DetalleItem>
                )}
                {h.sectorTrabajo && (
                  <DetalleItem label="Sector">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                      style={
                        h.sectorTrabajo === "Publico"
                          ? { background: "rgba(59,130,246,0.10)", color: "#2563eb" }
                          : h.sectorTrabajo === "Privado"
                          ? { background: "rgba(139,92,246,0.10)", color: "#7c3aed" }
                          : h.sectorTrabajo === "ONG"
                          ? { background: "rgba(16,185,129,0.10)", color: "#059669" }
                          : { background: "var(--humo)", color: "var(--gris-grafito)" }
                      }
                    >
                      {h.sectorTrabajo}
                    </span>
                  </DetalleItem>
                )}
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
    <div className="pt-3">
      <p className="text-xs font-semibold uppercase tracking-wide mb-1"
        style={{ color: "var(--placeholder)" }}>
        {label}
      </p>
      <p className="text-sm" style={{ color: "var(--azul-pizarra)" }}>{children}</p>
    </div>
  );
}