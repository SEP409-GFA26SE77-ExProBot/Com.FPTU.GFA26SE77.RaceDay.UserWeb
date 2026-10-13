"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  Gift,
  Loader2,
  Plus,
  Save,
  ScrollText,
  Trash2,
} from "lucide-react";
import { getEventById } from "@/api/events";
import { updateEventProfile } from "@/api/event-packages";
import type { RaceEventDto } from "@/dto/event.dto";
import {
  getRaceDetails,
  type RacePrize,
  type RaceScheduleItem,
} from "@/lib/race-details";
import { getApiErrorMessage } from "@/lib/error";
import { getOrganizerStatusLabel, getStatusColor } from "@/lib/format";
import { canEditProfile } from "../_shared";

function asLines(list: string[]) {
  return list.join("\n");
}

function linesToList(text: string) {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ProfileContentClient() {
  const params = useParams();
  const eventId = String(params?.id || "");
  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [schedule, setSchedule] = useState<RaceScheduleItem[]>([]);
  const [rulesText, setRulesText] = useState("");
  const [guidelinesText, setGuidelinesText] = useState("");
  const [penaltiesText, setPenaltiesText] = useState("");
  const [prizes, setPrizes] = useState<RacePrize[]>([]);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getEventById(eventId);
        if (cancelled) return;
        setEvent(data);
        // Chỉ hydrate từ API đã lưu — không seed fallback giả từ getRaceDetails.
        const details = getRaceDetails(data);
        setSchedule(
          details.schedule.length ? details.schedule : [{ time: "", activity: "" }]
        );
        setRulesText(asLines(details.rules));
        setGuidelinesText(asLines(details.guidelines));
        setPenaltiesText(asLines(details.penalties));
        setPrizes(
          details.prizes.length ? details.prizes : [{ category: "", reward: "" }]
        );
      } catch (e) {
        if (!cancelled)
          setError(getApiErrorMessage(e, "Không tải được nội dung."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const previewEvent = useMemo(() => {
    if (!event) return null;
    return {
      ...event,
      rules: {
        schedule,
        items: linesToList(rulesText),
        guidelines: linesToList(guidelinesText),
        penalties: linesToList(penaltiesText),
      },
      rewards: {
        prizes: prizes.filter((p) => p.category.trim() && p.reward.trim()),
      },
    } as RaceEventDto;
  }, [event, schedule, rulesText, guidelinesText, penaltiesText, prizes]);

  const preview = previewEvent ? getRaceDetails(previewEvent) : null;

  const handleSave = async () => {
    if (!event || saving) return;
    setSaving(true);
    setError(null);
    try {
      await updateEventProfile(eventId, {
        rules: {
          schedule: schedule.filter((s) => s.time.trim() && s.activity.trim()),
          items: linesToList(rulesText),
          guidelines: linesToList(guidelinesText),
          penalties: linesToList(penaltiesText),
        },
        rewards: {
          prizes: prizes.filter((p) => p.category.trim() && p.reward.trim()),
        },
      });
      const refreshed = await getEventById(eventId);
      setEvent(refreshed);
      notify("Đã lưu nội dung giải.");
    } catch (e) {
      setError(getApiErrorMessage(e, "Lưu thất bại."));
    } finally {
      setSaving(false);
    }
  };

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

  const editable = canEditProfile(event.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
            Chi tiết giải
          </p>
          <h1 className="mt-1 text-2xl font-extrabold">Quản lý nội dung</h1>
          <span
            className={`mt-2 inline-flex rounded-md border px-2.5 py-1 text-[11px] font-extrabold ${getStatusColor(event.status)}`}
          >
            {getOrganizerStatusLabel(event.status)}
          </span>
        </div>
        {editable && (
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Lưu nội dung
          </button>
        )}
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {toast}
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
        <div className="min-w-0 space-y-5">
          <section className={cardClass}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold">Lịch trình (schedule)</h2>
              {editable && (
                <button
                  type="button"
                  onClick={() =>
                    setSchedule((p) => [...p, { time: "", activity: "" }])
                  }
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-orange-600"
                >
                  <Plus className="h-3.5 w-3.5" /> Thêm
                </button>
              )}
            </div>
            <div className="space-y-2">
              {schedule.map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_auto]"
                >
                  <input
                    placeholder="Thời gian"
                    value={row.time}
                    disabled={!editable}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSchedule((prev) =>
                        prev.map((x, idx) => (idx === i ? { ...x, time: v } : x))
                      );
                    }}
                    className={inputClass}
                  />
                  <input
                    placeholder="Hoạt động"
                    value={row.activity}
                    disabled={!editable}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSchedule((prev) =>
                        prev.map((x, idx) =>
                          idx === i ? { ...x, activity: v } : x
                        )
                      );
                    }}
                    className={inputClass}
                  />
                  {editable ? (
                    <button
                      type="button"
                      onClick={() =>
                        setSchedule((prev) =>
                          prev.filter((_, idx) => idx !== i)
                        )
                      }
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center justify-self-end rounded-lg border border-border text-red-600 hover:bg-red-50 sm:justify-self-auto"
                      aria-label="Xóa dòng"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <span className="hidden sm:block" />
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className={cardClass}>
            <h2 className="mb-2 text-sm font-bold">
              Luật thi đấu (mỗi dòng 1 mục)
            </h2>
            <textarea
              rows={8}
              value={rulesText}
              disabled={!editable}
              onChange={(e) => setRulesText(e.target.value)}
              className={textareaClass}
            />
          </section>

          <section className={cardClass}>
            <h2 className="mb-2 text-sm font-bold">Hướng dẫn VĐV</h2>
            <textarea
              rows={6}
              value={guidelinesText}
              disabled={!editable}
              onChange={(e) => setGuidelinesText(e.target.value)}
              className={textareaClass}
            />
          </section>

          <section className={cardClass}>
            <h2 className="mb-2 text-sm font-bold">Hình phạt</h2>
            <textarea
              rows={5}
              value={penaltiesText}
              disabled={!editable}
              onChange={(e) => setPenaltiesText(e.target.value)}
              className={textareaClass}
            />
          </section>

          <section className={cardClass}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold">Giải thưởng</h2>
              {editable && (
                <button
                  type="button"
                  onClick={() =>
                    setPrizes((p) => [...p, { category: "", reward: "" }])
                  }
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-orange-600"
                >
                  <Plus className="h-3.5 w-3.5" /> Thêm
                </button>
              )}
            </div>
            <div className="space-y-2">
              {prizes.map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto]"
                >
                  <input
                    placeholder="Hạng mục"
                    value={row.category}
                    disabled={!editable}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPrizes((prev) =>
                        prev.map((x, idx) =>
                          idx === i ? { ...x, category: v } : x
                        )
                      );
                    }}
                    className={inputClass}
                  />
                  <input
                    placeholder="Phần thưởng"
                    value={row.reward}
                    disabled={!editable}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPrizes((prev) =>
                        prev.map((x, idx) =>
                          idx === i ? { ...x, reward: v } : x
                        )
                      );
                    }}
                    className={inputClass}
                  />
                  {editable ? (
                    <button
                      type="button"
                      onClick={() =>
                        setPrizes((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center justify-self-end rounded-lg border border-border text-red-600 hover:bg-red-50 sm:justify-self-auto"
                      aria-label="Xóa giải thưởng"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <span className="hidden sm:block" />
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="min-w-0 overflow-hidden rounded-2xl border border-border bg-[#f7f5f1] p-4 shadow-sm xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600">
            Preview — trang detail
          </p>
          <h2 className="mt-1 text-base font-extrabold sm:text-lg">
            Giống khối nội dung trang public
          </h2>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Layout bám `/events/[id]` (lịch · thể lệ · hướng dẫn · giải thưởng · hình phạt).
          </p>
          {preview && (
            <div className="mt-5 space-y-6">
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <h3 className="text-sm font-bold">Lịch trình race day</h3>
                </div>
                {preview.schedule.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Chưa có lịch trình.</p>
                ) : (
                  <ol className="overflow-hidden rounded-xl border border-border divide-y divide-border bg-card">
                    {preview.schedule.map((row) => (
                      <li
                        key={`${row.time}-${row.activity}`}
                        className="flex flex-col gap-0.5 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3"
                      >
                        <span className="shrink-0 text-[11px] font-bold text-orange-600 sm:w-36">
                          {row.time}
                        </span>
                        <span className="min-w-0 break-words text-xs text-foreground sm:text-sm">
                          {row.activity}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              <section>
                <div className="mb-2 flex items-center gap-2">
                  <ScrollText className="h-4 w-4 text-orange-500" />
                  <h3 className="text-sm font-bold">Thể lệ &amp; quy định</h3>
                </div>
                {preview.rules.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Chưa có thể lệ.</p>
                ) : (
                  <ul className="space-y-2 rounded-xl border border-border bg-card p-3 sm:p-4">
                    {preview.rules.map((rule) => (
                      <li
                        key={rule}
                        className="flex gap-2 text-xs leading-relaxed text-muted-foreground sm:text-sm"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                        <span className="min-w-0 break-words">{rule}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <div className="mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-orange-500" />
                  <h3 className="text-sm font-bold">Hướng dẫn VĐV</h3>
                </div>
                {preview.guidelines.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Chưa có hướng dẫn.</p>
                ) : (
                  <ul className="space-y-2 rounded-xl border border-border bg-card p-3 sm:p-4">
                    {preview.guidelines.map((g) => (
                      <li
                        key={g}
                        className="flex gap-2 text-xs leading-relaxed text-muted-foreground sm:text-sm"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                        <span className="min-w-0 break-words">{g}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <div className="mb-2 flex items-center gap-2">
                  <Gift className="h-4 w-4 text-orange-500" />
                  <h3 className="text-sm font-bold">Giải thưởng chi tiết</h3>
                </div>
                {preview.prizes.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Chưa có giải thưởng.</p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <table className="w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-3 py-2 text-left font-semibold">
                            Hạng mục
                          </th>
                          <th className="px-3 py-2 text-left font-semibold">
                            Phần thưởng
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {preview.prizes.map((p) => (
                          <tr key={p.category}>
                            <td className="px-3 py-2 align-top font-medium text-foreground">
                              {p.category}
                            </td>
                            <td className="px-3 py-2 break-words text-muted-foreground">
                              {p.reward}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section>
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <h3 className="text-sm font-bold">Hình phạt / DSQ</h3>
                </div>
                <ul className="space-y-2 rounded-xl border border-red-500/20 bg-red-500/[0.04] p-3 sm:p-4">
                  {preview.penalties.length === 0 ? (
                    <li className="text-xs text-muted-foreground">
                      Chưa có hình phạt — điền ở form bên trái.
                    </li>
                  ) : (
                    preview.penalties.map((p) => (
                      <li
                        key={p}
                        className="flex gap-2 text-xs leading-relaxed text-foreground/80 sm:text-sm"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                        <span className="min-w-0 break-words">{p}</span>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

const cardClass =
  "min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5";

const inputClass =
  "box-border min-w-0 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm disabled:opacity-60 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20";

const textareaClass =
  `${inputClass} max-h-64 resize-y overflow-auto leading-relaxed`;
