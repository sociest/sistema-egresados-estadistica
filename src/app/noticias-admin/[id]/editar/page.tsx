import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { noticias } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdminLayout from "@/components/shared/AdminLayout";
import NoticiaForm from "@/components/noticias/NoticiaForm";

export default async function EditarNoticiaPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.rol !== "admin") redirect("/Titulados_y_Egresados");

  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  const [noticia] = await db.select().from(noticias).where(eq(noticias.id, id)).limit(1);
  if (!noticia) notFound();

  return (
    <AdminLayout correo={session.correo}>
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/noticias-admin" className="btn-ghost btn-sm inline-flex">
          <ArrowLeft className="w-4 h-4" /> Volver a Noticias
        </Link>
        <div>
          <h1 className="page-title">Editar Publicación</h1>
          <p className="page-sub">{noticia.titulo}</p>
        </div>
        <div className="card">
          <NoticiaForm noticia={noticia} redirectTo="/noticias-admin" />
        </div>
      </div>
    </AdminLayout>
  );
}