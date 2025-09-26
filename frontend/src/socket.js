import { io } from 'socket.io-client';

export const connectSocket = (userId) => {
  if (!userId) return null;

  return io('https://mercadoyangue-i3in.onrender.com', { 
    query: { userId } // 🔹 passa o id para o backend
  });
};
