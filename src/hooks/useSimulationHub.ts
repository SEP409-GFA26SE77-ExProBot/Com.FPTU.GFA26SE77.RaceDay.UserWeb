"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import {
  fetchHubAccessToken,
  simulationHubUrl,
  type SimulationRunReplacedDto,
  type SimulationSnapshotDto,
} from "@/api/simulation";

type Handlers = {
  onSnapshot: (snap: SimulationSnapshotDto) => void;
  onRunReplaced: (notice: SimulationRunReplacedDto) => void;
  onStatus?: (status: string) => void;
  onError?: (message: string) => void;
};

/**
 * SignalR cho giả lập đua: JoinRun / LeaveRun + Snapshot / RunReplaced.
 * Không poll REST trong lúc Running.
 */
export function useSimulationHub(handlers: Handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const connectionRef = useRef<HubConnection | null>(null);
  const joinedRunRef = useRef<string | null>(null);
  const startingRef = useRef<Promise<HubConnection> | null>(null);

  const ensureConnection = useCallback(async () => {
    if (
      connectionRef.current &&
      connectionRef.current.state !== HubConnectionState.Disconnected
    ) {
      return connectionRef.current;
    }
    if (startingRef.current) return startingRef.current;

    startingRef.current = (async () => {
      const hubUrl = simulationHubUrl();
      const connection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => fetchHubAccessToken(),
        })
        .withAutomaticReconnect([0, 1000, 2000, 5000, 10000])
        .configureLogging(LogLevel.Warning)
        .build();

      connection.on("Snapshot", (snap: SimulationSnapshotDto) => {
        handlersRef.current.onSnapshot(snap);
      });
      connection.on("RunReplaced", (notice: SimulationRunReplacedDto) => {
        handlersRef.current.onRunReplaced(notice);
      });
      connection.onreconnecting(() => {
        handlersRef.current.onStatus?.("Đang kết nối lại hub…");
      });
      connection.onreconnected(async () => {
        handlersRef.current.onStatus?.("Hub đã kết nối lại.");
        const runId = joinedRunRef.current;
        if (runId) {
          try {
            await connection.invoke("JoinRun", runId);
          } catch (e) {
            handlersRef.current.onError?.(
              e instanceof Error ? e.message : "JoinRun sau reconnect thất bại."
            );
          }
        }
      });
      connection.onclose(() => {
        handlersRef.current.onStatus?.("Hub đã đóng.");
      });

      await connection.start();
      connectionRef.current = connection;
      handlersRef.current.onStatus?.("Hub đã kết nối.");
      return connection;
    })();

    try {
      return await startingRef.current;
    } finally {
      startingRef.current = null;
    }
  }, []);

  const joinRun = useCallback(
    async (runId: string) => {
      const connection = await ensureConnection();
      if (joinedRunRef.current && joinedRunRef.current !== runId) {
        try {
          await connection.invoke("LeaveRun", joinedRunRef.current);
        } catch {
          /* leave best-effort */
        }
      }
      await connection.invoke("JoinRun", runId);
      joinedRunRef.current = runId;
    },
    [ensureConnection]
  );

  const leaveRun = useCallback(async (runId?: string) => {
    const connection = connectionRef.current;
    const id = runId ?? joinedRunRef.current;
    if (!connection || !id) return;
    try {
      await connection.invoke("LeaveRun", id);
    } catch {
      /* ignore */
    }
    if (joinedRunRef.current === id) joinedRunRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      const connection = connectionRef.current;
      connectionRef.current = null;
      joinedRunRef.current = null;
      if (connection) {
        void connection.stop();
      }
    };
  }, []);

  return { joinRun, leaveRun, ensureConnection };
}
