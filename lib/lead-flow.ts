export type LeadStatus = "open" | "claimed" | "expired" | "settled";
export type SettlementStatus = "unpaid" | "marked_paid" | "confirmed";

export type ClaimRefusal = "self_claim" | "already_claimed" | "not_open";
export type ExpireRefusal = "not_open";
export type MarkPaidRefusal =
  | "not_acceptor"
  | "already_marked_paid"
  | "already_confirmed";
export type ConfirmRefusal = "not_poster" | "not_marked_paid" | "already_confirmed";
export type MessageRefusal = "no_thread" | "not_party";

export type FlowOk<T> = { ok: true; value: T };
export type FlowErr<R extends string> = { ok: false; reason: R };
export type FlowResult<T, R extends string> = FlowOk<T> | FlowErr<R>;

export const LEAD_EXPIRY_MS = 15 * 60 * 1000;

export function decideClaim(input: {
  leadStatus: LeadStatus;
  posterId: string;
  claimerId: string;
  claimedById: string | null;
}): FlowResult<{ status: "claimed" }, ClaimRefusal> {
  if (input.claimerId === input.posterId) {
    return { ok: false, reason: "self_claim" };
  }
  if (input.claimedById) {
    return { ok: false, reason: "already_claimed" };
  }
  switch (input.leadStatus) {
    case "open":
      return { ok: true, value: { status: "claimed" } };
    case "claimed":
      return { ok: false, reason: "already_claimed" };
    case "expired":
    case "settled":
      return { ok: false, reason: "not_open" };
    default: {
      const unreachable: never = input.leadStatus;
      return unreachable;
    }
  }
}

export function decideExpire(
  leadStatus: LeadStatus,
): FlowResult<{ status: "expired" }, ExpireRefusal> {
  switch (leadStatus) {
    case "open":
      return { ok: true, value: { status: "expired" } };
    case "claimed":
    case "expired":
    case "settled":
      return { ok: false, reason: "not_open" };
    default: {
      const unreachable: never = leadStatus;
      return unreachable;
    }
  }
}

export function decideMarkPaid(input: {
  settlementStatus: SettlementStatus;
  actorId: string;
  acceptorId: string;
}): FlowResult<{ status: "marked_paid" }, MarkPaidRefusal> {
  if (input.actorId !== input.acceptorId) {
    return { ok: false, reason: "not_acceptor" };
  }
  switch (input.settlementStatus) {
    case "unpaid":
      return { ok: true, value: { status: "marked_paid" } };
    case "marked_paid":
      return { ok: false, reason: "already_marked_paid" };
    case "confirmed":
      return { ok: false, reason: "already_confirmed" };
    default: {
      const unreachable: never = input.settlementStatus;
      return unreachable;
    }
  }
}

export function decideConfirm(input: {
  settlementStatus: SettlementStatus;
  actorId: string;
  posterId: string;
}): FlowResult<
  { settlementStatus: "confirmed"; leadStatus: "settled" },
  ConfirmRefusal
> {
  if (input.actorId !== input.posterId) {
    return { ok: false, reason: "not_poster" };
  }
  switch (input.settlementStatus) {
    case "unpaid":
      return { ok: false, reason: "not_marked_paid" };
    case "marked_paid":
      return {
        ok: true,
        value: { settlementStatus: "confirmed", leadStatus: "settled" },
      };
    case "confirmed":
      return { ok: false, reason: "already_confirmed" };
    default: {
      const unreachable: never = input.settlementStatus;
      return unreachable;
    }
  }
}

export function decideMessage(input: {
  leadStatus: LeadStatus;
  senderId: string;
  posterId: string;
  claimerId: string | null;
}): FlowResult<true, MessageRefusal> {
  switch (input.leadStatus) {
    case "open":
    case "expired":
      return { ok: false, reason: "no_thread" };
    case "claimed":
    case "settled": {
      if (!input.claimerId) return { ok: false, reason: "no_thread" };
      if (input.senderId !== input.posterId && input.senderId !== input.claimerId) {
        return { ok: false, reason: "not_party" };
      }
      return { ok: true, value: true };
    }
    default: {
      const unreachable: never = input.leadStatus;
      return unreachable;
    }
  }
}
