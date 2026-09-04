/**
 * Message Routes
 * WHY: Define HTTP endpoints for message persistence
 * HOW: GET retrieves history, POST creates new message entry
 * RESULT: RESTful /message endpoints for conversation management
 */

import express from "express";
import authGuard from "../../shared/authGuard.js";
import { listMessages, createMessage } from "./message.controller.js";

const router = express.Router();
router.get("/", authGuard, listMessages);
router.post("/", authGuard, createMessage);

export default router;
