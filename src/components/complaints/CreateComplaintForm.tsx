"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowLeft, AlertCircle, Loader2, Send } from "lucide-react";
import { createComplaint } from "@/api/complaints";
import { getMyRegistrations } from "@/api/events";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ComplaintError, ComplaintLoading } from "./ComplaintFeedback";
import { useComplaintResource } from "./use-complaint-resource";
import {
  complaintDetailHref,
  complaintFormError,
  isComplaintId,
} from "@/lib/complaints";
import { getApiErrorMessage } from "@/lib/error";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";
import type { RegistrationDto } from "@/dto/event.dto";

export default function CreateComplaintForm({
  eventId,
  distanceId,
}: {
  eventId: string;
  distanceId?: string;
}) {
  if (!isComplaintId(eventId))
    return (
      <div className={`${PAGE_SHELL_FORM} py-8`}>
        <ComplaintError message="Mã giải chạy không hợp lệ." />
        <Button variant="link" asChild>
          <Link href="/disputes">Về danh sách khiếu nại</Link>
        </Button>
      </div>
    );
  return (
    <CreateComplaintContext
      key={`${eventId}:${distanceId ?? ""}`}
      eventId={eventId}
      distanceId={distanceId}
    />
  );
}

function CreateComplaintContext({
  eventId,
  distanceId,
}: {
  eventId: string;
  distanceId?: string;
}) {
  const registrations = useComplaintResource(
    "create-registration",
    getMyRegistrations,
  );
  const eligible = (registrations.data ?? []).filter(
    (registration) =>
      registration.eventId === eventId &&
      ["confirmed", "finished"].includes(registration.status.toLowerCase()),
  );
  const selected = distanceId
    ? eligible.find((registration) => registration.distanceId === distanceId)
    : eligible.length === 1
      ? eligible[0]
      : undefined;
  return (
    <div className={`${PAGE_SHELL_FORM} max-w-3xl space-y-5 py-8`}>
      <Button variant="ghost" asChild>
        <Link href="/disputes">
          <ArrowLeft />
          Khiếu nại của tôi
        </Link>
      </Button>
      {registrations.loading ? (
        <ComplaintLoading />
      ) : registrations.error ? (
        <ComplaintError
          message={registrations.error}
          onRetry={registrations.reload}
        />
      ) : selected ? (
        <ComplaintForm registration={selected} />
      ) : (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>
              {eligible.length > 1 && !distanceId
                ? "Chọn cự ly đã tham gia"
                : "Không có đăng ký phù hợp"}
            </CardTitle>
            <CardDescription>
              Chỉ có thể gửi khiếu nại cho cự ly bạn đã được xác nhận hoặc đã
              hoàn thành.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {eligible.map((registration) => (
              <Button key={registration.id} variant="outline" asChild>
                <Link
                  href={`/dispute/${eventId}?distanceId=${registration.distanceId}`}
                >
                  {registration.distanceName || "Cự ly đã đăng ký"}
                </Link>
              </Button>
            ))}
            {!eligible.length && (
              <Button variant="outline" asChild>
                <Link href="/disputes">Chọn giải khác</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ComplaintForm({ registration }: { registration: RegistrationDto }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [evidenceLinks, setEvidenceLinks] = useState(["", "", "", "", ""]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const input = {
      title: title.trim(),
      content: content.trim(),
      evidenceLinks: evidenceLinks.map((link) => link.trim()).filter(Boolean),
    };
    const validation = complaintFormError(input);
    if (validation) {
      setError(validation);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const complaint = await createComplaint({
        ...input,
        eventId: registration.eventId,
        distanceId: registration.distanceId,
      });
      router.replace(complaintDetailHref(complaint.id));
    } catch (failure) {
      setError(
        getApiErrorMessage(
          failure,
          "Không thể gửi khiếu nại. Vui lòng thử lại.",
        ),
      );
      setSubmitting(false);
    }
  }
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-xl">Gửi khiếu nại</CardTitle>
        <CardDescription>
          {registration.eventName || "Giải chạy đã tham gia"} ·{" "}
          {registration.distanceName || "Cự ly đã đăng ký"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-6">
          <fieldset disabled={submitting} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="complaint-title">
                Tiêu đề <span className="text-destructive">*</span>
              </Label>
              <Input
                id="complaint-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={200}
                required
                placeholder="Ví dụ: Sai kết quả thời gian chạy"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complaint-content">
                Nội dung <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="complaint-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={2000}
                required
                rows={6}
                placeholder="Mô tả vấn đề và thông tin cần ban tổ chức kiểm tra."
              />
              <p className="text-right text-xs text-muted-foreground">
                {content.length}/2000 ký tự
              </p>
            </div>
            <Separator />
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold">Link bằng chứng</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cần ít nhất 1 link, tối đa 5 link. Đảm bảo ban tổ chức có
                  quyền xem tài liệu.
                </p>
              </div>
              {evidenceLinks.map((link, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`complaint-evidence-${index}`}>
                    Bằng chứng {index + 1}
                    {index === 0 ? (
                      <span className="text-destructive"> *</span>
                    ) : (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        (tùy chọn)
                      </span>
                    )}
                  </Label>
                  <Input
                    id={`complaint-evidence-${index}`}
                    type="url"
                    inputMode="url"
                    value={link}
                    required={index === 0}
                    placeholder="https://drive.google.com/..."
                    onChange={(event) =>
                      setEvidenceLinks((previous) =>
                        previous.map((value, position) =>
                          position === index ? event.target.value : value,
                        ),
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </fieldset>
          {error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Không thể gửi khiếu nại</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              disabled={submitting}
              onClick={() => router.push("/disputes")}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <Send />}
              {submitting ? "Đang gửi…" : "Gửi khiếu nại"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
