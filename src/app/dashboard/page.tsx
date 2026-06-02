import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminLayout from "@/components/shared/AdminLayout";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session || session.rol !== "admin") redirect("/login");

  return (
    <AdminLayout correo={session.correo}>
      <div className="page">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-[2px] w-6 rounded-full" style={{ background: "#ea580c" }} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: "#ea580c" }}>
              Estadísticas generales
            </span>
          </div>
          <h1 className="text-2xl font-black uppercase leading-none tracking-tighter"
            style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
            Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--gris-grafito)" }}>
            Seguimiento de egresados — Carrera de Estadística UMSA
          </p>
        </div>
        <DashboardClient />
      </div>
    </AdminLayout>
  );
}