"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { noticiaSchema, type NoticiaInput } from "@/lib/validations";
import { Save, X, Eye, EyeOff, Upload, Link, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  noticia?: any;
  redirectTo?: string;
}

const TIPO_LABELS: Record<string, string> = {
  noticia_institucional: "Noticia institucional",
  curso_evento:          "Curso / Evento",
  noticia_social:        "Noticia social",
};

const TIPO_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  noticia_institucional: {
    bg: "rgba(0,165,168,0.10)",
    color: "var(--turquesa-dark)",
    border: "1px solid rgba(0,165,168,0.30)",
  },
  curso_evento: {
    bg: "rgba(139,92,246,0.10)",
    color: "#7c3aed",
    border: "1px solid rgba(139,92,246,0.30)",
  },
  noticia_social: {
    bg: "rgba(245,158,11,0.10)",
    color: "var(--naranja)",
    border: "1px solid rgba(245,158,11,0.30)",
  },
};

export default function NoticiaForm({ noticia: n, redirectTo }: Props) {
  const router    = useRouter();
  const isEditing = !!n;
  const [serverError, setServerError] = useState<string | null>(null);
  const [preview, setPreview]         = useState(false);

  // Estado para el campo de imagen
  const [imagenTab,     setImagenTab]     = useState<"url" | "subir">("url");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError,   setUploadError]   = useState<string | null>(null);
  const [previewImg,    setPreviewImg]     = useState<string | null>(n?.imagenUrl ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<NoticiaInput>({
      resolver: zodResolver(noticiaSchema),
      defaultValues: n ? {
        titulo:    n.titulo,
        cuerpo:    n.cuerpo,
        tipo:      n.tipo,
        fecha:     n.fecha?.split("T")[0] ?? n.fecha ?? "",
        imagenUrl: n.imagenUrl ?? "",
        publicado: n.publicado ?? false,
      } : {
        tipo:      "noticia_institucional",
        publicado: false,
        fecha:     new Date().toISOString().split("T")[0],
      },
    });

  const cuerpoWatch  = watch("cuerpo", "");
  const tipoWatch    = watch("tipo");
  const imagenWatch  = watch("imagenUrl");

  // Subir imagen al servidor
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Preview local inmediato
    const localUrl = URL.createObjectURL(file);
    setPreviewImg(localUrl);

    setUploadLoading(true);
    try {
      const fd = new FormData();
      fd.append("archivo", file);

      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok) {
        setUploadError(json.error ?? "Error al subir la imagen");
        setPreviewImg(null);
        setValue("imagenUrl", "");
        return;
      }

      setValue("imagenUrl", json.data.url);
      setPreviewImg(json.data.url);
    } catch {
      setUploadError("Error al conectar con el servidor");
      setPreviewImg(null);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue("imagenUrl", val);
    setPreviewImg(val || null);
  };

  const limpiarImagen = () => {
    setValue("imagenUrl", "");
    setPreviewImg(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (d: NoticiaInput) => {
    setServerError(null);
    const url    = isEditing ? `/api/noticias/${n.id}` : "/api/noticias";
    const method = isEditing ? "PUT" : "POST";

    const res  = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...d, imagenUrl: d.imagenUrl || null }),
    });
    const json = await res.json();
    if (!res.ok) { setServerError(json.error); return; }

    router.push(redirectTo ?? "/noticias-admin");
    router.refresh();
  };

  const tipoColor = TIPO_COLORS[tipoWatch] ?? TIPO_COLORS.noticia_institucional;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && <p className="error-box">{serverError}</p>}

      {/* ── Tipo ── */}
      <div>
        <label className="label">Tipo de publicación <span className="text-red-400">*</span></label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(["noticia_institucional", "curso_evento", "noticia_social"] as const).map(t => {
            const active = tipoWatch === t;
            const c = TIPO_COLORS[t];
            return (
              <label
                key={t}
                className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all"
                style={{
                  background: active ? c.bg : "var(--humo)",
                  border: active ? c.border : "1.5px solid var(--borde)",
                }}
              >
                <input type="radio" value={t} {...register("tipo")} className="sr-only" />
                <div
                  className="w-3 h-3 rounded-full border-2 shrink-0 flex items-center justify-center"
                  style={{ borderColor: active ? c.color : "var(--placeholder)" }}
                >
                  {active && (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                  )}
                </div>
                <span className="text-sm font-medium" style={{ color: active ? c.color : "var(--gris-grafito)" }}>
                  {TIPO_LABELS[t]}
                </span>
              </label>
            );
          })}
        </div>
        {errors.tipo && <p className="hint">{errors.tipo.message}</p>}
      </div>

      {/* ── Título ── */}
      <div>
        <label className="label">Título <span className="text-red-400">*</span></label>
        <input
          {...register("titulo")}
          placeholder="Título de la noticia o evento..."
          className={cn("field", errors.titulo && "field-err")}
        />
        {errors.titulo && <p className="hint">{errors.titulo.message}</p>}
      </div>

      {/* ── Fecha ── */}
      <div>
        <label className="label">Fecha <span className="text-red-400">*</span></label>
        <input
          {...register("fecha")}
          type="date"
          className={cn("field", errors.fecha && "field-err")}
          style={{ maxWidth: "220px" }}
        />
        {errors.fecha && <p className="hint">{errors.fecha.message}</p>}
      </div>

      {/* ── Imagen con pestañas ── */}
      <div>
        <label className="label">Imagen (opcional)</label>

        {/* Pestañas */}
        <div
          className="flex rounded-xl overflow-hidden mb-3"
          style={{ border: "1.5px solid var(--borde)", width: "fit-content" }}
        >
          {(["url", "subir"] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => { setImagenTab(tab); setUploadError(null); }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-all"
              style={imagenTab === tab ? {
                background: "var(--turquesa)",
                color: "white",
              } : {
                background: "var(--humo)",
                color: "var(--gris-grafito)",
              }}
            >
              {tab === "url"
                ? <><Link className="w-3.5 h-3.5" /> Pegar URL</>
                : <><Upload className="w-3.5 h-3.5" /> Subir imagen</>}
            </button>
          ))}
        </div>

        {/* Panel URL */}
        {imagenTab === "url" && (
          <div className="space-y-2">
            <input
              value={imagenWatch ?? ""}
              onChange={handleUrlChange}
              placeholder="https://ejemplo.com/imagen.jpg"
              className={cn("field", errors.imagenUrl && "field-err")}
            />
            {errors.imagenUrl && <p className="hint">{errors.imagenUrl.message}</p>}
          </div>
        )}

        {/* Panel subida */}
        {imagenTab === "subir" && (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadLoading}
              className="flex flex-col items-center justify-center gap-2 w-full py-8 rounded-xl transition-all"
              style={{
                border: "2px dashed var(--borde)",
                background: "var(--humo)",
                color: "var(--gris-grafito)",
              }}
              onMouseEnter={e => {
                if (!uploadLoading) {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--turquesa)";
                  (e.currentTarget as HTMLElement).style.background = "var(--turquesa-pale)";
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--borde)";
                (e.currentTarget as HTMLElement).style.background = "var(--humo)";
              }}
            >
              {uploadLoading
                ? <><Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--turquesa)" }} /><span className="text-sm">Subiendo...</span></>
                : <><ImageIcon className="w-6 h-6" style={{ color: "var(--placeholder)" }} /><span className="text-sm font-medium" style={{ color: "var(--azul-pizarra)" }}>Haz clic para seleccionar</span><span className="text-xs" style={{ color: "var(--placeholder)" }}>JPG, PNG o WEBP — máx. 5MB</span></>
              }
            </button>
            {uploadError && <p className="error-box">{uploadError}</p>}
          </div>
        )}

        {/* Preview de imagen (se muestra en ambas pestañas si hay URL) */}
        {previewImg && (
          <div className="mt-3 relative inline-block">
            <img
              src={previewImg}
              alt="Preview"
              className="rounded-xl object-cover"
              style={{
                maxHeight: "180px",
                maxWidth: "100%",
                border: "1px solid var(--borde)",
              }}
              onError={() => setPreviewImg(null)}
            />
            <button
              type="button"
              onClick={limpiarImagen}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "#dc2626", color: "white" }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Campo oculto que guarda el valor real */}
        <input type="hidden" {...register("imagenUrl")} />
      </div>

      {/* ── Cuerpo con toggle preview ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="label mb-0">Contenido <span className="text-red-400">*</span></label>
          <button
            type="button"
            onClick={() => setPreview(v => !v)}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{ color: "var(--turquesa-dark)" }}
          >
            {preview
              ? <><EyeOff className="w-3.5 h-3.5" /> Editar</>
              : <><Eye className="w-3.5 h-3.5" /> Vista previa</>}
          </button>
        </div>

        {preview ? (
          <div
            className="min-h-[180px] rounded-xl px-4 py-3 text-sm leading-relaxed"
            style={{
              background: "var(--humo)",
              border: "1.5px solid var(--borde)",
              color: "var(--azul-pizarra)",
              whiteSpace: "pre-wrap",
            }}
          >
            {cuerpoWatch || <span style={{ color: "var(--placeholder)" }}>Sin contenido aún...</span>}
          </div>
        ) : (
          <textarea
            {...register("cuerpo")}
            rows={8}
            placeholder="Escribe el contenido completo de la noticia..."
            className={cn("field resize-y", errors.cuerpo && "field-err")}
            style={{ minHeight: "180px" }}
          />
        )}
        {errors.cuerpo && <p className="hint">{errors.cuerpo.message}</p>}
        <p className="text-xs mt-1" style={{ color: "var(--placeholder)" }}>
          {cuerpoWatch.length} caracteres
        </p>
      </div>

      {/* ── Toggle publicado ── */}
      <div
        className="flex items-center justify-between rounded-xl px-4 py-3"
        style={{ background: "var(--humo)", border: "1.5px solid var(--borde)" }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--azul-pizarra)" }}>
            Publicar noticia
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--gris-grafito)" }}>
            Las noticias publicadas son visibles en el sitio público
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" {...register("publicado")} className="sr-only" />
          <div
            className="w-10 h-6 rounded-full relative transition-colors cursor-pointer"
            style={{ background: watch("publicado") ? "var(--verde)" : "var(--borde)" }}
          >
            <span
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
              style={{ transform: watch("publicado") ? "translateX(1.25rem)" : "translateX(0.25rem)" }}
            />
          </div>
        </label>
      </div>

      {/* ── Acciones ── */}
      <div className="flex gap-3 pt-2 border-t" style={{ borderColor: "var(--borde)" }}>
        <button type="submit" disabled={isSubmitting || uploadLoading} className="btn-primary">
          {isSubmitting
            ? <><span className="spinner" /> Guardando...</>
            : <><Save className="w-4 h-4" /> {isEditing ? "Guardar cambios" : "Crear publicación"}</>}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-ghost">
          <X className="w-4 h-4" /> Cancelar
        </button>
      </div>
    </form>
  );
}