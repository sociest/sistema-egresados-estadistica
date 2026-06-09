import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdminLayout from "@/components/shared/AdminLayout";
import NoticiaForm from "@/components/noticias/NoticiaForm";

export default async function NuevaNoticiaPage() {
  const session = await getSession();
  if (!session || session.rol !== "admin") redirect("/Titulados_y_Egresados");

  return (
    <AdminLayout correo={session.correo}>
      <div className="max-w-2xl space-y-6">
        <Link href="/noticias-admin" className="btn-ghost btn-sm inline-flex">
          <ArrowLeft className="w-4 h-4" /> Volver a Noticias
        </Link>
        <div>
          <h1 className="page-title">Nueva Publicación</h1>
          <p className="page-sub">Crear una noticia, evento o curso para el sitio público</p>
        </div>
        <div className="card">
          <NoticiaForm redirectTo="/noticias-admin" />
        </div>
      </div>
    </AdminLayout>
  );
}