import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { egresado } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { GraduationCap } from "lucide-react";
import RegistroInicialForm from "@/components/perfil/RegistroInicialForm";

export default async function RegistroInicialPage() {
  const session = await getSession();
  if (!session || session.rol !== "egresado") redirect("/Titulados_y_Egresados");
  
  // Solo redirigir a mi-perfil si tiene idEgresado Y existe en BD
  if (session.idEgresado) {
    const [eg] = await db.select({ id: egresado.id })
      .from(egresado)
      .where(eq(egresado.id, session.idEgresado))
      .limit(1);
    if (eg) redirect("/mi-perfil");
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-xl animate-fade-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                          bg-primary-600/20 border border-primary-500/30 mb-4">
            <GraduationCap className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Completa tu perfil</h1>
          <p className="text-slate-500 text-sm">Para continuar, necesitas registrar tus datos.</p>
        </div>
        <div className="card">
          <RegistroInicialForm />
        </div>
      </div>
    </div>
  );
}