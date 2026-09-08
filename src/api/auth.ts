import api from "@/config/axios";

export interface LoginDto {
  username: string;
  password: string; 
}

export interface LoginResponse {
  user_id: number;
  username?: string;
  token: string;
  expiredTime: number;
  role?: string | null; // role_code từ JWT: 'ADMIN', 'SHOPOWNER', ...
}

export async function login(data: LoginDto) {
  const res = await api.post('/auth/login', data) as LoginResponse;
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', res.token);
  }
  return res;
}

export async function logout(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
  }
}