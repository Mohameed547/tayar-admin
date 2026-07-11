import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAppSelector } from "../../store";

interface SocketContextProps {
  socket: Socket | null;
  isConnected: boolean;
  registerListener: <T>(event: string, callback: (data: T) => void) => () => void;
}

const SocketContext = createContext<SocketContextProps | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api";
const SOCKET_URL = BASE_URL.replace("/api", "");

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const token = useAppSelector((state) => state.auth.token);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<{ [event: string]: Set<Function> }>({});

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on("connect", () => {
      console.log("Admin Socket.IO connected");
      setIsConnected(true);

      // Re-bind all active listeners on connection/reconnection
      Object.keys(listenersRef.current).forEach((event) => {
        socketInstance.off(event);
        socketInstance.on(event, (data: any) => {
          listenersRef.current[event]?.forEach((cb) => {
            try {
              cb(data);
            } catch (err) {
              console.error(`Error in admin socket listener callback for ${event}:`, err);
            }
          });
        });
      });
    });

    socketInstance.on("disconnect", () => {
      console.log("Admin Socket.IO disconnected");
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Admin Socket connection error:", error);
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token]);

  const registerListener = useCallback(
    <T,>(event: string, callback: (data: T) => void) => {
      if (!listenersRef.current[event]) {
        listenersRef.current[event] = new Set();
      }

      const callbacks = listenersRef.current[event];
      if (callbacks.has(callback)) return () => {};

      callbacks.add(callback);

      // If it's the first listener, register with the socket if it's already active
      if (callbacks.size === 1) {
        const currentSocket = socketRef.current;
        if (currentSocket) {
          currentSocket.on(event, (data: any) => {
            listenersRef.current[event]?.forEach((cb) => {
              try {
                cb(data);
              } catch (err) {
                console.error(`Error in socket listener callback for ${event}:`, err);
              }
            });
          });
        }
      }

      return () => {
        const currentCallbacks = listenersRef.current[event];
        if (currentCallbacks) {
          currentCallbacks.delete(callback);
          if (currentCallbacks.size === 0) {
            const currentSocket = socketRef.current;
            if (currentSocket) {
              currentSocket.off(event);
            }
            delete listenersRef.current[event];
          }
        }
      };
    },
    []
  );

  return (
    <SocketContext.Provider value={{ socket, isConnected, registerListener }}>
      {children}
    </SocketContext.Provider>
  );
};
