"use client";

import { useCallback, useEffect, useRef } from "react";
import type { NotificationType } from "@prisma/client";

export type SseNotificationPayload = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  href: string | null;
  createdAt: string;
  readAt: string | null;
  storeId: string | null;
  userId: string | null;
  data: unknown | null;
};

type Options = {
  onNotification: (notification: SseNotificationPayload) => void;
  /** Set to false to disable the hook (e.g. keep polling-only during gradual rollout) */
  enabled?: boolean;
};

const SSE_URL = "/api/sse";
const RECONNECT_BASE_MS = 3_000;
const RECONNECT_MAX_MS = 30_000;

export function useSseNotifications({ onNotification, enabled = true }: Options) {
  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;

  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const mountedRef = useRef(true);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    clearReconnectTimer();
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  }, [clearReconnectTimer]);

  const connect = useCallback(() => {
    if (!mountedRef.current || !enabled) return;
    disconnect();

    const es = new EventSource(SSE_URL);
    esRef.current = es;

    es.addEventListener("connected", () => {
      reconnectAttemptsRef.current = 0;
    });

    es.addEventListener("notification", (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data as string) as SseNotificationPayload;
        onNotificationRef.current(payload);
      } catch {
        // malformed event — ignore
      }
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;

      if (!mountedRef.current) return;

      // Exponential back-off capped at RECONNECT_MAX_MS
      const attempts = reconnectAttemptsRef.current;
      const delay = Math.min(RECONNECT_BASE_MS * 2 ** attempts, RECONNECT_MAX_MS);
      reconnectAttemptsRef.current = attempts + 1;

      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, delay);
    };
  }, [enabled, disconnect]);

  useEffect(() => {
    mountedRef.current = true;

    if (enabled) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [enabled, connect, disconnect]);
}
