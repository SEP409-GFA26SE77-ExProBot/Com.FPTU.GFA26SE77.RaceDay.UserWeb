import api from "@/config/axios";
import Cookies from 'js-cookie';

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
  await api.post('/auth/register', data);
}

export async function login(data: LoginDto) {
  const res: LoginResponse = await api.post('/auth/login', data);
  if (res.token && res.role) {
    Cookies.set('access_token', res.token, { expires: res.expiredTime / (1000 * 60 * 60 * 24), sameSite: 'lax' });
    Cookies.set('role', res.role, { expires: res.expiredTime / (1000 * 60 * 60 * 24), sameSite: 'lax' });
    Cookies.set('username', res.username!, { expires: res.expiredTime / (1000 * 60 * 60 * 24), sameSite: 'lax' });
    Cookies.set('user_id', res.user_id!.toString(), { expires: res.expiredTime / (1000 * 60 * 60 * 24), sameSite: 'lax' });
  }
}

export async function logout(): Promise<void> {
  Cookies.remove('access_token');
  Cookies.remove('role');
  Cookies.remove('username');
  Cookies.remove('user_id');
  window.location.href = '/login';
}