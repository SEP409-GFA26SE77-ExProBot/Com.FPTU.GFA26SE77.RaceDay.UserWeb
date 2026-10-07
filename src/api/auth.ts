import api from "@/config/axios";
import { LoginDto, LoginResponse, RegisterDto, VerifyEmailDto } from "@/dto/auth.dto";
import Cookies from 'js-cookie';
import { MOCK_ACCOUNTS } from "@/data/mock-users";

const PUBLIC_API = 'api/v1/iam'

export async function register(data: RegisterDto): Promise<void> {
  await api.post(`${PUBLIC_API}/auth/register`, {
    email: data.email.trim(),
    username: data.username.trim(),
    password: data.password,
    fullName: data.fullName.trim(),
    phone: data.phone?.trim() || null,
    gender: data.gender ?? 0,
    dateOfBirth: data.dateOfBirth || null,
  });
}

export async function login(data: LoginDto): Promise<LoginResponse> {
  const loginPayload = {
    username: (data.username || data.email || "").trim(),
    password: data.password,
  };
  const res: LoginResponse = await api.post(`${PUBLIC_API}/auth/login`, loginPayload);
  const token = res.accessToken || res.token;
  const role = res.role;
  const username = res.username || loginPayload.username;
  const userId = res.userId || res.user_id;

  if (token) {
    const days = res.expiredTime ? res.expiredTime / (1000 * 60 * 60 * 24) : 7;
    Cookies.set('access_token', token, { expires: days, sameSite: 'lax' });
    if (role) Cookies.set('role', role, { expires: days, sameSite: 'lax' });
    if (username) Cookies.set('username', username, { expires: days, sameSite: 'lax' });
    if (userId) Cookies.set('user_id', userId.toString(), { expires: days, sameSite: 'lax' });
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


export async function logout(): Promise<void> {
  Cookies.remove('access_token');
  Cookies.remove('role');
  Cookies.remove('username');
  Cookies.remove('user_id');
  window.location.href = '/';
}