import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <div>
        <p className="text-sm font-semibold tracking-[0.18em] text-[#c45512] uppercase">
          LeadPass demo
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Pass a cab lead. Record the cash.</h1>
        <p className="mt-3 max-w-xl text-lg text-stone-700">
          Drivers post a pickup in Thane, another driver claims it, and both record an offline
          commission. This demo never collects a passenger phone number and never holds money.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/drive"
          className="inline-flex min-h-14 items-center rounded-full bg-[#1c1915] px-6 text-lg font-semibold text-[#f6f1e7]"
        >
          Driver phone
        </Link>
        <Link
          href="/admin"
          className="inline-flex min-h-14 items-center rounded-full border border-stone-900/20 bg-white px-6 text-lg font-semibold"
        >
          Admin desk
        </Link>
      </div>
    </main>
  );
}
