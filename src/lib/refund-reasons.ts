/** Self-service: yêu cầu hoàn tiền khi lỗi hệ thống (Manager/Admin duyệt). */
export function isRefundReasonReady(
  _code: "system_error" | "",
  otherDetail: string
): boolean {
  return otherDetail.trim().length >= 20;
}
