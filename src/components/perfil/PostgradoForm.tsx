"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { postgradoSchema, type PostgradoInput } from "@/lib/validations";
import { Save, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  idEgresado: number;
  postgrado?: any;
  onSuccess:  () => void;
  onCancel:   () => void;
}

const TIPOS   = ["Diplomado", "Especialidad", "Maestria", "Doctorado", "Postdoctorado", "Otro"] as const;
const ESTADOS = ["En curso", "Finalizado", "Abandonado"] as const;

export default function PostgradoForm({ idEgresado, postgrado: pg, onSuccess, onCancel }: Props) {
  const isEditing = !!pg;
  const [error,   setError]   = useState<string | null>(null);

  const years = Array.from(
    { length: new Date().getFullYear() - 1989 },
    (_, i) => 1990 + i
  ).reverse();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } =
    useForm<PostgradoInput>({
      resolver: zodResolver(postgradoSchema),
      defaultValues: {
        idEgresado,
        tipo:        pg?.tipo        ?? undefined,
        institucion: pg?.institucion ?? "",
        pais:        pg?.pais        ?? "Bolivia",
        anioInicio:  pg?.anioInicio  ?? undefined,
        anioFin:     pg?.anioFin     ?? undefined,
        estado:      pg?.estado      ?? "En curso",
      },
    });

  const estadoWatch = watch("estado");

  const onSubmit = async (d: PostgradoInput) => {
    setError(null);

    if (isEditing) {
      // Edición → solicitud de cambio (JSON)
      const res  = await fetch(`/api/postgrado/${pg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      onSuccess();
      return;
    }

    // Creación → FormData (para documento)
    const res = await fetch("/api/postgrado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(d),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error); return; }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <p className="error-box">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Tipo <span className="text-red-400">*</span></label>
          <select {...register("tipo")} className={cn("field", errors.tipo && "field-err")}>
            <option value="">— Seleccionar —</option>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.tipo && <p className="hint">{errors.tipo.message}</p>}
        </div>

        <div>
          <label className="label">Estado <span className="text-red-400">*</span></label>
          <select {...register("estado")} className="field">
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="label">Institución <span className="text-red-400">*</span></label>
          <input {...register("institucion")} placeholder="Nombre de la institución"
            className={cn("field", errors.institucion && "field-err")} />
          {errors.institucion && <p className="hint">{errors.institucion.message}</p>}
        </div>

        <div>
          <label className="label">País <span className="text-red-400">*</span></label>
          <input {...register("pais")} className="field" placeholder="Bolivia" />
        </div>

        <div>
          <label className="label">Año de Inicio <span className="text-red-400">*</span></label>
          <select {...register("anioInicio", { setValueAs: v => v === "" ? undefined : Number(v) })}
            className={cn("field", errors.anioInicio && "field-err")}>
            <option value="">— Seleccionar —</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {errors.anioInicio && <p className="hint">{errors.anioInicio.message}</p>}
        </div>

        {estadoWatch !== "En curso" && (
          <div>
            <label className="label">Año de Finalización</label>
            <select {...register("anioFin", { setValueAs: v => v === "" ? null : Number(v) })}
              className="field">
              <option value="">— Sin especificar —</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Documento — solo en creación */}

      <div className="flex gap-3 pt-3 border-t" style={{ borderColor: "var(--borde)" }}>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting
            ? <><span className="spinner" /> Guardando...</>
            : <><Save className="w-4 h-4" /> {isEditing ? "Guardar cambios" : "Agregar postgrado"}</>}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">
          <X className="w-4 h-4" /> Cancelar
        </button>
      </div>
    </form>
  );
}