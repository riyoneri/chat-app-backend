import { Router } from "express";

import * as userAuthController from "../controllers/user-auth.controller";

const router = Router();

router.post("/register", userAuthController.register);

export default router;
