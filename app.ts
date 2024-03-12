import bodyParser from "body-parser";
import cors from "cors";
import { config } from "dotenv";
import express, { Express, NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { connect, isValidObjectId } from "mongoose";
import morgan from "morgan";
import { join } from "node:path";
import { exit } from "node:process";
import userAuthRoute from "./routes/user-auth.route";
import userRoute from "./routes/user.route";
import {
  ioConfig,
  removeSocketClient,
  saveSocketClient,
  socketDatabase,
} from "./socket";
import CustomError from "./util/custom-error";
config();

const MONGODB_URL = process.env.MONGODB_URL;

const app: Express = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(join(process.cwd(), "public")));
app.use(cors());
app.use(morgan("dev"));

app.use("/auth", userAuthRoute);
app.use(userRoute);

app.use(
  (
    error: CustomError,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ) => {
    const { message, errors, status } = error;

    response.status(status || 500).json({ message: errors || message });
  },
);

if (MONGODB_URL)
  connect(MONGODB_URL)
    .then(() => {
      const server = app.listen(5000, () => console.log("[server]: 5000"));
      const io = ioConfig.initializeIO(server);
      io.use((socket, next) => {
        try {
          const token = socket.handshake.auth.token;
          verify(token, process.env.SECRET_KEY!);
          next();
        } catch {
          next(new Error("Not Authenticated"));
        }
      });

      io.on("connection", (socket) => {
        ioConfig.initializeSocket(socket);

        socket.on("initialize", ({ userId }) => {
          if (isValidObjectId(userId)) {
            saveSocketClient({ userId, socketId: socket.id });
            socket.broadcast.emit("status", { type: "active", userId });

            socket.emit(
              "actives",
              socketDatabase.users.map((user) => user.userId),
            );
          }
        });

        socket.on("reconnect", ({ userId }) => {
          if (isValidObjectId(userId)) {
            saveSocketClient({ userId, socketId: socket.id });
            socket.broadcast.emit("status", { type: "active", userId });

            socket.emit(
              "actives",
              socketDatabase.users.map((user) => user.userId),
            );
          }
        });

        socket.on("logout", ({ userId }) => {
          socket.broadcast.emit("status", { type: "inactive", userId });
        });

        socket.on("disconnect", () => {
          const removedClient = removeSocketClient(socket.id);
          socket.broadcast.emit("status", {
            type: "inactive",
            userId: removedClient?.userId,
          });
        });
      });
    })
    // eslint-disable-next-line unicorn/prefer-top-level-await
    .catch(() => exit(1));
