import { reasonCopy } from "@/lib/reasons";

export function ErrorBanner({ error }: { error?: string }) {
  const message = reasonCopy(error);
  if (!message) return null;
  return (
    <p
      role="alert"
      data-testid="error-banner"
      className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-base font-medium text-red-900"
    >
      {message}
    </p>
  );
}
