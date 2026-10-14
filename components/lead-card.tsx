import Link from "next/link";
import { leadStatusLabel, minutesLeft } from "@/lib/labels";
import { formatRupees } from "@/lib/money";
import type { Lead } from "@/lib/db";

export function LeadCard({ lead }: { lead: Lead }) {
  return (
    <Link
      href={`/drive/leads/${lead.id}`}
      data-testid={`lead-${lead.id}`}
      className="block rounded-3xl border border-stone-900/10 bg-white p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-[#f3e2d2] px-3 py-1 text-sm font-semibold text-[#8a3d0c]">
          {lead.pickupZone}
        </span>
        <span className="text-lg font-semibold">{formatRupees(lead.commissionPaise)}</span>
      </div>
      <p className="mt-3 text-lg font-semibold">Drop: {lead.dropHint}</p>
      {lead.note ? <p className="mt-1 text-stone-600">{lead.note}</p> : null}
      <p className="mt-3 text-sm text-stone-600">
        {lead.posterName} · {leadStatusLabel(lead.status)}
        {lead.status === "open" ? ` · ${minutesLeft(lead.expiresAt)}` : null}
        {lead.claimedByName ? ` · ${lead.claimedByName}` : null}
      </p>
    </Link>
  );
}
