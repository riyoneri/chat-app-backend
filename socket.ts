import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
let io: Server;
let socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

import { instrument } from "@socket.io/admin-ui";

export const socketDatabase: { users: { userId: string; socketId: string }[] } =
  {
    users: [],
  };

export const ioConfig = {
  initializeIO: (httpServer: import("http").Server) => {
    io = new Server(httpServer, {
      cors: {
        origin: [process.env.CLIENT_URL!],
        credentials: true,
      },
    });
    instrument(io, {
      auth: false,
    });
    return io;
  },
  initializeSocket: (
    newSocket: Socket<
      DefaultEventsMap,
      DefaultEventsMap,
      DefaultEventsMap,
      any
    >,
  ) => {
    socket = newSocket;
    return socket;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
  getSocket: () => {
    if (!socket) {
      throw new Error("Socket.io not initialized!");
    }
    return socket;
  },
};

export const saveSocketClient = ({
  socketId,
  userId,
}: {
  userId: string;
  socketId: string;
}) => {
  const existingUser = socketDatabase.users.find(
    (user) => user.userId === userId,
  );

  if (existingUser) existingUser.socketId = socketId;
  else socketDatabase.users.push({ userId, socketId });
};

export const removeSocketClient = (socketId: string) => {
  const removedClient = socketDatabase.users.find(
    (user) => user.socketId === socketId,
  );

  socketDatabase.users = socketDatabase.users.filter(
    (user) => user.socketId !== socketId,
  );

  return removedClient;
};

export const findClientSocket = (userId: string) => {
  return (
    socketDatabase.users.find((user) => user.userId === userId)?.socketId ?? ""
  );
};
