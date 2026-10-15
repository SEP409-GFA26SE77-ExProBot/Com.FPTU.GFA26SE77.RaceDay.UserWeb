"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  KeyRound,
  Loader2,
  LogIn,
  User,
} from "lucide-react";
import {
  changePassword,
  getMyProfile,
  persistAvatarCookie,
  updateMyProfile,
  uploadMyAvatar,
} from "@/api/auth";
import {
  genderToApiNumber,
  genderToFormValue,
  profileDobToDateInput,
  type MyProfileDto,
} from "@/dto/auth.dto";
import { getApiErrorMessage } from "@/lib/error";
import {
  isValidDateOfBirth,
  isValidOptionalVietnamPhone,
  MSG,
} from "@/lib/input-rules";
import { mediaDisplayUrl } from "@/lib/media-url";
import { PAGE_SHELL } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";

type ProfileForm = {
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
};

export default function ProfileEditPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState<MyProfileDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState<ProfileForm>({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>(
    {}
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileApiError, setProfileApiError] = useState<string | null>(null);
  /** File staged — chỉ upload khi bấm Lưu hồ sơ */
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState<
    string | null
  >(null);

  const [pw, setPw] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [savingPw, setSavingPw] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwApiError, setPwApiError] = useState<string | null>(null);

  useEffect(() => {
    const token = Cookies.get("access_token");
    setLoggedIn(Boolean(token));
    setUsername(Cookies.get("username") || "");
    if (!token) {
      setReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await getMyProfile();
        if (cancelled) return;
        setProfile(me);
        persistAvatarCookie(me.avatarUrl);
        setForm({
          fullName: me.fullName || "",
          email: me.email || "",
          phone: me.phone || "",
          gender: genderToFormValue(me.gender),
          dateOfBirth: profileDobToDateInput(me.dateOfBirth),
        });
        setLoadError(null);
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            getApiErrorMessage(e, "Không tải được hồ sơ cá nhân.")
          );
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const validateProfile = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Vui lòng nhập họ tên";
    else if (form.fullName.trim().length > 100)
      e.fullName = "Họ tên tối đa 100 ký tự.";
    if (form.phone.trim() && !isValidOptionalVietnamPhone(form.phone))
      e.phone = MSG.phone;
    if (form.dateOfBirth && !isValidDateOfBirth(form.dateOfBirth))
      e.dateOfBirth = MSG.dateOfBirth;
    setProfileErrors(e);
    return Object.keys(e).length === 0;
  };

  const clearPendingAvatar = () => {
    setPendingAvatar(null);
    setPendingAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  useEffect(() => {
    return () => {
      if (pendingAvatarPreview) URL.revokeObjectURL(pendingAvatarPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ revoke khi unmount
  }, []);

  const handleSaveProfile = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validateProfile()) return;
    setSavingProfile(true);
    setProfileApiError(null);
    setProfileSaved(false);
    try {
      let next = profile;
      if (pendingAvatar) {
        next = await uploadMyAvatar(pendingAvatar);
        clearPendingAvatar();
      }
      const updated = await updateMyProfile({
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || null,
        dateOfBirth: form.dateOfBirth || null,
        gender: genderToApiNumber(form.gender),
        avatarUrl: next?.avatarUrl ?? profile?.avatarUrl,
      });
      setProfile(updated);
      persistAvatarCookie(updated.avatarUrl);
      setProfileSaved(true);
    } catch (err) {
      setProfileApiError(
        getApiErrorMessage(err, "Cập nhật hồ sơ thất bại.")
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarPick = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileApiError("Chỉ chọn file ảnh.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setProfileApiError("Ảnh tối đa 2MB.");
      return;
    }
    setProfileApiError(null);
    setPendingAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setPendingAvatar(file);
  };

  const validatePw = () => {
    const e: Record<string, string> = {};
    if (!pw.currentPassword) e.currentPassword = "Nhập mật khẩu hiện tại";
    if (pw.newPassword.length < 8)
      e.newPassword = "Mật khẩu mới tối thiểu 8 ký tự";
    if (pw.newPassword !== pw.confirmPassword)
      e.confirmPassword = "Xác nhận mật khẩu không khớp";
    setPwErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChangePassword = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validatePw()) return;
    setSavingPw(true);
    setPwApiError(null);
    setPwSaved(false);
    try {
      await changePassword({
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      setPwSaved(true);
      setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwApiError(getApiErrorMessage(err, "Đổi mật khẩu thất bại."));
    } finally {
      setSavingPw(false);
    }
  };

  if (!ready) {
    return (
      <PageLoading
        title="Đang tải hồ sơ…"
        description="Lấy thông tin cá nhân từ máy chủ."
        icon={User}
      />
    );
  }

  if (!loggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <LogIn className="h-10 w-10 text-orange-500" />
        <h1 className="text-xl font-bold">Cần đăng nhập</h1>
        <Link
          href="/login?from=/profile/edit"
          className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  const inputClass = (field: string) =>
    `w-full rounded-xl border ${
      profileErrors[field]
        ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
        : "border-border focus:border-orange-500/50 focus:ring-orange-500/20"
    } bg-background py-2.5 px-4 text-sm outline-none transition-all focus:ring-2`;

  const displayName = profile?.fullName || profile?.username || username;
  const initial = (displayName || "U").charAt(0).toUpperCase();
  const avatarSrc =
    pendingAvatarPreview ||
    (profile?.avatarUrl ? mediaDisplayUrl(profile.avatarUrl) : null);

  return (
    <div className={`${PAGE_SHELL} max-w-5xl py-7 space-y-6`}>
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Về hồ sơ
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Chỉnh sửa hồ sơ
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tài khoản{" "}
          <span className="font-semibold text-foreground">
            {profile?.username || username}
          </span>
          . Email đăng nhập không đổi tại đây.
        </p>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {loadError}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Card ảnh đại diện */}
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm h-fit space-y-4">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Camera className="h-4 w-4 text-orange-500" />
            Ảnh đại diện
          </h2>
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-orange-500/40 bg-gradient-to-tr from-orange-500 to-amber-500 shadow-md">
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-3xl font-extrabold text-white">
                  {initial}
                </span>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) =>
                void handleAvatarPick(e.target.files?.[0] ?? null)
              }
            />
            <button
              type="button"
              disabled={savingProfile}
              onClick={() => fileRef.current?.click()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
              {pendingAvatar ? "Đổi ảnh khác" : "Chọn ảnh"}
            </button>
            {pendingAvatar ? (
              <p className="text-center text-[11px] text-orange-600 font-medium">
                Ảnh mới sẽ lưu khi bấm Lưu hồ sơ.
              </p>
            ) : (
              <p className="text-center text-[11px] text-muted-foreground">
                JPG / PNG / WEBP · tối đa 2MB
              </p>
            )}
          </div>
        </section>

        <div className="space-y-6 min-w-0">
          <form
            onSubmit={handleSaveProfile}
            className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 space-y-4 shadow-sm"
            noValidate
          >
            <h2 className="text-sm font-bold flex items-center gap-2">
              <User className="h-4 w-4 text-orange-500" />
              Thông tin cá nhân
            </h2>

            {profileApiError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {profileApiError}
              </div>
            ) : null}
            {profileSaved ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Đã lưu hồ sơ cá nhân.
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1.5">
                  Họ và tên *
                </label>
                <input
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, fullName: e.target.value }))
                  }
                  className={inputClass("fullName")}
                  disabled={savingProfile}
                />
                {profileErrors.fullName ? (
                  <p className="mt-1 text-xs text-red-500">
                    {profileErrors.fullName}
                  </p>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1.5">
                  Email
                </label>
                <input
                  value={form.email}
                  disabled
                  className="w-full rounded-xl border border-border bg-muted/40 py-2.5 px-4 text-sm text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  Số điện thoại
                </label>
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  className={inputClass("phone")}
                  disabled={savingProfile}
                  placeholder="0912 345 678"
                />
                {profileErrors.phone ? (
                  <p className="mt-1 text-xs text-red-500">
                    {profileErrors.phone}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  Giới tính
                </label>
                <select
                  value={form.gender}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, gender: e.target.value }))
                  }
                  className={inputClass("gender")}
                  disabled={savingProfile}
                >
                  <option value="">Chưa chọn</option>
                  <option value="Male">Nam</option>
                  <option value="Female">Nữ</option>
                  <option value="Other">Khác</option>
                </select>
              </div>

              <div className="sm:col-span-2 sm:max-w-xs">
                <label className="block text-xs font-semibold mb-1.5">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, dateOfBirth: e.target.value }))
                  }
                  className={inputClass("dateOfBirth")}
                  disabled={savingProfile}
                />
                {profileErrors.dateOfBirth ? (
                  <p className="mt-1 text-xs text-red-500">
                    {profileErrors.dateOfBirth}
                  </p>
                ) : null}
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {savingProfile ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Lưu hồ sơ
            </button>
          </form>

          <form
            onSubmit={handleChangePassword}
            className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 space-y-4 shadow-sm"
            noValidate
          >
            <h2 className="text-sm font-bold flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-orange-500" />
              Đổi mật khẩu
            </h2>

            {pwApiError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {pwApiError}
              </div>
            ) : null}
            {pwSaved ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Đã đổi mật khẩu.
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  {
                    key: "currentPassword",
                    label: "Mật khẩu hiện tại",
                    autoComplete: "current-password",
                    span: true,
                  },
                  {
                    key: "newPassword",
                    label: "Mật khẩu mới",
                    autoComplete: "new-password",
                    span: false,
                  },
                  {
                    key: "confirmPassword",
                    label: "Xác nhận mật khẩu mới",
                    autoComplete: "new-password",
                    span: false,
                  },
                ] as const
              ).map((f) => (
                <div
                  key={f.key}
                  className={f.span ? "sm:col-span-2" : undefined}
                >
                  <label className="block text-xs font-semibold mb-1.5">
                    {f.label}
                  </label>
                  <input
                    type="password"
                    autoComplete={f.autoComplete}
                    value={pw[f.key]}
                    onChange={(e) =>
                      setPw((p) => ({ ...p, [f.key]: e.target.value }))
                    }
                    className={`w-full rounded-xl border ${
                      pwErrors[f.key]
                        ? "border-red-400"
                        : "border-border focus:border-orange-500/50"
                    } bg-background py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-orange-500/20`}
                    disabled={savingPw}
                  />
                  {pwErrors[f.key] ? (
                    <p className="mt-1 text-xs text-red-500">{pwErrors[f.key]}</p>
                  ) : null}
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={savingPw}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border px-6 py-2.5 text-sm font-bold hover:bg-muted disabled:opacity-50"
            >
              {savingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Đổi mật khẩu
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
