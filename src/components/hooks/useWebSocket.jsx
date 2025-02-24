// src/hooks/useWebSocket.js
import { useEffect, useRef, useCallback } from 'react';
import { useData } from '../stores/DataContext';

export default function useWebSocket(url) {
  const ws = useRef(null);
  const { dispatch } = useData();

  const connect = useCallback(() => {
    ws.current = new WebSocket(url);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      dispatch({ type: 'WS_MESSAGE', payload: data });
    };

    ws.current.onclose = () => {
      setTimeout(connect, 1000);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.current?.close();
    };
  }, [url, dispatch]);

  useEffect(() => {
    connect();
    return () => ws.current?.close();
  }, [connect]);

  const send = useCallback((data) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  return { send };
}