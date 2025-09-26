import { io } from 'socket.io-client';

export const connectSocket = (userId) => {
  if (!userId) return null;

  return io('https://mercadoyangue.netlify.app', { 
    query: { userId } // 🔹 passa o id para o backend
  });
};
