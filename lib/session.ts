import { cookies } from "next/headers";
import { getDriver, type Driver } from "./db";

export const DRIVER_COOKIE = "lp_driver";
export const DEFAULT_DRIVER_ID = "drv_ramesh";

export async function getCurrentDriver(): Promise<Driver> {
  const jar = await cookies();
  const requested = jar.get(DRIVER_COOKIE)?.value ?? DEFAULT_DRIVER_ID;
  return getDriver(requested) ?? getDriver(DEFAULT_DRIVER_ID)!;
}
