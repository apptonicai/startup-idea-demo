import type { LeadStatus, SettlementStatus } from "./lead-flow";

export function leadStatusLabel(status: LeadStatus): string {
  switch (status) {
    case "open":
      return "Open";
    case "claimed":
      return "Claimed";
    case "expired":
      return "Expired";
    case "settled":
      return "Settled";
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

export function settlementStatusLabel(status: SettlementStatus): string {
  switch (status) {
    case "unpaid":
      return "Unpaid";
    case "marked_paid":
      return "Awaiting confirm";
    case "confirmed":
      return "Settled";
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

export function minutesLeft(expiresAt: string, now = Date.now()): string {
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return "Expired";
  const minutes = Math.max(1, Math.ceil(ms / 60000));
  return `${minutes} min left`;
}
