"use client";

import { useCallback } from "react";
import { toast } from "react-toastify";

export function useOrganizerToastState<T extends string | null>(initialValue: T) {
  const setToast = useCallback(
    (message: string | null) => {
      if (message) toast.success(message);
    },
    []
  );

  return [initialValue, setToast] as const;
}
