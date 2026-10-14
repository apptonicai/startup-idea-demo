import { ErrorBanner } from "@/components/error-banner";
import { postLead } from "@/lib/actions";
import { PICKUP_ZONES } from "@/lib/zones";

export default async function PostPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <form action={postLead} className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Post a lead</h1>
        <p className="text-stone-600">No passenger phone. Commission is cash between drivers.</p>
      </div>
      <ErrorBanner error={error} />
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Pickup zone</legend>
        <div className="flex flex-wrap gap-2">
          {PICKUP_ZONES.map((zone, index) => (
            <label
              key={zone}
              className="cursor-pointer rounded-full border border-stone-900/15 bg-white px-3 py-2 text-sm font-semibold has-[:checked]:border-[#c45512] has-[:checked]:bg-[#f3e2d2]"
            >
              <input
                className="sr-only"
                type="radio"
                name="pickupZone"
                value={zone}
                defaultChecked={index === 0}
                required
              />
              {zone}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">Drop hint</span>
        <input
          name="dropHint"
          required
          maxLength={120}
          data-testid="drop-hint"
          placeholder="Towards Viviana, or a landmark"
          className="min-h-14 w-full rounded-2xl border border-stone-900/15 bg-white px-4 text-base"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">Note (optional)</span>
        <textarea
          name="note"
          maxLength={280}
          data-testid="lead-note"
          rows={3}
          className="w-full rounded-2xl border border-stone-900/15 bg-white px-4 py-3 text-base"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">Commission (₹)</span>
        <input
          name="commissionRupees"
          type="number"
          min={1}
          max={10000}
          step={1}
          required
          defaultValue={80}
          data-testid="commission-rupees"
          className="min-h-14 w-full rounded-2xl border border-stone-900/15 bg-white px-4 text-lg font-semibold"
        />
      </label>
      <button
        type="submit"
        data-testid="post-lead"
        className="sticky bottom-0 min-h-14 w-full rounded-2xl bg-[#c45512] text-lg font-semibold text-white"
      >
        Post lead
      </button>
    </form>
  );
}
