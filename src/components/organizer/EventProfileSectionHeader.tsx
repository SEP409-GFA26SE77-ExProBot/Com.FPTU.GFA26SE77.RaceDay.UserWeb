"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  eventId: string;
  /** @deprecated Tên giải đã có trên OrganizerShell — không render nữa */
  eventName?: string;
  /** @deprecated Status giữ ở Hồ sơ · gửi duyệt — không render nữa */
  status?: string;
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  actions?: ReactNode;
  showHubLink?: boolean;
};

/**
 * Header dùng chung các trang Chi tiết giải.
 * Không hiện tên giải / badge trạng thái (đã có ở shell + Hồ sơ gửi duyệt).
 */
export default function EventProfileSectionHeader({
  eventId,
  title,
  eyebrow = "Chi tiết giải",
  description,
  actions,
  showHubLink = true,
}: Props) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{title}</h1>
        {description ? (
          <div className="mt-2 text-xs text-muted-foreground">{description}</div>
        ) : null}
        {showHubLink ? (
          <p className="mt-2 text-xs text-muted-foreground">
            <Link
              href={`/organizer/events/${eventId}/profile/overview`}
              className="font-bold text-orange-600 hover:underline"
            >
              ← Tổng hợp chi tiết giải
            </Link>
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
