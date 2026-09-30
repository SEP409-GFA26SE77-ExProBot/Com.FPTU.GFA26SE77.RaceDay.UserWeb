"use client";

import { useCallback, useEffect, useState } from "react";

/** Short page-turn delay so list swaps feel intentional (mock API) */
export function usePagedList<T>(items: T[], pageSize: number, resetKey?: string) {
  const [page, setPage] = useState(1);
  const [turning, setTurning] = useState(false);
  const [visible, setVisible] = useState(true);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize, items.length]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(1, next), totalPages);
      if (clamped === page || turning) return;
      setTurning(true);
      setVisible(false);
      window.setTimeout(() => {
        setPage(clamped);
        setVisible(true);
        setTurning(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 280);
    },
    [page, totalPages, turning]
  );

  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return {
    page,
    totalPages,
    pageItems,
    turning,
    visible,
    goTo,
    totalItems: items.length,
    pageSize,
  };
}
