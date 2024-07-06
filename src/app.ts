import bodyParser from "body-parser";
import compression from "compression";
import busboy from "connect-busboy";
import cors from "cors";
import { config } from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import { Request as JWTRequest, expressjwt } from "express-jwt";
import helmet from "helmet";
import { verify } from "jsonwebtoken";
import { connect, isValidObjectId } from "mongoose";
import { exit } from "node:process";
import { RateLimiterMemory } from "rate-limiter-flexible";

import User from "./models/user.model";
import chatRoutes from "./routes/chat.route";
import userAuthroute from "./routes/user-auth.route";
import userRoutes from "./routes/user.route";
import {
  addSocketClient,
  clients,
  removeSocketClient,
  socketConfig,
} from "./socket";
import CustomError from "./utils/custom-error";

config();

const MONGODB_URL =
  process.env.NODE_ENV === "development"
    ? process.env.MONGODB_URL_LOCAL
    : process.env.MONGODB_URL;

const app = express();
const port = process.env.PORT || 5000;

const rateLimiter = new RateLimiterMemory({
  points: 6,
  duration: 2,
});

app.use(compression());
app.use(helmet());
app.disable("x-powered-by");
app.use(cors());
app.use(bodyParser.json());

app.use((request: Request, response: Response, next: NextFunction) => {
  rateLimiter
    .consume(request.ip!)
    .then(() => {
      next();
    })
    .catch(() => response.status(429).json({ message: "Too many requests" }));
});

app.use(
  expressjwt({
    secret: process.env.JWT_SECRET_KEY!,
    algorithms: ["HS256"],
  }).unless({ path: /^\/auth/ }),
);

app.use(
  async (request: JWTRequest, _response: Response, next: NextFunction) => {
    try {
      if (request.auth?.id) {
        if (!isValidObjectId(request.auth?.id))
          throw new Error("User id is not valid");

        const user = await User.findById(request.auth.id);

        if (!user) throw new Error("User not found");

        request.user = user;
        return next();
      }

      next();
    } catch {
      const error = new CustomError("Internal server error.", 500);
      next(error);
    }
  },
);

app.use(busboy({ limits: { files: 1, fileSize: 1024 * 1024 * 4 } }));

app.use("/auth", userAuthroute);
app.use("/users", userRoutes);
app.use("/chat", chatRoutes);

app.use((_, response: Response) => {
  response.status(404).json({ message: "URL does not exist" });
});

app.use(
  (error: CustomError, _: Request, response: Response, next: NextFunction) => {
    const { message, errors } = error;
    let { statusCode } = error;

    if (response.headersSent) return next(error);
    if (error.name === "UnauthorizedError") statusCode = 401;
    response.status(statusCode || 500).json({ message: errors || message });
  },
);

if (MONGODB_URL)
  connect(MONGODB_URL)
    .then(() => {
      const server = app.listen(port, () =>
        // eslint-disable-next-line no-console
        console.log(`Server: http://localhost:${port}`),
      );

      const io = socketConfig.initializeIO(server);
      io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!isValidObjectId(socket.handshake.auth.userId))
          return next(new Error("Invalid userid"));

        verify(
          token,
          process.env.JWT_SECRET_KEY!,
          { complete: true },
          (error) => {
            if (error) return next(new Error(error.message));
            next();
          },
        );
      });

      io.on("connection", (socket) => {
        socketConfig.initializeSocket(socket);
        addSocketClient(socket.handshake.auth.userId, socket.id);

        io.emit("chat:active", clients);

        socket.on("user:logout", (userId) => {
          const removedClient = removeSocketClient(userId);
          removedClient &&
            socket.broadcast.emit("chat:inactive", removedClient);
        });

        socket.on("disconnect", () => {
          const removedClient = removeSocketClient(
            socket.handshake.auth.userId,
          );

          removedClient &&
            socket.broadcast.emit("chat:inactive", removedClient);
        });
      });
    })
    // eslint-disable-next-line unicorn/prefer-top-level-await
    .catch(() => exit(1));
