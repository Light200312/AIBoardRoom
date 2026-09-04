/**
 * Panels Controller
 * WHY: Generate specialized expert panels for different use cases (law, interview, medical)
 * HOW: Service-based generation of expert agent configurations per domain
 * RESULT: Panel configurations with relevant agents for domain-specific scenarios
 */

import { generateLawPanel, generateInterviewPanel, generateMedicalPanel } from "./panels.service.js";

/**
 * lawPanel - Generate legal expert panel
 * WHY: Create specialized team for law-related discussions
 * HOW: Service generates relevant legal experts, assigns roles
 * RESULT: Panel object with legal experts configured for topic
 */
export async function lawPanel(req, res) {
  try {
    const { topic } = req.body || {};
    if (!topic) return res.status(400).json({ message: "topic is required." });
    const result = generateLawPanel(topic);
    return res.json(result);
  } catch (error) { console.error("Law panel generation failed:", error); return res.status(500).json({ message: "Failed to generate law panel.", error: error.message }); }
}


/**
 * interviewPanel - Generate interview coach panel
 * WHY: Create team for interview preparation and practice
 * HOW: Service generates interviewers and coaches for given scenario
 * RESULT: Panel with interview coaches tailored to scenario
 */
export async function interviewPanel(req, res) {
  try {
    const { scenario } = req.body || {};
    if (!scenario) return res.status(400).json({ message: "scenario is required." });
    const result = generateInterviewPanel(scenario);
    return res.json(result);
  } catch (error) { console.error("Interview panel generation failed:", error); return res.status(500).json({ message: "Failed to generate interview panel.", error: error.message }); }
}


/**
 * medicalPanel - Generate medical expert panel
 * WHY: Create specialized team for medical case discussions
 * HOW: Service generates medical professionals relevant to case type
 * RESULT: Panel with medical experts configured for case study
 */
export async function medicalPanel(req, res) {
  try {
    const { medicalCase } = req.body || {};
    if (!medicalCase) return res.status(400).json({ message: "medicalCase is required." });
    const result = generateMedicalPanel(medicalCase);
    return res.json(result);
  } catch (error) { console.error("Medical panel generation failed:", error); return res.status(500).json({ message: "Failed to generate medical panel.", error: error.message }); }
}
