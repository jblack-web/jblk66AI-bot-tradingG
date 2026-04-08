import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';

let socketInstance = null;

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(WS_URL, { autoConnect: false, transports: ['websocket'] });
  }
  return socketInstance;
}

export function useWebSocket(onPriceUpdate, onTradeUpdate, onNotification) {
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('subscribe', 'prices');
      socket.emit('subscribe', 'trades');
      socket.emit('subscribe', 'notifications');
    });

    if (onPriceUpdate) socket.on('price_update', onPriceUpdate);
    if (onTradeUpdate) socket.on('trade_update', onTradeUpdate);
    if (onNotification) socket.on('notification', onNotification);

    return () => {
      socket.emit('unsubscribe', 'prices');
      socket.emit('unsubscribe', 'trades');
      socket.emit('unsubscribe', 'notifications');
      socket.disconnect();
    };
  }, [onPriceUpdate, onTradeUpdate, onNotification]);

  const subscribe = useCallback((room) => {
    socketRef.current?.emit('subscribe', room);
  }, []);

  const unsubscribe = useCallback((room) => {
    socketRef.current?.emit('unsubscribe', room);
  }, []);

  return { subscribe, unsubscribe };
}
