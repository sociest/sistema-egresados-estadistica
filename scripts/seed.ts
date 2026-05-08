// scripts/seed.ts — Seed completo con datos amplios para testing de filtros

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/lib/schema";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";

dotenv.config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db   = drizzle(pool, { schema });

async function main() {
  console.log("\n🌱 Limpiando BD y sembrando datos amplios...\n");

  await db.delete(schema.verificacionTokens);
  await db.delete(schema.postgrado);
  await db.delete(schema.historialLaboral);
  await db.delete(schema.usuario);
  await db.delete(schema.egresado);
  console.log("🗑️  Tablas limpiadas\n");

  // ── EGRESADOS ─────────────────────────────────────────────────────────────
  const egresadosData = [
    // ── TITULADOS ─────────────────────────────────────────────────────────
    {
      tipo: "Titulado" as const,
      nombres: "Carlos Alberto", apellidos: "Mamani Quispe",
      apellidoPaterno: "Mamani", apellidoMaterno: "Quispe",
      ci: "10000001", celular: "71000001", correoElectronico: "carlos.mamani@gmail.com",
      direccion: "Av. Arce 123, La Paz", fechaNacimiento: "1990-03-15",
      fechaGraduacion: "2015-11-20", anioTitulacion: 2015,
      modalidadTitulacion: "Tesis" as const,
      anioIngreso: 2008, semestreIngreso: "I", anioEgreso: 2014, semestreEgreso: "II",
      linkedin: "https://linkedin.com/in/carlos-mamani",
      areaEspecializacion: "Estadística oficial",
      lugarResidencia: "La Paz",
      inicioProceso: null, motivoNoTitulacion: null, planeaTitularse: null,
    },
    {
      tipo: "Titulado" as const,
      nombres: "María Elena", apellidos: "Flores Condori",
      apellidoPaterno: "Flores", apellidoMaterno: "Condori",
      ci: "10000002", celular: "71000002", correoElectronico: "maria.flores@gmail.com",
      direccion: "Calle Loayza 456, La Paz", fechaNacimiento: "1992-07-22",
      fechaGraduacion: "2017-06-10", anioTitulacion: 2017,
      modalidadTitulacion: "Proyecto de grado" as const,
      anioIngreso: 2010, semestreIngreso: "II", anioEgreso: 2016, semestreEgreso: "I",
      areaEspecializacion: "Econometría",
      lugarResidencia: "La Paz",
      inicioProceso: null, motivoNoTitulacion: null, planeaTitularse: null,
    },
    {
      tipo: "Titulado" as const,
      nombres: "Roberto Andrés", apellidos: "Vargas Torrez",
      apellidoPaterno: "Vargas", apellidoMaterno: "Torrez",
      ci: "10000003", celular: "71000003", correoElectronico: "roberto.vargas@gmail.com",
      direccion: "Av. Montes 789, La Paz", fechaNacimiento: "1988-11-05",
      fechaGraduacion: "2013-04-18", anioTitulacion: 2013,
      modalidadTitulacion: "Trabajo dirigido" as const,
      anioIngreso: 2006, semestreIngreso: "I", anioEgreso: 2012, semestreEgreso: "II",
      areaEspecializacion: "Consultoría estadística",
      lugarResidencia: "La Paz",
      inicioProceso: null, motivoNoTitulacion: null, planeaTitularse: null,
    },
    {
      tipo: "Titulado" as const,
      nombres: "Lucía Patricia", apellidos: "Choque Apaza",
      apellidoPaterno: "Choque", apellidoMaterno: "Apaza",
      ci: "10000004", celular: "71000004", correoElectronico: "lucia.choque@gmail.com",
      direccion: "Calle Murillo 321, El Alto", fechaNacimiento: "1995-02-28",
      fechaGraduacion: "2020-12-01", anioTitulacion: 2020,
      modalidadTitulacion: "Tesis" as const,
      anioIngreso: 2013, semestreIngreso: "I", anioEgreso: 2019, semestreEgreso: "I",
      areaEspecializacion: "Epidemiología",
      lugarResidencia: "El Alto",
      inicioProceso: null, motivoNoTitulacion: null, planeaTitularse: null,
    },
    {
      tipo: "Titulado" as const,
      nombres: "Ana Sofía", apellidos: "Condori Mamani",
      apellidoPaterno: "Condori", apellidoMaterno: "Mamani",
      ci: "10000006", celular: "71000006", correoElectronico: "ana.condori@gmail.com",
      direccion: "Calle Potosí 100, La Paz", fechaNacimiento: "1998-04-12",
      fechaGraduacion: "2022-06-15", anioTitulacion: 2022,
      modalidadTitulacion: "Otro" as const,
      anioIngreso: 2016, semestreIngreso: "I", anioEgreso: 2021, semestreEgreso: "II",
      areaEspecializacion: "Machine Learning",
      lugarResidencia: "La Paz",
      inicioProceso: null, motivoNoTitulacion: null, planeaTitularse: null,
    },
    {
      tipo: "Titulado" as const,
      nombres: "Rodrigo", apellidos: "Aliaga Poma",
      apellidoPaterno: "Aliaga", apellidoMaterno: "Poma",
      ci: "10000009", celular: "71000009", correoElectronico: "rodrigo.aliaga@gmail.com",
      direccion: "Cochabamba Centro", fechaNacimiento: "1994-06-30",
      fechaGraduacion: "2020-03-10", anioTitulacion: 2020,
      modalidadTitulacion: "Proyecto de grado" as const,
      anioIngreso: 2012, semestreIngreso: "I", anioEgreso: 2019, semestreEgreso: "I",
      areaEspecializacion: "Bioestadística",
      lugarResidencia: "Cochabamba",
      inicioProceso: null, motivoNoTitulacion: null, planeaTitularse: null,
    },
    {
      tipo: "Titulado" as const,
      nombres: "Camila", apellidos: "Rojas Salinas",
      apellidoPaterno: "Rojas", apellidoMaterno: "Salinas",
      ci: "10000010", celular: "71000010", correoElectronico: "camila.rojas@gmail.com",
      direccion: "Santa Cruz Centro", fechaNacimiento: "1991-11-22",
      fechaGraduacion: "2018-09-15", anioTitulacion: 2018,
      modalidadTitulacion: "Tesis" as const,
      anioIngreso: 2010, semestreIngreso: "I", anioEgreso: 2017, semestreEgreso: "II",
      areaEspecializacion: "Estadística empresarial",
      lugarResidencia: "Santa Cruz",
      inicioProceso: null, motivoNoTitulacion: null, planeaTitularse: null,
    },
    // ── EGRESADOS SIN TÍTULO ───────────────────────────────────────────────
    {
      tipo: "Egresado" as const,
      nombres: "Paola Vanessa", apellidos: "Huanca Mendoza",
      apellidoPaterno: "Huanca", apellidoMaterno: "Mendoza",
      ci: "10000021", celular: "71000021", correoElectronico: "paola.huanca@gmail.com",
      direccion: "Calle Yungas 200, La Paz", fechaNacimiento: "1994-06-10",
      fechaGraduacion: "2020-01-01", anioTitulacion: null,
      modalidadTitulacion: null,
      anioIngreso: 2012, semestreIngreso: "I", anioEgreso: 2019, semestreEgreso: "II",
      areaEspecializacion: "Estadística social",
      lugarResidencia: "La Paz",
      inicioProceso: true, motivoNoTitulacion: "Dificultades económicas.", planeaTitularse: "Si" as const,
    },
    {
      tipo: "Egresado" as const,
      nombres: "Marcos Antonio", apellidos: "Ticona Ramos",
      apellidoPaterno: "Ticona", apellidoMaterno: "Ramos",
      ci: "10000022", celular: "71000022", correoElectronico: "marcos.ticona@gmail.com",
      direccion: "Av. Periférica 1500, El Alto", fechaNacimiento: "1991-12-03",
      fechaGraduacion: "2018-06-01", anioTitulacion: null,
      modalidadTitulacion: null,
      anioIngreso: 2009, semestreIngreso: "II", anioEgreso: 2017, semestreEgreso: "I",
      areaEspecializacion: "Análisis empresarial",
      lugarResidencia: "El Alto",
      inicioProceso: false, motivoNoTitulacion: "Se incorporó al mercado laboral.", planeaTitularse: "No" as const,
    },
    {
      tipo: "Egresado" as const,
      nombres: "Silvia", apellidos: "Mamani Torres",
      apellidoPaterno: "Mamani", apellidoMaterno: "Torres",
      ci: "10000025", celular: "71000025", correoElectronico: "silvia.mamani@gmail.com",
      direccion: "Av. Montes 500, La Paz", fechaNacimiento: "1997-01-29",
      fechaGraduacion: "2023-01-01", anioTitulacion: null,
      modalidadTitulacion: null,
      anioIngreso: 2016, semestreIngreso: "I", anioEgreso: 2022, semestreEgreso: "I",
      areaEspecializacion: "Estadística educativa",
      lugarResidencia: "La Paz",
      inicioProceso: true, motivoNoTitulacion: "Pendiente de requisitos.", planeaTitularse: "No sabe" as const,
    },
  ];

  const egresadosCreados = await db.insert(schema.egresado)
    .values(egresadosData)
    .returning();

  console.log(`✅ ${egresadosCreados.length} egresados creados`);

  // índice por CI para referencias fáciles
  const por = (ci: string) => egresadosCreados.find(e => e.ci === ci)!;

  // ── HISTORIAL LABORAL ─────────────────────────────────────────────────────
  const historialData = [
    // Carlos Mamani
    { idEgresado: por("10000001").id, empresa: "INE Bolivia", cargo: "Estadístico Senior", area: "Censos", ciudadRegionTrabajo: "La Paz", sectorTrabajo: "Publico" as const, tipoContrato: "Indefinido" as const, fechaInicio: "2015-03-01", fechaFin: null },
    // María Flores
    { idEgresado: por("10000002").id, empresa: "UDAPE", cargo: "Investigadora Senior", area: "Macroeconomía", ciudadRegionTrabajo: "La Paz", sectorTrabajo: "Publico" as const, tipoContrato: "Fijo" as const, fechaInicio: "2017-08-01", fechaFin: null },
    // Roberto Vargas
    { idEgresado: por("10000003").id, empresa: "Deloitte Bolivia", cargo: "Consultor", area: "Auditoría", ciudadRegionTrabajo: "La Paz", sectorTrabajo: "Privado" as const, tipoContrato: "Indefinido" as const, fechaInicio: "2014-05-01", fechaFin: "2018-12-31" },
    { idEgresado: por("10000003").id, empresa: "PwC Bolivia", cargo: "Senior Consultant", area: "Riesgo", ciudadRegionTrabajo: "La Paz", sectorTrabajo: "Privado" as const, tipoContrato: "Indefinido" as const, fechaInicio: "2019-02-01", fechaFin: null },
    // Lucía Choque
    { idEgresado: por("10000004").id, empresa: "Ministerio de Salud", cargo: "Analista Epidemiología", area: "Epidemiología", ciudadRegionTrabajo: "La Paz", sectorTrabajo: "Publico" as const, tipoContrato: "Fijo" as const, fechaInicio: "2021-03-01", fechaFin: null },
    // Ana Condori
    { idEgresado: por("10000006").id, empresa: "Tigo Bolivia", cargo: "Data Analyst", area: "BI", ciudadRegionTrabajo: "La Paz", sectorTrabajo: "Privado" as const, tipoContrato: "Fijo" as const, fechaInicio: "2022-07-01", fechaFin: "2023-06-30" },
    // Rodrigo Aliaga
    { idEgresado: por("10000009").id, empresa: "Clínica Los Andes", cargo: "Bioestadístico", area: "Investigación", ciudadRegionTrabajo: "Cochabamba", sectorTrabajo: "Privado" as const, tipoContrato: "Indefinido" as const, fechaInicio: "2020-04-01", fechaFin: null },
    // Camila Rojas
    { idEgresado: por("10000010").id, empresa: "Cervecería Boliviana", cargo: "Analista de Datos", area: "Operaciones", ciudadRegionTrabajo: "Santa Cruz", sectorTrabajo: "Privado" as const, tipoContrato: "Indefinido" as const, fechaInicio: "2018-10-01", fechaFin: null },
    // Paola Huanca
    { idEgresado: por("10000021").id, empresa: "UDAPE", cargo: "Técnica Social", area: "Social", ciudadRegionTrabajo: "La Paz", sectorTrabajo: "Publico" as const, tipoContrato: "Fijo" as const, fechaInicio: "2019-10-01", fechaFin: null },
    // Marcos Ticona
    { idEgresado: por("10000022").id, empresa: "ENTEL", cargo: "Analista BI", area: "TI", ciudadRegionTrabajo: "La Paz", sectorTrabajo: "Privado" as const, tipoContrato: "Indefinido" as const, fechaInicio: "2018-03-15", fechaFin: null },
    // Silvia Mamani
    { idEgresado: por("10000025").id, empresa: "Plan Internacional Bolivia", cargo: "Oficial M&E", area: "Educación", ciudadRegionTrabajo: "La Paz", sectorTrabajo: "ONG" as const, tipoContrato: "Fijo" as const, fechaInicio: "2023-02-01", fechaFin: null },
  ];

  await db.insert(schema.historialLaboral).values(historialData);
  console.log(`✅ ${historialData.length} registros de historial laboral creados`);

  // ── POSTGRADOS ────────────────────────────────────────────────────────────
  await db.insert(schema.postgrado).values([
    { idEgresado: por("10000001").id, tipo: "Maestria",     institucion: "UMSA",                  pais: "Bolivia",   anioInicio: 2018, anioFin: 2020, estado: "Finalizado" },
    { idEgresado: por("10000002").id, tipo: "Maestria",     institucion: "FLACSO",                 pais: "Argentina", anioInicio: 2019, anioFin: 2021, estado: "Finalizado" },
    { idEgresado: por("10000003").id, tipo: "Diplomado",    institucion: "FLACSO Argentina",       pais: "Argentina", anioInicio: 2016, anioFin: 2017, estado: "Finalizado" },
    { idEgresado: por("10000006").id, tipo: "Maestria",     institucion: "Universidad de Chile",   pais: "Chile",     anioInicio: 2023, estado: "En curso" },
    { idEgresado: por("10000009").id, tipo: "Especialidad", institucion: "PUCP",                   pais: "Perú",      anioInicio: 2022, estado: "En curso" },
    { idEgresado: por("10000010").id, tipo: "Maestria",     institucion: "Universidad Austral",    pais: "Argentina", anioInicio: 2020, anioFin: 2022, estado: "Finalizado" },
    { idEgresado: por("10000021").id, tipo: "Diplomado",    institucion: "UPB",                    pais: "Bolivia",   anioInicio: 2021, anioFin: 2022, estado: "Finalizado" },
  ]);
  console.log("✅ Postgrados creados");

  // ── Activar directorio ────────────────────────────────────────────────────
  for (const eg of egresadosCreados) {
    await db.update(schema.egresado)
      .set({ mostrarEnDirectorio: true })
      .where(eq(schema.egresado.id, eg.id));
  }

  // ── USUARIOS ──────────────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@estadistica.bo";
  const adminPass  = process.env.ADMIN_PASSWORD ?? "Admin1234!";

  await db.insert(schema.usuario).values({
    ci: "admin", correo: adminEmail,
    passwordHash: await bcrypt.hash(adminPass, 12),
    rol: "admin", estado: "activo", primerLogin: false,
    correoVerificado: true, celularVerificado: false,
  });

  for (const eg of egresadosCreados) {
    await db.insert(schema.usuario).values({
      ci: eg.ci, correo: eg.correoElectronico!,
      passwordHash: await bcrypt.hash(eg.ci, 12),
      rol: "egresado", estado: "activo", idEgresado: eg.id,
      primerLogin: true, correoVerificado: false, celularVerificado: false,
    });
  }

  console.log(`✅ ${egresadosCreados.length + 1} usuarios creados\n`);
  console.log("━".repeat(60));
  console.log(`👑 Admin: ${adminEmail} / ${adminPass}`);
  console.log("━".repeat(60) + "\n");
}

main()
  .catch(e => { console.error("❌ Error:", e); process.exit(1); })
  .finally(() => pool.end());