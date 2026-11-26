/** Check-in nhân sự bằng QR — BE Positioning module. */
import api from "@/config/axios";

export type StaffCheckInCode = {
  /** Nội dung mã QR; Staff/Photographer quét bằng app RaceDay Staff. */
  payload: string;
  issuedAtUtc: string;
  expiresAtUtc: string;
  serverNowUtc: string;
};

/** GET mã QR check-in hiện tại của giải (chỉ BTC). Mã đổi mỗi 60 giây. */
export async function getStaffCheckInCode(eventId: string): Promise<StaffCheckInCode> {
  return (await api.get(
    `api/v1/positioning/events/${encodeURIComponent(eventId)}/check-in-code`,
  )) as StaffCheckInCode;
}
