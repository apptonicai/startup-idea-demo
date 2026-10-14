import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#efeae1]">
      <header className="border-b border-stone-900/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-[#c45512] uppercase">
              LeadPass admin
            </p>
            <h1 className="text-2xl font-semibold">Lead desk</h1>
          </div>
          <Link href="/drive" className="font-semibold underline">
            Driver phone
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
