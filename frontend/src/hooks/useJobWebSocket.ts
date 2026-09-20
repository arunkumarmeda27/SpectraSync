/**
 * useJobWebSocket — React hook for real-time DSP job progress via WebSocket.
 *
 * Connects to /ws/jobs/{jobId} and exposes live stage, progress, and completion
 * status. Automatically reconnects on transient disconnects and cleans up on
 * unmount.
 */
import { useEffect, useRef, useState } from 'react';

export interface WsJobEvent {
  job_id: number;
  status: 'running' | 'completed' | 'failed' | 'connected';
  stage?: string;
  progress?: number;
  message?: string;
  error?: string;
  primary_modulation?: string;
  confidence?: number;
}

export type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'completed' | 'failed';

export function useJobWebSocket(jobId: number | null) {
  const [lastEvent, setLastEvent] = useState<WsJobEvent | null>(null);
  const [wsStatus, setWsStatus] = useState<WsStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnect = useRef(true);

  useEffect(() => {
    if (!jobId) return;

    shouldReconnect.current = true;

    const connect = () => {
      if (!shouldReconnect.current) return;

      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const host = window.location.host;
      const url = `${proto}://${host}/ws/jobs/${jobId}`;

      setWsStatus('connecting');
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus('connected');
      };

      ws.onmessage = (ev) => {
        try {
          const msg: WsJobEvent = JSON.parse(ev.data);
          setLastEvent(msg);
          if (msg.status === 'completed') {
            setWsStatus('completed');
            shouldReconnect.current = false;
            ws.close(1000);
          } else if (msg.status === 'failed') {
            setWsStatus('failed');
            shouldReconnect.current = false;
            ws.close(1000);
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onerror = () => {
        setWsStatus('disconnected');
      };

      ws.onclose = (ev) => {
        if (!shouldReconnect.current || ev.code === 1000) return;
        // Reconnect after 2 s on unexpected close
        setWsStatus('disconnected');
        reconnectTimer.current = setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      shouldReconnect.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close(1000);
      }
    };
  }, [jobId]);

  return { lastEvent, wsStatus };
}
