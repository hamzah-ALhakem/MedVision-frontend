import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();
const SOCKET_URL = "http://localhost:5000"; 

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  
  // نقرأ المستخدم
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    // نتصل فقط إذا كان المستخدم موجوداً
    if (user && user.id) {
        console.log("🔌 Initializing Socket for user:", user.id);
        
        const newSocket = io(SOCKET_URL, {
            transports: ['websocket'],
            reconnectionAttempts: 5
        });

        setSocket(newSocket);

        newSocket.on("connect", () => {
            console.log("✅ Connected with ID:", newSocket.id);
            // الانضمام للغرفة فور الاتصال
            newSocket.emit("join_user", user.id);
        });

        return () => newSocket.disconnect();
    }
  }, [user?.id]); // 👈 هذا الاعتماد مهم جداً: سيعيد الاتصال إذا تغير المستخدم (تسجيل دخول)

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);