import { Router } from "express";
import { getWhiteboard, applyFounderOp } from "./whiteboard.controller.js";

const router = Router();

router.get("/", getWhiteboard);
router.post("/op", applyFounderOp);

export default router;
