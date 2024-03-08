import bodyParser from "body-parser";
import cors from "cors";
import { config } from "dotenv";
import express, { Express, NextFunction, Request, Response } from "express";
import { connect } from "mongoose";
import morgan from "morgan";
import { join } from "node:path";
import { exit } from "node:process";
import userAuthRoute from "./routes/user-auth.route";
import userRoute from "./routes/user.route";
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
    .then(() => app.listen(5000, () => console.log("[server]: 5000")))
    // eslint-disable-next-line unicorn/prefer-top-level-await
    .catch(() => exit(1));
