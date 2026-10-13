"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import type { ApiRegistration } from "@/dto/organizer.dto";
import type { RaceEventDto } from "@/dto/event.dto";
import Pagination from "@/components/ui/Pagination";
import RegistrationReviewModal from "@/components/organizer/RegistrationReviewModal";
import { usePagedList } from "@/hooks/usePagedList";
import {
  formatDateTime,
  formatPrice,
  getRegistrationStatusColor,
  getRegistrationStatusLabel,
} from "@/lib/format";
import {
  formatMedicalLabels,
  hasSpecialMedical,
  registrationReviewedAt,
  registrationReviewerLabel,
} from "@/lib/registration-medical";

const PAGE_SIZE = 10;

type MedicalFilter = "all" | "special" | "none";

type Props = {
  event: RaceEventDto;
  regs: ApiRegistration[];
  loading: boolean;
  busyId: string | null;
  organizerUsername: string;
  onReload: () => void;
  onApprove: (id: string) => void;
  onRejectRequest: (id: string) => void;
};

function distanceLabelOf(r: ApiRegistration): string {
  return (
    r.distanceLabel ||
    (r.distanceKm != null ? `${r.distanceKm}K` : "") ||
    r.distanceId ||
    "—"
  );
}

export default function RegistrationApprovalsPanel({
  event,
  regs,
  loading,
  busyId,
  organizerUsername,
  onReload,
  onApprove,
  onRejectRequest,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending_approval");
  const [distanceFilter, setDistanceFilter] = useState("all");
  const [medicalFilter, setMedicalFilter] = useState<MedicalFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [reasonViewId, setReasonViewId] = useState<string | null>(null);

  const distanceOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of event.distances || []) {
      map.set(d.id, d.name || `${d.distanceKm}K`);
    }
    for (const r of regs) {
      if (!map.has(r.distanceId)) {
        map.set(r.distanceId, distanceLabelOf(r));
      }
    }
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [event.distances, regs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return regs.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (distanceFilter !== "all" && r.distanceId !== distanceFilter) {
        return false;
      }
      if (medicalFilter === "special" && !hasSpecialMedical(r.medicalCodes)) {
        return false;
      }
      if (medicalFilter === "none" && hasSpecialMedical(r.medicalCodes)) {
        return false;
      }
      if (!q) return true;
      const hay = [
        r.fullName,
        r.email,
        r.phone,
        r.idNumber,
        r.bibNumber,
        distanceLabelOf(r),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [regs, search, statusFilter, distanceFilter, medicalFilter]);

  const resetKey = `${statusFilter}|${distanceFilter}|${medicalFilter}|${search}`;
  const { page, totalPages, pageItems, turning, visible, goTo, totalItems } =
    usePagedList(filtered, PAGE_SIZE, resetKey);

  const pendingCount = useMemo(
    () => regs.filter((r) => r.status === "pending_approval").length,
    [regs]
  );

  const activeFilterCount =
    (statusFilter !== "pending_approval" ? 1 : 0) +
    (distanceFilter !== "all" ? 1 : 0) +
    (medicalFilter !== "all" ? 1 : 0);

  const detailReg = detailId
    ? regs.find((r) => r.id === detailId) || null
    : null;
  const reasonReg = reasonViewId
    ? regs.find((r) => r.id === reasonViewId) || null
    : null;

  const clearFilters = () => {
    setStatusFilter("pending_approval");
    setDistanceFilter("all");
    setMedicalFilter("all");
    setSearch("");
  };

  const fallbackReviewer = `BTC · ${organizerUsername}`;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
            BTC · {organizerUsername}
          </p>
          <h2 className="mt-1 text-xl font-extrabold text-foreground sm:text-2xl">
            Duyệt đăng ký
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tìm kiếm, lọc và duyệt hồ sơ VĐV đã thanh toán.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onReload}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Tải lại
          </button>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            {pendingCount} chờ duyệt
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo họ tên, email, SĐT, BIB…"
            className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition-all focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-muted"
              aria-label="Xóa tìm kiếm"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
          className={`inline-flex h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors ${
            filtersOpen || activeFilterCount > 0
              ? "border-orange-500 bg-orange-500 text-white shadow-sm shadow-orange-500/25"
              : "border-border bg-white text-foreground hover:border-orange-400/60"
          }`}
        >
          <Filter className="h-4 w-4" />
          Bộ lọc
          {activeFilterCount > 0 ? (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                filtersOpen ? "bg-white/20" : "bg-orange-500 text-white"
              }`}
            >
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>

      {filtersOpen ? (
        <div className="grid gap-3 rounded-2xl border border-border/60 bg-card p-4 sm:grid-cols-3">
          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Trạng thái
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="pending_approval">Chờ duyệt</option>
              <option value="confirmed">Đã duyệt</option>
              <option value="rejected">Đã từ chối</option>
              <option value="all">Tất cả</option>
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Cự ly
            </span>
            <select
              value={distanceFilter}
              onChange={(e) => setDistanceFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="all">Tất cả cự ly</option>
              {distanceOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Tình trạng sức khỏe
            </span>
            <select
              value={medicalFilter}
              onChange={(e) =>
                setMedicalFilter(e.target.value as MedicalFilter)
              }
              className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="all">Tất cả</option>
              <option value="special">Có bệnh lý đặc biệt</option>
              <option value="none">Không có bệnh lý</option>
            </select>
          </label>
          {activeFilterCount > 0 || search ? (
            <div className="sm:col-span-3">
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-bold text-orange-600 hover:underline"
              >
                Xóa bộ lọc
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Hiển thị{" "}
        <span className="font-semibold text-foreground">{totalItems}</span> /{" "}
        {regs.length} đơn
      </p>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Đang tải đăng ký…
          </div>
        ) : totalItems === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-muted-foreground">
            Không có đơn phù hợp bộ lọc. VĐV cần thanh toán PayOS trước khi vào
            chờ duyệt.
          </div>
        ) : (
          <div
            className={`overflow-x-auto transition-opacity duration-200 ${
              visible && !turning ? "opacity-100" : "opacity-40"
            }`}
          >
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-bold">STT</th>
                  <th className="px-4 py-3 font-bold">Họ và tên</th>
                  <th className="px-4 py-3 font-bold">Cự ly</th>
                  <th className="px-4 py-3 font-bold">Liên hệ</th>
                  <th className="px-4 py-3 font-bold">Sức khỏe</th>
                  <th className="px-4 py-3 font-bold">Đăng ký</th>
                  <th className="px-4 py-3 font-bold">Trạng thái</th>
                  <th className="px-4 py-3 font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pageItems.map((r, idx) => {
                  const stt = (page - 1) * PAGE_SIZE + idx + 1;
                  const canModerate = r.status === "pending_approval";
                  const special = hasSpecialMedical(r.medicalCodes);
                  const rowBusy = busyId === r.id;
                  return (
                    <tr key={r.id} className="hover:bg-orange-50/40">
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {stt}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-foreground">{r.fullName}</p>
                        {r.bibNumber ? (
                          <p className="text-[11px] font-semibold text-orange-600">
                            BIB {r.bibNumber}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{distanceLabelOf(r)}</p>
                        <p className="text-[11px] font-medium text-orange-600">
                          {formatPrice(Number(r.price || 0))}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-foreground/90">{r.email}</p>
                        <p className="text-xs text-muted-foreground">{r.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        {special ? (
                          <span
                            className="line-clamp-2 text-xs font-semibold text-amber-800"
                            title={formatMedicalLabels(r.medicalCodes)}
                          >
                            {formatMedicalLabels(r.medicalCodes)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Không bệnh lý
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDateTime(r.createdAtUtc)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-extrabold ${getRegistrationStatusColor(
                            r.status
                          )}`}
                        >
                          {getRegistrationStatusLabel(r.status)}
                        </span>
                        {r.status === "rejected" ? (
                          <button
                            type="button"
                            onClick={() => setReasonViewId(r.id)}
                            className="mt-1 block text-[11px] font-bold text-red-600 hover:underline"
                          >
                            Xem lý do
                          </button>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailId(r.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-bold hover:bg-muted"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Form
                          </button>
                          {canModerate ? (
                            <>
                              <button
                                type="button"
                                disabled={rowBusy}
                                onClick={() => onApprove(r.id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-60"
                              >
                                {rowBusy ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                                Duyệt
                              </button>
                              <button
                                type="button"
                                disabled={rowBusy}
                                onClick={() => onRejectRequest(r.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-700 disabled:opacity-60"
                              >
                                <X className="h-3.5 w-3.5" />
                                Từ chối
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        onChange={goTo}
        disabled={turning || loading}
      />

      {detailReg ? (
        <RegistrationReviewModal
          registration={detailReg}
          eventName={event.name}
          open
          busy={busyId === detailReg.id}
          fallbackReviewer={fallbackReviewer}
          onClose={() => setDetailId(null)}
          onApprove={() => onApprove(detailReg.id)}
          onReject={() => {
            setDetailId(null);
            onRejectRequest(detailReg.id);
          }}
        />
      ) : null}

      {reasonReg ? (
        <RejectionReasonCard
          reg={reasonReg}
          eventName={event.name}
          fallbackReviewer={fallbackReviewer}
          onClose={() => setReasonViewId(null)}
          onOpenForm={() => {
            setReasonViewId(null);
            setDetailId(reasonReg.id);
          }}
        />
      ) : null}
    </section>
  );
}

function RejectionReasonCard({
  reg,
  eventName,
  fallbackReviewer,
  onClose,
  onOpenForm,
}: {
  reg: ApiRegistration;
  eventName: string;
  fallbackReviewer: string;
  onClose: () => void;
  onOpenForm: () => void;
}) {
  const reviewer =
    registrationReviewerLabel(reg) || fallbackReviewer;
  const reviewedAt = registrationReviewedAt(reg);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md space-y-4 rounded-2xl border border-red-200 bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-red-600">
              Đơn bị từ chối
            </p>
            <h3 className="mt-1 text-lg font-extrabold text-foreground">
              {reg.fullName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-sm">
          <Row label="Tên giải" value={eventName} />
          <Row label="Đăng ký lúc" value={formatDateTime(reg.createdAtUtc)} />
          <Row
            label="Trạng thái"
            value={getRegistrationStatusLabel(reg.status)}
          />
          <Row label="Người duyệt" value={reviewer} />
          <Row
            label="Thời gian duyệt"
            value={reviewedAt ? formatDateTime(reviewedAt) : "—"}
          />
        </div>

        <div className="rounded-xl border border-red-500/20 bg-red-50 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-red-700">
            Lý do từ chối
          </p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm text-red-950/90">
            {reg.rejectionReason?.trim() || "Không có mô tả."}
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onOpenForm}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
          >
            Xem form
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-sm font-bold text-white"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-semibold text-foreground">{value}</span>
    </div>
  );
}
