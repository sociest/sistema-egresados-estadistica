"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { egresadoSchema, type EgresadoInput } from "@/lib/validations";
import { Save } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RegistroInicialForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<EgresadoInput>({ resolver: zodResolver(egresadoSchema) });

  const onSubmit = async (d: EgresadoInput) => {
    setError(null);
    const apellidos = [d.apellidoPaterno, d.apellidoMaterno].filter(Boolean).join(" ") || d.nombres;

    const res1  = await fetch("/api/egresados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...d, apellidos }),
    });
    const json1 = await res1.json();
    if (!res1.ok) { setError(json1.error); return; }

    const res2 = await fetch("/api/auth/link-egresado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idEgresado: json1.data?.id }),
    });
    const json2 = await res2.json();
    if (!res2.ok) { setError(json2.error); return; }

    router.push("/mi-perfil");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <p className="error-box">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Nombres <span className="text-red-400">*</span></label>
          <input {...register("nombres")} className={cn("field", errors.nombres && "field-err")} />
          {errors.nombres && <p className="hint">{errors.nombres.message}</p>}
        </div>
        <div>
          <label className="label">Apellido Paterno</label>
          <input {...register("apellidoPaterno")} className="field" />
        </div>
        <div>
          <label className="label">Apellido Materno</label>
          <input {...register("apellidoMaterno")} className="field" />
        </div>
        <div>
          <label className="label">CI <span className="text-red-400">*</span></label>
          <input {...register("ci")} className={cn("field", errors.ci && "field-err")} />
          {errors.ci && <p className="hint">{errors.ci.message}</p>}
        </div>
        <div>
          <label className="label">Fecha de Nacimiento <span className="text-red-400">*</span></label>
          <input {...register("fechaNacimiento")} type="date"
            className={cn("field", errors.fechaNacimiento && "field-err")} />
          {errors.fechaNacimiento && <p className="hint">{errors.fechaNacimiento.message}</p>}
        </div>
        <div>
          <label className="label">Celular</label>
          <input {...register("celular")} type="tel" className="field" />
        </div>

        <div className="md:col-span-2">
          <label className="label">Lugar de Residencia</label>
          <input
            {...register("lugarResidencia")}
            className="field"
            placeholder="Ej: La Paz, Cochabamba, Santa Cruz..."
          />
        </div>
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
        {isSubmitting
          ? <><span className="spinner" /> Guardando...</>
          : <><Save className="w-4 h-4" /> Guardar y continuar</>}
      </button>
    </form>
  );
}
