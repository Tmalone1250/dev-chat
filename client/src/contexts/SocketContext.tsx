import { createContext, useContext, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
    auth: {
      token: localStorage.getItem('token'),
    },
    autoConnect: false,
  });

  useEffect(() => {
    if (user) {
      socket.connect();

      socket.on('connect', () => {
        console.log('Connected to socket server');
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    } else {
      socket.disconnect();
    }

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('error');
      socket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
