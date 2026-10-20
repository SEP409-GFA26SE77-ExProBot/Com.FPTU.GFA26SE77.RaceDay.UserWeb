"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  Boxes,
  Building2,
  CheckCircle2,
  Circle,
  FolderOpen,
  Hash,
  Loader2,
  Map,
  PackagePlus,
  Route,
  ScrollText,
} from "lucide-react";
import { getEventById } from "@/api/events";
import EventProfileSectionHeader from "@/components/organizer/EventProfileSectionHeader";
import type { RaceEventDto } from "@/dto/event.dto";
import { getApiErrorMessage } from "@/lib/error";
import { PROFILE_DOC_TYPES } from "@/lib/event-profile-docs";
import { getRaceDetails } from "@/lib/race-details";

type HubItem = {
  id: string;
  label: string;
  href: string;
  icon: typeof Building2;
  ok: boolean;
  hint: string;
};

export default function ProfileOverviewClient() {
  const params = useParams();
  const eventId = String(params?.id || "");
  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getEventById(eventId);
        if (!cancelled) {
          setEvent(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled)
          setError(getApiErrorMessage(e, "Không tải được hồ sơ giải."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const items = useMemo((): HubItem[] => {
    if (!event) return [];
    const base = `/organizer/events/${eventId}/profile`;
    const docKeys = new Set(
      (event.documents || [])
        .filter((d) => d.fileUrl || d.fileName)
        .map((d) => d.documentKey)
    );
    const requiredDocsOk = PROFILE_DOC_TYPES.filter((d) => d.required).every(
      (d) => docKeys.has(d.id)
    );
    const details = getRaceDetails(event);
    const hasContent =
      details.schedule.some((s) => s.time && s.activity) ||
      details.rules.length > 0 ||
      details.guidelines.length > 0;
    const hasDistances = (event.distances || []).length > 0;
    const hasBasic = Boolean(
      event.name?.trim() &&
        event.location &&
        !String(event.location).includes("Chưa cập nhật") &&
        event.date
    );
    const hasOrg = Boolean(
      event.organizer?.name?.trim() &&
        event.organizer?.email &&
        !String(event.organizer.email).includes("pending-")
    );
    return [
      {
        id: "basic",
        label: "Thông tin cơ bản",
        href: `${base}/basic`,
        icon: Building2,
        ok: hasBasic && hasOrg,
        hint: hasBasic
          ? hasOrg
            ? "Đã có tên, địa điểm, ngày và liên hệ BTC"
            : "Thiếu liên hệ ban tổ chức"
          : "Cần tên, địa điểm và ngày tổ chức",
      },
      {
        id: "distances",
        label: "Cự ly & giá vé",
        href: `${base}/distances`,
        icon: Route,
        ok: hasDistances,
        hint: hasDistances
          ? `${event.distances!.length} cự ly`
          : "Chưa cấu hình cự ly",
      },
      {
        id: "bib",
        label: "Cấu hình BIB",
        href: `${base}/bib`,
        icon: Hash,
        ok: Boolean(event.bibRangeStart || event.bibPrefix),
        hint: event.bibPrefix
          ? `Prefix ${event.bibPrefix} · từ ${event.bibRangeStart ?? 1001}`
          : event.bibRangeStart
            ? `Dải từ ${event.bibRangeStart}`
            : "Mặc định BE: 1001, 1002… (không prefix)",
      },
      {
        id: "map",
        label: "Thiết lập bản đồ",
        href: `/organizer/events/${eventId}/setup-map`,
        icon: Map,
        ok: true,
        hint: "Cung đường / checkpoint theo cự ly",
      },
      {
        id: "documents",
        label: "Giấy phép & tài liệu",
        href: `${base}/documents`,
        icon: FolderOpen,
        ok: requiredDocsOk,
        hint: requiredDocsOk
          ? "Đủ hồ sơ bắt buộc"
          : "Thiếu công văn hoặc phương án an ninh",
      },
      {
        id: "content",
        label: "Quản lý nội dung",
        href: `${base}/content`,
        icon: ScrollText,
        ok: hasContent,
        hint: hasContent
          ? "Đã có lịch / điều lệ"
          : "Nội dung nhập tay — kiểm tra khớp tài liệu",
      },
      {
        id: "supplies",
        label: "Vật phẩm tiếp tế",
        href: `${base}/supplies`,
        icon: Boxes,
        ok: true,
        hint: "Tùy chọn — cấu hình điểm / vật phẩm tiếp tế",
      },
      {
        id: "addition",
        label: "Bổ sung",
        href: `${base}/addition`,
        icon: PackagePlus,
        ok: true,
        hint: "Vật phẩm / thiết bị bổ sung",
      },
    ];
  }, [event, eventId]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
        <p className="mt-4 text-sm text-muted-foreground">{error}</p>
        <Link
          href="/my-events"
          className="mt-4 inline-block text-sm font-bold text-orange-600"
        >
          Về danh sách
        </Link>
      </div>
    );
  }

  const coreItems = items.filter(
    (i) =>
      i.id !== "supplies" &&
      i.id !== "addition" &&
      i.id !== "bib" &&
      i.id !== "map"
  );
  const done = coreItems.filter((i) => i.ok).length;

  return (
    <div className="space-y-6">
      <EventProfileSectionHeader
        eventId={eventId}
        eventName={event.name}
        status={event.status}
        title="Tổng hợp chi tiết giải"
        showHubLink={false}
        description={
          <span>
            {done}/{coreItems.length} mục chính sẵn sàng · Gửi duyệt tại{" "}
            <Link
              href={`/organizer/events/${eventId}/profile/open-registration`}
              className="font-bold text-orange-600 hover:underline"
            >
              Hồ sơ · gửi duyệt
            </Link>
          </span>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className="group rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition hover:border-orange-500/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Icon className="h-5 w-5" />
                </span>
                {item.ok ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Circle className="h-5 w-5 text-amber-500" />
                )}
              </div>
              <p className="mt-3 text-sm font-bold text-foreground group-hover:text-orange-700">
                {item.label}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
