"use client";
import { useOrganizerErrorState } from "@/lib/use-organizer-error-state";
import { useOrganizerToastState } from "@/lib/use-organizer-toast-state";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  KeyRound,
  Loader2,
  Lock,
  LockOpen,
  Mail,
  MapPin,
  Pencil,
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
  listStaffMapData,
  resetEventStaffPassword,
  setEventStaffLock,
  updateEventStaff,
} from "@/api/event-staff";
import type {
  EventStaffMemberDto,
  EventStaffRole,
  StaffRouteDto,
  StaffStationDto,
} from "@/dto/event-staff.dto";
import {
  PHOTOGRAPHER_MAX_STATIONS,
  STAFF_DEFAULT_PASSWORD,
  memberStationIds,
  softWarnFarStations,
  toStationItems,
} from "@/dto/event-staff.dto";
import { getApiErrorMessage } from "@/lib/error";
import { PAGE_SHELL } from "@/lib/page-shell";
import { toastError, toastSuccess } from "@/lib/toast";

const StaffAssignmentMap = dynamic(
  () => import("@/components/organizer/StaffAssignmentMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-border/60 bg-muted/30 text-sm text-muted-foreground">
        Đang tải bản đồ…
      </div>
    ),
  }
);

const ROLE_TABS: {
  id: EventStaffRole;
  label: string;
}[] = [
  { id: "race-staff", label: "Race Staff" },
  { id: "photographer", label: "Photographer" },
];

const INVITE_ROLE_LABELS: Record<EventStaffRole, string> = {
  "race-staff": "Nhân viên giải",
  photographer: "Nhiếp ảnh gia",
};

const STAFF_FORM_PRESETS: Record<
  EventStaffRole,
  { fullName: string; email: string; phone: string; label: string }[]
> = {
  "race-staff": [
    {
      label: "Nhân viên giải",
      fullName: "Nguyễn Văn Giải",
      email: "race-staff@example.com",
      phone: "0901000001",
    },
    {
      label: "Y tế giải",
      fullName: "Trần Thị Y Tế",
      email: "medic@example.com",
      phone: "0901000002",
    },
    {
      label: "Hỗ trợ phát kit",
      fullName: "Phạm Quốc Tình Nguyện",
      email: "volunteer.kit@example.com",
      phone: "0901000004",
    },
    {
      label: "Check-in desk",
      fullName: "Hoàng Thị Check-in",
      email: "checkin@example.com",
      phone: "0901000005",
    },
  ],
  photographer: [
    {
      label: "Photographer KM5",
      fullName: "Lê Minh Ảnh",
      email: "photo.km5@example.com",
      phone: "0901000003",
    },
  ],
};

function StationPicker({
  role,
  value,
  stations,
  disabled,
  onChange,
  compact,
  multi,
  max,
  /** inline = panel trong form (modal); popover = dropdown trên card list */
  variant = "popover",
}: {
  role: EventStaffRole;
  /** Single: 1 id; multi (photographer): nhiều id. */
  value: string | string[];
  stations: StaffStationDto[];
  disabled?: boolean;
  onChange: (next: string | string[]) => void;
  compact?: boolean;
  multi?: boolean;
  max?: number;
  variant?: "popover" | "inline";
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    openUp: boolean;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedIds = Array.isArray(value)
    ? value
    : value
      ? [value]
      : [];
  const limit = max ?? (multi ? PHOTOGRAPHER_MAX_STATIONS : 1);
  const inline = variant === "inline";

  const updateMenuPos = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 6;
    const preferred = multi ? 280 : 240;
    const spaceBelow = window.innerHeight - r.bottom - gap - 12;
    const spaceAbove = r.top - gap - 12;
    const openUp = spaceBelow < 200 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(
      160,
      Math.min(preferred, openUp ? spaceAbove : spaceBelow)
    );
    const width = Math.min(Math.max(r.width, 240), window.innerWidth - 16);
    const left = Math.min(r.left, Math.max(8, window.innerWidth - width - 8));
    setMenuPos({
      top: openUp ? r.top - gap : r.bottom + gap,
      left,
      width,
      maxHeight,
      openUp,
    });
  }, [multi]);

  useLayoutEffect(() => {
    if (inline || !open) {
      setMenuPos(null);
      return;
    }
    updateMenuPos();
    const onWin = () => updateMenuPos();
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    return () => {
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
  }, [open, updateMenuPos, inline]);

  useEffect(() => {
    if (inline || !open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, inline]);

  const mapStations = stations.filter((s) => s.source === "map");
  const dutyStations = stations.filter((s) => s.source !== "map");
  const mapGroup =
    role === "photographer"
      ? "Checkpoint / zone chụp"
      : "Checkpoint / điểm tiếp tế";

  const summary =
    selectedIds.length === 0
      ? "— Chưa gán —"
      : selectedIds.length === 1
        ? stations.find((s) => s.id === selectedIds[0])?.label ||
          selectedIds[0]
        : `${selectedIds.length} điểm đã chọn`;

  const farWarn = multi
    ? softWarnFarStations(selectedIds, stations)
    : null;

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

  const toggle = (id: string) => {
    if (!multi) {
      onChange(id);
      if (!inline) {
        setOpen(false);
        setQ("");
      }
      return;
    }
    if (!id) {
      onChange([]);
      return;
    }
    const has = selectedIds.includes(id);
    if (has) {
      onChange(selectedIds.filter((x) => x !== id));
      return;
    }
    if (selectedIds.length >= limit) {
      toastError(`Tối đa ${limit} điểm cho photographer.`);
      return;
    }
    onChange([...selectedIds, id]);
  };

  const row = (s: StaffStationDto) => {
    const checked = selectedIds.includes(s.id);
    const pointLabel = s.label.includes("—")
      ? s.label.split("—").slice(1).join("—").trim()
      : s.label;
    return (
      <button
        key={s.id}
        type="button"
        disabled={disabled}
        onClick={() => toggle(s.id)}
        className={`flex w-full items-start justify-between gap-2 px-3 py-2.5 text-left disabled:opacity-50 ${
          checked
            ? "bg-orange-500/10 text-orange-950"
            : "hover:bg-muted"
        } ${inline ? "text-sm" : "text-xs"}`}
      >
        <span className="min-w-0 space-y-0.5">
          {s.distanceName ? (
            <span
              className={`block truncate font-bold tracking-tight text-orange-700 ${
                inline ? "text-sm" : "text-xs"
              }`}
            >
              {s.distanceName}
            </span>
          ) : null}
          <span
            className={`block truncate ${
              s.distanceName
                ? "text-muted-foreground"
                : checked
                  ? "font-semibold"
                  : ""
            } ${inline ? "text-xs" : "text-[11px]"}`}
          >
            {s.distanceName ? pointLabel || s.label : s.label}
          </span>
        </span>
        {checked ? (
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
        ) : (
          <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-border" />
        )}
      </button>
    );
  };

  const warnBanner = farWarn ? (
    <div
      className={`flex items-start gap-2 rounded-xl border border-amber-400/60 bg-amber-50 px-3 py-2.5 text-amber-950 ${
        inline ? "text-sm" : "text-xs"
      }`}
      role="status"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <div className="min-w-0">
        <p className="font-bold">Cảnh báo phân bổ</p>
        <p className={`${inline ? "text-xs" : "text-[11px]"} leading-snug`}>
          {farWarn}
        </p>
      </div>
    </div>
  ) : null;

  const listBody = (
    <>
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          disabled={disabled}
          placeholder="Tìm vị trí / nhiệm vụ…"
          className="w-full bg-transparent text-xs outline-none disabled:opacity-50"
        />
      </div>
      {multi ? (
        <p className="shrink-0 border-b border-border px-3 py-1.5 text-[10px] text-muted-foreground">
          Đã chọn {selectedIds.length}/{limit}
          {selectedIds.length > 0 ? ` · ${summary}` : ""}
        </p>
      ) : null}
      <div
        className={`min-h-0 overflow-y-auto py-1 ${
          inline ? "max-h-44" : "flex-1"
        }`}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={() => toggle("")}
          className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-muted disabled:opacity-50"
        >
          <span className="text-muted-foreground">— Chưa gán —</span>
          {selectedIds.length === 0 ? (
            <Check className="h-3.5 w-3.5 text-orange-500" />
          ) : null}
        </button>
        {filteredMap.length > 0 ? (
          <>
            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {mapGroup}
            </p>
            {filteredMap.map(row)}
          </>
        ) : null}
        {filteredDuty.length > 0 ? (
          <>
            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Nhiệm vụ
            </p>
            {filteredDuty.map(row)}
          </>
        ) : null}
        {filteredMap.length === 0 && filteredDuty.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">
            Không có kết quả.
          </p>
        ) : null}
      </div>
    </>
  );

  if (inline) {
    return (
      <div className="space-y-2">
        {warnBanner}
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          {listBody}
        </div>
      </div>
    );
  }

  const menu =
    open && menuPos
      ? createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: menuPos.openUp ? undefined : menuPos.top,
              bottom: menuPos.openUp
                ? window.innerHeight - menuPos.top
                : undefined,
              left: menuPos.left,
              width: menuPos.width,
              maxHeight: menuPos.maxHeight,
              zIndex: 200,
            }}
            className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
          >
            {listBody}
            {multi ? (
              <div className="shrink-0 border-t border-border px-3 py-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setQ("");
                  }}
                  className="w-full rounded-lg bg-orange-500/15 py-1.5 text-[11px] font-bold text-orange-700"
                >
                  Xong ({selectedIds.length}/{limit})
                </button>
              </div>
            ) : null}
          </div>,
          document.body
        )
      : null;

  return (
    <div className="relative space-y-1.5">
      {warnBanner}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 text-left hover:border-orange-300 disabled:opacity-50 ${
          compact ? "py-1.5 text-xs" : "py-2 text-sm"
        }`}
      >
        <span
          className={`truncate ${selectedIds.length ? "text-foreground" : "text-muted-foreground"}`}
        >
          {summary}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {menu}
    </div>
  );
}

/** Badge trên card: chỉ khóa / đang hoạt động (bỏ invited/active staff status). */
function accountBadge(locked: boolean) {
  if (locked) {
    return {
      label: "Đã khóa",
      className: "border-red-300 bg-red-50 text-red-700",
    };
  }
  return {
    label: "Đang hoạt động",
    className: "border-emerald-500/30 bg-emerald-500/15 text-emerald-800",
  };
}

export default function OrganizerEventStaff({ eventId }: { eventId: string }) {
  const [role, setRole] = useState<EventStaffRole>("race-staff");
  const [members, setMembers] = useState<EventStaffMemberDto[]>([]);
  const [stations, setStations] = useState<StaffStationDto[]>([]);
  const [routes, setRoutes] = useState<StaffRouteDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useOrganizerErrorState();
  const [, setToast] = useOrganizerToastState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EventStaffMemberDto | null>(
    null
  );
  const [resetTarget, setResetTarget] = useState<EventStaffMemberDto | null>(
    null
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState(STAFF_DEFAULT_PASSWORD);
  const [stationIds, setStationIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedMapStationId, setSelectedMapStationId] = useState<
    string | null
  >(null);
  const [memberQuery, setMemberQuery] = useState("");

  const roleMeta = useMemo(() => ROLE_TABS.find((t) => t.id === role)!, [role]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, mapData] = await Promise.all([
        listEventStaff(eventId, role),
        listStaffMapData(eventId, role),
      ]);
      setMembers(list.filter((m) => m.status !== "revoked"));
      setStations(mapData.stations);
      setRoutes(mapData.routes);
      setStationIds((prev) =>
        prev.filter((id) => mapData.stations.some((s) => s.id === id))
      );
    } catch (e) {
      setError(getApiErrorMessage(e, "Không tải được nhân sự."));
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [eventId, role, setError]);

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
    setPassword(STAFF_DEFAULT_PASSWORD);
    setStationIds([]);
    setFormError(null);
  };

  const isPhoto = role === "photographer";

  const stationPayload = (ids: string[]) => {
    const items = toStationItems(ids, stations);
    return {
      stationId: items[0]?.stationId ?? null,
      stationLabel: items[0]?.stationLabel ?? null,
      stations: items,
    };
  };

  const closeInvite = () => {
    if (busy) return;
    setInviteOpen(false);
    resetForm();
  };

  const closeEdit = () => {
    if (busy) return;
    setEditTarget(null);
    resetForm();
  };

  const openEdit = (m: EventStaffMemberDto) => {
    setEditTarget(m);
    setFullName(m.fullName);
    setEmail(
      m.email?.endsWith("@staff.raceday.local") ? "" : m.email || ""
    );
    setPhone(m.phone || "");
    setStationIds(memberStationIds(m));
    setFormError(null);
  };

  const onInvite = async () => {
    const name = fullName.trim();
    const mail = email.trim();
    const pwd = password.trim();
    if (!name) {
      setFormError("Vui lòng nhập họ tên.");
      return;
    }
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      setFormError("Email không hợp lệ.");
      return;
    }
    if (!pwd || pwd.length < 8) {
      setFormError("Mật khẩu tối thiểu 8 ký tự.");
      return;
    }
    setBusy(true);
    setFormError(null);
    setError(null);
    try {
      const st = stationPayload(stationIds);
      await inviteEventStaff(eventId, {
        role,
        email: mail || undefined,
        fullName: name,
        phone: phone.trim() || undefined,
        stationId: st.stationId || undefined,
        stationLabel: st.stationLabel || undefined,
        stations: st.stations,
        password: pwd,
      });
      setInviteOpen(false);
      resetForm();
      await load();
      setToast("Đã thêm nhân sự vào giải.");
    } catch (e) {
      const message = getApiErrorMessage(e, "Tạo tài khoản thất bại.");
      setFormError(message);
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const onUpdate = async () => {
    if (!editTarget) return;
    const name = fullName.trim();
    const mail = email.trim();
    if (!name) {
      setFormError("Vui lòng nhập họ tên.");
      return;
    }
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      setFormError("Email không hợp lệ.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const st = stationPayload(stationIds);
      await updateEventStaff(eventId, editTarget.id, {
        fullName: name,
        email: mail,
        phone: phone.trim() || null,
        stationId: st.stationId,
        stationLabel: st.stationLabel,
        stations: st.stations,
      });
      setEditTarget(null);
      resetForm();
      toastSuccess("Đã cập nhật nhân sự.");
      await load();
    } catch (e) {
      setFormError(getApiErrorMessage(e, "Cập nhật thất bại."));
    } finally {
      setBusy(false);
    }
  };

  const onAssign = async (memberId: string, next: string | string[]) => {
    const ids = Array.isArray(next) ? next : next ? [next] : [];
    const st = stationPayload(ids);
    setBusy(true);
    try {
      await assignEventStaffStation(eventId, {
        memberId,
        stationId: st.stationId,
        stationLabel: st.stationLabel,
        stations: st.stations,
      });
      toastSuccess("Đã cập nhật vị trí.");
      await load();
    } catch (e) {
      toastError(e, "Gán vị trí thất bại.");
    } finally {
      setBusy(false);
    }
  };

  const onResetPassword = (m: EventStaffMemberDto) => {
    if (!m.userId) {
      toastError(null, "Nhân sự chưa có tài khoản đăng nhập.");
      return;
    }
    setResetTarget(m);
  };

  const confirmResetPassword = async () => {
    if (!resetTarget) return;
    setBusy(true);
    try {
      const result = await resetEventStaffPassword(eventId, resetTarget.id);
      setResetTarget(null);
      setToast(
        result.passwordSentByEmail
          ? `Đã khôi phục MK gốc và gửi email (${result.password}).`
          : `Đã khôi phục MK gốc: ${result.password}`
      );
    } catch (e) {
      toastError(e, "Khôi phục mật khẩu thất bại.");
    } finally {
      setBusy(false);
    }
  };

  const onToggleLock = async (m: EventStaffMemberDto) => {
    if (!m.userId) {
      toastError(null, "Nhân sự chưa có tài khoản đăng nhập.");
      return;
    }
    const next = !m.accountLocked;
    setBusy(true);
    try {
      await setEventStaffLock(eventId, m.id, next);
      toastSuccess(next ? "Đã khóa tài khoản." : "Đã mở khóa tài khoản.");
      await load();
    } catch (e) {
      toastError(e, next ? "Khóa thất bại." : "Mở khóa thất bại.");
    } finally {
      setBusy(false);
    }
  };

  const filteredMembers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.stationLabel || "").toLowerCase().includes(q) ||
        (m.phone || "").includes(q)
    );
  }, [members, memberQuery]);

  const mapHighlightMembers = useMemo(() => {
    if (!selectedMapStationId) return filteredMembers;
    return filteredMembers;
  }, [filteredMembers, selectedMapStationId]);

  return (
    <div className={`${PAGE_SHELL} space-y-4 py-1`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
            Nhân sự giải
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            <Users className="h-6 w-6 text-orange-500" />
            Quản lý nhân sự
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold transition-colors duration-150 hover:bg-muted-foreground/10 active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Làm mới
          </button>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setInviteOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors duration-150 hover:from-orange-400 hover:to-red-500 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Tạo tài khoản
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
            {INVITE_ROLE_LABELS[t.id]}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        {/* LEFT: CRUD */}
        <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold">
              Danh sách {roleMeta.label} ({members.length})
            </h2>
            <div className="relative min-w-[10rem] flex-1 sm:max-w-[14rem]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                placeholder="Tìm tên / email…"
                className="w-full rounded-xl border border-border bg-background py-1.5 pl-8 pr-3 text-xs outline-none focus:border-orange-500/50"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-muted/20 p-2.5">
            <p className="text-[11px] font-bold text-foreground">
              Mẫu sẵn có (điền form)
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {STAFF_FORM_PRESETS[role].map((p) => (
                <button
                  key={p.email}
                  type="button"
                  onClick={() => {
                    setFullName(p.fullName);
                    setEmail(p.email);
                    setPhone(p.phone);
                    setFormError(null);
                    setInviteOpen(true);
                  }}
                  className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-700 hover:bg-orange-100"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
              Đang tải…
            </div>
          ) : mapHighlightMembers.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Chưa có {INVITE_ROLE_LABELS[role].toLowerCase()} cho giải này. Bấm{" "}
              <span className="font-semibold text-foreground">
                Tạo tài khoản
              </span>
              .
            </div>
          ) : (
            <ul className="max-h-[min(60vh,560px)] space-y-2 overflow-y-auto pr-1">
              {mapHighlightMembers.map((m) => {
                const ids = memberStationIds(m);
                const mapSelected =
                  !!selectedMapStationId &&
                  ids.includes(selectedMapStationId);
                const badge = accountBadge(!!m.accountLocked);
                return (
                  <li
                    key={m.id}
                    className={`rounded-2xl border p-3 shadow-sm transition ${
                      mapSelected
                        ? "border-orange-400 bg-orange-50/60"
                        : "border-border/60 bg-background"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{m.fullName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[
                            m.email &&
                            !m.email.endsWith("@staff.raceday.local")
                              ? m.email
                              : null,
                            m.phone || null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "Chưa có email / SĐT"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2">
                      <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <MapPin className="h-3 w-3" /> Phân bổ vị trí
                      </p>
                      <StationPicker
                        role={role}
                        value={isPhoto ? ids : ids[0] || ""}
                        stations={stations}
                        disabled={busy}
                        compact
                        multi={isPhoto}
                        max={PHOTOGRAPHER_MAX_STATIONS}
                        onChange={(next) => void onAssign(m.id, next)}
                      />
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => openEdit(m)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] font-semibold hover:bg-muted disabled:opacity-40"
                      >
                        <Pencil className="h-3 w-3" /> Sửa
                      </button>
                      <button
                        type="button"
                        disabled={busy || !m.userId}
                        onClick={() => onResetPassword(m)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] font-semibold hover:bg-muted disabled:opacity-40"
                        title={
                          m.userId
                            ? `Khôi phục mật khẩu gốc (${STAFF_DEFAULT_PASSWORD})`
                            : "Chưa có tài khoản IAM"
                        }
                      >
                        <KeyRound className="h-3 w-3" /> MK gốc
                      </button>
                      <button
                        type="button"
                        disabled={busy || !m.userId}
                        onClick={() => void onToggleLock(m)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] font-semibold hover:bg-muted disabled:opacity-40"
                      >
                        {m.accountLocked ? (
                          <>
                            <LockOpen className="h-3 w-3" /> Mở khóa
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3" /> Khóa
                          </>
                        )}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* RIGHT: MAP */}
        <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm lg:sticky lg:top-4">
          <div className="mb-3">
            <h2 className="text-sm font-bold">Bản đồ phân bổ</h2>
          </div>
          <div className="h-[min(70vh,640px)]">
            <StaffAssignmentMap
              role={role}
              stations={stations}
              routes={routes}
              members={members}
              selectedStationId={selectedMapStationId}
              onSelectStation={setSelectedMapStationId}
            />
          </div>
        </section>
      </div>

      {inviteOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-zinc-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-staff-title"
          onClick={closeInvite}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
                  {INVITE_ROLE_LABELS[role]}
                </p>
                <h2
                  id="invite-staff-title"
                  className="mt-1 text-lg font-extrabold tracking-tight"
                >
                  Tạo tài khoản
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Email tuỳ chọn. Có thể gán vị trí sau trên danh sách / bản đồ.
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

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 sm:px-6">
              {formError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {formError}
                </div>
              ) : null}

              <div>
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

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    <Mail className="mr-1 inline h-3.5 w-3.5 text-orange-500" />
                    Email
                  </label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    disabled={busy}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition-all focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
                    placeholder="tuỳ chọn"
                  />
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
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  <KeyRound className="mr-1 inline h-3.5 w-3.5 text-orange-500" />
                  Mật khẩu *
                </label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm outline-none transition-all focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
                  placeholder={STAFF_DEFAULT_PASSWORD}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  <MapPin className="mr-1 inline h-3.5 w-3.5 text-orange-500" />
                  Vị trí / nhiệm vụ{" "}
                  <span className="font-normal text-muted-foreground">
                    (tuỳ chọn)
                  </span>
                </label>
                <StationPicker
                  role={role}
                  variant="inline"
                  value={isPhoto ? stationIds : stationIds[0] || ""}
                  stations={stations}
                  disabled={busy}
                  multi={isPhoto}
                  max={PHOTOGRAPHER_MAX_STATIONS}
                  onChange={(next) =>
                    setStationIds(
                      Array.isArray(next) ? next : next ? [next] : []
                    )
                  }
                />
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t border-border px-5 py-3 sm:px-6">
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
                Tạo tài khoản
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {resetTarget ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-pwd-title"
          onClick={() => !busy && setResetTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
                  Xác nhận
                </p>
                <h2
                  id="reset-pwd-title"
                  className="mt-1 text-lg font-extrabold tracking-tight"
                >
                  Khôi phục mật khẩu gốc?
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Đặt lại MK của{" "}
                  <span className="font-semibold text-foreground">
                    {resetTarget.fullName}
                  </span>{" "}
                  về{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {STAFF_DEFAULT_PASSWORD}
                  </span>
                  .
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => setResetTarget(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setResetTarget(null)}
                className="rounded-full border border-border px-4 py-2 text-xs font-bold hover:bg-muted disabled:opacity-40"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmResetPassword()}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <KeyRound className="h-3.5 w-3.5" />
                )}
                Khôi phục
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editTarget ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-zinc-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-staff-title"
          onClick={closeEdit}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
                  Cập nhật
                </p>
                <h2
                  id="edit-staff-title"
                  className="mt-1 text-lg font-extrabold tracking-tight"
                >
                  Sửa nhân sự
                </h2>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={closeEdit}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 sm:px-6">
              {formError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {formError}
                </div>
              ) : null}

              <div>
                <label className="mb-1.5 block text-xs font-semibold">
                  Họ tên *
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={busy}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold">
                    <Mail className="mr-1 inline h-3.5 w-3.5 text-orange-500" />
                    Email
                  </label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    disabled={busy}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
                    placeholder="tuỳ chọn"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold">
                    Số điện thoại
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={busy}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold">
                  <MapPin className="mr-1 inline h-3.5 w-3.5 text-orange-500" />
                  Vị trí / nhiệm vụ
                </label>
                <StationPicker
                  role={role}
                  variant="inline"
                  value={isPhoto ? stationIds : stationIds[0] || ""}
                  stations={stations}
                  disabled={busy}
                  multi={isPhoto}
                  max={PHOTOGRAPHER_MAX_STATIONS}
                  onChange={(next) =>
                    setStationIds(
                      Array.isArray(next) ? next : next ? [next] : []
                    )
                  }
                />
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t border-border px-5 py-3 sm:px-6">
              <button
                type="button"
                disabled={busy}
                onClick={closeEdit}
                className="rounded-full border border-border px-4 py-2 text-xs font-bold hover:bg-muted disabled:opacity-40"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onUpdate()}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                Lưu
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
