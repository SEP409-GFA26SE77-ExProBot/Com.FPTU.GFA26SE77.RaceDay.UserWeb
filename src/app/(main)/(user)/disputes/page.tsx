"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  LogIn,
  MessageSquareText,
} from "lucide-react";
import { getMyComplaints } from "@/api/complaints";
import { getRecentJoinedEvents } from "@/api/disputes";
import { getMyRegistrations } from "@/api/events";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ComplaintStatusBadge from "@/components/complaints/ComplaintStatusBadge";
import ComplaintPagination from "@/components/complaints/ComplaintPagination";
import {
  ComplaintEmpty,
  ComplaintError,
  ComplaintLoading,
} from "@/components/complaints/ComplaintFeedback";
import { useComplaintResource } from "@/components/complaints/use-complaint-resource";
import { complaintDetailHref } from "@/lib/complaints";
import { PAGE_SHELL_NARROW } from "@/lib/page-shell";
import { useAuthStore } from "@/stores/auth-store";

export default function DisputesPage() {
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.isInitialized);
  if (!initialized) return <ComplaintLoading />;
  if (!user)
    return (
      <div className={`${PAGE_SHELL_NARROW} py-12`}>
        <Card>
          <CardHeader>
            <CardTitle>Đăng nhập để xem khiếu nại</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login?from=/disputes">
                <LogIn />
                Đăng nhập
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  return <RunnerComplaints key={user.id} />;
}

function RunnerComplaints() {
  const [page, setPage] = useState(1);
  const [eventPage, setEventPage] = useState(1);
  const fetchList = useCallback(() => getMyComplaints(page, 10), [page]);
  const fetchRecent = useCallback(
    () => getRecentJoinedEvents(eventPage, 4),
    [eventPage],
  );
  const list = useComplaintResource(`mine:${page}`, fetchList);
  const recent = useComplaintResource(`recent:${eventPage}`, fetchRecent);
  const registrations = useComplaintResource(
    "registrations",
    getMyRegistrations,
  );

  return (
    <div className={`${PAGE_SHELL_NARROW} space-y-7 py-8`}>
      <div className="flex items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
          <MessageSquareText className="size-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-600">
            Hỗ trợ vận động viên
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Khiếu nại của tôi
          </h1>
        </div>
      </div>
      <Card className="overflow-hidden shadow-none">
        <CardHeader>
          <CardTitle>Danh sách khiếu nại</CardTitle>
          <CardDescription>
            Chọn tiêu đề để xem nội dung và phản hồi từ ban tổ chức.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {list.loading ? (
            <ComplaintLoading />
          ) : list.error ? (
            <div className="p-5">
              <ComplaintError message={list.error} onRetry={list.reload} />
            </div>
          ) : !list.data?.items.length ? (
            <ComplaintEmpty />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="pl-6">Giải chạy</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead className="pr-6 text-right">
                      Trạng thái
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.data.items.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell className="max-w-64 whitespace-normal pl-6 py-5 text-muted-foreground">
                        {complaint.eventName}
                      </TableCell>
                      <TableCell className="min-w-48 whitespace-normal font-medium">
                        <Link
                          href={complaintDetailHref(complaint.id)}
                          className="inline-flex items-center gap-2 hover:text-orange-600 hover:underline"
                        >
                          {complaint.title}
                          <ArrowUpRight className="size-3.5 shrink-0" />
                        </Link>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <ComplaintStatusBadge status={complaint.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ComplaintPagination
                page={page}
                pageSize={10}
                totalCount={list.data.totalCount}
                onChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
      <section className="space-y-4" aria-labelledby="recent-events-heading">
        <div>
          <h2 id="recent-events-heading" className="text-lg font-semibold">
            Gửi khiếu nại mới
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Chọn cự ly của giải bạn đã tham gia trong 1 tháng gần đây.
          </p>
        </div>
        {recent.loading || registrations.loading ? (
          <ComplaintLoading />
        ) : recent.error || registrations.error ? (
          <ComplaintError
            message={
              recent.error ||
              registrations.error ||
              "Không tải được các giải đã tham gia."
            }
            onRetry={() => {
              recent.reload();
              registrations.reload();
            }}
          />
        ) : !recent.data?.items.length ? (
          <Card className="shadow-none">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Bạn chưa có đăng ký đã xác nhận hoặc đã hoàn thành cho giải diễn
              ra trong 1 tháng gần đây.{" "}
              <Button variant="link" asChild>
                <Link href="/registered-events">Xem giải đã đăng ký</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {recent.data.items.map((event) => {
                const owned = (registrations.data ?? []).filter(
                  (registration) =>
                    registration.eventId === event.id &&
                    ["confirmed", "finished"].includes(
                      registration.status.toLowerCase(),
                    ),
                );
                return (
                  <Card key={event.id} className="shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base leading-snug">
                        {event.name}
                      </CardTitle>
                      <CardDescription>{event.location}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="size-3.5" />
                        {new Date(`${event.date}T00:00:00`).toLocaleDateString(
                          "vi-VN",
                        )}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {owned.map((registration) => (
                          <Button
                            key={registration.id}
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link
                              href={`/dispute/${event.id}?distanceId=${registration.distanceId}`}
                            >
                              Khiếu nại ·{" "}
                              {registration.distanceName ||
                                `${registration.distanceKm ?? ""} km`}
                              <ArrowUpRight />
                            </Link>
                          </Button>
                        ))}
                      </div>
                      {!owned.length && (
                        <p className="text-xs text-muted-foreground">
                          Không có đăng ký phù hợp để gửi khiếu nại.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <ComplaintPagination
              page={eventPage}
              pageSize={4}
              totalCount={recent.data.totalCount}
              onChange={setEventPage}
              itemLabel="giải chạy"
            />
          </>
        )}
      </section>
    </div>
  );
}
