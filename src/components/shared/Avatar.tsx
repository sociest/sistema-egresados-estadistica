"use client";

interface AvatarProps {
  fotoUrl?:         string | null;
  nombres:          string;
  apellidoPaterno?: string | null;
  size?:            "sm" | "md" | "lg" | "xl";
  className?:       string;
  style?:           React.CSSProperties;
}

const SIZE_MAP = {
  sm: { outer: "w-8 h-8",   text: "text-xs"   },
  md: { outer: "w-11 h-11", text: "text-sm"   },
  lg: { outer: "w-14 h-14", text: "text-base" },
  xl: { outer: "w-20 h-20", text: "text-2xl"  },
};

export default function Avatar({
  fotoUrl,
  nombres,
  apellidoPaterno,
  size = "md",
  className = "",
  style,
}: AvatarProps) {
  const initials =
    `${(apellidoPaterno ?? nombres)[0] ?? ""}${nombres[0] ?? ""}`.toUpperCase();
  const { outer, text } = SIZE_MAP[size];

  if (fotoUrl) {
    return (
      <div
        className={`${outer} rounded-2xl overflow-hidden shrink-0 ${className}`}
        style={{ background: "var(--borde)", ...style }}
      >
        <img
          src={fotoUrl}
          alt={`Foto de ${nombres}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            const img = e.currentTarget;
            img.style.display = "none";
            const parent = img.parentElement;
            if (parent) {
              parent.style.background     = "var(--turquesa-light)";
              parent.style.color          = "var(--turquesa-dark)";
              parent.style.display        = "flex";
              parent.style.alignItems     = "center";
              parent.style.justifyContent = "center";
              parent.style.fontFamily     = "'Source Serif 4', serif";
              parent.style.fontWeight     = "700";
              parent.style.fontSize       =
                size === "xl" ? "1.5rem"
                : size === "lg" ? "1.125rem"
                : size === "sm" ? "0.75rem"
                : "0.875rem";
              parent.textContent = initials;
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`${outer} rounded-2xl flex items-center justify-center font-bold ${text} shrink-0 ${className}`}
      style={{
        background: "var(--turquesa-light)",
        color:      "var(--turquesa-dark)",
        fontFamily: "'Source Serif 4', serif",
        flexShrink: 0,
        ...style,
      }}
    >
      {initials}
    </div>
  );
}