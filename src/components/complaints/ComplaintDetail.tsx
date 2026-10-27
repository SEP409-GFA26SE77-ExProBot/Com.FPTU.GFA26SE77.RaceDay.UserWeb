"use client";

import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ExternalLink,
  Loader2,
  MessageSquareText,
  X,
} from "lucide-react";
import { getComplaintDetail, replyToComplaint } from "@/api/complaints";
import type { ComplaintDto, ReplyComplaintDto } from "@/dto/complaint.dto";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import ComplaintStatusBadge from "./ComplaintStatusBadge";
import { ComplaintError, ComplaintLoading } from "./ComplaintFeedback";
import { useComplaintResource } from "./use-complaint-resource";
import {
  formatComplaintDate,
  isComplaintId,
  safeEvidenceUrl,
} from "@/lib/complaints";
import { getApiErrorMessage } from "@/lib/error";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";

export default function ComplaintDetail({
  complaintId,
  organizer = false,
  eventId,
}: {
  complaintId: string;
  organizer?: boolean;
  eventId?: string;
}) {
  const backHref = organizer
    ? `/organizer/disputes${eventId ? `?eventId=${encodeURIComponent(eventId)}` : ""}`
    : "/disputes";
  return (
    <div
      className={
        organizer
          ? "mx-auto w-full max-w-4xl space-y-5 py-3"
          : `${PAGE_SHELL_FORM} max-w-4xl space-y-5 py-8`
      }
    >
      <Button variant="ghost" asChild>
        <Link href={backHref}>
          <ArrowLeft />
          Danh sách khiếu nại
        </Link>
      </Button>
      {isComplaintId(complaintId) ? (
        <DetailContent
          key={complaintId}
          complaintId={complaintId}
          organizer={organizer}
        />
      ) : (
        <ComplaintError message="Mã khiếu nại không hợp lệ hoặc chưa được cung cấp." />
      )}
    </div>
  );
}

function DetailContent({
  complaintId,
  organizer,
}: {
  complaintId: string;
  organizer: boolean;
}) {
  const fetchDetail = useCallback(
    () => getComplaintDetail(complaintId),
    [complaintId],
  );
  const detail = useComplaintResource(complaintId, fetchDetail);
  const [updated, setUpdated] = useState<ComplaintDto | null>(null);
  const [decision, setDecision] = useState<
    ReplyComplaintDto["decision"] | null
  >(null);
  const [responseContent, setResponseContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyError, setReplyError] = useState("");
  const complaint = updated ?? detail.data;
  async function reply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!decision || submitting) return;
    if (!responseContent.trim()) {
      setReplyError("Vui lòng nhập nội dung phản hồi.");
      return;
    }
    setSubmitting(true);
    setReplyError("");
    try {
      const result = await replyToComplaint(complaintId, {
        decision,
        responseContent: responseContent.trim(),
      });
      setUpdated(result);
      setDecision(null);
      setResponseContent("");
    } catch (failure) {
      setReplyError(
        getApiErrorMessage(
          failure,
          "Không thể gửi phản hồi. Vui lòng thử lại.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }
  if (detail.loading) return <ComplaintLoading />;
  if (detail.error)
    return <ComplaintError message={detail.error} onRetry={detail.reload} />;
  if (!complaint) return <ComplaintError message="Không tìm thấy khiếu nại." />;
  return (
    <>
      <Card className="shadow-none">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Chi tiết khiếu nại
              </p>
              <CardTitle className="break-words text-2xl leading-snug">
                {complaint.title}
              </CardTitle>
            </div>
            <ComplaintStatusBadge status={complaint.status} />
          </div>
          <CardDescription>
            {complaint.eventName} · {complaint.distanceName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <dl className="grid gap-4 rounded-xl bg-muted/50 p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Ngày gửi</dt>
              <dd className="mt-1">
                <time dateTime={complaint.createdAtUtc}>
                  {formatComplaintDate(complaint.createdAtUtc)}
                </time>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Mã khiếu nại</dt>
              <dd className="mt-1 break-all font-mono text-xs">
                {complaint.id}
              </dd>
            </div>
          </dl>
          <section className="space-y-3">
            <h2 className="font-semibold">Nội dung</h2>
            <p className="whitespace-pre-wrap break-words text-sm leading-7 text-foreground/80">
              {complaint.content}
            </p>
          </section>
          <Separator />
          <section className="space-y-3">
            <h2 className="font-semibold">Bằng chứng</h2>
            {complaint.evidenceLinks.length ? (
              <ul className="space-y-2">
                {complaint.evidenceLinks.map((link, index) => {
                  const safeUrl = safeEvidenceUrl(link);
                  return (
                    <li
                      key={`${index}:${link}`}
                      className="min-w-0 rounded-lg border px-3 py-2 text-sm"
                    >
                      {safeUrl ? (
                        <Button
                          variant="link"
                          className="h-auto max-w-full justify-start p-0 text-left"
                          asChild
                        >
                          <a
                            href={safeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="shrink-0" />
                            <span className="truncate">
                              Bằng chứng {index + 1} · {link}
                            </span>
                          </a>
                        </Button>
                      ) : (
                        <span className="break-all text-muted-foreground">
                          Liên kết không hợp lệ: {link}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Không có link bằng chứng.
              </p>
            )}
          </section>
        </CardContent>
      </Card>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquareText className="size-4" />
            Phản hồi từ ban tổ chức
          </CardTitle>
          {complaint.repliedAtUtc && (
            <CardDescription>
              {formatComplaintDate(complaint.repliedAtUtc)}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">
            {complaint.responseContent || "Ban tổ chức chưa gửi phản hồi."}
          </p>
        </CardContent>
      </Card>
      {organizer && complaint.status === "Pending" && (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Xử lý khiếu nại</CardTitle>
            <CardDescription>
              Kiểm tra nội dung và bằng chứng trước khi đưa ra quyết định. Khiếu
              nại đã xử lý sẽ không thể thay đổi quyết định.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap justify-end gap-3">
            <Button
              variant="destructive"
              onClick={() => {
                setReplyError("");
                setDecision("Rejected");
              }}
            >
              <X />
              Từ chối
            </Button>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => {
                setReplyError("");
                setDecision("Accepted");
              }}
            >
              <Check />
              Chấp nhận
            </Button>
          </CardContent>
        </Card>
      )}
      <Dialog
        open={decision !== null}
        onOpenChange={(open) => {
          if (!open && !submitting) {
            setDecision(null);
            setReplyError("");
          }
        }}
      >
        <DialogContent
          className="sm:max-w-lg"
          onInteractOutside={(event) => {
            if (submitting) event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            if (submitting) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {decision === "Accepted"
                ? "Chấp nhận khiếu nại"
                : "Từ chối khiếu nại"}
            </DialogTitle>
            <DialogDescription>
              Nội dung phản hồi sẽ được gửi tới vận động viên cùng quyết định
              của bạn.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={reply} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="complaint-response">
                Nội dung phản hồi <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="complaint-response"
                rows={6}
                maxLength={2000}
                value={responseContent}
                onChange={(event) => setResponseContent(event.target.value)}
                disabled={submitting}
                required
                placeholder="Nhập kết quả kiểm tra và nội dung phản hồi…"
              />
              <p className="text-right text-xs text-muted-foreground">
                {responseContent.length}/2000 ký tự
              </p>
              {!responseContent.trim() && (
                <p className="text-xs text-muted-foreground">
                  Vui lòng nhập nội dung phản hồi để xác nhận quyết định.
                </p>
              )}
            </div>
            {replyError && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>Không thể gửi phản hồi</AlertTitle>
                <AlertDescription>{replyError}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => setDecision(null)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={submitting || !responseContent.trim()}
                variant={decision === "Rejected" ? "destructive" : "default"}
              >
                {submitting && <Loader2 className="animate-spin" />}
                {submitting ? "Đang gửi…" : "Xác nhận và gửi phản hồi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
