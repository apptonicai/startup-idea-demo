export function rupeesToPaise(rupees: number): number | null {
  if (!Number.isFinite(rupees) || rupees <= 0 || rupees > 10000) {
    return null;
  }
  const paise = Math.round(rupees * 100);
  if (paise <= 0) return null;
  return paise;
}

export function formatRupees(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(rupees);
}
