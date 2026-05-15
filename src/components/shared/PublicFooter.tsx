"use client";
import Link from "next/link";
import {
  Globe as FacebookIcon,
  Send as TwitterIcon,
  Play as YouTubeIcon,
  Camera as InstagramIcon,
  Mail,
  MapPin,
  Phone,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

// ── Sub-componentes internos (equivalentes a los del compañero) ──────────────

function SocialLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="size-[38px] rounded-lg flex items-center justify-center border transition-colors"
      style={{
        background: "rgba(255,255,255,0.10)",
        borderColor: "rgba(255,255,255,0.15)",
        color: "rgba(255,255,255,0.70)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.20)";
        (e.currentTarget as HTMLElement).style.color = "#fff";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)";
        (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.70)";
      }}
    >
      <Icon className="w-4 h-4" />
    </a>
  );
}

function FooterLinkList({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="font-bold text-xs text-white uppercase tracking-widest mb-4">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="flex items-center gap-2 text-[13px] transition-colors group"
              style={{ color: "rgba(255,255,255,0.70)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "#fff")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.70)")
              }
            >
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              <span>{link.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExternalAccessLinks({
  title = "Accesos Directos",
  links,
}: {
  title?: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="mt-6 space-y-2">
      <h4 className="font-bold text-xs uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.70)" }}>
        {title}
      </h4>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[12px] transition-colors"
          style={{ color: "rgba(255,255,255,0.70)" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "#fff")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.70)")
          }
        >
          <ExternalLink className="w-3 h-3 shrink-0" />
          <span>{link.label}</span>
        </a>
      ))}
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function PublicFooter() {
  const academicLinks = [
    { label: "Plan de Estudios", href: "#" },
    { label: "Malla Curricular", href: "#" },
    { label: "Calendario Académico", href: "#" },
    { label: "Docentes", href: "#" },
    { label: "Trámites y Servicios", href: "#" },
  ];

  const postgradoLinks = [
    { label: "Maestría en Análisis de Datos", href: "#" },
    { label: "Diplomados", href: "#" },
    { label: "Cursos de Actualización", href: "#" },
    { label: "IETA — Investigación", href: "#" },
    { label: "Repositorio Institucional", href: "#" },
  ];

  const directAccessLinks = [
    { label: "Moodle — Aula Virtual", href: "https://virtual.umsa.bo" },
    { label: "SIA — Sistema Académico", href: "https://sia.umsa.bo" },
    { label: "Webmail UMSA", href: "https://webmail.umsa.bo" },
  ];

  const socialLinks = [
    { href: "#", label: "Facebook", icon: FacebookIcon },
    { href: "#", label: "Twitter", icon: TwitterIcon },
    { href: "#", label: "YouTube", icon: YouTubeIcon },
    { href: "#", label: "Instagram", icon: InstagramIcon },
  ];

  return (
    <footer style={{ background: "linear-gradient(170deg, #001d3d 0%, #002a52 50%, #00325a 100%)" }}>

      {/* Contenido principal */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-12 lg:px-20 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">

          {/* Columna 1 — Identidad + contacto + redes */}
          <div className="lg:col- span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/iconos/blancopeq.png"
                alt="Logo pequeño blanco de la Carrera de Estadística"
                className="h-[96px] w-[96px] object-contain shrink-0"
                onError={(e) => {
                  // Fallback: mostrar el símbolo σ si la imagen no carga
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = "none";
                  const sibling = target.nextSibling as HTMLElement | null;
                  if (sibling) sibling.style.display = "flex";
                }}
              />
              {/* Fallback σ (oculto por defecto, se muestra si la imagen falla) */}
              <div
                className="h-[96px] w-[96px] rounded-xl items-center justify-center shrink-0 text-3xl font-bold"
                style={{
                  display: "none",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "var(--turquesa)",
                  fontFamily: "'Source Serif 4', serif",
                }}
              >
                σ
              </div>
              <div>
                <p className="font-bold text-base text-white leading-tight">
                  Carrera de Estadística
                </p>
                <p className="text-[11px] leading-tight" style={{ color: "rgba(255,255,255,0.70)" }}>
                  UMSA · Bolivia
                </p>
              </div>
            </div>

            <p
              className="text-base leading-relaxed mb-5"
              style={{ color: "rgba(255,255,255,0.70)" }}
            >
              Formando estadísticos y científicos de datos para el desarrollo
              de Bolivia desde 1974.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin
                  className="w-4 h-4 shrink-0 mt-0.5"
                  style={{ color: "rgba(255,255,255,0.90)" }}
                />
                <p
                  className="text-[12px] leading-snug"
                  style={{ color: "rgba(255,255,255,0.70)" }}
                >
                  Av. Villazón N° 1995, Monoblock Central,
                  <br />
                  Piso 3 — La Paz, Bolivia
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Phone
                  className="w-4 h-4 shrink-0"
                  style={{ color: "rgba(255,255,255,0.90)" }}
                />
                <a
                  href="tel:+59122442100"
                  className="text-[12px] transition-colors"
                  style={{ color: "rgba(255,255,255,0.70)" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "#fff")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.70)")
                  }
                >
                  (591-2) 2442100
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail
                  className="w-4 h-4 shrink-0"
                  style={{ color: "rgba(255,255,255,0.90)" }}
                />
                <a
                  href="mailto:estadistica@umsa.bo"
                  className="text-[12px] transition-colors"
                  style={{ color: "rgba(255,255,255,0.70)" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "#fff")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.70)")
                  }
                >
                  estadistica@umsa.bo
                </a>
              </div>
            </div>

            {/* Redes sociales */}
            <div className="flex gap-3 mt-6">
              {socialLinks.map((item, idx) => (
                <SocialLink
                  key={`${item.label}-${idx}`}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                />
              ))}
            </div>
          </div>

          {/* Columna 2 — Académico */}
          <FooterLinkList title="Académico" links={academicLinks} />

          {/* Columna 3 — Postgrado e IETA + Accesos directos */}
          <div>
            <FooterLinkList title="Postgrado e IETA" links={postgradoLinks} />
            <ExternalAccessLinks links={directAccessLinks} />
          </div>

          {/* Columna 4 — Ubicación (mapa + horario) */}
          <div>
            <h3 className="font-bold text-xs text-white uppercase tracking-widest mb-4">
              Ubicación
            </h3>
            <div
              className="rounded-xl overflow-hidden shadow-lg mb-3"
              style={{ border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <iframe
                title="Ubicación Carrera de Estadística UMSA"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3825.1892!2d-68.1196!3d-16.5046!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x915f20d9f45f0001%3A0xabcdef1234!2sAv.+Villaz%C3%B3n+1995%2C+La+Paz!5e0!3m2!1ses!2sbo!4v1000000000000"
                width="100%"
                height="160"
                style={{
                  border: 0,
                  filter: "grayscale(30%) brightness(0.9) contrast(1.1)",
                  display: "block",
                }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div
              className="rounded-xl p-4"
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-[11px] font-semibold text-white">
                  Horario de atención
                </span>
              </div>
              <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.70)" }}>
                Lunes a Viernes: 08:00 — 17:00
              </p>
              <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.70)" }}>
                Sábados: 08:00 — 12:00
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra inferior de copyright */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}>
        <div className="max-w-[1200px] mx-auto px-6 sm:px-12 lg:px-20 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p
            className="text-[12px] text-center sm:text-right"
            style={{ color: "rgba(255,255,255,0.60)" }}
          >
            © {new Date().getFullYear()} Carrera de Estadística — Universidad Mayor de San
            Andrés. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
