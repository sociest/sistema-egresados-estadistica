// src/app/usuarios/nuevo/page.tsx
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { egresado } from "@/lib/schema";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdminLayout from "@/components/shared/AdminLayout";
import UsuarioForm from "@/components/usuarios/UsuarioForm";

export default async function NuevoUsuarioPage() {
  const session = await getSession();
  if (!session || session.rol !== "admin") redirect("/login");

  const egresados = await db.select({
    id: egresado.id, nombres: egresado.nombres, apellidoPaterno: egresado.apellidoPaterno,
  }).from(egresado).orderBy(egresado.apellidoPaterno);

  return (
    <AdminLayout correo={session.correo}>
      <div className="max-w-xl space-y-6">
        <Link href="/usuarios" className="btn-ghost btn-sm inline-flex">
          <ArrowLeft className="w-4 h-4" /> Volver a Usuarios
        </Link>
        <div>
          <h1 className="page-title">Nuevo Usuario</h1>
          <p className="page-sub">Crear una cuenta de acceso al sistema</p>
        </div>
        <div className="card">
          <UsuarioForm egresados={egresados} />
        </div>
      </div>
    </AdminLayout>
  );
}
