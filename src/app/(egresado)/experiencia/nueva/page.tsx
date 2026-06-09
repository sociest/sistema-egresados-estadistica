// src/app/(egresado)/experiencia/nueva/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import HistorialForm from "@/components/perfil/HistorialForm";

export default async function NuevaExperienciaPage() {
  const session = await getSession();
  if (!session || session.rol !== "egresado") redirect("/Titulados_y_Egresados");
  if (!session.idEgresado) redirect("/registro-inicial");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-fade-up">
      <Link href="/mi-perfil" className="btn-ghost btn-sm inline-flex">
        <ArrowLeft className="w-4 h-4" /> Volver a Mi Perfil
      </Link>
      <div>
        <h1 className="page-title">Nueva Experiencia Laboral</h1>
        <p className="page-sub">Registra tu experiencia en el historial laboral</p>
      </div>
      <div className="card">
        <HistorialForm idEgresado={session.idEgresado} />
      </div>
    </div>
  );
}
