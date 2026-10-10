"use client";

import { useEffect, useRef } from "react";

export const PAYOS_EMBED_ELEMENT_ID = "payos-embedded-checkout";

const PAYOS_ORIGINS = [
  "https://pay.payos.vn",
  "https://dev.pay.payos.vn",
  "https://next.dev.pay.payos.vn",
];

type PayOsEmbeddedProps = {
  checkoutUrl: string;
  returnUrl: string;
  onSuccess: () => void;
  onCancel: () => void;
  onExit: () => void;
  className?: string;
};

function buildIframeSrc(checkoutUrl: string, returnUrl: string): string {
  if (checkoutUrl.includes("/web/")) {
    const embedded = checkoutUrl.replace("/web/", "/embedded/");
    const sep = embedded.includes("?") ? "&" : "?";
    return `${embedded}${sep}redirect_uri=${encodeURIComponent(returnUrl)}`;
  }
  try {
    const u = new URL(checkoutUrl);
    if (!u.searchParams.has("redirect_uri") && !u.searchParams.has("returnUrl")) {
      u.searchParams.set("redirect_uri", returnUrl);
    }
    if (!u.pathname.includes("/embedded/") && !u.pathname.includes("/mock-checkout/")) {
      u.searchParams.set("iframe", "true");
    }
    return u.toString();
  } catch {
    return checkoutUrl;
  }
}

/**
 * Nhúng PayOS (QR + chuyển khoản chung 1 iframe) — không redirect full page.
 */
export function PayOsEmbedded({
  checkoutUrl,
  returnUrl,
  onSuccess,
  onCancel,
  onExit,
  className,
}: PayOsEmbeddedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    doneRef.current = false;
    container.replaceChildren();

    const iframe = document.createElement("iframe");
    iframe.title = "PayOS Checkout";
    iframe.allow = "clipboard-write; payment";
    iframe.width = "100%";
    iframe.height = "100%";
    iframe.style.border = "0";
    iframe.style.display = "block";
    iframe.src = buildIframeSrc(checkoutUrl, returnUrl);
    container.appendChild(iframe);

    const finishSuccess = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onSuccess();
    };
    const finishCancel = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onCancel();
    };

    const onMessage = (event: MessageEvent) => {
      if (!PAYOS_ORIGINS.includes(event.origin)) return;
      let data: { type?: string; data?: { status?: string } };
      try {
        data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      if (data?.type === "status" || data?.type === "error") {
        if (doneRef.current) return;
        doneRef.current = true;
        onExit();
        return;
      }
      if (data?.type === "payment_response") {
        const status = data.data?.status?.toUpperCase();
        if (status === "CANCELLED" || status === "DELETED") finishCancel();
        else if (status === "PAID") finishSuccess();
      }
    };

    const onLoad = () => {
      try {
        const href = iframe.contentWindow?.location?.href ?? "";
        if (!href || href === "about:blank") return;
        if (/[?&]status=PAID\b/i.test(href) || href.includes("/pending")) {
          finishSuccess();
          return;
        }
        if (
          /[?&](status=CANCELLED|cancelled=true|cancel=true)\b/i.test(href) ||
          /[?&]code=01\b/i.test(href)
        ) {
          finishCancel();
        }
      } catch {
        /* cross-origin PayOS */
      }
    };

    window.addEventListener("message", onMessage);
    iframe.addEventListener("load", onLoad);

    return () => {
      window.removeEventListener("message", onMessage);
      iframe.removeEventListener("load", onLoad);
      container.replaceChildren();
    };
  }, [checkoutUrl, returnUrl, onSuccess, onCancel, onExit]);

  return (
    <div
      ref={containerRef}
      id={PAYOS_EMBED_ELEMENT_ID}
      className={
        className ??
        "w-full h-[520px] max-h-[70vh] overflow-hidden bg-white"
      }
    />
  );
}
