"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/Titulados_y_Egresados");
    router.refresh();
  };

  return (
    <button
      onClick={logout}
      className="flex items-center gap-2 text-slate-400 hover:text-red-400 text-sm
                 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
    >
      <LogOut className="w-4 h-4" /> Salir
    </button>
  );
}
