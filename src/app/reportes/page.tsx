import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminLayout from "@/components/shared/AdminLayout";
import ReportesClient from "@/components/reportes/ReportesClient";

export default async function ReportesPage() {
  const session = await getSession();
  if (!session || session.rol !== "admin") redirect("/Titulados_y_Egresados");

  return (
    <AdminLayout correo={session.correo}>
      <div className="page">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-[2px] w-6 rounded-full" style={{ background: "#ea580c" }} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: "#ea580c" }}>
              Análisis y exportación
            </span>
          </div>
          <h1 className="text-2xl font-black uppercase leading-none tracking-tighter"
            style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
            Reportes
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--gris-grafito)" }}>
            Filtra, visualiza y exporta información de egresados
          </p>
        </div>
        <ReportesClient />
      </div>
    </AdminLayout>
  );
}