import { toast, type ToastOptions } from "react-toastify";
import { getApiErrorMessage } from "@/lib/error";

const defaults: ToastOptions = {
  position: "top-right",
  autoClose: 3500,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: false,
};

export function toastSuccess(message: string, options?: ToastOptions) {
  return toast.success(message, { ...defaults, ...options });
}

export function toastError(
  err: unknown,
  fallback: string = "Đã xảy ra lỗi. Vui lòng thử lại.",
  options?: ToastOptions,
) {
  const message =
    typeof err === "string" && err.trim()
      ? err
      : getApiErrorMessage(err, fallback);
  return toast.error(message, { ...defaults, ...options });
}

export function toastInfo(message: string, options?: ToastOptions) {
  return toast.info(message, { ...defaults, ...options });
}
