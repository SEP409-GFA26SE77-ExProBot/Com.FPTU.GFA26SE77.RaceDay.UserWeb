import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { BASE_URL } from "./global-config";
import Cookies from 'js-cookie';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    }
})

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
            const token = Cookies.get('access_token');
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response.data
    },
    (error: AxiosError) => {
        if (error.response) {
            const status = error.response.status;

            switch (status) {
                case 401:
                    // Xử lý khi hết hạn phiên đăng nhập hoặc chưa đăng thực
                    Cookies.remove('access_token');
                    
                    if (typeof window !== 'undefined') {
                        const currentPath = window.location.pathname;
                        if (currentPath !== '/login') {
                            window.location.href = `/login?from=${encodeURIComponent(currentPath)}`;
                        }
                    }
                    break;
                case 403:
                    console.error('Không có quyền truy cập.');
                    window.location.href = '/403';
                    break;
                case 500:
                    console.error('Lỗi máy chủ nội bộ.');
                    break;
                default:
                    console.error(`Lỗi API: ${status}`);
            }
        } else if (error.request) {
            console.error('Không nhận được phản hồi từ server (Network Error)');
        }

        return Promise.reject(error);
    }
);

export default api; 