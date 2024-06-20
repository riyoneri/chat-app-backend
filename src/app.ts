import bodyParser from "body-parser";
import compression from "compression";
import busboy from "connect-busboy";
import { config } from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { connect } from "mongoose";
import { exit } from "node:process";
import { RateLimiterMemory } from "rate-limiter-flexible";

import userAuthroute from "./routes/user-auth.route";
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
  duration: 10,
});

app.use(compression());
app.use(helmet());
app.disable("x-powered-by");
app.use(bodyParser.json());

app.use((request: Request, response: Response, next: NextFunction) => {
  rateLimiter
    .consume(request.ip!)
    .then(() => {
      next();
    })
    .catch(() => response.status(429).send("Too Many Requests"));
});

app.use(busboy({ limits: { files: 1, fileSize: 1024 * 1024 * 4 } }));

app.use("/auth", userAuthroute);

app.use((_, response: Response) => {
  response.status(404).send("URL does not exist");
});

app.use(
  (error: CustomError, _: Request, response: Response, next: NextFunction) => {
    const { message, errors, statusCode } = error;
    if (response.headersSent) return next(error);
    response.status(statusCode || 500).json({ message: errors || message });
  },
);

if (MONGODB_URL)
  connect(MONGODB_URL)
    .then(() => {
      // eslint-disable-next-line no-console
      app.listen(port, () => console.log(`Server: http://localhost:${port}`));
    })
    // eslint-disable-next-line unicorn/prefer-top-level-await
    .catch(() => exit(1));
