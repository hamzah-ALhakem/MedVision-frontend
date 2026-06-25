import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SOCKET_URL } from '../config/env';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, token } = useAuth(); // Read user and token from AuthContext

  useEffect(() => {
    // Only connect if we have a user AND a token
    if (user && user.id && token) {
        console.log("🔌 Initializing Socket for user:", user.id);
        
        const newSocket = io(SOCKET_URL, {
            transports: ['websocket'],
            reconnectionAttempts: 5,
            auth: { token } // Pass token for backend authentication
        });

        setSocket(newSocket);

        newSocket.on("connect", () => {
            console.log("✅ Connected with ID:", newSocket.id);
            // Server now auto-joins room based on JWT token, no emit needed
        });

        return () => newSocket.disconnect();
    } else if (socket) {
        // Disconnect if user logs out
        socket.disconnect();
        setSocket(null);
    }
  }, [user?.id, token]); 

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);