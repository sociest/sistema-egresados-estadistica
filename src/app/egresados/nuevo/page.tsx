import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdminLayout from "@/components/shared/AdminLayout";
import EgresadoForm from "@/components/egresados/EgresadoForm";

export default async function NuevoEgresadoPage() {
  const session = await getSession();
  if (!session || session.rol !== "admin") redirect("/Titulados_y_Egresados");

  return (
    <AdminLayout correo={session.correo}>
      <div className="max-w-2xl space-y-6">
        <Link href="/egresados" className="btn-ghost btn-sm inline-flex">
          <ArrowLeft className="w-4 h-4" /> Volver a Egresados
        </Link>
        <div>
          <h1 className="page-title">Nuevo Egresado</h1>
          <p className="page-sub">Registrar un nuevo egresado en el sistema</p>
        </div>
        <div className="card">
          <EgresadoForm />
        </div>
      </div>
    </AdminLayout>
  );
}
