import { switchDriver } from "@/lib/actions";
import type { Driver } from "@/lib/db";

export function DriverSwitcher({
  drivers,
  current,
  nextPath,
}: {
  drivers: Driver[];
  current: Driver;
  nextPath: string;
}) {
  return (
    <form action={switchDriver} className="flex items-center gap-2" key={current.id}>
      <input type="hidden" name="next" value={nextPath} />
      <label className="sr-only" htmlFor="driverId">
        Acting as
      </label>
      <select
        id="driverId"
        name="driverId"
        defaultValue={current.id}
        data-testid="driver-select"
        className="min-h-12 min-w-0 flex-1 rounded-xl border border-stone-900/15 bg-white px-3 text-base font-semibold"
      >
        {drivers.map((driver) => (
          <option key={driver.id} value={driver.id}>
            {driver.name} · {driver.area}
          </option>
        ))}
      </select>
      <button
        type="submit"
        data-testid="switch-driver"
        className="min-h-12 rounded-xl bg-[#1c1915] px-4 text-base font-semibold text-[#f6f1e7]"
      >
        Switch
      </button>
    </form>
  );
}
