"use client";

import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/lib/error";

// The loader must be stable (module function or useCallback). A changed loader
// invalidates the result immediately; late responses cannot overwrite a new view.
export function useDashboardResource<T>(loader: () => Promise<T>) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    loader: typeof loader;
    revision: number;
    data?: T;
    error?: string;
  }>();
  useEffect(() => {
    let active = true;
    loader().then(
      (data) => {
        if (active) setResult({ loader, revision, data });
      },
      (error) => {
        if (active)
          setResult({
            loader,
            revision,
            error: getApiErrorMessage(
              error,
              "Không tải được dữ liệu. Vui lòng thử lại.",
            ),
          });
      },
    );
    return () => {
      active = false;
    };
  }, [loader, revision]);
  const current =
    result?.loader === loader && result.revision === revision
      ? result
      : undefined;
  return {
    data: current?.data,
    error: current?.error,
    loading: !current,
    reload: () => setRevision((value) => value + 1),
  };
}
