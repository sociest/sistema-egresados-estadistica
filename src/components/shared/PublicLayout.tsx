// src/components/shared/PublicLayout.tsx
import { getSession } from "@/lib/auth";
import PublicHeader from "@/components/shared/PublicHeader";
import PublicFooter from "@/components/shared/PublicFooter";
import PublicLayoutClient from "@/components/shared/PublicLayoutClient";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const isLoggedIn = !!session;
  const correo = session?.correo;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--humo)" }}>
      <PublicHeader isLoggedIn={isLoggedIn} correo={correo} />
      <main className="flex-1 pt-16 md:pt-20">
        {children}
      </main>
      <PublicFooter />
      {/* Modal de login global — escucha "abrir-modal-login" desde cualquier página */}
      <PublicLayoutClient />
    </div>
  );
}
