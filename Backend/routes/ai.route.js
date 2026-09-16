import express from "express";
import isAuthenticated from "../middleware/isAuthenticated.js";
import { singleUpload } from "../middleware/multer.js";
import {
  uploadAndAnalyzeResume,
  getResumeAnalysis,
  getJobMatch,
  getCandidateMatches,
  assistantChat,
  getAssistantHistory,
  clearAssistantHistory,
  generateInterview,
  getInterview,
  submitInterview,
  evaluateInterview,
  getJobInterviews,
  generateReport,
  getReport,
  makeDecision,
  getReportByApplication,
} from "../controllers/ai.controller.js";

const router = express.Router();

// ─── Resume (Feature 1) ──────────────────────────────────────────
router.post("/resume/upload", isAuthenticated, singleUpload, uploadAndAnalyzeResume);
router.get("/resume/analysis", isAuthenticated, getResumeAnalysis);

// ─── Matching (Feature 2) ─────────────────────────────────────────
router.get("/match/job/:jobId", isAuthenticated, getJobMatch);
router.get("/match/candidates/:jobId", isAuthenticated, getCandidateMatches);

// ─── RAG Assistant (Feature 3) ────────────────────────────────────
router.post("/assistant/chat", isAuthenticated, assistantChat);
router.get("/assistant/history", isAuthenticated, getAssistantHistory);
router.delete("/assistant/history", isAuthenticated, clearAssistantHistory);

// ─── Interview (Feature 4) ───────────────────────────────────────
router.post("/interview/generate", isAuthenticated, generateInterview);
router.get("/interview/job/:jobId", isAuthenticated, getJobInterviews);
router.get("/interview/:id", isAuthenticated, getInterview);
router.post("/interview/:id/submit", isAuthenticated, submitInterview);
router.post("/interview/:id/evaluate", isAuthenticated, evaluateInterview);

// ─── Report (Feature 5) ──────────────────────────────────────────
router.post("/report/generate", isAuthenticated, generateReport);
router.get("/report/application/:applicationId", isAuthenticated, getReportByApplication);
router.get("/report/:id", isAuthenticated, getReport);
router.post("/report/:id/decide", isAuthenticated, makeDecision);

export default router;
