"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Loader2,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  User,
  Users,
  X,
} from "lucide-react";
import {
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

function StationPicker({
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
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const mapStations = stations.filter((s) => s.source === "map");
  const dutyStations = stations.filter((s) => s.source !== "map");
  const mapGroup =
    role === "volunteer"
      ? "Điểm tiếp tế (map)"
      : role === "photographer"
        ? "Checkpoint / zone chụp (map)"
        : "Checkpoint (map)";

  const selected = stations.find((s) => s.id === value);
  const needle = q.trim().toLowerCase();
  const filterList = (list: StaffStationDto[]) =>
    needle
      ? list.filter(
          (s) =>
            s.label.toLowerCase().includes(needle) ||
            (s.distanceName || "").toLowerCase().includes(needle)
        )
      : list;
  const filteredMap = filterList(mapStations);
  const filteredDuty = filterList(dutyStations);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    setQ("");
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 text-left hover:border-orange-300 disabled:opacity-50 ${
          compact ? "py-1.5 text-xs" : "py-2 text-sm"
        }`}
      >
        <span className={`truncate ${selected ? "text-foreground" : "text-muted-foreground"}`}>
          {selected?.label || "— Chưa gán —"}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="absolute left-0 right-0 z-40 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm checkpoint / nhiệm vụ…"
              className="w-full bg-transparent text-xs outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => pick("")}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-muted"
            >
              <span className="text-muted-foreground">— Chưa gán —</span>
              {!value ? <Check className="h-3.5 w-3.5 text-orange-500" /> : null}
            </button>
            {filteredMap.length > 0 ? (
              <>
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {mapGroup}
                </p>
                {filteredMap.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => pick(s.id)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-orange-500/10"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{s.label}</span>
                      {s.distanceName ? (
                        <span className="text-[10px] text-muted-foreground">
                          {s.distanceName}
                        </span>
                      ) : null}
                    </span>
                    {value === s.id ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                    ) : null}
                  </button>
                ))}
              </>
            ) : null}
            {filteredDuty.length > 0 ? (
              <>
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Nhiệm vụ (không gán map)
                </p>
                {filteredDuty.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => pick(s.id)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-orange-500/10"
                  >
                    <span className="truncate font-medium">{s.label}</span>
                    {value === s.id ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                    ) : null}
                  </button>
                ))}
              </>
            ) : null}
            {filteredMap.length === 0 && filteredDuty.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                Không có kết quả.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function statusLabel(s: string) {
  switch (s) {
    case "invited":
      return "Chờ kích hoạt";
    case "active":
      return "Đã hoạt động";
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

  const [inviteOpen, setInviteOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [stationId, setStationId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
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
    setStationId("");
    setFormError(null);
  };

  const closeInvite = () => {
    if (busy) return;
    setInviteOpen(false);
    resetForm();
  };

  const stationLabelOf = (id: string) =>
    stations.find((s) => s.id === id)?.label ?? undefined;

  const onInvite = async () => {
    const name = fullName.trim();
    const mail = email.trim();
    if (!name) {
      setFormError("Vui lòng nhập họ tên.");
      return;
    }
    if (!mail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      setFormError("Email không hợp lệ.");
      return;
    }
    setBusy(true);
    setFormError(null);
    setError(null);
    try {
      await inviteEventStaff(eventId, {
        role,
        email: mail,
        fullName: name,
        phone: phone.trim() || undefined,
        stationId: stationId || undefined,
        stationLabel: stationId ? stationLabelOf(stationId) : undefined,
      });
      setInviteOpen(false);
      resetForm();
      await load();
    } catch (e) {
      setFormError(getApiErrorMessage(e, "Mời thất bại."));
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
            Mời tài khoản theo role — mật khẩu mặc định chỉ gửi qua email. Sau
            khi họ đăng nhập lần đầu sẽ chuyển sang Đã hoạt động.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Làm mới
          </button>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setInviteOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> Mời / thêm
          </button>
        </div>
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
          — vẫn có thể gán nhiệm vụ không gắn map khi mời.
        </p>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

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
            Chưa có {roleMeta.label.toLowerCase()} cho giải này. Bấm{" "}
            <span className="font-semibold text-foreground">Mời / thêm</span> để
            cấp tài khoản.
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
                  <div className="min-w-[14rem] flex-1 sm:max-w-xs">
                    <StationPicker
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

      {inviteOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-staff-title"
          onClick={closeInvite}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
                  {roleMeta.label}
                </p>
                <h2
                  id="invite-staff-title"
                  className="mt-1 text-lg font-extrabold tracking-tight"
                >
                  Mời / thêm nhân sự
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Tài khoản đăng nhập và mật khẩu mặc định sẽ được gửi qua email
                  bên dưới.
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={closeInvite}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {formError}
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  <User className="mr-1 inline h-3.5 w-3.5 text-orange-500" />
                  Họ tên *
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={busy}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition-all focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  <Mail className="mr-1 inline h-3.5 w-3.5 text-orange-500" />
                  Email *
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  disabled={busy}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition-all focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
                  placeholder="email@example.com"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Email nhận thông tin đăng nhập. Tài khoản tạo riêng, không
                  trùng email VĐV.
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  <Phone className="mr-1 inline h-3.5 w-3.5 text-orange-500" />
                  Số điện thoại
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={busy}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition-all focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
                  placeholder="09xxxxxxxx"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  {role === "volunteer"
                    ? "Điểm tiếp tế / nhiệm vụ"
                    : "Checkpoint / nhiệm vụ"}
                </label>
                <StationPicker
                  role={role}
                  value={stationId}
                  stations={stations}
                  disabled={busy}
                  onChange={setStationId}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={closeInvite}
                className="rounded-full border border-border px-4 py-2 text-xs font-bold hover:bg-muted disabled:opacity-40"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onInvite()}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Gửi lời mời
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
