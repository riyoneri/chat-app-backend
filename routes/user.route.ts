import express from "express";
import * as userControllers from "../controllers/user.controller";
import { isAuth } from "../middlewares/is-auth";

const router = express.Router();

router.get("/users", isAuth, userControllers.getUsers);

export default router;
