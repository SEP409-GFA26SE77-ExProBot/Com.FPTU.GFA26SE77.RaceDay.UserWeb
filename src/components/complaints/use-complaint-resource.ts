"use client";

import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/lib/error";

export function useComplaintResource<T>(
  key: string,
  fetcher: () => Promise<T>,
) {
  const [version, setVersion] = useState(0);
  const requestKey = `${key}:${version}`;
  const [result, setResult] = useState<{
    key: string;
    data?: T;
    error?: string;
  }>({ key: "" });

  useEffect(() => {
    let active = true;
    fetcher().then(
      (data) => {
        if (active) setResult({ key: requestKey, data });
      },
      (error: unknown) => {
        if (active)
          setResult({ key: requestKey, error: getApiErrorMessage(error) });
      },
    );
    return () => {
      active = false;
    };
  }, [fetcher, requestKey]);

  const current = result.key === requestKey;
  return {
    data: current ? result.data : undefined,
    error: current ? result.error : undefined,
    loading: !current,
    reload: () => setVersion((value) => value + 1),
  };
}
