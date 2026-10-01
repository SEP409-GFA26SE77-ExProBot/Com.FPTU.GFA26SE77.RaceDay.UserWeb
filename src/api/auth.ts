import api from "@/config/axios";
import Cookies from 'js-cookie';
import { authenticateMockUser, findMockUser } from "@/data/mock-users";

const PUBLIC_API = '/api/v1/iam'

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface LoginResponse {
  user_id: number;
  username?: string;
  token: string;
  expiredTime: number;
  role?: string | null;
}

export async function register(data: RegisterDto): Promise<void> {
  try {
    await api.post(`${PUBLIC_API}/auth/register`, data);
  } catch (err) {
    // If backend is unreachable, simulate successful registration
    console.warn("API registration failed or offline, simulating registration:", err);
  }
}

export async function login(data: LoginDto) {
  try {
    const res: LoginResponse = await api.post(`${PUBLIC_API}/auth/login`, data);
    if (res.token && res.role) {
      Cookies.set('access_token', res.token, { expires: res.expiredTime / (1000 * 60 * 60 * 24), sameSite: 'lax' });
      Cookies.set('role', res.role, { expires: res.expiredTime / (1000 * 60 * 60 * 24), sameSite: 'lax' });
      Cookies.set('username', res.username!, { expires: res.expiredTime / (1000 * 60 * 60 * 24), sameSite: 'lax' });
      Cookies.set('user_id', res.user_id!.toString(), { expires: res.expiredTime / (1000 * 60 * 60 * 24), sameSite: 'lax' });
      return;
    }
  } catch (err) {
    // Check mock users fallback
    const mockUser = authenticateMockUser(data.username, data.password);
    if (mockUser) {
      const mockToken = `mock-token-${mockUser.role.toLowerCase()}-${Date.now()}`;
      Cookies.set('access_token', mockToken, { expires: 1, sameSite: 'lax' });
      Cookies.set('role', mockUser.role, { expires: 1, sameSite: 'lax' });
      Cookies.set('username', mockUser.username, { expires: 1, sameSite: 'lax' });
      Cookies.set('user_id', mockUser.id.toString(), { expires: 1, sameSite: 'lax' });
      return;
    }

    const matchedUser = findMockUser(data.username);
    if (matchedUser && matchedUser.password !== data.password) {
      throw new Error("Mật khẩu không đúng cho tài khoản demo này.");
    }

    // Rethrow original error if not mock user
    throw err;
  }
}

export async function logout(): Promise<void> {
  Cookies.remove('access_token');
  Cookies.remove('role');
  Cookies.remove('username');
  Cookies.remove('user_id');
  window.location.href = '/login';
}
