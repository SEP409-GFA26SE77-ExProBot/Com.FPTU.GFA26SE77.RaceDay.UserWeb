"use client";

import { useCallback } from "react";
import { toast } from "react-toastify";

export function useOrganizerErrorState() {
  const setError = useCallback((message: string | null) => {
    if (message) toast.error(message);
  }, []);

  return [null, setError] as const;
}
