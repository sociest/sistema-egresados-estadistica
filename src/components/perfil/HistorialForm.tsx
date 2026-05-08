"use client";
// src/components/perfil/HistorialForm.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  idEgresado:  number;
  historial?:  any;
  onSuccess?:  () => void;
}

const TIPOS_CONTRATO = ["Indefinido", "Fijo", "Por obra", "Consultor", "Pasante", "Otro"] as const;
const SECTORES       = ["Publico", "Privado", "Independiente", "ONG", "Otro"] as const;

export default function HistorialForm({ idEgresado, historial, onSuccess }: Props) {
  const router    = useRouter();
  const isEditing = !!historial;

  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [esActual, setEsActual] = useState(historial ? historial.fechaFin === null : false);

  const [form, setForm] = useState({
    empresa:      historial?.empresa      ?? "",
    cargo:        historial?.cargo        ?? "",
    area:         historial?.area         ?? "",
    tipoContrato: historial?.tipoContrato ?? "",
    ciudadRegionTrabajo: historial?.ciudadRegionTrabajo ?? "",
    sectorTrabajo:       historial?.sectorTrabajo       ?? "",
    fechaInicio:  historial?.fechaInicio?.split("T")[0] ?? historial?.fechaInicio ?? "",
    fechaFin:     historial?.fechaFin?.split("T")[0]   ?? historial?.fechaFin   ?? "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.empresa.trim() || form.empresa.length < 2) { setError("Empresa requerida"); return; }
    if (!form.cargo.trim()   || form.cargo.length   < 2) { setError("Cargo requerido");   return; }
    if (!form.fechaInicio)                               { setError("Fecha de inicio requerida"); return; }

    setLoading(true);
    try {
      const url    = isEditing ? `/api/historial/${historial.id}` : "/api/historial";
      const method = isEditing ? "PUT" : "POST";

      let res: Response;

      if (isEditing) {
        res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idEgresado,
            empresa:            form.empresa,
            cargo:              form.cargo,
            area:               form.area || null,
            tipoContrato:       form.tipoContrato || null,
            ciudadRegionTrabajo: form.ciudadRegionTrabajo || null,
            sectorTrabajo:       form.sectorTrabajo       || null,
            fechaInicio:        form.fechaInicio,
            fechaFin:           esActual ? null : (form.fechaFin || null),
            actualmenteTrabaja: esActual,
          }),
        });
      } else {
        const fd = new FormData();
        fd.append("idEgresado",         String(idEgresado));
        fd.append("empresa",            form.empresa);
        fd.append("cargo",              form.cargo);
        fd.append("area",               form.area);
        fd.append("tipoContrato",       form.tipoContrato);
        fd.append("ciudadRegionTrabajo", form.ciudadRegionTrabajo);
        fd.append("sectorTrabajo",       form.sectorTrabajo);
        fd.append("fechaInicio",        form.fechaInicio);
        fd.append("fechaFin",           esActual ? "" : form.fechaFin);
        fd.append("actualmenteTrabaja", String(esActual));
        res = await fetch(url, { method: "POST", body: fd });
      }

      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      if (onSuccess) onSuccess();
      else { router.push("/mi-perfil"); router.refresh(); }
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && <p className="error-box">{error}</p>}

      {/* Empresa y Cargo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="label">Empresa <span className="text-red-500">*</span></label>
          <input
            value={form.empresa}
            onChange={e => set("empresa", e.target.value)}
            placeholder="Nombre de la empresa"
            className="field"
          />
        </div>
        <div>
          <label className="label">Cargo <span className="text-red-500">*</span></label>
          <input
            value={form.cargo}
            onChange={e => set("cargo", e.target.value)}
            placeholder="Cargo o puesto"
            className="field"
          />
        </div>
        <div>
          <label className="label">Área</label>
          <input
            value={form.area}
            onChange={e => set("area", e.target.value)}
            placeholder="Área o departamento (opcional)"
            className="field"
          />
        </div>
      </div>

      {/* Tipo contrato, Ciudad, Sector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="label">Tipo de Contrato</label>
          <select value={form.tipoContrato} onChange={e => set("tipoContrato", e.target.value)} className="field">
            <option value="">— Seleccionar —</option>
            {TIPOS_CONTRATO.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
         <div>
          <label className="label">Ciudad / Región de Trabajo</label>
          <input value={form.ciudadRegionTrabajo} onChange={e => set("ciudadRegionTrabajo", e.target.value)} placeholder="Ej: La Paz" className="field" />
        </div>
        <div>
          <label className="label">Sector</label>
          <select value={form.sectorTrabajo} onChange={e => set("sectorTrabajo", e.target.value)} className="field">
            <option value="">— Seleccionar —</option>
            {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Fecha inicio */}
      <div className="max-w-xs">
        <label className="label">Fecha de Inicio <span className="text-red-500">*</span></label>
        <input
          type="date"
          value={form.fechaInicio}
          onChange={e => set("fechaInicio", e.target.value)}
          className="field"
        />
      </div>

      {/* Toggle actualmente trabaja */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => setEsActual(v => !v)}
            className="w-10 h-6 rounded-full relative transition-colors cursor-pointer"
            style={{ background: esActual ? "var(--verde)" : "var(--borde)" }}
          >
            <span
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
              style={{ transform: esActual ? "translateX(1.25rem)" : "translateX(0.25rem)" }}
            />
          </div>
          <span className="text-sm font-medium" style={{ color: "var(--azul-pizarra)" }}>
            Actualmente trabajo aquí
          </span>
        </label>
      </div>

      {!esActual && (
        <div className="max-w-xs">
          <label className="label">Fecha de Fin</label>
          <input
            type="date"
            value={form.fechaFin}
            onChange={e => set("fechaFin", e.target.value)}
            className="field"
          />
        </div>
      )}

      {/* ── Documento de verificación ── */}


      {/* Acciones */}
      <div className="flex gap-3 pt-3 border-t" style={{ borderColor: "var(--borde)" }}>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading
            ? <><span className="spinner" /> Guardando...</>
            : <><Save className="w-4 h-4" /> {isEditing ? "Guardar cambios" : "Agregar experiencia"}</>}
        </button>
        <button
          type="button"
          onClick={() => onSuccess ? onSuccess() : router.push("/mi-perfil")}
          className="btn-ghost"
        >
          <X className="w-4 h-4" /> Cancelar
        </button>
      </div>
    </form>
  );
}
