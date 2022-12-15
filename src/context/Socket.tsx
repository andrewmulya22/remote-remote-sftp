import { showNotification } from "@mantine/notifications";
import { IconX } from "@tabler/icons";
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
        const socketConnection = socketIO(URL);
        setConnection(socketConnection);
      } catch (err) {
        showNotification({
          title: "Connection Error",
          message: "Cant connect to server",
          color: "red",
          icon: <IconX />,
        });
      }
  }, [URL]);

  return (
    <SocketContext.Provider value={connection}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
