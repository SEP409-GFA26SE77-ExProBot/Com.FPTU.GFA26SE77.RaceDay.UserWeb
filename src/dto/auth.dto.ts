import * as z from "zod";

export const LoginSchema = z.object({
  username: z.string().optional(),
  email: z.string().optional(),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export type LoginDto = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
  email: z.string().email("Địa chỉ email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
  fullName: z.string().min(1, "Họ và tên không được để trống"),
  phone: z.string().optional(),
  gender: z.number().optional(),
  dateOfBirth: z.string().optional(),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

export const LoginResponseSchema = z.object({
  userId: z.union([z.string(), z.number()]).optional(),
  user_id: z.union([z.string(), z.number()]).optional(),
  username: z.string().optional(),
  fullName: z.string().optional(),
  email: z.string().optional(),
  token: z.string().optional(),
  accessToken: z.string().optional(),
  expiredTime: z.number().optional(),
  role: z.string().optional(),
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