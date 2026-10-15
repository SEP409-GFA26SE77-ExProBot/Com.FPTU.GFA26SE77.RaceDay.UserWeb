import * as z from "zod";

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

export const LoginSchema = z.object({
  username: z.string().trim().min(1, "Vui lòng nhập tên đăng nhập"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export type LoginDto = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
    .regex(
      USERNAME_PATTERN,
      "Tên đăng nhập chỉ gồm chữ cái, số, dấu chấm, gạch dưới hoặc gạch ngang."
    ),
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập địa chỉ email hợp lệ")
    .pipe(z.email("Địa chỉ email không hợp lệ")),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
  fullName: z.string().trim().min(1, "Họ và tên không được để trống"),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

export const RegisterFormSchema = RegisterSchema.extend({
  confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp.",
  path: ["confirmPassword"],
});

export type RegisterFormDto = z.infer<typeof RegisterFormSchema>;

export const LoginResponseSchema = z.object({
  userId: z.union([z.string(), z.number()]).optional(),
  username: z.string().optional(),
  fullName: z.string().optional(),
  email: z.string().optional(),
  accessToken: z.string().optional(),
  role: z.string().optional(),
  mustChangePassword: z.boolean().optional(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const VerifyEmailSchema = z.object({
  email: z.string().email("Địa chỉ email không hợp lệ"),
  otp: z.string().length(6, "Mã OTP phải có 6 chữ số").optional(),
});

export type VerifyEmailDto = z.infer<typeof VerifyEmailSchema>;

export const VerifyOtpSchema = z.object({
  email: z.string().email("Địa chỉ email không hợp lệ"),
  otp: z.string().length(6, "Mã OTP phải có đúng 6 chữ số"),
});

export type VerifyOtpDto = z.infer<typeof VerifyOtpSchema>;

export const ResendOtpSchema = z.object({
  email: z.string().email("Địa chỉ email không hợp lệ"),
});

export type ResendOtpDto = z.infer<typeof ResendOtpSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Địa chỉ email không hợp lệ"),
});

export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  email: z.string().email("Địa chỉ email không hợp lệ"),
  otp: z.string().length(6, "Mã OTP phải có đúng 6 chữ số"),
  newPassword: z.string().min(8, "Mật khẩu mới phải có ít nhất 8 ký tự"),
});

export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
  newPassword: z.string().min(8, "Mật khẩu mới phải có ít nhất 8 ký tự"),
});

export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;

/** GET / PUT api/v1/iam/me */
export interface MyProfileDto {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  /** 0 Unknown | 1 Male | 2 Female */
  gender: number | string;
  status?: number | string;
  emailVerified?: boolean;
  /** URL ảnh đại diện (R2 / uploads/avatars) */
  avatarUrl?: string | null;
}

/** Body PUT api/v1/iam/me */
export interface UpdateMyProfileDto {
  fullName: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  /** 0 Unknown | 1 Male | 2 Female */
  gender?: number;
  avatarUrl?: string | null;
}

export function genderToApiNumber(gender: unknown): number {
  if (typeof gender === "number" && Number.isFinite(gender)) return gender;
  const s = String(gender ?? "").trim().toLowerCase();
  if (s === "1" || s === "male" || s === "nam") return 1;
  if (s === "2" || s === "female" || s === "nữ" || s === "nu") return 2;
  return 0;
}

/** Map gender API → giá trị form đăng ký (Male | Female | Other). */
export function genderToFormValue(gender: unknown): string {
  const n = genderToApiNumber(gender);
  if (n === 1) return "Male";
  if (n === 2) return "Female";
  if (n === 0) return "";
  return "Other";
}

export function profileDobToDateInput(iso?: string | null): string {
  if (!iso) return "";
  const m = String(iso).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}
