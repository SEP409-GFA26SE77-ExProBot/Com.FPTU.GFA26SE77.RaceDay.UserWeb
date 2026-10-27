"use client";

import { AlertCircle, MessageSquareText, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function ComplaintError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>Không thể tải khiếu nại</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw />
            Thử lại
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export function ComplaintLoading() {
  return (
    <div
      role="status"
      aria-label="Đang tải khiếu nại"
      className="space-y-4 p-6"
    >
      {[1, 2, 3].map((index) => (
        <Skeleton key={index} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function ComplaintEmpty({
  message = "Các khiếu nại sẽ xuất hiện tại đây sau khi được gửi.",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <MessageSquareText className="size-9 text-muted-foreground" />
      <p className="font-semibold">Chưa có khiếu nại</p>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
