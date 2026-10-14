export const REASON_COPY: Record<string, string> = {
  self_claim: "You posted this lead, so you cannot claim it.",
  already_claimed: "Another driver already claimed this lead.",
  not_open: "This lead can only be expired while it is still open.",
  not_acceptor: "Only the driver who claimed the lead can mark the commission paid.",
  already_marked_paid: "This commission is already marked paid.",
  already_confirmed: "This commission is already confirmed.",
  not_poster: "Only the driver who posted the lead can confirm the commission.",
  not_marked_paid: "Confirm only after the other driver marks the commission paid.",
  no_thread: "Messages open after a driver claims the lead.",
  not_party: "Only the two drivers on this lead can send messages.",
  missing: "That lead is no longer available.",
  missing_driver: "Choose a driver first.",
  bad_zone: "Choose a Thane pickup zone.",
  bad_drop: "Add a short drop hint.",
  bad_amount: "Enter a commission in rupees.",
  bad_message: "Write a short message.",
  already_reviewed: "This thread is already marked reviewed.",
};

export function reasonCopy(reason: string | undefined): string | null {
  if (!reason) return null;
  return REASON_COPY[reason] ?? "That action could not be completed.";
}
