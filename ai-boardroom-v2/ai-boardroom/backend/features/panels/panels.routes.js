/**
 * Panels Routes
 * WHY: Expose domain-specific expert panel generation endpoints
 * HOW: Three domain POST endpoints (law, interview, medical) for panel creation
 * RESULT: Specialized panel endpoints for different use case domains
 */

import express from "express";
import authGuard from "../../shared/authGuard.js";
import { lawPanel, interviewPanel, medicalPanel } from "./panels.controller.js";

const router = express.Router();
router.post("/law-panel", authGuard, lawPanel);
router.post("/interview-panel", authGuard, interviewPanel);
router.post("/medical-panel", authGuard, medicalPanel);

export default router;
