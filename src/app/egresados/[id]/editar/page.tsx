import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { egresado } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdminLayout from "@/components/shared/AdminLayout";
import EgresadoForm from "@/components/egresados/EgresadoForm";

export default async function EditarEgresadoPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.rol !== "admin") redirect("/login");

  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  const [eg] = await db.select().from(egresado).where(eq(egresado.id, id)).limit(1);
  if (!eg) notFound();

  return (
    <AdminLayout correo={session.correo || ""}>
      <div className="max-w-2xl space-y-6">
        <Link href={`/egresados/${id}`} className="btn-ghost btn-sm inline-flex">
          <ArrowLeft className="w-4 h-4" /> Volver al detalle
        </Link>
        <div>
          <h1 className="page-title">Editar Egresado</h1>
          <p className="page-sub">
            {[eg.apellidoPaterno, eg.apellidoMaterno].filter(Boolean).join(" ") || eg.nombres}, {eg.nombres}
          </p>
        </div>
        <div className="card">
           <EgresadoForm egresado={eg} redirectTo={`/egresados/${id}`} esAdmin={true} />
        </div>
      </div>
    </AdminLayout>
  );
}
