import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { RateLimiterMemory } from "rate-limiter-flexible";
import compression from "compression";
import CustomError from "./utils/custom-error";

const app = express();
const port = process.env.PORT || 3000;

const rateLimiter = new RateLimiterMemory({
  points: 6,
  duration: 10,
});

app.use(compression());
app.use(helmet());
app.disable("x-powered-by");

app.use((request: Request, response: Response, next: NextFunction) => {
  rateLimiter
    .consume(request.ip!)
    .then(() => {
      next();
    })
    .catch(() => response.status(429).send("Too Many Requests"));
});

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

// eslint-disable-next-line no-console
app.listen(port, () => console.log(`Server: http://localhost:${port}`));
