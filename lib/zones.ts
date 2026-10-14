export const PICKUP_ZONES = [
  "Station",
  "Majiwada",
  "Kapurbawdi",
  "Cadbury Jn",
  "Wagle",
  "Hiranandani",
  "Ghodbunder",
  "Kolshet",
  "Balkum",
  "Kalwa",
  "Teen Hath Naka",
  "Other",
] as const;

export type PickupZone = (typeof PICKUP_ZONES)[number];

export function isPickupZone(value: string): value is PickupZone {
  return (PICKUP_ZONES as readonly string[]).includes(value);
}
