"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Users,
  X,
} from "lucide-react";
import {
  addEventStaff,
  assignEventStaffStation,
  inviteEventStaff,
  listEventStaff,
  listStaffStations,
  revokeEventStaff,
} from "@/api/event-staff";
import type {
  EventStaffMemberDto,
  EventStaffRole,
  StaffStationDto,
} from "@/dto/event-staff.dto";
import { getApiErrorMessage } from "@/lib/error";
import { PAGE_SHELL } from "@/lib/page-shell";

const ROLE_TABS: { id: EventStaffRole; label: string; hint: string }[] = [
  {
    id: "coordinator",
    label: "Coordinator",
    hint: "Gán checkpoint từ bản đồ (start / CP / finish) hoặc nhiệm vụ không gắn map (điều hành, y tế).",
  },
  {
    id: "photographer",
    label: "Photographer",
    hint: "Gán điểm checkpoint trên cung đường để bố trí chụp — hoặc để di động / chưa gán map.",
  },
  {
    id: "volunteer",
    label: "Volunteer",
    hint: "Gán điểm tiếp tế (aid) đã setup trên map, hoặc quầy check-in / kit không gắn map.",
  },
];

function StationSelect({
  role,
  value,
  stations,
  disabled,
  onChange,
  compact,
}: {
  role: EventStaffRole;
  value: string;
  stations: StaffStationDto[];
  disabled?: boolean;
  onChange: (id: string) => void;
  compact?: boolean;
}) {
  const mapStations = stations.filter((s) => s.source === "map");
  const dutyStations = stations.filter((s) => s.source !== "map");
  const mapGroup =
    role === "volunteer"
      ? "Điểm tiếp tế (map)"
      : role === "photographer"
        ? "Checkpoint / zone chụp (map)"
        : "Checkpoint (map)";
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-xl border border-border bg-background px-3 ${
        compact ? "py-1.5 text-xs" : "py-2 text-sm"
      }`}
    >
      <option value="">— Chưa gán —</option>
      {mapStations.length > 0 ? (
        <optgroup label={mapGroup}>
          {mapStations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </optgroup>
      ) : null}
      {dutyStations.length > 0 ? (
        <optgroup label="Nhiệm vụ (không gán map)">
          {dutyStations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </optgroup>
      ) : null}
    </select>
  );
}

function statusLabel(s: string) {
  switch (s) {
    case "invited":
      return "Đã mời";
    case "active":
      return "Đang hoạt động";
    case "revoked":
      return "Đã gỡ";
    default:
      return s;
  }
}

function statusClass(s: string) {
  switch (s) {
    case "invited":
      return "bg-amber-500/15 text-amber-800 border-amber-500/30";
    case "active":
      return "bg-emerald-500/15 text-emerald-800 border-emerald-500/30";
    case "revoked":
      return "bg-slate-500/15 text-slate-600 border-slate-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export default function OrganizerEventStaff({ eventId }: { eventId: string }) {
  const [role, setRole] = useState<EventStaffRole>("coordinator");
  const [members, setMembers] = useState<EventStaffMemberDto[]>([]);
  const [stations, setStations] = useState<StaffStationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [stationId, setStationId] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<EventStaffMemberDto | null>(
    null
  );

  const roleMeta = useMemo(
    () => ROLE_TABS.find((t) => t.id === role)!,
    [role]
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, st] = await Promise.all([
        listEventStaff(eventId, role),
        listStaffStations(eventId, role),
      ]);
      setMembers(list.filter((m) => m.status !== "revoked"));
      setStations(st);
      setStationId((prev) =>
        prev && st.some((s) => s.id === prev) ? prev : ""
      );
    } catch (e) {
      setError(getApiErrorMessage(e, "Không tải được nhân sự."));
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [eventId, role]);

  useEffect(() => {
    setLoading(true);
    let cancelled = false;
    (async () => {
      await load();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPhone("");
  };

  const stationLabelOf = (id: string) =>
    stations.find((s) => s.id === id)?.label ?? undefined;

  const onInvite = async () => {
    setBusy(true);
    setError(null);
    try {
      await inviteEventStaff(eventId, {
        role,
        email,
        fullName,
        phone: phone || undefined,
        stationId: stationId || undefined,
        stationLabel: stationId ? stationLabelOf(stationId) : undefined,
      });
      setToast("Đã gửi lời mời nhân sự.");
      resetForm();
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e, "Mời thất bại."));
    } finally {
      setBusy(false);
    }
  };

  const onAdd = async () => {
    setBusy(true);
    setError(null);
    try {
      await addEventStaff(eventId, {
        role,
        fullName,
        email: email || undefined,
        phone: phone || undefined,
        stationId: stationId || undefined,
        stationLabel: stationId ? stationLabelOf(stationId) : undefined,
      });
      setToast("Đã thêm nhân sự (active ngay).");
      resetForm();
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e, "Thêm thất bại."));
    } finally {
      setBusy(false);
    }
  };

  const onAssign = async (memberId: string, nextStation: string) => {
    setBusy(true);
    try {
      await assignEventStaffStation(eventId, {
        memberId,
        stationId: nextStation || null,
        stationLabel: nextStation ? stationLabelOf(nextStation) ?? null : null,
      });
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e, "Gán vị trí thất bại."));
    } finally {
      setBusy(false);
    }
  };

  const confirmRevoke = async () => {
    if (!revokeTarget) return;
    const memberId = revokeTarget.id;
    setBusy(true);
    setError(null);
    try {
      await revokeEventStaff(eventId, memberId);
      setRevokeTarget(null);
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e, "Gỡ thất bại."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${PAGE_SHELL} space-y-5 py-1`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
            Nhân sự giải
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            <Users className="h-6 w-6 text-orange-500" />
            Quản lý nhân sự
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bố trí nhiệm vụ theo điểm đã setup ở Thiết lập bản đồ (checkpoint /
            tiếp tế) hoặc nhiệm vụ không gắn map. Dữ liệu lưu trên BE theo giải.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Làm mới
        </button>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border/60 pb-px">
        {ROLE_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setRole(t.id)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              role === t.id
                ? "bg-orange-500/15 text-orange-600"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{roleMeta.hint}</p>
      {stations.filter((s) => s.source === "map").length === 0 ? (
        <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Chưa có điểm map phù hợp role này. Vào{" "}
          <span className="font-semibold">Thiết lập bản đồ</span> thêm{" "}
          {role === "volunteer"
            ? "điểm tiếp tế (aid)"
            : "checkpoint (start / CP / finish)"}
          — vẫn có thể gán nhiệm vụ không gắn map bên dưới.
        </p>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}
      {toast ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {toast}
        </div>
      ) : null}

      <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="text-sm font-bold">
          {role === "volunteer" ? "Thêm / mời volunteer" : "Mời / thêm"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block space-y-1 text-xs">
            <span className="font-semibold text-muted-foreground">Họ tên</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1 text-xs">
            <span className="font-semibold text-muted-foreground">
              Email {role !== "volunteer" ? "*" : "(tuỳ chọn nếu thêm nhanh)"}
            </span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1 text-xs">
            <span className="font-semibold text-muted-foreground">SĐT</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1 text-xs sm:col-span-2 lg:col-span-1">
            <span className="font-semibold text-muted-foreground">
              {role === "volunteer"
                ? "Điểm tiếp tế / nhiệm vụ"
                : "Checkpoint / nhiệm vụ"}
            </span>
            <StationSelect
              role={role}
              value={stationId}
              stations={stations}
              onChange={setStationId}
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || !email.trim()}
            onClick={() => void onInvite()}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" /> Mời qua email
          </button>
          <button
            type="button"
            disabled={busy || !fullName.trim()}
            onClick={() => void onAdd()}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-bold hover:border-orange-300 disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" /> Thêm trực tiếp
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold">
          Danh sách {roleMeta.label} ({members.length})
        </h2>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
            Đang tải…
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Chưa có {roleMeta.label.toLowerCase()} cho giải này.
          </div>
        ) : (
          <ul className="space-y-2">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold">{m.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.email}
                    {m.phone ? ` · ${m.phone}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClass(m.status)}`}
                  >
                    {statusLabel(m.status)}
                  </span>
                  <div className="min-w-[12rem] flex-1 sm:max-w-xs">
                    <StationSelect
                      role={role}
                      value={m.stationId || ""}
                      stations={stations}
                      disabled={busy}
                      compact
                      onChange={(id) => void onAssign(m.id, id)}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setRevokeTarget(m)}
                    className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-40"
                  >
                    Gỡ
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {revokeTarget ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="revoke-staff-title"
          onClick={() => !busy && setRevokeTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
                  Xác nhận
                </p>
                <h2
                  id="revoke-staff-title"
                  className="mt-1 text-lg font-extrabold tracking-tight"
                >
                  Gỡ nhân sự khỏi giải?
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {revokeTarget.fullName}
                  </span>
                  {revokeTarget.email ? ` · ${revokeTarget.email}` : ""} sẽ bị
                  gỡ khỏi danh sách {roleMeta.label.toLowerCase()} của giải này.
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => setRevokeTarget(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setRevokeTarget(null)}
                className="rounded-full border border-border px-4 py-2 text-xs font-bold hover:bg-muted disabled:opacity-40"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmRevoke()}
                className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-40"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                Gỡ khỏi giải
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
