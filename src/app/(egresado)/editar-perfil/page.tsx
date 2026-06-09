import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { egresado } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import EgresadoForm from "@/components/egresados/EgresadoForm";

function calcularCamposVacios(eg: any): string[] {
  const vacios: string[] = [];
  if (!eg.celular && !eg.telefono)   vacios.push("celular");
  if (!eg.lugarResidencia)           vacios.push("lugarResidencia");
  if (!eg.genero)                    vacios.push("genero");
  if (!eg.areaEspecializacion)       vacios.push("areaEspecializacion");
  if (!eg.nacionalidad)              vacios.push("nacionalidad");
  return vacios;
}

export default async function EditarPerfilPage() {
  const session = await getSession();
  if (!session || session.rol !== "egresado") redirect("/Titulados_y_Egresados");
  if (!session.idEgresado) redirect("/registro-inicial");

  const [eg] = await db.select().from(egresado)
    .where(eq(egresado.id, session.idEgresado)).limit(1);
  if (!eg) redirect("/registro-inicial");

  const camposVacios    = calcularCamposVacios(eg);
  const perfilIncompleto = camposVacios.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-up">
      <Link href="/mi-perfil" className="btn-ghost btn-sm inline-flex">
        <ArrowLeft className="w-4 h-4" /> Volver a Mi Perfil
      </Link>

      <div>
        <h1 className="page-title">Editar mis datos</h1>
        <p className="page-sub">
          {[eg.apellidoPaterno, eg.apellidoMaterno].filter(Boolean).join(" ") || eg.nombres}, {eg.nombres}
        </p>
      </div>

      {perfilIncompleto && (
        <div
          className="flex items-start gap-3 px-4 py-3.5 rounded-xl"
          style={{ background: "var(--naranja-light)", border: "1.5px solid #fed7aa" }}
        >
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--naranja)" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--naranja)" }}>
              Tu perfil está incompleto
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#92400e" }}>
              Completá tu información para aparecer mejor en el directorio. Faltan:{" "}
              {camposVacios.map(c => ({
                celular:           "celular",
                lugarResidencia:   "lugar de residencia",
                genero:            "género",
                areaEspecializacion: "área de especialización",
                nacionalidad:      "nacionalidad",
              }[c] ?? c)).join(", ")}.
            </p>
          </div>
        </div>
      )}

      <div className="card">
        <EgresadoForm
          egresado={eg}
          redirectTo="/mi-perfil"
          modo="egresado"
          camposVacios={camposVacios}
        />
      </div>
    </div>
  );
}