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
import Cookies from 'js-cookie';
import { mapAppRole } from "@/lib/role";
import { extractExpirationFromToken, extractRoleFromToken, normalizeRole } from "@/lib/jwt";

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
  const accessToken = res.accessToken;
  // IAM có thể trả USER → map RUNNER; trống cũng mặc định RUNNER
  const role = mapAppRole(extractRoleFromToken(accessToken) || res.role || null);
  const username = res.username || loginPayload.username;
  const userId = res.userId;
  const expiredTime = extractExpirationFromToken(accessToken);

  if (accessToken) {
    const days = expiredTime ? expiredTime / (1000 * 60 * 60 * 24) : 7;
    Cookies.set("accessToken", accessToken, { expires: days, sameSite: "lax", path: "/" });
    Cookies.set("role", role, { expires: days, sameSite: "lax", path: "/" });
    if (username) Cookies.set("username", username, { expires: days, sameSite: "lax", path: "/" });
    if (userId) Cookies.set("userId", userId.toString(), { expires: days, sameSite: "lax", path: "/" });
    // Avatar không có trong login response — lấy nhẹ từ /me (không chặn login nếu fail)
    try {
      const me = await getMyProfile();
      persistAvatarCookie(me.avatarUrl);
    } catch {
      /* ignore */
      console.log("Failed to fetch user profile after login; avatar cookie not set.");
    }
  }
  return res;
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
  return api.get(`${PUBLIC_API}/me`) as Promise<MyProfileDto>;
}

/**
 * Cập nhật hồ sơ cá nhân — PUT api/v1/iam/me
 * (BE cần implement; FE đã sẵn contract).
 */
export async function updateMyProfile(
  data: UpdateMyProfileDto
): Promise<MyProfileDto> {
  return api.put(`${PUBLIC_API}/me`, {
    fullName: data.fullName.trim(),
    phone: data.phone?.trim() || null,
    dateOfBirth: data.dateOfBirth || null,
    gender: data.gender ?? 0,
    ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
  }) as Promise<MyProfileDto>;
}

/** POST api/v1/iam/me/avatar — upload ảnh + cập nhật hồ sơ */
export async function uploadMyAvatar(file: File): Promise<MyProfileDto> {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`${PUBLIC_API}/me/avatar`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }) as Promise<MyProfileDto>;
}

/** Cookie avatar để Header hiện ảnh sau khi đổi hồ sơ */
export function persistAvatarCookie(avatarUrl?: string | null) {
  if (avatarUrl) {
    Cookies.set("avatar_url", avatarUrl, {
      expires: 7,
      sameSite: "lax",
      path: "/",
    });
  } else {
    Cookies.remove("avatar_url");
  }
}

export async function logout(): Promise<void> {
  Cookies.remove('access_token');
  Cookies.remove('role');
  Cookies.remove('username');
  Cookies.remove('user_id');
  persistAvatarCookie(null);
  window.location.href = '/';
}
