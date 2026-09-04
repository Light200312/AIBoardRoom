/**
 * Orchestrator Routes
 * ========================================
 * Defines HTTP routes for multi-agent orchestration endpoints.
 * All routes require authentication via authGuard middleware.
 */

import express from "express";
import authGuard from "../../shared/authGuard.js";
import { run } from "./orchestrator.controller.js";

// Create a new router instance for orchestrator endpoints
const router = express.Router();

/**
 * POST /orchestrator/run
 * 
 * Initiates a multi-agent orchestration session.
 * Coordinates multiple agents to discuss a task goal and guide the user.
 * 
 * @requires Authentication via authGuard middleware
 * @method POST
 * @path /run
 * @body {Object} Orchestration parameters (see orchestrator.controller.js for details)
 * @returns {Object} Orchestration result with messages, trace, and performance metrics
 */
router.post("/run", authGuard, run);

// Export the configured router for use in main app
export default router;
