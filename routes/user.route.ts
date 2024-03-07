import express from "express";
import * as userControllers from "../controllers/user.controller";
import { isAuth } from "../middlewares/is-auth";
import { query } from "express-validator";

const router = express.Router();

router.get(
  "/users",
  isAuth,
  [query("page").optional({ values: "undefined" }).toInt()],
  userControllers.getUsers,
);

export default router;
