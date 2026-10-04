'use client';

import { io, Socket } from 'socket.io-client';
import { api } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    socket = io(socketUrl, {
      auth: (cb) => {
        cb({ token: api.getToken() });
      },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('📡 Connected to NavDrishtiAI Realtime Gateway');
    });

    socket.on('connect_error', (err) => {
      console.warn('Realtime connection error:', err.message);
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
