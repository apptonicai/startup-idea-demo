import { LeadCard } from "@/components/lead-card";
import { listClaimedBy, listPostedBy } from "@/lib/db";
import { getCurrentDriver } from "@/lib/session";

export default async function MinePage() {
  const driver = await getCurrentDriver();
  const posted = listPostedBy(driver.id);
  const claimed = listClaimedBy(driver.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mine</h1>
        <p className="text-stone-600">Leads you posted and leads you claimed, {driver.name}.</p>
      </div>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Posted</h2>
        {posted.length === 0 ? (
          <p className="rounded-3xl bg-white p-4 text-stone-600">You have not posted a lead.</p>
        ) : (
          posted.map((lead) => <LeadCard key={lead.id} lead={lead} />)
        )}
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Claimed</h2>
        {claimed.length === 0 ? (
          <p className="rounded-3xl bg-white p-4 text-stone-600">You have not claimed a lead.</p>
        ) : (
          claimed.map((lead) => <LeadCard key={lead.id} lead={lead} />)
        )}
      </section>
    </div>
  );
}
