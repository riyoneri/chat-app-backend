import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
let io: Server;
let socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

export const config = {
  initializeIO: (httpServer: import("http").Server) => {
    io = new Server(httpServer, { cors: { origin: "*" } });
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
