import Link from "next/link";
import { notFound } from "next/navigation";
import { ErrorBanner } from "@/components/error-banner";
import { expireLeadAction, reviewThreadAction } from "@/lib/actions";
import { getLeadDetail } from "@/lib/db";
import { leadStatusLabel, settlementStatusLabel } from "@/lib/labels";
import { formatRupees } from "@/lib/money";

export default async function AdminLeadPage({
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
  const { lead, messages, settlement } = detail;

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm font-semibold text-stone-600">
        Back to desk
      </Link>
      <ErrorBanner error={error} />
      <header className="rounded-3xl bg-white p-6">
        <p className="text-sm font-semibold text-[#c45512]">{lead.pickupZone}</p>
        <h2 className="mt-1 text-3xl font-semibold">{lead.dropHint}</h2>
        <p className="mt-2 text-stone-700">
          {lead.posterName}
          {lead.claimedByName ? ` → ${lead.claimedByName}` : ""} · {leadStatusLabel(lead.status)} ·{" "}
          {formatRupees(lead.commissionPaise)}
        </p>
        {lead.note ? <p className="mt-2">{lead.note}</p> : null}
        {settlement ? (
          <p className="mt-3 font-semibold">
            Recorded commission {formatRupees(settlement.amountPaise)} ·{" "}
            {settlementStatusLabel(settlement.status)}
            {settlement.note ? ` · ${settlement.note}` : ""}
          </p>
        ) : (
          <p className="mt-3 text-stone-600">No settlement record yet.</p>
        )}
        <p className="mt-2 text-sm text-stone-500">
          {lead.reviewedAt ? `Thread reviewed ${lead.reviewedAt}` : "Thread not reviewed"}
        </p>
      </header>

      <section className="rounded-3xl bg-white p-6">
        <h3 className="text-lg font-semibold">Transcript</h3>
        {messages.length === 0 ? (
          <p className="mt-3 text-stone-600">No messages yet.</p>
        ) : (
          <ol className="mt-3 space-y-3" data-testid="admin-transcript">
            {messages.map((message) => (
              <li key={message.id} className="rounded-2xl bg-[#f6f1e7] px-4 py-3">
                <p className="text-xs font-semibold text-stone-500">
                  {message.senderName} · {message.createdAt}
                </p>
                <p>{message.body}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        {lead.status === "open" ? (
          <form action={expireLeadAction}>
            <input type="hidden" name="leadId" value={lead.id} />
            <button
              type="submit"
              data-testid="expire-lead"
              className="min-h-12 rounded-full bg-[#1c1915] px-5 font-semibold text-white"
            >
              Expire open lead
            </button>
          </form>
        ) : null}
        {!lead.reviewedAt ? (
          <form action={reviewThreadAction}>
            <input type="hidden" name="leadId" value={lead.id} />
            <button
              type="submit"
              data-testid="mark-reviewed"
              className="min-h-12 rounded-full border border-stone-900/20 bg-white px-5 font-semibold"
            >
              Mark thread reviewed
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
