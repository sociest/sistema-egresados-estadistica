import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminLayout from "@/components/shared/AdminLayout";
import ReportesClient from "@/components/reportes/ReportesClient";


export default async function ReportesPage() {
  const session = await getSession();
  if (!session || session.rol !== "admin") redirect("/login");

  return (
    <AdminLayout correo={session.correo}>
      <div className="page">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-sub">Filtra, visualiza y exporta información de egresados</p>
        </div>
      </div>
    </AdminLayout>
  );
}
