import type { RaceEventDto, RegistrationDto } from "@/dto/event.dto";

/** Snapshot lưu lúc mở checkout PayOS (`confirmation_data`). */
export type ConfirmationSession = {
  registrationId?: string;
  distanceLabel?: string;
  distanceKm?: number;
  price?: number;
};

export function readConfirmationSession(): ConfirmationSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("confirmation_data");
    return raw ? (JSON.parse(raw) as ConfirmationSession) : null;
  } catch {
    return null;
  }
}

/**
 * BE registration detail thường chỉ có `distanceId` — bổ sung tên/giá từ
 * event.distances, số tiền PayOS, hoặc session checkout.
 *
 * Giá ưu tiên: `price` (QuotedAmount / phase lúc ĐK) → PayOS paidAmount →
 * session checkout → mới tới list price `distance.basePrice` (có thể cao hơn early bird).
 */
export function resolveDistanceDisplay(
  reg: Pick<
    RegistrationDto,
    | "id"
    | "distanceId"
    | "distanceName"
    | "distanceKm"
    | "distancePrice"
    | "price"
    | "pricePhaseName"
  >,
  event?: Pick<RaceEventDto, "distances"> | null,
  opts?: {
    session?: ConfirmationSession | null;
    paidAmount?: number | null;
  }
): { name: string; km?: number; price: number; phaseName?: string | null } {
  const d = event?.distances?.find((x) => x.id === reg.distanceId);
  const session =
    opts?.session &&
    (!opts.session.registrationId || opts.session.registrationId === reg.id)
      ? opts.session
      : null;

  const quoted =
    reg.price != null && Number.isFinite(Number(reg.price))
      ? Number(reg.price)
      : null;

  return {
    name:
      reg.distanceName ||
      d?.name ||
      d?.type ||
      session?.distanceLabel ||
      "",
    km: reg.distanceKm ?? d?.distanceKm ?? session?.distanceKm,
    price:
      quoted ??
      opts?.paidAmount ??
      (reg.distancePrice != null ? Number(reg.distancePrice) : null) ??
      session?.price ??
      d?.basePrice ??
      d?.price ??
      0,
    phaseName: reg.pricePhaseName ?? null,
  };
}
