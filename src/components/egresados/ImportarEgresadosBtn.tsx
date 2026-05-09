"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, Download, X, CheckCircle, AlertTriangle,
  FileSpreadsheet, ChevronDown, ChevronUp, Loader2,
} from "lucide-react";

interface ErrorFila {
  fila:    number;
  ci?:     string;
  errores: string[];
}

interface ResultadoImportacion {
  importados:      number;
  errores:         number;
  totalProcesadas: number;
  detalleErrores:  ErrorFila[];
}

export default function ImportarEgresadosBtn() {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open,       setOpen]       = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [archivo,    setArchivo]    = useState<File | null>(null);
  const [resultado,  setResultado]  = useState<ResultadoImportacion | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [mostrarErr, setMostrarErr] = useState(false);

  const reset = () => {
    setArchivo(null);
    setResultado(null);
    setError(null);
    setMostrarErr(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext ?? "")) {
      setError("Solo se aceptan archivos .xlsx, .xls o .csv");
      return;
    }
    setError(null);
    setResultado(null);
    setArchivo(f);
  };

  const importar = async () => {
    if (!archivo) return;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("archivo", archivo);
      const res  = await fetch("/api/egresados/importar", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      setResultado(json.data);
      if (json.data.importados > 0) router.refresh();
    } catch {
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const descargarPlantilla = () => {
    window.open("/api/egresados/importar", "_blank");
  };

  return (
    <>
      {/* Botón trigger */}
      <button
        onClick={() => { setOpen(true); reset(); }}
        className="btn-slate btn-sm flex items-center gap-2"
      >
        <Upload className="w-3.5 h-3.5" />
        Importar Excel
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(30,43,59,0.70)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.currentTarget === e.target) { setOpen(false); reset(); } }}
        >
          <div
            className="w-full max-w-xl rounded-3xl overflow-hidden animate-fade-up"
            style={{
              background: "var(--blanco)",
              boxShadow: "0 25px 60px rgba(30,43,59,0.25)",
            }}
          >
            {/* Header */}
            <div
              className="px-6 py-5 flex items-center justify-between"
              style={{ background: "var(--marino)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5" style={{ color: "var(--turquesa)" }} />
                <div>
                  <p className="text-white font-bold text-sm" style={{ fontFamily: "'Source Serif 4', serif" }}>
                    Importación masiva de egresados
                  </p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.50)" }}>
                    Sube un archivo Excel o CSV con los datos
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setOpen(false); reset(); }}
                className="w-8 h-8 flex items-center justify-center rounded-xl"
                style={{ color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.07)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Descargar plantilla */}
              <div
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: "var(--turquesa-pale)", border: "1px solid rgba(0,165,168,0.20)" }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--turquesa-dark)" }}>
                    ¿Primera vez? Descarga la plantilla
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--gris-grafito)" }}>
                    Formato: Semestre I/2020 · ¿Es titulado? Si/No
                  </p>
                </div>
                <button
                  onClick={descargarPlantilla}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: "var(--turquesa)",
                    color: "white",
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Plantilla .xlsx
                </button>
              </div>

              {/* Zona de subida */}
              {!resultado && (
                <>
                  {archivo ? (
                    <div
                      className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{ background: "var(--humo)", border: "1.5px solid var(--borde)" }}
                    >
                      <FileSpreadsheet className="w-5 h-5 shrink-0" style={{ color: "var(--turquesa)" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--azul-pizarra)" }}>
                          {archivo.name}
                        </p>
                        <p className="text-xs" style={{ color: "var(--placeholder)" }}>
                          {(archivo.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <button
                        onClick={reset}
                        className="p-1.5 rounded-lg"
                        style={{ color: "var(--placeholder)" }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full flex flex-col items-center justify-center gap-3 py-10 rounded-2xl transition-all"
                      style={{
                        border: "2px dashed var(--borde)",
                        background: "var(--humo)",
                        color: "var(--gris-grafito)",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--turquesa)";
                        (e.currentTarget as HTMLElement).style.background = "var(--turquesa-pale)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--borde)";
                        (e.currentTarget as HTMLElement).style.background = "var(--humo)";
                      }}
                    >
                      <Upload className="w-8 h-8" style={{ color: "var(--placeholder)" }} />
                      <div className="text-center">
                        <p className="text-sm font-semibold" style={{ color: "var(--azul-pizarra)" }}>
                          Haz clic para seleccionar el archivo
                        </p>
                        <p className="text-xs mt-1" style={{ color: "var(--placeholder)" }}>
                          .xlsx, .xls o .csv — máx. 500 filas, 10MB · Semestres en formato I/2020
                        </p>
                      </div>
                    </button>
                  )}

                  <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFile}
                    className="hidden"
                  />

                  {error && <p className="error-box">{error}</p>}

                  <button
                    onClick={importar}
                    disabled={!archivo || loading}
                    className="btn-primary w-full py-3"
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
                      : <><Upload className="w-4 h-4" /> Iniciar importación</>}
                  </button>
                </>
              )}

              {/* Resultado */}
              {resultado && (
                <div className="space-y-4">
                  {/* Resumen */}
                  <div className="grid grid-cols-3 gap-3">
                    <div
                      className="rounded-xl p-3 text-center"
                      style={{ background: "var(--humo)", border: "1px solid var(--borde)" }}
                    >
                      <p className="text-2xl font-bold" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
                        {resultado.totalProcesadas}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--gris-grafito)" }}>Procesadas</p>
                    </div>
                    <div
                      className="rounded-xl p-3 text-center"
                      style={{ background: "var(--verde-light)", border: "1px solid #86efac" }}
                    >
                      <p className="text-2xl font-bold" style={{ color: "var(--verde)", fontFamily: "'Source Serif 4', serif" }}>
                        {resultado.importados}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--verde)" }}>Importados</p>
                    </div>
                    <div
                      className="rounded-xl p-3 text-center"
                      style={{
                        background: resultado.errores > 0 ? "#FEF2F2" : "var(--verde-light)",
                        border: `1px solid ${resultado.errores > 0 ? "#FECACA" : "#86efac"}`,
                      }}
                    >
                      <p
                        className="text-2xl font-bold"
                        style={{
                          color: resultado.errores > 0 ? "#dc2626" : "var(--verde)",
                          fontFamily: "'Source Serif 4', serif",
                        }}
                      >
                        {resultado.errores}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: resultado.errores > 0 ? "#dc2626" : "var(--verde)" }}>
                        Con errores
                      </p>
                    </div>
                  </div>

                  {/* Mensaje principal */}
                  {resultado.importados > 0 && (
                    <div
                      className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{ background: "var(--verde-light)", border: "1px solid #86efac" }}
                    >
                      <CheckCircle className="w-5 h-5 shrink-0" style={{ color: "var(--verde)" }} />
                      <p className="text-sm font-semibold" style={{ color: "var(--verde)" }}>
                        {resultado.importados === 1
                          ? "1 egresado importado correctamente"
                          : `${resultado.importados} egresados importados correctamente`}
                      </p>
                    </div>
                  )}

                  {/* Detalle de errores */}
                  {resultado.errores > 0 && (
                    <div>
                      <button
                        onClick={() => setMostrarErr(v => !v)}
                        className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: "#FEF2F2",
                          border: "1px solid #FECACA",
                          color: "#dc2626",
                        }}
                      >
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span className="flex-1 text-left">
                          {resultado.errores} fila(s) con errores — ver detalle
                        </span>
                        {mostrarErr
                          ? <ChevronUp className="w-4 h-4" />
                          : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {mostrarErr && (
                        <div
                          className="mt-2 rounded-xl overflow-hidden"
                          style={{ border: "1px solid #FECACA", maxHeight: "220px", overflowY: "auto" }}
                        >
                          {resultado.detalleErrores.map((e, i) => (
                            <div
                              key={i}
                              className="px-4 py-3"
                              style={{
                                borderTop: i > 0 ? "1px solid #FECACA" : "none",
                                background: i % 2 === 0 ? "#FEF2F2" : "#FFF5F5",
                              }}
                            >
                              <p className="text-xs font-semibold" style={{ color: "#dc2626" }}>
                                Fila {e.fila}{e.ci ? ` — CI: ${e.ci}` : ""}
                              </p>
                              {e.errores.map((msg, j) => (
                                <p key={j} className="text-xs mt-0.5" style={{ color: "#7f1d1d" }}>
                                  • {msg}
                                </p>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Acciones post-resultado */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setOpen(false); reset(); }}
                      className="btn-primary flex-1"
                    >
                      Cerrar
                    </button>
                    <button
                      onClick={reset}
                      className="btn-slate flex-1"
                    >
                      Importar otro archivo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}