import { useAuthStore, announceSessionChange } from "@/stores/auth-store";
import api from "@/config/axios";
import {
  LoginDto,
  LoginResponse,
  RegisterDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  MyProfileDto,
  UpdateMyProfileDto,
} from "@/dto/auth.dto";
import { mapAppRole } from "@/lib/role";

const PUBLIC_API = 'api/v1/iam'

export async function register(data: RegisterDto): Promise<void> {
  await api.post(`${PUBLIC_API}/auth/register`, {
    email: data.email.trim(),
    username: data.username.trim(),
    password: data.password,
    fullName: data.fullName.trim(),
    phone: data.phone?.trim() || null,
  });
}

export async function login(data: LoginDto): Promise<LoginResponse> {
  const loginPayload = {
    username: (data.username || "").trim(),
    password: data.password,
  };
  const res: LoginResponse = await api.post(`${PUBLIC_API}/auth/login`, loginPayload);
  useAuthStore.getState().clearAuth();
  await useAuthStore.getState().fetchMe();
  const user = useAuthStore.getState().user;
  if (!user) {
    await useAuthStore.getState().logout();
    throw new Error("Không thể xác nhận phiên đăng nhập.");
  }
  announceSessionChange();
  return { ...res, role: mapAppRole(user.roleName), userId: user.id, username: user.username };

}

export async function verifyEmail(dto: VerifyEmailDto) {
  const res = await api.post(`${PUBLIC_API}/auth/verify-email`, dto);
  return res;
}

export async function resendVerificationOtp(email: string) {
  const res = await api.post(`${PUBLIC_API}/auth/resend-otp`, { email });
  return res;
}

export async function forgotPassword(data: ForgotPasswordDto): Promise<void> {
  await api.post(`${PUBLIC_API}/auth/forgot-password`, data);
}

export async function resetPassword(data: ResetPasswordDto): Promise<void> {
  await api.post(`${PUBLIC_API}/auth/reset-password`, data);
}

export async function changePassword(data: ChangePasswordDto): Promise<void> {
  await api.post(`${PUBLIC_API}/auth/change-password`, data);
}

/** Hồ sơ user đang đăng nhập — GET api/v1/iam/me */
export async function getMyProfile(): Promise<MyProfileDto> {
  await useAuthStore.getState().fetchMe();
  const user = useAuthStore.getState().user;
  if (!user) throw new Error("Bạn cần đăng nhập.");
  return user;
}

/**
 * Cập nhật hồ sơ cá nhân — PUT api/v1/iam/me
 * (BE cần implement; FE đã sẵn contract).
 */
export async function updateMyProfile(
  data: UpdateMyProfileDto
): Promise<MyProfileDto> {
  const user = await api.put(`${PUBLIC_API}/me`, {
    fullName: data.fullName.trim(),
    ...(data.idNumber !== undefined ? { idNumber: data.idNumber?.trim() ?? null } : {}),
    phone: data.phone?.trim() || null,
    dateOfBirth: data.dateOfBirth || null,
    gender: data.gender ?? 0,
    ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
  }) as unknown as MyProfileDto;
  useAuthStore.getState().setUser(user);
  return user;
}

/** POST api/v1/iam/me/avatar — upload ảnh + cập nhật hồ sơ */
export async function uploadMyAvatar(file: File): Promise<MyProfileDto> {
  const formData = new FormData();
  formData.append("file", file);
  const user = await api.post(`${PUBLIC_API}/me/avatar`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }) as unknown as MyProfileDto;
  useAuthStore.getState().setUser(user);
  return user;
}

/** Keep existing profile callers synchronized with the in-memory user. */
export function updateAuthAvatar(avatarUrl?: string | null) {
  const user = useAuthStore.getState().user;
  if (user) useAuthStore.getState().setUser({ ...user, avatarUrl: avatarUrl || null });
}

export async function logout(): Promise<void> {
  try {
    await useAuthStore.getState().logout();
  } finally {
    window.location.href = '/';
  }
}
