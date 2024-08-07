import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

interface Client {
  userId: string;
  socketId: string;
}

let io: Server;
let socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap>;

export let clients: Client[] = [];

export const socketConfig = {
  initializeIO: (httpServer: import("http").Server) => {
    io = new Server(httpServer, { cors: { origin: "*" } });
    return io;
  },
  initializeSocket: (
    newSocket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap>,
  ) => {
    socket = newSocket;
    return socket;
  },
  getIO: () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
  },
  getSocket: () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return socket;
  },
};

export const addSocketClient = (userId: string, socketId: string) => {
  const existingUser = clients.find((user) => user.userId === userId);

  if (existingUser) existingUser.socketId = socketId;
  else clients.push({ userId, socketId });
};

export const removeSocketClient = (userId: string) => {
  let removedClient: Client = { socketId: "", userId: "" };

  clients = clients.filter((client) => {
    if (client.userId !== userId) {
      return true;
    }
    removedClient = client;
    return false;
  });

  return removedClient;
};

export const getSocketClient = (userId: string) =>
  clients.find((client) => client.userId === userId)?.socketId;
