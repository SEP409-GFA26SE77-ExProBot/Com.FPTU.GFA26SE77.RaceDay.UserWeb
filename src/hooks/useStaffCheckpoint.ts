"use client";

import { useEffect, useState } from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { fetchHubAccessToken, simulationHubUrl } from "@/api/simulation";
import { getStaffCheckpoint, type StaffCheckpointSnapshot } from "@/api/staff-simulation";
import { getApiErrorMessage } from "@/lib/error";

export function useStaffCheckpoint(eventId: string, retry: number) {
  const source = `${eventId}:${retry}`;
  const [state, setState] = useState<{ source: string; snapshot: StaffCheckpointSnapshot | null; error: string; connected: boolean }>({
    source, snapshot: null, error: "", connected: false,
  });
  useEffect(() => {
    let disposed = false;
    let subscription: { dispose: () => void } | undefined;
    let connection: ReturnType<HubConnectionBuilder["build"]> | undefined;
    const accept = (next: StaffCheckpointSnapshot) => {
      if (disposed) return;
      setState(current => ({
        source, error: "", connected: current.source === source && current.connected,
        snapshot: current.source === source && current.snapshot?.runId === next.runId
          && current.snapshot?.checkpoint.id === next.checkpoint.id && current.snapshot.version > next.version
          ? current.snapshot : next,
      }));
    };
    const fail = (message: string) => {
      if (disposed) return;
      // Do not retain private checkpoint data after permission loss.
      setState({ source, error: message, connected: false, snapshot: null });
    };
    const subscribe = () => {
      subscription?.dispose();
      subscription = connection!.stream<StaffCheckpointSnapshot>("WatchCheckpoint", eventId).subscribe({
        next: next => { accept(next); if (!disposed) setState(current => ({ ...current, connected: true })); },
        error: e => fail(e.message || "Không thể theo dõi checkpoint. Vui lòng thử lại."),
        complete: () => { if (!disposed) setState(current => ({ ...current, connected: false })); },
      });
    };
    void (async () => {
      try {
        accept(await getStaffCheckpoint(eventId));
        if (disposed) return;
        connection = new HubConnectionBuilder().withUrl(simulationHubUrl(), {
          accessTokenFactory: fetchHubAccessToken,
        }).withAutomaticReconnect([0, 1000, 3000, 5000]).configureLogging(LogLevel.Warning).build();
        connection.onreconnecting(() => {
          if (!disposed) setState({ source, error: "", connected: false, snapshot: null });
        });
        connection.onreconnected(() => { if (!disposed) subscribe(); });
        connection.onclose(() => fail("Kết nối đã đóng. Bấm kết nối lại để nhận dữ liệu mới."));
        await connection.start();
        if (disposed) { await connection.stop(); return; }
        subscribe();
      } catch (e) { fail(getApiErrorMessage(e, "Không mở được checkpoint. Kiểm tra phân công và cấu hình simulation.")); }
    })();
    return () => {
      disposed = true;
      subscription?.dispose();
      void connection?.stop();
    };
  }, [eventId, source]);
  return state.source === source ? state : { snapshot: null, connected: false, error: "" };
}
