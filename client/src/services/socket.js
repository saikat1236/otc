import { io } from 'socket.io-client';

// Generate or retrieve persistent user ID
export function getOrCreateUserId() {
  let uid = localStorage.getItem('otc_user_id');
  if (!uid) {
    uid = 'trader_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('otc_user_id', uid);
  }
  return uid;
}

const userId = getOrCreateUserId();

// Determine socket server URL
// In development, Vite proxies or we connect to 5005 directly.
const SOCKET_URL = window.location.port === '3000' 
  ? 'http://localhost:5000' 
  : window.location.origin;

export const socket = io(SOCKET_URL, {
  query: { userId },
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 20,
  reconnectionDelay: 1000
});

export { userId };
