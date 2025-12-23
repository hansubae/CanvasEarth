import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { CanvasObject } from '../types';

interface WebSocketMessage {
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  object?: CanvasObject;
  objectId?: number;
}

interface UseWebSocketProps {
  onMessage: (message: WebSocketMessage) => void;
  enabled?: boolean;
}

const CANVAS_TOPIC = '/topic/canvas';

// Exponential backoff configuration
const INITIAL_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const MAX_RECONNECT_ATTEMPTS = 10; // Maximum reconnection attempts
const BACKOFF_MULTIPLIER = 2; // Double the delay each time

export const useWebSocket = ({ onMessage, enabled = true }: UseWebSocketProps) => {
  const clientRef = useRef<Client | null>(null);
  const reconnectTimeoutRef = useRef<number>();
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectDelayRef = useRef<number>(INITIAL_RECONNECT_DELAY);

  const connect = useCallback(() => {
    if (!enabled) return;

    // Check if max reconnection attempts reached
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[WebSocket] Max reconnection attempts reached. Please refresh the page.');
      return;
    }

    // Get API URL from environment variable
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const wsUrl = `${apiUrl}/ws`;

    console.log('[WebSocket] Connecting to:', wsUrl);
    if (reconnectAttemptsRef.current > 0) {
      console.log(`[WebSocket] Reconnection attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS}`);
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 0, // Disable automatic reconnection (we handle it manually)
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.log('[WebSocket] Connected!');

        // Reset reconnection state on successful connection
        reconnectAttemptsRef.current = 0;
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;

        // Subscribe to canvas updates
        client.subscribe(CANVAS_TOPIC, (message) => {
          try {
            const data: WebSocketMessage = JSON.parse(message.body);
            console.log('[WebSocket] Received message:', data);
            onMessage(data);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        });
      },

      onStompError: (frame) => {
        console.error('[WebSocket] STOMP error:', frame.headers['message']);
        console.error('[WebSocket] Details:', frame.body);
      },

      onWebSocketError: (event) => {
        console.error('[WebSocket] WebSocket error:', event);
      },

      onWebSocketClose: () => {
        console.log('[WebSocket] Connection closed');
      },

      onDisconnect: () => {
        console.log('[WebSocket] Disconnected');

        // Increment reconnection attempts
        reconnectAttemptsRef.current += 1;

        // Check if we should attempt to reconnect
        if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          console.error('[WebSocket] Max reconnection attempts reached. Giving up.');
          return;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          reconnectDelayRef.current,
          MAX_RECONNECT_DELAY
        );

        console.log(`[WebSocket] Reconnecting in ${delay / 1000}s (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);

        // Schedule reconnection with exponential backoff
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);

        // Increase delay for next attempt
        reconnectDelayRef.current = Math.min(
          reconnectDelayRef.current * BACKOFF_MULTIPLIER,
          MAX_RECONNECT_DELAY
        );
      },
    });

    client.activate();
    clientRef.current = client;
  }, [enabled, onMessage]);

  const disconnect = useCallback(() => {
    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // Reset reconnection state
    reconnectAttemptsRef.current = 0;
    reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;

    if (clientRef.current) {
      console.log('[WebSocket] Disconnecting...');
      clientRef.current.deactivate();
      clientRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected: clientRef.current?.connected ?? false,
    disconnect,
    reconnect: connect,
  };
};
