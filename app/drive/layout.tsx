import { DriverSwitcher } from "@/components/driver-switcher";
import { TabBar } from "@/components/tab-bar";
import { listDrivers } from "@/lib/db";
import { getCurrentDriver } from "@/lib/session";
import { headers } from "next/headers";

export default async function DriveLayout({ children }: { children: React.ReactNode }) {
  const [driver, drivers, headerList] = await Promise.all([
    getCurrentDriver(),
    Promise.resolve(listDrivers()),
    headers(),
  ]);
  const nextPath = headerList.get("x-pathname") ?? "/drive";

  return (
    <div className="min-h-dvh bg-[#d9d2c6] px-3 py-4">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-[420px] flex-col overflow-hidden rounded-[2rem] border-8 border-[#1c1915] bg-[#f6f1e7] shadow-2xl">
        <header className="space-y-3 border-b border-stone-900/10 px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-[#c45512] uppercase">
                LeadPass
              </p>
              <p className="text-sm text-stone-600">Acting as {driver.name}</p>
            </div>
            <a href="/admin" className="text-sm font-semibold underline">
              Admin
            </a>
          </div>
          <DriverSwitcher drivers={drivers} current={driver} nextPath={nextPath} />
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        <TabBar />
      </div>
    </div>
  );
}
