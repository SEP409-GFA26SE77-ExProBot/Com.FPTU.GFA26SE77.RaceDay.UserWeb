/**
 * Mirror BE `RaceDay.Shared.Application.Validation.InputRules`
 * + message từ `InputValidationExtensions`.
 */

export const MIN_RUNNER_AGE_YEARS = 5;
export const MAX_PERSON_AGE_YEARS = 100;
export const MIN_HEIGHT_CM = 100;
export const MAX_HEIGHT_CM = 250;
export const MIN_WEIGHT_KG = 25;
export const MAX_WEIGHT_KG = 250;

/** VN mobile: 03/05/07/08/09 + 8 digits, hoặc +84… */
const VN_MOBILE = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
/** CCCD/CMND: 9 hoặc 12 chữ số */
const VN_ID = /^\d{9}$|^\d{12}$/;
/** ABO ± Rh */
const BLOOD_TYPE = /^(A|B|AB|O)([+-])?$/i;

export const MSG = {
  phone: "Số điện thoại không hợp lệ.",
  dateOfBirth: "Ngày sinh không hợp lệ.",
  idNumber: "Số CCCD/CMND phải gồm 9 hoặc 12 chữ số.",
  idNumberRequired: "Vui lòng nhập số CCCD / hộ chiếu.",
  bloodType: "Nhóm máu không hợp lệ (VD: O, A, B, AB hoặc O+/A-/…).",
  bloodTypeRequired: "Vui lòng chọn nhóm máu.",
  gender: "Giới tính không hợp lệ (Male/Female/Other hoặc Nam/Nữ).",
  height: `Chiều cao phải từ ${MIN_HEIGHT_CM}–${MAX_HEIGHT_CM} cm.`,
  weight: `Cân nặng phải từ ${MIN_WEIGHT_KG}–${MAX_WEIGHT_KG} kg.`,
  liability: "Cần chấp nhận điều khoản trách nhiệm.",
  paymentTerms: "Cần chấp nhận điều khoản thanh toán.",
  emergencyRelation: "Vui lòng chọn mối quan hệ.",
  emergencyPhoneSame:
    "SĐT liên hệ khẩn cấp không được trùng số điện thoại của người tham gia.",
} as const;

/** So khớp SĐT VN kể cả dạng 0… / +84… */
export function phonesMatch(a: string, b: string): boolean {
  const na = normalizePhone(a).replace(/^\+84/, "0");
  const nb = normalizePhone(b).replace(/^\+84/, "0");
  return Boolean(na) && na === nb;
}

export function normalizePhone(phone: string): string {
  return phone.trim().replace(/[\s.\-()]/g, "");
}

export function isValidVietnamPhone(phone: string): boolean {
  const n = normalizePhone(phone);
  return n.length > 0 && VN_MOBILE.test(n);
}

export function isValidOptionalVietnamPhone(phone: string): boolean {
  return !phone.trim() || isValidVietnamPhone(phone);
}

/** `yyyy-mm-dd` từ input type=date */
export function isValidDateOfBirth(isoDate: string, today = new Date()): boolean {
  if (!isoDate.trim()) return true;
  const parts = isoDate.trim().split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return false;
  const [y, m, d] = parts;
  const dob = new Date(y, m - 1, d);
  if (
    dob.getFullYear() !== y ||
    dob.getMonth() !== m - 1 ||
    dob.getDate() !== d
  ) {
    return false;
  }

  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  if (dob > startOfToday) return false;

  const oldest = new Date(startOfToday);
  oldest.setFullYear(oldest.getFullYear() - MAX_PERSON_AGE_YEARS);
  const youngest = new Date(startOfToday);
  youngest.setFullYear(youngest.getFullYear() - MIN_RUNNER_AGE_YEARS);

  return dob >= oldest && dob <= youngest;
}

export function isValidOptionalIdNumber(idNumber: string): boolean {
  const t = idNumber.trim();
  return !t || VN_ID.test(t);
}

export function isValidRequiredIdNumber(idNumber: string): boolean {
  const t = idNumber.trim();
  return Boolean(t) && VN_ID.test(t);
}

export function isValidOptionalBloodType(bloodType: string): boolean {
  const t = bloodType.trim();
  return !t || BLOOD_TYPE.test(t);
}

export function isValidOptionalGender(gender: string): boolean {
  if (!gender.trim()) return true;
  const g = gender.trim().toLowerCase();
  return (
    g === "male" ||
    g === "female" ||
    g === "other" ||
    g === "nam" ||
    g === "nữ" ||
    g === "nu"
  );
}

export function isValidOptionalHeightCm(raw: string): boolean {
  if (!raw.trim()) return true;
  const n = Number(raw);
  return Number.isFinite(n) && n >= MIN_HEIGHT_CM && n <= MAX_HEIGHT_CM;
}

export function isValidOptionalWeightKg(raw: string): boolean {
  if (!raw.trim()) return true;
  const n = Number(raw);
  return Number.isFinite(n) && n >= MIN_WEIGHT_KG && n <= MAX_WEIGHT_KG;
}

export function isValidEmail(email: string): boolean {
  const t = email.trim();
  // Gần FluentValidation EmailAddress + max 100
  return t.length > 0 && t.length <= 100 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}
