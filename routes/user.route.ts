import express from "express";
import * as userControllers from "../controllers/user.controller";

const router = express.Router();

router.get("/users", userControllers.getUsers);

export default router;
