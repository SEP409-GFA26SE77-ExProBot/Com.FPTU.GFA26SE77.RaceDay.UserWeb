"use client";

import Link from "next/link";
import { CourseProvider, useCourse } from "@/components/organizer/race-map/CourseContext";
import DistanceCourseSwitcher from "@/components/organizer/race-map/DistanceCourseSwitcher";
import OrganizerSetupMap from "@/components/organizer/race-map/OrganizerSetupMap";
import RaceSimulator from "@/components/organizer/race-map/RaceSimulator";
import { ArrowRight, Loader2, Map, Route } from "lucide-react";

type WorkspaceMode = "setup" | "simulation";

function NoDistanceEmpty({
  eventId,
  mode,
}: {
  eventId: string;
  mode: WorkspaceMode;
}) {
  const isSetup = mode === "setup";
  const distancesHref = `/organizer/events/${eventId}/profile/distances`;

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      {/* Soft map-like atmosphere — brand orange, not flat void */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 60% at 50% 40%, rgba(249,115,22,0.12), transparent 70%),
            linear-gradient(135deg, rgba(249,115,22,0.04) 0%, transparent 45%, rgba(220,38,38,0.05) 100%),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 27px,
              rgba(148,163,184,0.08) 27px,
              rgba(148,163,184,0.08) 28px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 27px,
              rgba(148,163,184,0.08) 27px,
              rgba(148,163,184,0.08) 28px
            )
          `,
        }}
      />

      <div className="relative z-[1] flex w-full flex-col items-center justify-center gap-5 px-6 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25">
          <Map className="h-8 w-8" strokeWidth={1.75} />
        </div>

        <div className="max-w-md space-y-2">
          <h2 className="text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
            {isSetup
              ? "Chưa thể vẽ bản đồ"
              : "Chưa thể giả lập đua"}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {isSetup
              ? "Cần ít nhất một cự ly (km + sức chứa) trước khi vẽ lộ trình, checkpoint và điểm tiếp tế."
              : "Cần có cự ly và cung đường đã lưu trước khi chạy giả lập timing."}
          </p>
        </div>

        <ol className="flex w-full max-w-sm flex-col gap-2 text-left text-xs sm:text-sm">
          <li className="flex items-start gap-3 rounded-xl border border-orange-200/80 bg-orange-50/80 px-3.5 py-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">
              1
            </span>
            <span className="pt-0.5 text-foreground/90">
              Thêm cự ly tại <strong>Cự ly &amp; giá vé</strong>
            </span>
          </li>
          <li className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/80 px-3.5 py-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
              2
            </span>
            <span className="pt-0.5 text-muted-foreground">
              Quay lại đây chọn cự ly và{" "}
              {isSetup ? "vẽ Start → Finish" : "chạy giả lập"}
            </span>
          </li>
        </ol>

        <Link
          href={distancesHref}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:brightness-105"
        >
          <Route className="h-4 w-4" />
          Đi tới Cự ly &amp; giá vé
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function WorkspaceInner({ mode }: { mode: WorkspaceMode }) {
  const isSetup = mode === "setup";
  const { eventId, distances, distancesLoading, selectedDistanceId } =
    useCourse();

  const noDistances = !distancesLoading && distances.length === 0;

  return (
    <div className="flex h-[calc(100vh-7.5rem)] min-h-[480px] flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-base font-extrabold tracking-tight text-foreground sm:text-lg">
          <span className="text-orange-600">
            {isSetup ? "THIẾT LẬP BẢN ĐỒ" : "GIẢ LẬP ĐUA"}
          </span>
          <span className="text-muted-foreground"> — </span>
          {isSetup
            ? "Lộ trình, checkpoint & điểm tiếp tế"
            : "Timing & xếp hạng"}
        </h1>
      </div>

      {!noDistances ? (
        <div className="shrink-0">
          <DistanceCourseSwitcher />
        </div>
      ) : null}

      {distancesLoading ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-sm text-muted-foreground">Đang tải cự ly…</p>
        </div>
      ) : noDistances ? (
        <NoDistanceEmpty eventId={eventId} mode={mode} />
      ) : !selectedDistanceId ? (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-border/60 bg-card text-sm text-muted-foreground shadow-sm">
          Chọn một cự ly ở trên để tiếp tục.
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-hidden">
          {isSetup ? <OrganizerSetupMap /> : <RaceSimulator />}
        </div>
      )}
    </div>
  );
}

export default function RaceMapWorkspace({
  eventId,
  mode,
}: {
  eventId: string;
  mode: WorkspaceMode;
}) {
  if (!eventId) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
        Đang mở không gian làm việc…
      </div>
    );
  }

  return (
    <CourseProvider eventId={eventId}>
      <WorkspaceInner mode={mode} />
    </CourseProvider>
  );
}
