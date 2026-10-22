import axios, { AxiosError } from "axios";
import { useAuthStore } from "@/stores/auth-store";

const api = axios.create({
    baseURL: "/api/backend/",
    withCredentials: true,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    }
})

api.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error: AxiosError) => {
        if (error.response) {
            const status = error.response.status;
            const resData = error.response.data as { error?: string; message?: string; title?: string } | undefined;
            const errorMsg = resData?.error || resData?.message || resData?.title || (typeof resData === "string" ? resData : "");

            switch (status) {
                case 400:
                case 422:
                    // Validation / business rule errors are handled and displayed directly by the calling UI forms
                    break;
                case 401:
                    if (error.config?.url?.endsWith("/me")) return Promise.reject(error);
                    useAuthStore.getState().clearAuth();
                    if (typeof window !== 'undefined') {
                        const currentPath = window.location.pathname;
                        if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/verify-email') {
                            window.location.href = `/login?from=${encodeURIComponent(currentPath)}`;
                        }
                    }
                    break;
                case 403:
                    console.error('Không có quyền truy cập.');
                    if (typeof window !== 'undefined') {
                        window.location.href = '/403';
                    }
                    break;
                case 500:
                    console.error('Lỗi máy chủ nội bộ (500):', errorMsg);
                    break;
                default:
                    console.warn(`Lỗi API [${status}]:`, errorMsg || error.message);
            }
        } else if (error.request) {
            console.error('Không nhận được phản hồi từ server (Network Error)');
        }

        return Promise.reject(error);
    }
);

export default api;
