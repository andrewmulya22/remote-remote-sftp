import React, { useEffect, useState, createContext, ReactNode } from "react";
import { useRecoilValue } from "recoil";
import socketIO, { Socket } from "socket.io-client";
import { URLState } from "../atoms/URLState";

export const SocketContext = createContext<Socket | null>(null);

const SocketProvider = ({ children }: { children: ReactNode }) => {
  const URL = useRecoilValue(URLState);
  const [connection, setConnection] = useState<Socket | null>(null);

  useEffect(() => {
    if (URL)
      try {
        const socketConnection = socketIO("http://localhost:5000");
        setConnection(socketConnection);
      } catch (err) {
        console.log(err);
      }
  }, [URL]);

  return (
    <SocketContext.Provider value={connection}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
