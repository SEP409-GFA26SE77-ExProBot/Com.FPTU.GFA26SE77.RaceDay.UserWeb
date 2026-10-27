"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  ChevronRight,
  Home,
  ListFilter,
  MessageSquareText,
  MoreHorizontal,
  RefreshCw,
  X,
} from "lucide-react";
import { getComplaintEvents, getOrganizerComplaints } from "@/api/complaints";
import { COMPLAINT_STATUSES, type ComplaintStatus } from "@/dto/complaint.dto";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ComplaintStatusBadge from "./ComplaintStatusBadge";
import ComplaintPagination from "./ComplaintPagination";
import {
  ComplaintEmpty,
  ComplaintError,
  ComplaintLoading,
} from "./ComplaintFeedback";
import { useComplaintResource } from "./use-complaint-resource";
import {
  complaintDetailHref,
  formatComplaintDate,
  isComplaintId,
} from "@/lib/complaints";

export default function OrganizerComplaints({
  eventId: initialEventId,
}: {
  eventId?: string;
}) {
  const router = useRouter();
  const eventId =
    initialEventId && isComplaintId(initialEventId) ? initialEventId : "all";
  const [status, setStatus] = useState<ComplaintStatus | "all">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const fetchList = useCallback(async () => {
    if (fromDate && toDate && fromDate > toDate)
      throw new Error("Ngày kết thúc phải từ ngày bắt đầu trở đi.");
    return getOrganizerComplaints({
      eventId: eventId === "all" ? null : eventId,
      status: status === "all" ? null : status,
      fromDate: fromDate ? `${fromDate}T00:00:00.000Z` : null,
      toDate: toDate ? `${toDate}T23:59:59.999Z` : null,
      page,
      pageSize,
    });
  }, [eventId, status, fromDate, toDate, page, pageSize]);
  const list = useComplaintResource(
    `${eventId}:${status}:${fromDate}:${toDate}:${page}:${pageSize}`,
    fetchList,
  );
  const events = useComplaintResource("organizer-events", getComplaintEvents);
  const filtered = eventId !== "all" || status !== "all" || fromDate || toDate;

  function changeEvent(value: string) {
    setPage(1);
    router.replace(
      value === "all"
        ? "/organizer/disputes"
        : `/organizer/disputes?eventId=${encodeURIComponent(value)}`,
    );
  }

  function clearFilters() {
    setStatus("all");
    setFromDate("");
    setToDate("");
    setPage(1);
    if (eventId !== "all") router.replace("/organizer/disputes");
  }

  return (
    <div className="space-y-5 py-2">
      <nav
        aria-label="Đường dẫn"
        className="flex items-center gap-2 text-xs text-muted-foreground"
      >
        <Link
          href="/my-events"
          className="inline-flex items-center gap-1.5 hover:text-foreground"
        >
          <Home className="size-3.5" />
          Quản lý giải
        </Link>
        <ChevronRight className="size-3" />
        <span className="font-medium text-foreground">Khiếu nại</span>
      </nav>
      <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
              <MessageSquareText className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Danh sách khiếu nại
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {list.data
                  ? `${list.data.totalCount} khiếu nại · ${list.data.pendingCount ?? 0} chờ xử lý`
                  : "Theo dõi và phản hồi khiếu nại của vận động viên"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={list.reload}
            disabled={list.loading}
          >
            <RefreshCw className={list.loading ? "animate-spin" : ""} />
            Làm mới
          </Button>
        </div>
        <CardContent className="space-y-5 p-0">
          <div className="flex flex-wrap items-end gap-3 px-6">
            <div className="min-w-44 flex-1 space-y-1.5">
              <Label
                htmlFor="complaints-event"
                className="text-xs text-muted-foreground"
              >
                Giải chạy
              </Label>
              <Select
                value={eventId}
                onValueChange={changeEvent}
                disabled={events.loading}
              >
                <SelectTrigger
                  id="complaints-event"
                  className="w-full max-w-80"
                >
                  <SelectValue placeholder="Tất cả giải" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả giải</SelectItem>
                  {(events.data ?? []).map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                  {eventId !== "all" &&
                    !events.data?.some((event) => event.id === eventId) && (
                      <SelectItem value={eventId}>Giải đang chọn</SelectItem>
                    )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="complaints-status"
                className="text-xs text-muted-foreground"
              >
                Trạng thái
              </Label>
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value as ComplaintStatus | "all");
                  setPage(1);
                }}
              >
                <SelectTrigger id="complaints-status" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {COMPLAINT_STATUSES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="complaints-from"
                className="text-xs text-muted-foreground"
              >
                Từ ngày (UTC)
              </Label>
              <Input
                id="complaints-from"
                type="date"
                value={fromDate}
                onChange={(event) => {
                  setFromDate(event.target.value);
                  setPage(1);
                }}
                className="w-40"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="complaints-to"
                className="text-xs text-muted-foreground"
              >
                Đến ngày (UTC)
              </Label>
              <Input
                id="complaints-to"
                type="date"
                min={fromDate || undefined}
                value={toDate}
                onChange={(event) => {
                  setToDate(event.target.value);
                  setPage(1);
                }}
                className="w-40"
              />
            </div>
            {filtered && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X />
                Xóa bộ lọc
              </Button>
            )}
          </div>
          {events.error && (
            <div className="px-6">
              <ComplaintError message={events.error} onRetry={events.reload} />
            </div>
          )}
          {list.loading ? (
            <ComplaintLoading />
          ) : list.error ? (
            <div className="px-6 pb-6">
              <ComplaintError message={list.error} onRetry={list.reload} />
            </div>
          ) : !list.data?.items.length ? (
            <ComplaintEmpty
              message={
                filtered
                  ? "Không có khiếu nại khớp bộ lọc hiện tại."
                  : "Các khiếu nại gửi đến giải bạn quản lý sẽ xuất hiện tại đây."
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-y bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className="min-w-56 pl-6">Tiêu đề</TableHead>
                    <TableHead className="min-w-48">Giải chạy</TableHead>
                    <TableHead>Cự ly</TableHead>
                    <TableHead className="min-w-40">Ngày gửi</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="w-14 pr-6">
                      <span className="sr-only">Thao tác</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.data.items.map((complaint) => {
                    const href = complaintDetailHref(
                      complaint.id,
                      complaint.eventId,
                      true,
                    );
                    return (
                      <TableRow
                        key={complaint.id}
                        className="hover:bg-orange-50/40"
                      >
                        <TableCell className="max-w-80 whitespace-normal py-4 pl-6">
                          <Link
                            href={href}
                            className="line-clamp-2 font-medium hover:text-orange-600 hover:underline"
                          >
                            {complaint.title}
                          </Link>
                          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                            #{complaint.id.slice(0, 8)}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-64 whitespace-normal">
                          <Badge
                            variant="outline"
                            className="h-auto rounded-lg py-1 whitespace-normal font-normal"
                          >
                            {complaint.eventName}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {complaint.distanceName}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <time dateTime={complaint.createdAtUtc}>
                            {formatComplaintDate(complaint.createdAtUtc)}
                          </time>
                        </TableCell>
                        <TableCell>
                          <ComplaintStatusBadge status={complaint.status} />
                        </TableCell>
                        <TableCell className="pr-6">
                          <Button variant="ghost" size="icon-sm" asChild>
                            <Link
                              href={href}
                              aria-label={`Xem và xử lý: ${complaint.title}`}
                            >
                              <MoreHorizontal />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="flex items-center justify-end gap-2 px-6 text-xs text-muted-foreground">
                <ListFilter className="size-3.5" />
                <Label
                  htmlFor="complaints-page-size"
                  className="text-xs font-normal"
                >
                  Số dòng mỗi trang
                </Label>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger
                    id="complaints-page-size"
                    size="sm"
                    className="w-16"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50].map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ComplaintPagination
                page={page}
                pageSize={pageSize}
                totalCount={list.data.totalCount}
                onChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
