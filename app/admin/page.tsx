import Link from "next/link";
import { adminCounts, listAdminLeads, listDrivers, listSettlements } from "@/lib/db";
import { leadStatusLabel, settlementStatusLabel } from "@/lib/labels";
import { formatRupees } from "@/lib/money";

export default function AdminPage() {
  const counts = adminCounts();
  const leads = listAdminLeads();
  const settlements = listSettlements();
  const drivers = listDrivers();
  const cards = [
    ["Open", counts.open],
    ["Claimed", counts.claimed],
    ["Awaiting confirm", counts.awaitingConfirm],
    ["Settled", counts.settled],
  ] as const;

  return (
    <div className="space-y-8">
      <section className="grid gap-3 sm:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-stone-900/10 bg-white p-4">
            <p className="text-sm text-stone-600">{label}</p>
            <p className="text-3xl font-semibold" data-testid={`count-${label}`}>
              {value}
            </p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-xl font-semibold">Drivers</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {drivers.map((driver) => (
            <li key={driver.id} className="rounded-full bg-white px-3 py-2 text-sm font-semibold">
              {driver.name} · {driver.area}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Leads</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-stone-900/10 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-stone-200 text-stone-500">
              <tr>
                <th className="px-3 py-3 font-medium">Pickup</th>
                <th className="px-3 py-3 font-medium">Drop</th>
                <th className="px-3 py-3 font-medium">Poster</th>
                <th className="px-3 py-3 font-medium">Claimed by</th>
                <th className="px-3 py-3 font-medium">Commission</th>
                <th className="px-3 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-stone-100">
                  <td className="px-3 py-3">
                    <Link className="font-semibold underline" href={`/admin/leads/${lead.id}`}>
                      {lead.pickupZone}
                    </Link>
                  </td>
                  <td className="px-3 py-3">{lead.dropHint}</td>
                  <td className="px-3 py-3">{lead.posterName}</td>
                  <td className="px-3 py-3">{lead.claimedByName ?? "—"}</td>
                  <td className="px-3 py-3">{formatRupees(lead.commissionPaise)}</td>
                  <td className="px-3 py-3">{leadStatusLabel(lead.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Settlements</h2>
        <p className="text-sm text-stone-600">Amounts are recorded only. Admin cannot change them.</p>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-stone-900/10 bg-white">
          <table className="min-w-full text-left text-sm" data-testid="settlement-table">
            <thead className="border-b border-stone-200 text-stone-500">
              <tr>
                <th className="px-3 py-3 font-medium">Lead</th>
                <th className="px-3 py-3 font-medium">Amount</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Poster</th>
                <th className="px-3 py-3 font-medium">Acceptor</th>
                <th className="px-3 py-3 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {settlements.map((row) => (
                <tr key={row.id} className="border-b border-stone-100" data-testid={`settlement-${row.leadId}`}>
                  <td className="px-3 py-3">
                    <Link className="font-semibold underline" href={`/admin/leads/${row.leadId}`}>
                      {row.pickupZone}
                    </Link>
                  </td>
                  <td className="px-3 py-3">{formatRupees(row.amountPaise)}</td>
                  <td className="px-3 py-3">{settlementStatusLabel(row.status)}</td>
                  <td className="px-3 py-3">{row.posterName}</td>
                  <td className="px-3 py-3">{row.acceptorName ?? "—"}</td>
                  <td className="px-3 py-3">{row.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
