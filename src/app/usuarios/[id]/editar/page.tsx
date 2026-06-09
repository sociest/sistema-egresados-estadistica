import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { usuario, egresado } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdminLayout from "@/components/shared/AdminLayout";
import UsuarioForm from "@/components/usuarios/UsuarioForm";

export default async function EditarUsuarioPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.rol !== "admin") redirect("/Titulados_y_Egresados");

  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  const [[u], egresados] = await Promise.all([
    db.select().from(usuario).where(eq(usuario.id, id)).limit(1),
        db.select({ id: egresado.id, nombres: egresado.nombres, apellidoPaterno: egresado.apellidoPaterno })
      .from(egresado).orderBy(egresado.apellidoPaterno),
  ]);
  if (!u) notFound();

  return (
    <AdminLayout correo={session.correo}>
      <div className="max-w-xl space-y-6">
        <Link href="/usuarios" className="btn-ghost btn-sm inline-flex">
          <ArrowLeft className="w-4 h-4" /> Volver a Usuarios
        </Link>
        <div>
          <h1 className="page-title">Editar Usuario</h1>
          <p className="page-sub">{u.correo}</p>
        </div>
        <div className="card">
          <UsuarioForm usuario={u} egresados={egresados} />
        </div>
      </div>
    </AdminLayout>
  );
}
