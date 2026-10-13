"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  Package,
  Pencil,
  Tag,
  User,
  Users,
} from "lucide-react";
import { getMyProfile } from "@/api/auth";
import { getPackageCatalog, createPackagePurchase } from "@/api/event-packages";
import { createPackageCheckout } from "@/api/payments";
import type { MyProfileDto } from "@/dto/auth.dto";
import type {
  PackageCatalogDto,
  PackageDurationOption,
  PackageCapacityOption,
} from "@/dto/event-package.dto";
import type { CheckoutResponseDto } from "@/dto/payment.dto";
import { formatPrice } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/error";
import {
  PaymentCheckoutView,
  PaymentSuccessView,
} from "@/components/payment";

type Step = "form" | "paying" | "success";

function toAbsoluteUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (typeof window === "undefined") return url;
  return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

function genderLabel(gender: number | string | undefined): string {
  const g = typeof gender === "string" ? gender.toLowerCase() : Number(gender);
  if (g === 1 || g === "male") return "Nam";
  if (g === 2 || g === "female") return "Nữ";
  return "—";
}

function displayOrDash(value?: string | null): string {
  const t = value?.trim();
  return t ? t : "Chưa cập nhật";
}

export default function EventPackageCheckout() {
  const router = useRouter();

  const [catalog, setCatalog] = useState<PackageCatalogDto | null>(null);
  const [profile, setProfile] = useState<MyProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [orgName, setOrgName] = useState("");
  const [orgIntro, setOrgIntro] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [invoiceInfo, setInvoiceInfo] = useState("");
  const [selectedDuration, setSelectedDuration] = useState<PackageDurationOption | null>(null);
  const [selectedCapacity, setSelectedCapacity] = useState<PackageCapacityOption | null>(null);
  const [promoDraft, setPromoDraft] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoValid, setPromoValid] = useState<boolean | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Payment
  const [step, setStep] = useState<Step>("form");
  const [checkout, setCheckout] = useState<CheckoutResponseDto | null>(null);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);

  // Load catalog + profile
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [data, me] = await Promise.all([
          getPackageCatalog(),
          getMyProfile().catch(() => null),
        ]);
        if (cancelled) return;
        setCatalog(data);
        setProfile(me);
        if (data.durations.length > 0) setSelectedDuration(data.durations[0]);
        if (data.capacities.length > 0) setSelectedCapacity(data.capacities[0]);
      } catch (e) {
        if (!cancelled) setError(getApiErrorMessage(e, "Không tải được bảng giá."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const matchedPromo = catalog?.promoCodes.find(
    (c) => c.code.toLowerCase() === promoCode.trim().toLowerCase()
  );

  // Promo validation — chỉ khi đã Áp dụng
  useEffect(() => {
    if (!promoCode.trim() || !catalog) {
      setPromoValid(null);
      return;
    }
    setPromoValid(!!matchedPromo);
  }, [promoCode, catalog, matchedPromo]);

  const handleApplyPromo = () => {
    const code = promoDraft.trim();
    setPromoCode(code);
    if (!code) {
      setPromoValid(null);
      return;
    }
    const hit = catalog?.promoCodes.find(
      (c) => c.code.toLowerCase() === code.toLowerCase()
    );
    setPromoValid(!!hit);
  };

  // Price calculation — % lấy từ BE, không hardcode 10%
  const basePrice = selectedDuration?.price ?? 0;
  const addOnFee = selectedCapacity?.addOnFee ?? 0;
  const totalBeforeDiscount = basePrice + addOnFee;
  const promoRate = matchedPromo && promoValid ? Number(matchedPromo.percentOff) : 0;
  const discountAmount =
    promoRate > 0 ? Math.round(totalBeforeDiscount * promoRate) : 0;
  const totalPrice = totalBeforeDiscount - discountAmount;

  const canSubmit =
    orgName.trim().length >= 2 &&
    orgIntro.trim().length >= 1 &&
    orgAddress.trim().length >= 1 &&
    selectedDuration !== null &&
    selectedCapacity !== null &&
    termsAccepted &&
    !submitting;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !selectedDuration || !selectedCapacity) return;
    setSubmitting(true);
    setError(null);
    try {
      const purchase = await createPackagePurchase({
        orgName: orgName.trim(),
        orgIntro: orgIntro.trim(),
        orgAddress: orgAddress.trim(),
        invoiceInfo: invoiceInfo.trim() || undefined,
        durationMonths: selectedDuration.months,
        participantCap: selectedCapacity.maxParticipants,
        promoCode: promoValid ? promoCode.trim() : undefined,
      });
      setPurchaseId(purchase.id);

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const returnUrl = `${origin}/events/create/package-return?purchaseId=${purchase.id}`;
      const cancelUrl = `${origin}/events/create`;

      const checkoutRes = await createPackageCheckout({
        packagePurchaseId: purchase.id,
        returnUrl,
        cancelUrl,
      });

      if (!checkoutRes.checkoutUrl && !checkoutRes.qrCode) {
        throw new Error("Không nhận được liên kết thanh toán.");
      }

      setCheckout({
        ...checkoutRes,
        checkoutUrl: checkoutRes.checkoutUrl
          ? toAbsoluteUrl(checkoutRes.checkoutUrl)
          : "",
        amount: checkoutRes.amount ?? purchase.totalAmount,
      });
      setStep("paying");
    } catch (e) {
      setError(getApiErrorMessage(e, "Tạo đơn thanh toán thất bại."));
    } finally {
      setSubmitting(false);
    }
  }, [
    canSubmit, selectedDuration, selectedCapacity,
    orgName, orgIntro, orgAddress, invoiceInfo,
    promoCode, promoValid,
  ]);

  const returnUrl = purchaseId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/events/create/package-return?purchaseId=${purchaseId}`
    : "";

  const handlePaymentSuccess = useCallback(
    (paymentId: string) => {
      setStep("success");
      setTimeout(() => {
        router.push(
          `/events/create/package-return?purchaseId=${purchaseId}&paymentId=${paymentId}`
        );
      }, 800);
    },
    [purchaseId, router]
  );

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="mt-3 text-sm text-muted-foreground">Đang tải bảng giá gói…</p>
      </div>
    );
  }

  // ── Success ──
  if (step === "success") {
    return <PaymentSuccessView subtitle="Đang tạo giải nháp của bạn…" />;
  }

  // ── Payment ──
  if (step === "paying" && checkout) {
    const amountToPay = checkout.amount ?? totalPrice;
    return (
      <PaymentCheckoutView
        kicker="Thanh toán gói"
        title="Thanh toán gói tổ chức"
        subtitle="Quét VietQR hoặc chuyển khoản bên dưới. Sau khi xong giải nháp sẽ được tạo tự động."
        checkout={checkout}
        returnUrl={returnUrl}
        amount={amountToPay}
        orderSummaryItems={[
          { label: "Tổ chức", value: orgName },
          { label: "Thời hạn", value: `${selectedDuration?.months} tháng` },
          { label: "Quy mô", value: `${selectedCapacity?.maxParticipants} VĐV` },
          ...(promoValid
            ? [
                {
                  label: "Mã giảm giá",
                  value: (
                    <span className="font-semibold text-emerald-600">
                      {promoCode}
                    </span>
                  ),
                },
              ]
            : []),
        ]}
        orderSummaryNotes="PayOS xác nhận xong sẽ tự chuyển trang. Giải nháp được tạo sau khi thanh toán thành công."
        onSuccess={handlePaymentSuccess}
        onCancel={() => router.push("/events/create")}
        onExit={() => setStep("form")}
        exitLabel="Quay lại chọn gói"
        enableMockPay={true}
      />
    );
  }

  // ── Form (3-card layout) ──
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
          Gói tổ chức giải
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Đăng ký gói tổ chức sự kiện
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Chọn gói phù hợp, điền thông tin tổ chức rồi thanh toán. Sau khi thanh toán giải nháp sẽ được tạo tự động.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Cột giữa rộng hơn 2 cột bên */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)_minmax(0,0.9fr)]">
        {/* ── Col 1: Cá nhân + BTC ── */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
                <User className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-bold text-foreground">Thông tin cá nhân</h2>
            </div>
            <dl className="space-y-2.5 text-sm">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Họ và tên
                </dt>
                <dd className="font-medium text-foreground">
                  {displayOrDash(profile?.fullName || profile?.username)}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Giới tính
                </dt>
                <dd className="font-medium text-foreground">
                  {genderLabel(profile?.gender)}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Email
                </dt>
                <dd className="truncate font-medium text-foreground">
                  {displayOrDash(profile?.email)}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Số điện thoại
                </dt>
                <dd className="font-medium text-foreground">
                  {displayOrDash(profile?.phone)}
                </dd>
              </div>
            </dl>
            <Link
              href="/profile"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-700 transition-colors hover:bg-orange-500/15"
            >
              <Pencil className="h-3 w-3" />
              Chỉnh sửa
            </Link>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
                <Building2 className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-bold text-foreground">Thông tin ban tổ chức</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Tên tổ chức / BTC <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="VD: RaceDay Sports JSC"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Giới thiệu ngắn <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={orgIntro}
                  onChange={(e) => setOrgIntro(e.target.value)}
                  rows={3}
                  placeholder="Mô tả ngắn về tổ chức…"
                  required
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Địa chỉ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={orgAddress}
                  onChange={(e) => setOrgAddress(e.target.value)}
                  placeholder="Địa chỉ trụ sở BTC"
                  required
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Thông tin xuất hóa đơn
                </label>
                <input
                  type="text"
                  value={invoiceInfo}
                  onChange={(e) => setInvoiceInfo(e.target.value)}
                  placeholder="MST, tên công ty (nếu cần hóa đơn)"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Col 2: Chọn gói (rộng nhất) — sticky + cuộn trong panel ── */}
        <div className="flex flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]">
          <div className="mb-4 flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
              <Package className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-bold text-foreground">Chọn gói</h2>
          </div>

          <div className="min-h-0 space-y-5 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Thời hạn gói
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(catalog?.durations ?? []).map((d) => {
                  const active = selectedDuration?.months === d.months;
                  return (
                    <button
                      key={d.months}
                      type="button"
                      onClick={() => setSelectedDuration(d)}
                      className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
                        active
                          ? "border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/20"
                          : "border-border hover:border-orange-500/30"
                      }`}
                    >
                      <span className="block font-bold text-foreground">
                        {d.name?.trim() || `${d.months} tháng`}
                      </span>
                      <span
                        className={`text-xs ${active ? "font-semibold text-orange-600" : "text-muted-foreground"}`}
                      >
                        {formatPrice(d.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Users className="h-3 w-3" /> Quy mô VĐV
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(catalog?.capacities ?? []).map((c) => {
                  const active =
                    selectedCapacity?.maxParticipants === c.maxParticipants;
                  return (
                    <button
                      key={c.maxParticipants}
                      type="button"
                      onClick={() => setSelectedCapacity(c)}
                      className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
                        active
                          ? "border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/20"
                          : "border-border hover:border-orange-500/30"
                      }`}
                    >
                      <span className="block font-bold text-foreground">
                        {c.name?.trim() ||
                          `${c.maxParticipants.toLocaleString("vi-VN")} VĐV`}
                      </span>
                      <span
                        className={`text-xs ${active ? "font-semibold text-orange-600" : "text-muted-foreground"}`}
                      >
                        {c.addOnFee > 0
                          ? `+${formatPrice(c.addOnFee)}`
                          : "Đã bao gồm"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Col 3: Thanh toán + mã giảm giá ── */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
              <CreditCard className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-bold text-foreground">Tóm tắt thanh toán</h2>
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Gói thời hạn</span>
              <span className="font-medium text-foreground">
                {selectedDuration ? `${selectedDuration.months} tháng` : "—"}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Giá gói</span>
              <span className="font-semibold text-foreground">{formatPrice(basePrice)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Phụ phí quy mô</span>
              <span className="font-medium text-foreground">
                {addOnFee > 0 ? `+${formatPrice(addOnFee)}` : "0đ"}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between gap-3">
                <span className="text-emerald-600">Giảm giá ({promoCode})</span>
                <span className="font-semibold text-emerald-600">-{formatPrice(discountAmount)}</span>
              </div>
            )}
          </div>

          <div className="mt-4">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Tag className="h-3 w-3" /> Mã giảm giá
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoDraft}
                onChange={(e) => {
                  setPromoDraft(e.target.value);
                  if (promoValid !== null) {
                    setPromoCode("");
                    setPromoValid(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyPromo();
                  }
                }}
                placeholder="Nhập mã"
                className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                className="shrink-0 rounded-xl bg-orange-500 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-orange-600"
              >
                Áp dụng
              </button>
            </div>
            {promoValid === true && matchedPromo && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <Check className="h-3.5 w-3.5" /> Đã giảm{" "}
                {Math.round(Number(matchedPromo.percentOff) * 100)}%
              </p>
            )}
            {promoValid === false && (
              <p className="mt-1.5 text-xs font-semibold text-red-500">Mã không hợp lệ</p>
            )}
            <p className="mt-1 text-[10px] text-muted-foreground">
              Mã do Admin RaceDay phát hành.
            </p>
          </div>

          <div className="mt-4 flex items-baseline justify-between gap-2 border-t border-border pt-3">
            <span className="font-bold text-foreground">Tổng thanh toán</span>
            <span className="text-xl font-extrabold text-orange-600">{formatPrice(totalPrice)}</span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              <span>Thanh toán qua PayOS — bảo mật SSL</span>
            </div>

            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border accent-orange-500"
              />
              <span className="text-xs leading-relaxed text-muted-foreground">
                Tôi đồng ý với{" "}
                <span className="font-semibold text-foreground">điều khoản dịch vụ</span> và{" "}
                <span className="font-semibold text-foreground">chính sách bảo mật</span> của RaceDay.
              </span>
            </label>

            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => void handleSubmit()}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition-all hover:shadow-orange-500/35 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {submitting ? "Đang xử lý…" : "Thanh toán"}
            </button>
          </div>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
            Sau khi thanh toán, giải nháp (draft) được tạo tự động. Bạn bổ sung
            hồ sơ rồi gửi duyệt.
          </p>
        </div>
      </div>
    </div>
  );
}
