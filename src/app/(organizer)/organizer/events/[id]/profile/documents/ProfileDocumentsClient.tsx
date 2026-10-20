"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  FileText,
  Loader2,
  Save,
  Upload,
} from "lucide-react";
import { getEventById } from "@/api/events";
import { uploadOrganizerFile } from "@/api/organizer";
import { updateEventProfile } from "@/api/event-packages";
import EventProfileSectionHeader from "@/components/organizer/EventProfileSectionHeader";
import type { RaceEventDto } from "@/dto/event.dto";
import { getApiErrorMessage } from "@/lib/error";
import {
  LEGACY_OPTIONAL_DOC_KEYS,
  LEGACY_OPTIONAL_DOC_META,
  PROFILE_DOC_TYPES,
} from "@/lib/event-profile-docs";
import { toastError, toastSuccess } from "@/lib/toast";
import { mediaDisplayUrl } from "@/lib/media-url";
import { canEditProfile } from "../_shared";

type DocFile = { fileName: string; fileUrl: string };

export default function ProfileDocumentsClient() {
  const params = useParams();
  const eventId = String(params?.id || "");
  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [files, setFiles] = useState<Record<string, DocFile>>({});

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getEventById(eventId);
        if (cancelled) return;
        setEvent(data);
        const map: Record<string, DocFile> = {};
        for (const d of data.documents || []) {
          if (d.documentKey && d.fileUrl) {
            map[d.documentKey] = {
              fileName: d.fileName || d.title || d.documentKey,
              fileUrl: d.fileUrl,
            };
          }
        }
        setFiles(map);
      } catch (e) {
        if (!cancelled)
          setError(getApiErrorMessage(e, "Không tải được tài liệu."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const handleUpload = useCallback(async (docId: string, file: File) => {
    setUploadingKey(docId);
    try {
      const result = await uploadOrganizerFile(file, "document");
      setFiles((prev) => ({
        ...prev,
        [docId]: {
          fileName: result.fileName || file.name,
          fileUrl: result.fileUrl,
        },
      }));
      toastSuccess("Đã tải lên.");
    } catch (e) {
      toastError(e, "Upload thất bại.");
    } finally {
      setUploadingKey(null);
    }
  }, []);

  const handleSave = async () => {
    if (!event || saving) return;
    setSaving(true);

    try {
      const primary = PROFILE_DOC_TYPES.filter((d) => files[d.id]).map((d) => ({
        documentKey: d.id,
        title: d.title,
        fileName: files[d.id].fileName,
        fileUrl: files[d.id].fileUrl,
        required: d.required,
      }));
      // Giữ file optional cũ nếu chưa chuyển sang `other` — tránh mất dữ liệu khi ReplaceDocuments.
      const legacy = LEGACY_OPTIONAL_DOC_KEYS.filter((k) => files[k]).map(
        (k) => ({
          documentKey: k,
          title: LEGACY_OPTIONAL_DOC_META[k].title,
          fileName: files[k].fileName,
          fileUrl: files[k].fileUrl,
          required: false,
        })
      );
      await updateEventProfile(eventId, { documents: [...primary, ...legacy] });
      const refreshed = await getEventById(eventId);
      setEvent(refreshed);
      toastSuccess("Đã lưu tài liệu.");
    } catch (e) {
      toastError(e, "Lưu thất bại.");
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
  const legacyPresent = LEGACY_OPTIONAL_DOC_KEYS.filter((k) => files[k]);

  return (
    <div className="space-y-6">
      <EventProfileSectionHeader
        eventId={eventId}
        eventName={event.name}
        status={event.status}
        title="Giấy phép & tài liệu"
        description={
          <span>
            Admin chỉ xác minh hồ sơ có tồn tại / mở được. Hai mục bắt buộc khớp
            rule BE trước khi gửi duyệt.
          </span>
        }
        actions={
          editable ? (
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
              Lưu tài liệu
            </button>
          ) : undefined
        }
      />
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-3">
        {PROFILE_DOC_TYPES.map((doc) => {
          const uploaded = files[doc.id];
          return (
            <div
              key={doc.id}
              className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 sm:flex-row sm:items-center"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold">{doc.title}</p>
                  {doc.required ? (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                      Bắt buộc
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {doc.description}
                </p>
                {uploaded && (
                  <a
                    href={mediaDisplayUrl(uploaded.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs font-semibold text-orange-600 hover:underline"
                  >
                    {uploaded.fileName}
                  </a>
                )}
              </div>
              {editable && (
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">
                  {uploadingKey === doc.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  {uploaded ? "Đổi file" : "Tải lên"}
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,image/*"
                    disabled={uploadingKey === doc.id}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleUpload(doc.id, f);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>

      {legacyPresent.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
          <p className="font-bold">Tài liệu tùy chọn đã lưu trước đây</p>
          <p className="mt-1 text-xs text-amber-900/80">
            Vẫn được giữ khi lưu. Nên tải gộp vào «Các loại tài liệu khác» nếu
            muốn gom một file.
          </p>
          <ul className="mt-2 space-y-1 text-xs">
            {legacyPresent.map((k) => (
              <li key={k}>
                <a
                  href={mediaDisplayUrl(files[k].fileUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-orange-700 hover:underline"
                >
                  {LEGACY_OPTIONAL_DOC_META[k].title}: {files[k].fileName}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
