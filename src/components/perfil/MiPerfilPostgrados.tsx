"use client";
// src/components/perfil/MiPerfilPostgrados.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Pencil, Trash2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import PostgradoForm from "./PostgradoForm";

interface Props {
  postgrados: any[];
  idEgresado: number;
}

const ESTADO_BADGE: Record<string, string> = {
  "En curso":   "badge-blue",
  "Finalizado": "badge-green",
  "Abandonado": "badge-slate",
};

export default function MiPerfilPostgrados({ postgrados, idEgresado }: Props) {
  const router = useRouter();
  const [editing,  setEditing]  = useState<number | null>(null);
  const [adding,   setAdding]   = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este estudio de postgrado?")) return;
    setDeleting(id);
    await fetch(`/api/postgrado/${id}`, { method: "DELETE" });
    router.refresh();
    setDeleting(null);
  };

  const handleSuccess = () => {
    setEditing(null);
    setAdding(false);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      {/* Lista de postgrados */}
      {postgrados.map(p => (
        <div key={p.id}>
          {editing === p.id ? (
            <div className="border border-primary-500/30 bg-primary-500/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-primary-300 text-sm font-semibold">Editando postgrado</p>
                <button onClick={() => setEditing(null)} className="btn-ghost btn-xs">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <PostgradoForm
                idEgresado={idEgresado}
                postgrado={p}
                onSuccess={handleSuccess}
                onCancel={() => setEditing(null)}
              />
            </div>
          ) : (
            <div className="rounded-xl p-4 border bg-slate-800/10 border-slate-700/50 group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="w-9 h-9 bg-slate-700 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[var(--turquesa-dark)] font-semibold text-sm">{p.tipo}</p>
                    <p className="text-[var(--gris-grafito)] text-sm">{p.institucion}</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {p.pais} · {p.anioInicio}{p.anioFin ? `–${p.anioFin}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className={cn("badge", ESTADO_BADGE[p.estado] ?? "badge-slate")}>
                    {p.estado}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditing(p.id)} className="btn-slate btn-xs">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deleting === p.id}
                      className="btn-danger btn-xs"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Formulario de nuevo postgrado */}
      {adding ? (
        <div className="border border-primary-500/30 bg-primary-500/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-primary-300 text-sm font-semibold">Nuevo estudio de postgrado</p>
            <button onClick={() => setAdding(false)} className="btn-ghost btn-xs">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <PostgradoForm
            idEgresado={idEgresado}
            onSuccess={handleSuccess}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full border border-dashed border-slate-700 hover:border-primary-500/50
                     hover:bg-primary-500/5 rounded-xl p-3 text-slate-500 hover:text-primary-400
                     text-sm flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Agregar estudio de postgrado
        </button>
      )}
    </div>
  );
}
