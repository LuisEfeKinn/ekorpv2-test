'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

export type WsNotification = {
  id: string;
  event: string;
  data: {
    id: number;
    eventKey: string;
    notifiableKey: string;
    subject: string;
    message: string;
    read: boolean;
    createdAt: string;
  };
  receivedAt: Date;
  isRead: boolean;
};

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('accessToken') || sessionStorage.getItem('jwt_access_token') || '';
}

function buildWsUrl(token: string): string {
  const base = CONFIG.serverUrl.replace(/^http/, 'ws').replace(/\/$/, '');
  return `${base}/notifications?token=${encodeURIComponent(token)}`;
}

// ----------------------------------------------------------------------

export function useNotificationsWs() {
  const [notifications, setNotifications] = useState<WsNotification[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  const connect = useCallback(() => {
    if (unmountedRef.current) return;
    const token = getToken();
    if (!token || !CONFIG.serverUrl) return;

    const ws = new WebSocket(buildWsUrl(token));
    wsRef.current = ws;

    ws.onopen = () => {
      if (!unmountedRef.current) setConnected(true);
    };

    ws.onmessage = (evt) => {
      if (unmountedRef.current) return;
      try {
        const msg = JSON.parse(evt.data) as {
          event: string;
          data: {
            id: number;
            eventKey: string;
            notifiableKey: string;
            subject: string;
            message: string;
            read: boolean;
            createdAt: string;
          };
        };
        if (msg.event !== 'notification') return;
        setNotifications((prev) => [
          {
            id: `${Date.now()}-${Math.random()}`,
            event: msg.event,
            data: msg.data,
            receivedAt: new Date(),
            isRead: msg.data.read,
          },
          ...prev,
        ]);
      } catch {
        // ignore malformed frames
      }
    };

    ws.onclose = () => {
      if (unmountedRef.current) return;
      setConnected(false);
      reconnectTimer.current = setTimeout(connect, 5000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    connect();
    return () => {
      unmountedRef.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return { notifications, unreadCount, connected, markAllAsRead, markAsRead, clearAll };
}
