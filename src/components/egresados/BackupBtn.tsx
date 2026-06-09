"use client";
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

export default function BackupBtn() {
  const [loading, setLoading] = useState(false);

  const handleBackup = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) {
        alert("Error al generar el backup");
        return;
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      const fecha = new Date().toISOString().split("T")[0];
      a.href     = url;
      a.download = `backup_egresados_${fecha}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Error de conexión al generar el backup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBackup}
      disabled={loading}
      className="btn-slate btn-sm flex items-center gap-2"
      title="Descargar backup completo en Excel"
    >
      {loading
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : <Download className="w-3.5 h-3.5" />
      }
      Backup
    </button>
  );
}