import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const connectSocket = (userId) => {
  if (!userId) return null;

  return io(SOCKET_URL, { 
    query: { userId }
  });
};
