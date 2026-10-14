import { ErrorBanner } from "@/components/error-banner";
import { LeadCard } from "@/components/lead-card";
import { listFeedLeads } from "@/lib/db";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const leads = listFeedLeads();
  const open = leads.filter((lead) => lead.status === "open");
  const claimed = leads.filter((lead) => lead.status === "claimed");

  return (
    <div className="space-y-4">
      <ErrorBanner error={error} />
      <div>
        <h1 className="text-2xl font-semibold">Open leads</h1>
        <p className="text-stone-600">First claim wins. Leads expire in 15 minutes.</p>
      </div>
      {open.length === 0 ? (
        <p className="rounded-3xl bg-white p-4 text-stone-600">No open leads right now.</p>
      ) : (
        open.map((lead) => <LeadCard key={lead.id} lead={lead} />)
      )}
      {claimed.length > 0 ? (
        <div className="space-y-3 pt-2">
          <h2 className="text-lg font-semibold">Already claimed</h2>
          {claimed.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
