"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  claimLead,
  confirmReceived,
  createLead,
  expireOpenLead,
  getDriver,
  markPaid,
  markThreadReviewed,
  sendMessage,
} from "./db";
import { rupeesToPaise } from "./money";
import { DRIVER_COOKIE, getCurrentDriver } from "./session";

function refresh(paths: string[]) {
  for (const path of paths) revalidatePath(path);
}

export async function switchDriver(formData: FormData) {
  const driverId = String(formData.get("driverId") ?? "");
  const next = String(formData.get("next") ?? "/drive");
  if (!getDriver(driverId)) redirect("/drive?error=missing_driver");
  const jar = await cookies();
  jar.set(DRIVER_COOKIE, driverId, { httpOnly: true, sameSite: "lax", path: "/" });
  refresh(["/drive", "/admin"]);
  redirect(next.startsWith("/") ? next : "/drive");
}

export async function postLead(formData: FormData) {
  const driver = await getCurrentDriver();
  const rupees = Number(formData.get("commissionRupees"));
  const paise = rupeesToPaise(rupees);
  if (paise === null) redirect("/drive/post?error=bad_amount");
  const result = createLead({
    posterId: driver.id,
    pickupZone: String(formData.get("pickupZone") ?? ""),
    dropHint: String(formData.get("dropHint") ?? ""),
    note: String(formData.get("note") ?? ""),
    commissionPaise: paise,
  });
  if (!result.ok || !result.id) {
    redirect(`/drive/post?error=${result.ok ? "missing" : result.reason}`);
  }
  refresh(["/drive", "/admin"]);
  redirect(`/drive/leads/${result.id}`);
}

export async function claimLeadAction(formData: FormData) {
  const leadId = String(formData.get("leadId") ?? "");
  const driver = await getCurrentDriver();
  const result = claimLead(leadId, driver.id);
  refresh(["/drive", "/admin"]);
  if (!result.ok) redirect(`/drive/leads/${leadId}?error=${result.reason}`);
  redirect(`/drive/leads/${leadId}`);
}

export async function sendMessageAction(formData: FormData) {
  const leadId = String(formData.get("leadId") ?? "");
  const driver = await getCurrentDriver();
  const result = sendMessage(leadId, driver.id, String(formData.get("body") ?? ""));
  refresh(["/drive", "/admin"]);
  if (!result.ok) redirect(`/drive/leads/${leadId}?error=${result.reason}`);
  redirect(`/drive/leads/${leadId}`);
}

export async function markPaidAction(formData: FormData) {
  const leadId = String(formData.get("leadId") ?? "");
  const driver = await getCurrentDriver();
  const result = markPaid(leadId, driver.id, String(formData.get("note") ?? ""));
  refresh(["/drive", "/admin"]);
  if (!result.ok) redirect(`/drive/leads/${leadId}?error=${result.reason}`);
  redirect(`/drive/leads/${leadId}`);
}

export async function confirmReceivedAction(formData: FormData) {
  const leadId = String(formData.get("leadId") ?? "");
  const driver = await getCurrentDriver();
  const result = confirmReceived(leadId, driver.id, String(formData.get("note") ?? ""));
  refresh(["/drive", "/admin"]);
  if (!result.ok) redirect(`/drive/leads/${leadId}?error=${result.reason}`);
  redirect(`/drive/leads/${leadId}`);
}

export async function expireLeadAction(formData: FormData) {
  const leadId = String(formData.get("leadId") ?? "");
  const result = expireOpenLead(leadId);
  refresh(["/drive", "/admin"]);
  if (!result.ok) redirect(`/admin/leads/${leadId}?error=${result.reason}`);
  redirect(`/admin/leads/${leadId}`);
}

export async function reviewThreadAction(formData: FormData) {
  const leadId = String(formData.get("leadId") ?? "");
  const result = markThreadReviewed(leadId);
  refresh(["/admin"]);
  if (!result.ok) redirect(`/admin/leads/${leadId}?error=${result.reason}`);
  redirect(`/admin/leads/${leadId}`);
}
