import express from "express";
import * as DmsController from "../controllers/dms-controller";

const router = express.Router();

router.get("/", DmsController.getAllDms);

export default router;
