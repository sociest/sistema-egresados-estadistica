// src/components/perfil/FotoPerfilUploader.tsx
"use client";
import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";

interface Props {
  idEgresado:    number;
  fotoUrl?:      string | null;
  nombres:       string;
  apellidoPaterno?: string | null;
  size?:         "lg" | "xl";
  esAdmin?:      boolean; // permite pasar idEgresado explícito
}

const SIZE_MAP = {
  lg: { outer: "w-14 h-14", text: "text-xl",  icon: "w-4 h-4" },
  xl: { outer: "w-20 h-20", text: "text-2xl", icon: "w-5 h-5" },
};

export default function FotoPerfilUploader({
  idEgresado,
  fotoUrl:     fotoUrlInicial,
  nombres,
  apellidoPaterno,
  size = "xl",
  esAdmin = false,
}: Props) {
  const [fotoUrl,  setFotoUrl]  = useState<string | null | undefined>(fotoUrlInicial);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = `${(apellidoPaterno ?? nombres)[0] ?? ""}${nombres[0] ?? ""}`.toUpperCase();
  const { outer, text, icon } = SIZE_MAP[size];

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Solo JPG, PNG o WEBP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Máximo 5MB");
      return;
    }

    setError(null);
    // Preview optimista inmediato
    const localUrl = URL.createObjectURL(file);
    setFotoUrl(localUrl);
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("archivo", file);
      if (esAdmin) fd.append("idEgresado", String(idEgresado));

      const res  = await fetch("/api/egresados/foto", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Error al subir");
        setFotoUrl(fotoUrlInicial); // revertir
        return;
      }
      setFotoUrl(json.data.url);
    } catch {
      setError("Error de conexión");
      setFotoUrl(fotoUrlInicial);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="relative inline-block shrink-0">
      {/* Avatar principal */}
      <div
        className={`${outer} rounded-2xl overflow-hidden flex items-center justify-center font-bold ${text} cursor-pointer select-none`}
        style={{
          background: fotoUrl ? "var(--borde)" : "var(--turquesa-light)",
          color:      "var(--turquesa-dark)",
          fontFamily: "'Source Serif 4', serif",
          position:   "relative",
        }}
        onClick={() => !loading && fileRef.current?.click()}
        title="Cambiar foto de perfil"
      >
        {fotoUrl ? (
          <img
            src={fotoUrl}
            alt={`Foto de ${nombres}`}
            className="w-full h-full object-cover"
            onError={() => setFotoUrl(null)}
          />
        ) : (
          <span>{initials}</span>
        )}

        {/* Overlay de loading */}
        {loading && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-2xl"
            style={{ background: "rgba(0,0,0,0.45)" }}
          >
            <Loader2 className={`${icon} animate-spin text-white`} />
          </div>
        )}
      </div>

      {/* Botón de cámara superpuesto (abajo a la derecha) */}
      {!loading && (
        <button
          onClick={() => fileRef.current?.click()}
          className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full border-2 border-white transition-all hover:scale-110"
          style={{
            width:      "26px",
            height:     "26px",
            background: "var(--turquesa)",
            color:      "white",
            borderColor: "var(--blanco)",
          }}
          title="Cambiar foto"
        >
          <Camera className="w-3 h-3" />
        </button>
      )}

      {/* Error breve */}
      {error && (
        <p
          className="absolute top-full left-0 mt-1 text-xs whitespace-nowrap px-2 py-1 rounded-lg z-10"
          style={{ background: "#FEF2F2", color: "#dc2626", border: "1px solid #FECACA" }}
        >
          {error}
        </p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}