import bodyParser from "body-parser";
import cors from "cors";
import express, { Express, NextFunction, Request, Response } from "express";
import userRoutes from "./routes/user.route";
import CustomError from "./util/custom-error";

const app: Express = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.use("/users", userRoutes);

app.use(
  (
    error: CustomError,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ) => {
    const { message, errors, status } = error;

    return response.status(status || 500).json({ message: errors || message });
  },
);

app.listen(5000, () => console.log("[server]: 5000"));
