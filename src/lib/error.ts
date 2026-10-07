export function getApiErrorMessage(err: unknown, fallback: string = "Đã xảy ra lỗi. Vui lòng thử lại."): string {
  if (!err) return fallback;

  if (typeof err === "string" && err.trim()) return err;

  const anyErr = err as any;
  const data = anyErr?.response?.data;

  if (data) {
    if (typeof data === "string" && data.trim()) {
      try {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === "object") {
          return getApiErrorMessage({ response: { data: parsed } }, fallback);
        }
      } catch {
        return data;
      }
      return data;
    }

    if (typeof data === "object") {
      if (typeof data.error === "string" && data.error.trim()) {
        return data.error;
      }
      if (typeof data.message === "string" && data.message.trim()) {
        return data.message;
      }
      if (typeof data.detail === "string" && data.detail.trim()) {
        return data.detail;
      }
      if (typeof data.errorMessage === "string" && data.errorMessage.trim()) {
        return data.errorMessage;
      }
      if (typeof data.msg === "string" && data.msg.trim()) {
        return data.msg;
      }
      if (typeof data.title === "string" && data.title.trim()) {
        return data.title;
      }

      if (data.errors) {
        if (Array.isArray(data.errors)) {
          const joined = data.errors.filter(Boolean).join("; ");
          if (joined) return joined;
        }
        if (typeof data.errors === "object") {
          const errorList = Object.values(data.errors).flat().filter(Boolean);
          if (errorList.length > 0) {
            return errorList.join("; ");
          }
        }
      }
    }
  }

  if (anyErr?.message && typeof anyErr.message === "string") {
    return anyErr.message;
  }

  return fallback;
}
