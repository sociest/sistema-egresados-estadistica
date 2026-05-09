"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usuarioSchema, usuarioEditSchema, type UsuarioInput, type UsuarioEditInput } from "@/lib/validations";
import { Save, X, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  usuario?: any;
  egresados: { id: number; nombres: string; apellidoPaterno: string | null }[];
}

export default function UsuarioForm({ usuario: u, egresados }: Props) {
  const router    = useRouter();
  const isEditing = !!u;
  const [show, setShow]   = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schema = isEditing ? usuarioEditSchema : usuarioSchema;
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<any>({
      resolver: zodResolver(schema),
      defaultValues: u
        ? { rol: u.rol, estado: u.estado, idEgresado: u.idEgresado ?? "", nuevaPassword: "" }
        : { rol: "egresado", estado: "activo", idEgresado: "" },
    });

  const onSubmit = async (d: any) => {
    setError(null);
    const url    = isEditing ? `/api/usuarios/${u.id}` : "/api/usuarios";
    const method = isEditing ? "PUT" : "POST";
    const payload = isEditing
      ? { rol: d.rol, estado: d.estado, idEgresado: d.idEgresado || null, nuevaPassword: d.nuevaPassword || undefined }
      : { ...d, idEgresado: d.idEgresado || null };

    const res  = await fetch(url, {
      method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error); return; }
    router.push("/usuarios");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && <p className="error-box">{error}</p>}

      {/* Correo — solo en creación */}
      {!isEditing && (
        <div>
          <label className="label">Correo <span className="text-red-400">*</span></label>
          <input {...register("correo")} type="email" placeholder="correo@ejemplo.com"
            className={cn("field", errors.correo && "field-err")} />
          {errors.correo && <p className="hint">{(errors.correo as any).message}</p>}
        </div>
      )}

      {/* Contraseña */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">
            {isEditing ? "Nueva Contraseña" : "Contraseña"}
            {!isEditing && <span className="text-red-400 ml-1">*</span>}
            {isEditing && <span className="text-slate-600 text-xs ml-1">(dejar vacío para no cambiar)</span>}
          </label>
          <div className="relative">
            <input
              {...register(isEditing ? "nuevaPassword" : "password")}
              type={show ? "text" : "password"}
              placeholder="••••••••"
              className="field pr-10"
            />
            <button type="button" onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {!isEditing && errors.password && <p className="hint">{(errors.password as any).message}</p>}
        </div>

        {!isEditing && (
          <div>
            <label className="label">Confirmar Contraseña <span className="text-red-400">*</span></label>
            <input {...register("confirmarPassword")} type={show ? "text" : "password"}
              placeholder="••••••••" className={cn("field", errors.confirmarPassword && "field-err")} />
            {errors.confirmarPassword && <p className="hint">{(errors.confirmarPassword as any).message}</p>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rol */}
        <div>
          <label className="label">Rol <span className="text-red-400">*</span></label>
          <select {...register("rol")} className="field">
            <option value="egresado">Egresado</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        {/* Estado */}
        <div>
          <label className="label">Estado <span className="text-red-400">*</span></label>
          <select {...register("estado")} className="field">
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="bloqueado">Bloqueado</option>
          </select>
        </div>
      </div>

      {/* Egresado vinculado */}
      <div>
        <label className="label">Egresado Vinculado</label>
        <select {...register("idEgresado", {
          setValueAs: v => v === "" ? null : Number(v),
        })} className="field">
          <option value="">— Sin vincular (admin sin egresado) —</option>
          {egresados.map(e => (
            <option key={e.id} value={e.id}>{e.apellidoPaterno ?? e.nombres}, {e.nombres}</option>
          ))}
        </select>
        <p className="text-slate-600 text-xs mt-1.5">
          Vincula este usuario a un egresado para que pueda ver y editar su perfil.
        </p>
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-800">
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting
            ? <><span className="spinner" /> Guardando...</>
            : <><Save className="w-4 h-4" /> {isEditing ? "Guardar cambios" : "Crear usuario"}</>}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-ghost">
          <X className="w-4 h-4" /> Cancelar
        </button>
      </div>
    </form>
  );
}
