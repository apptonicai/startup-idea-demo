import Link from "next/link";
import { notFound } from "next/navigation";
import { ErrorBanner } from "@/components/error-banner";
import {
  claimLeadAction,
  confirmReceivedAction,
  markPaidAction,
  sendMessageAction,
} from "@/lib/actions";
import { getLeadDetail } from "@/lib/db";
import { leadStatusLabel, minutesLeft, settlementStatusLabel } from "@/lib/labels";
import { formatRupees } from "@/lib/money";
import { getCurrentDriver } from "@/lib/session";

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const detail = getLeadDetail(id);
  if (!detail) notFound();
  const driver = await getCurrentDriver();
  const { lead, messages, settlement } = detail;
  const isPoster = driver.id === lead.posterId;
  const isAcceptor = driver.id === lead.claimedById;
  const isParty = isPoster || isAcceptor;
  const canClaim = lead.status === "open" || (lead.status === "claimed" && !isParty);

  return (
    <div className="space-y-4">
      <Link href="/drive" className="text-sm font-semibold text-stone-600">
        Back to feed
      </Link>
      <ErrorBanner error={error} />
      <article className="rounded-3xl bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-full bg-[#f3e2d2] px-3 py-1 text-sm font-semibold text-[#8a3d0c]">
            {lead.pickupZone}
          </span>
          <span className="text-xl font-semibold">{formatRupees(lead.commissionPaise)}</span>
        </div>
        <h1 className="mt-3 text-2xl font-semibold">{lead.dropHint}</h1>
        {lead.note ? <p className="mt-2 text-stone-700">{lead.note}</p> : null}
        <p className="mt-3 text-sm text-stone-600">
          Posted by {lead.posterName} · {leadStatusLabel(lead.status)}
          {lead.status === "open" ? ` · ${minutesLeft(lead.expiresAt)}` : null}
        </p>
        {lead.claimedByName ? (
          <p className="text-sm text-stone-600">Claimed by {lead.claimedByName}</p>
        ) : null}
        {settlement ? (
          <p className="mt-2 text-sm font-semibold">
            Commission {formatRupees(settlement.amountPaise)} ·{" "}
            {settlementStatusLabel(settlement.status)}
            {settlement.note ? ` · ${settlement.note}` : ""}
          </p>
        ) : null}
      </article>

      {canClaim ? (
        <form action={claimLeadAction}>
          <input type="hidden" name="leadId" value={lead.id} />
          <button
            type="submit"
            data-testid="claim-lead"
            className="sticky bottom-0 min-h-14 w-full rounded-2xl bg-[#1c1915] text-lg font-semibold text-white"
          >
            Claim this lead
          </button>
        </form>
      ) : null}

      {isParty && (lead.status === "claimed" || lead.status === "settled") ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Handoff</h2>
          <ol className="space-y-2" data-testid="transcript">
            {messages.map((message) => (
              <li
                key={message.id}
                className={`rounded-2xl px-4 py-3 ${
                  message.senderId === driver.id ? "bg-[#1c1915] text-[#f6f1e7]" : "bg-white"
                }`}
              >
                <p className="text-xs font-semibold opacity-70">{message.senderName}</p>
                <p>{message.body}</p>
              </li>
            ))}
          </ol>
          <form action={sendMessageAction} className="space-y-2">
            <input type="hidden" name="leadId" value={lead.id} />
            <label className="block space-y-1">
              <span className="sr-only">Message</span>
              <textarea
                name="body"
                required
                maxLength={500}
                data-testid="message-body"
                placeholder="Text the other driver"
                className="min-h-20 w-full rounded-2xl border border-stone-900/15 bg-white px-4 py-3"
              />
            </label>
            <button
              type="submit"
              data-testid="send-message"
              className="min-h-12 w-full rounded-2xl border border-stone-900/20 bg-white text-base font-semibold"
            >
              Send message
            </button>
          </form>
        </section>
      ) : null}

      {isAcceptor && settlement?.status === "unpaid" ? (
        <form action={markPaidAction} className="space-y-2 rounded-3xl bg-white p-4">
          <input type="hidden" name="leadId" value={lead.id} />
          <p className="font-semibold">You took this lead. Mark the cash paid.</p>
          <input
            name="note"
            maxLength={160}
            data-testid="paid-note"
            placeholder="Short note (optional)"
            className="min-h-12 w-full rounded-2xl border border-stone-900/15 px-4"
          />
          <button
            type="submit"
            data-testid="mark-paid"
            className="sticky bottom-0 min-h-14 w-full rounded-2xl bg-[#c45512] text-lg font-semibold text-white"
          >
            Mark commission paid
          </button>
        </form>
      ) : null}

      {isPoster && settlement?.status === "marked_paid" ? (
        <form action={confirmReceivedAction} className="space-y-2 rounded-3xl bg-white p-4">
          <input type="hidden" name="leadId" value={lead.id} />
          <p className="font-semibold">
            {lead.claimedByName} marked {formatRupees(settlement.amountPaise)} paid. Confirm you
            received it.
          </p>
          <input
            name="note"
            maxLength={160}
            data-testid="confirm-note"
            placeholder="Short note (optional)"
            className="min-h-12 w-full rounded-2xl border border-stone-900/15 px-4"
          />
          <button
            type="submit"
            data-testid="confirm-received"
            className="sticky bottom-0 min-h-14 w-full rounded-2xl bg-[#1c1915] text-lg font-semibold text-white"
          >
            Confirm received
          </button>
        </form>
      ) : null}
    </div>
  );
}
