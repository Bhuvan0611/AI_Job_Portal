import { User } from "../models/user.model.js";
import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";
import { ResumeAnalysis } from "../models/resumeAnalysis.model.js";
import { CandidateMatch } from "../models/candidateMatch.model.js";
import { Interview } from "../models/interview.model.js";
import { AIReport } from "../models/aiReport.model.js";
import { RAGConversation } from "../models/ragConversation.model.js";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloud.js";
import {
  extractTextFromResumeUrl,
  extractSkillsFromText,
  computeAccurateMatch,
  formatCleanSkills,
} from "../utils/resumeExtractor.js";
import {
  generateGroundedAssistantAnswer,
  generateCustomInterviewQuestions,
  generateCandidateReport,
  evaluateCandidateAnswers,
} from "../utils/aiFallbackService.js";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const AI_TIMEOUT = 60000; // 60s timeout for AI calls (model loading can be slow)

/**
 * Helper: call the Python AI service with timeout + error handling.
 * If the AI service is down, returns null (caller handles gracefully).
 */
const callAI = async (endpoint, body) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT);

  try {
    const response = await fetch(`${AI_SERVICE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI service error (${response.status}): ${errorText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("AI service call timed out");
    } else {
      console.error("AI service unavailable:", error.message);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

// ═══════════════════════════════════════════════════════════════════
// FEATURE 1 — Resume Upload & Analysis
// ═══════════════════════════════════════════════════════════════════

/**
 * POST /api/ai/resume/upload
 * Upload a PDF resume, store in Cloudinary, and send to Python for analysis.
 */
export const uploadAndAnalyzeResume = async (req, res) => {
  try {
    const userId = req.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        message: "No file uploaded. Please select a PDF.",
        success: false,
      });
    }

    // Validate file type
    if (file.mimetype !== "application/pdf") {
      return res.status(400).json({
        message: "Only PDF files are accepted.",
        success: false,
      });
    }

    // 1. Upload PDF to Cloudinary
    const fileUri = getDataUri(file);
    const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
      resource_type: "raw",
      folder: "resumes",
    });
    const resumeFileUrl = cloudResponse.secure_url;

    // 2. Save URL in user profile
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }
    user.profile.resumeFile = resumeFileUrl;
    user.profile.resumeOriginalName = file.originalname;
    await user.save();

    let analysisData = null;

    // 3. Try Python AI service first
    try {
      const pdfBase64 = file.buffer.toString("base64");
      const aiResult = await callAI("/extract-and-analyze", {
        pdf_base64: pdfBase64,
        filename: file.originalname,
      });
      if (aiResult && aiResult.success && aiResult.analysis) {
        analysisData = aiResult.analysis;
      }
    } catch (aiErr) {
      console.warn("Python AI service extract failed, falling back to local extractor:", aiErr.message);
    }

    // Fallback: extract text and skills locally from PDF buffer
    if (!analysisData) {
      const extractedText = await extractTextFromResumeUrl(resumeFileUrl);
      const detectedSkills = extractSkillsFromText(extractedText);
      analysisData = {
        rawText: extractedText,
        skills: detectedSkills,
        education: [],
        experience: [],
        projects: [],
        certifications: [],
        suggestedRoles: ["Full Stack Developer", "Software Engineer"],
        missingSkills: [],
        summary: "Analyzed and extracted from uploaded resume.",
      };
    }

    // 4. Clean and deduplicate skills, then update user's profile skills directly
    const combinedRawSkills = [
      ...(analysisData.skills || []),
      ...(user.profile?.skills || []),
    ];
    const cleanedSkills = formatCleanSkills(combinedRawSkills);

    // Save to user profile directly
    user.profile.skills = cleanedSkills;
    await user.save();

    // 5. Save/update ResumeAnalysis in MongoDB
    const savedAnalysis = await ResumeAnalysis.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        rawText: analysisData.rawText,
        skills: cleanedSkills,
        education: analysisData.education || [],
        experience: analysisData.experience || [],
        projects: analysisData.projects || [],
        certifications: analysisData.certifications || [],
        suggestedRoles: analysisData.suggestedRoles || [],
        missingSkills: analysisData.missingSkills || [],
        summary: analysisData.summary || "",
        analyzedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      message: "Resume analyzed successfully and skills updated in your profile!",
      success: true,
      analysis: savedAnalysis,
      user,
      resumeFileUrl,
    });
  } catch (error) {
    console.error("uploadAndAnalyzeResume error:", error);
    return res.status(500).json({
      message: "Server error uploading resume",
      success: false,
    });
  }
};

/**
 * GET /api/ai/resume/analysis
 * Get cached resume analysis for the current user.
 */
export const getResumeAnalysis = async (req, res) => {
  try {
    const analysis = await ResumeAnalysis.findOne({ user: req.id });
    if (!analysis) {
      return res.status(404).json({
        message: "No resume analysis found. Please upload your resume first.",
        success: false,
      });
    }

    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("getResumeAnalysis error:", error);
    return res.status(500).json({
      message: "Server error fetching analysis",
      success: false,
    });
  }
};

// ═══════════════════════════════════════════════════════════════════
// FEATURE 2 — Job Matching
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /api/ai/match/job/:jobId
 * Student: get AI match score for a specific job.
 */
export const getJobMatch = async (req, res) => {
  try {
    const userId = req.id;
    const { jobId } = req.params;

    // Check cache first
    const cached = await CandidateMatch.findOne({ job: jobId, candidate: userId });
    if (cached) {
      return res.status(200).json({ success: true, match: cached });
    }

    // Need resume analysis
    let analysis = await ResumeAnalysis.findOne({ user: userId });
    const user = await User.findById(userId);
    if (!analysis && user) {
      const resumeUrl = user.profile?.resume || user.profile?.resumeFile;
      if (resumeUrl) {
        const extracted = await extractTextFromResumeUrl(resumeUrl);
        if (extracted && extracted.length > 50) {
          const extractedSkills = extractSkillsFromText(extracted);
          const combinedSkills = Array.from(new Set([...(user.profile?.skills || []), ...extractedSkills]));
          try {
            analysis = await ResumeAnalysis.findOneAndUpdate(
              { user: userId },
              {
                user: userId,
                rawText: extracted,
                skills: combinedSkills,
                summary: `Extracted from resume URL: ${resumeUrl}`,
                analyzedAt: new Date(),
              },
              { upsert: true, new: true }
            );
          } catch (e) {
            console.warn("Could not save auto-extracted ResumeAnalysis:", e.message);
          }
        }
      }
    }

    if (!analysis && (!user?.profile?.skills || user.profile.skills.length === 0)) {
      return res.status(400).json({
        message: "Please upload and analyze your resume or add your skills in your profile first.",
        success: false,
      });
    }

    // Fetch job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found", success: false });
    }

    const resumeText = analysis?.rawText || "";
    const resumeSkills = analysis?.skills?.length ? analysis.skills : (user?.profile?.skills || []);

    // Try Python service if available
    let matchData = null;
    if (resumeText && resumeText.length > 50) {
      const aiResult = await callAI("/compute-match", {
        resumeText,
        resumeSkills,
        jobTitle: job.title,
        jobDescription: job.description,
        jobRequirements: job.requirements || [],
      });
      if (aiResult && aiResult.success && aiResult.match) {
        matchData = aiResult.match;
      }
    }

    // Fall back to built-in matching engine
    if (!matchData) {
      matchData = computeAccurateMatch({
        candidateName: user?.fullname || "Candidate",
        resumeText,
        candidateSkills: resumeSkills,
        jobTitle: job.title,
        jobDescription: job.description || "",
        jobRequirements: job.requirements || [],
      });
    }

    // Save to MongoDB
    const savedMatch = await CandidateMatch.findOneAndUpdate(
      { job: jobId, candidate: userId },
      {
        job: jobId,
        candidate: userId,
        matchScore: matchData.matchScore,
        semanticScore: matchData.semanticScore,
        skillScore: matchData.skillScore,
        matchedSkills: matchData.matchedSkills || [],
        missingSkills: matchData.missingSkills || [],
        explanation: matchData.explanation || "",
        resumeEmbedding: matchData.resumeEmbedding || [],
        jobEmbedding: matchData.jobEmbedding || [],
        computedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({ success: true, match: savedMatch });
  } catch (error) {
    console.error("getJobMatch error:", error);
    return res.status(500).json({
      message: "Server error computing match",
      success: false,
    });
  }
};

/**
 * GET /api/ai/match/candidates/:jobId
 * Recruiter: get all candidate match scores for a job.
 */
export const getCandidateMatches = async (req, res) => {
  try {
    const recruiterId = req.id;
    const { jobId } = req.params;
    const forceRefresh = req.query.refresh === "true";

    // Verify recruiter owns this job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found", success: false });
    }
    if (job.created_by.toString() !== recruiterId) {
      return res.status(403).json({ message: "Unauthorized", success: false });
    }

    // Get all matches for this job
    let matches = await CandidateMatch.find({ job: jobId })
      .populate("candidate", "fullname email profile.profilePhoto profile.skills profile.resume")
      .sort({ matchScore: -1 });

    // Auto-compute match for any applicant who doesn't have one yet, or needs refreshing
    const applications = await Application.find({ job: jobId }).populate("applicant");
    for (const app of applications) {
      if (!app.applicant) continue;
      const candidateId = app.applicant._id;
      const existingMatch = matches.find(
        (m) => m.candidate && m.candidate._id.toString() === candidateId.toString()
      );

      // Recompute if missing, force-refresh requested, or existing score is an inaccurate legacy name-only placeholder
      const needsRecalculation =
        !existingMatch ||
        forceRefresh ||
        (existingMatch.matchScore < 15 && (!existingMatch.matchedSkills || existingMatch.matchedSkills.length === 0));

      if (needsRecalculation) {
        try {
          let analysis = await ResumeAnalysis.findOne({ user: candidateId });
          let resumeText = analysis?.rawText || "";
          let resumeSkills = analysis?.skills?.length
            ? [...analysis.skills]
            : [...(app.applicant.profile?.skills || [])];

          // If raw resume text is missing or tiny, attempt to extract it from candidate's resume URL
          const resumeUrl = app.applicant.profile?.resume || app.applicant.profile?.resumeFile;
          if ((!resumeText || resumeText.length < 50) && resumeUrl) {
            const extracted = await extractTextFromResumeUrl(resumeUrl);
            if (extracted && extracted.length > 50) {
              resumeText = extracted;
              const extractedSkills = extractSkillsFromText(extracted);
              resumeSkills = Array.from(new Set([...resumeSkills, ...extractedSkills]));

              // Cache to ResumeAnalysis in MongoDB
              try {
                await ResumeAnalysis.findOneAndUpdate(
                  { user: candidateId },
                  {
                    user: candidateId,
                    rawText: extracted,
                    skills: resumeSkills,
                    summary: `Extracted from resume: ${resumeUrl}`,
                    analyzedAt: new Date(),
                  },
                  { upsert: true, new: true }
                );
              } catch (saveErr) {
                console.warn("Could not cache extracted ResumeAnalysis:", saveErr.message);
              }
            }
          }

          // Try Python AI microservice first if available
          let matchData = null;
          if (resumeText && resumeText.length > 50) {
            const aiResult = await callAI("/compute-match", {
              resumeText: resumeText,
              resumeSkills: resumeSkills,
              jobTitle: job.title,
              jobDescription: job.description || "",
              jobRequirements: job.requirements || [],
            });
            if (aiResult && aiResult.success && aiResult.match) {
              matchData = aiResult.match;
            }
          }

          // Fall back to our built-in accurate scoring engine
          if (!matchData) {
            matchData = computeAccurateMatch({
              candidateName: app.applicant.fullname,
              resumeText: resumeText,
              candidateSkills: resumeSkills,
              jobTitle: job.title,
              jobDescription: job.description || "",
              jobRequirements: job.requirements || [],
            });
          }

          if (matchData) {
            const savedMatch = await CandidateMatch.findOneAndUpdate(
              { job: jobId, candidate: candidateId },
              {
                job: jobId,
                candidate: candidateId,
                matchScore: matchData.matchScore,
                semanticScore: matchData.semanticScore,
                skillScore: matchData.skillScore,
                matchedSkills: matchData.matchedSkills || [],
                missingSkills: matchData.missingSkills || [],
                explanation: matchData.explanation || "",
                computedAt: new Date(),
              },
              { upsert: true, new: true }
            ).populate("candidate", "fullname email profile.profilePhoto profile.skills profile.resume");

            if (savedMatch) {
              const existingIdx = matches.findIndex(
                (m) => m.candidate && m.candidate._id.toString() === candidateId.toString()
              );
              if (existingIdx >= 0) {
                matches[existingIdx] = savedMatch;
              } else {
                matches.push(savedMatch);
              }
            }
          }
        } catch (matchErr) {
          console.error("Error auto-matching applicant:", matchErr);
        }
      }
    }

    // Re-sort matches by score descending
    matches.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    return res.status(200).json({ success: true, matches });
  } catch (error) {
    console.error("getCandidateMatches error:", error);
    return res.status(500).json({
      message: "Server error fetching matches",
      success: false,
    });
  }
};

// ═══════════════════════════════════════════════════════════════════
// FEATURE 3 — RAG Recruiter Assistant
// ═══════════════════════════════════════════════════════════════════

/**
 * POST /api/ai/assistant/chat
 * Recruiter sends a question, gets a grounded answer about their candidates.
 */
export const assistantChat = async (req, res) => {
  try {
    const recruiterId = req.id;
    const { message, jobId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Please enter a message.",
        success: false,
      });
    }

    // Verify recruiter role
    const recruiter = await User.findById(recruiterId);
    if (!recruiter || recruiter.role !== "Recruiter") {
      return res.status(403).json({
        message: "Only recruiters can use the AI assistant.",
        success: false,
      });
    }

    // AUTHORIZATION-SCOPED RETRIEVAL
    // a. Find jobs created by this recruiter. When the assistant is opened
    // from a specific job's Applicants page, `jobId` scopes retrieval (and
    // therefore the answer) to just that job's candidates — otherwise every
    // question would be answered using candidates from ALL of the
    // recruiter's postings, which is misleading when the UI says
    // "who fits best for this job".
    let jobs = await Job.find({ created_by: recruiterId }).populate("company", "name");
    if (jobId) {
      const scopedJob = jobs.find((j) => j._id.toString() === jobId);
      if (!scopedJob) {
        return res.status(403).json({
          message: "You are not authorized to view this job's candidates.",
          success: false,
        });
      }
      jobs = [scopedJob];
    }
    const jobIds = jobs.map((j) => j._id);

    // b. Find applications for those jobs
    const applications = await Application.find({ job: { $in: jobIds } })
      .populate("applicant", "fullname email profile.skills profile.bio");
    const candidateIds = [...new Set(applications.map((a) => a.applicant._id.toString()))];

    // c. Fetch AI data for ONLY these candidates
    const analyses = await ResumeAnalysis.find({ user: { $in: candidateIds } });
    const matches = await CandidateMatch.find({ candidate: { $in: candidateIds } });
    const interviews = await Interview.find({ candidate: { $in: candidateIds } });

    // d. Build candidate data
    const analysisMap = Object.fromEntries(analyses.map((a) => [a.user.toString(), a]));
    const candidateData = [];
    const seen = new Set();

    for (const app of applications) {
      const cId = app.applicant._id.toString();
      if (seen.has(cId)) continue;
      seen.add(cId);

      const analysis = analysisMap[cId];
      const currentJobId = app.job?.toString() || (jobId ? jobId.toString() : null);
      const candidateMatches = matches
        .filter((m) => m.candidate.toString() === cId)
        .sort((a, b) => {
          if (currentJobId && a.job.toString() === currentJobId) return -1;
          if (currentJobId && b.job.toString() === currentJobId) return 1;
          return (b.matchScore || 0) - (a.matchScore || 0);
        })
        .map((m) => {
          const job = jobs.find((j) => j._id.toString() === m.job.toString());
          return {
            job: job?.title || "Unknown",
            score: m.matchScore,
            matchedSkills: m.matchedSkills || [],
            missingSkills: m.missingSkills || [],
            explanation: m.explanation || "",
          };
        });

      const topMatch = candidateMatches[0];
      const interview = interviews.find((i) => i.candidate.toString() === cId);

      candidateData.push({
        candidateId: cId,
        name: app.applicant.fullname,
        email: app.applicant.email,
        skills: analysis?.skills || app.applicant.profile?.skills || [],
        matchedSkills: topMatch?.matchedSkills || [],
        missingSkills: topMatch?.missingSkills || [],
        score: topMatch?.score || 70,
        experience: analysis?.experience || [],
        education: analysis?.education || [],
        matchScores: candidateMatches,
        interviewScore: interview?.overallScore || null,
        rawResumeSummary: analysis?.rawText ? analysis.rawText.slice(0, 1200) : "",
      });
    }

    // e. Build job data
    const jobData = jobs.map((j) => ({
      title: j.title,
      company: j.company?.name || "",
      location: j.location,
      jobType: j.jobType,
      requirements: j.requirements || [],
    }));

    // f. Get conversation history
    let conversation = await RAGConversation.findOne({ recruiter: recruiterId });
    const conversationHistory = conversation?.messages || [];

    let answerText = "";
    let sourcesList = [];

    // g. Try Python AI service first
    try {
      const aiResult = await callAI("/assistant-query", {
        question: message,
        candidateData,
        jobData,
        conversationHistory: conversationHistory.slice(-10),
      });
      if (aiResult && aiResult.success && aiResult.answer) {
        answerText = aiResult.answer;
        sourcesList = aiResult.sourcesUsed || [];
      }
    } catch (e) {
      console.warn("Python AI assistant-query failed:", e.message);
    }

    // Fallback: use direct grounded assistant engine (with optional Gemini support)
    if (!answerText) {
      const fallbackResult = await generateGroundedAssistantAnswer({
        question: message,
        candidateData,
        jobData,
        conversationHistory,
      });
      answerText = fallbackResult.answer;
      sourcesList = fallbackResult.sourcesUsed || [];
    }

    // h. Save messages to conversation
    const userMessage = { role: "user", content: message, sources: [], timestamp: new Date() };
    const assistantMessage = {
      role: "assistant",
      content: answerText,
      sources: sourcesList,
      timestamp: new Date(),
    };

    if (!conversation) {
      conversation = new RAGConversation({
        recruiter: recruiterId,
        messages: [userMessage, assistantMessage],
      });
    } else {
      conversation.messages.push(userMessage, assistantMessage);
    }
    await conversation.save();

    return res.status(200).json({
      success: true,
      answer: answerText,
      sources: sourcesList,
    });
  } catch (error) {
    console.error("assistantChat error:", error);
    return res.status(500).json({
      message: "Server error processing chat",
      success: false,
    });
  }
};

/**
 * GET /api/ai/assistant/history
 * Get conversation history for the current recruiter.
 */
export const getAssistantHistory = async (req, res) => {
  try {
    const conversation = await RAGConversation.findOne({ recruiter: req.id });
    return res.status(200).json({
      success: true,
      messages: conversation?.messages || [],
    });
  } catch (error) {
    console.error("getAssistantHistory error:", error);
    return res.status(500).json({
      message: "Server error fetching history",
      success: false,
    });
  }
};

/**
 * DELETE /api/ai/assistant/history
 * Clear conversation history for the current recruiter.
 */
export const clearAssistantHistory = async (req, res) => {
  try {
    await RAGConversation.findOneAndUpdate(
      { recruiter: req.id },
      { messages: [] }
    );
    return res.status(200).json({
      success: true,
      message: "Conversation history cleared.",
    });
  } catch (error) {
    console.error("clearAssistantHistory error:", error);
    return res.status(500).json({
      message: "Server error clearing history",
      success: false,
    });
  }
};

// ═══════════════════════════════════════════════════════════════════
// FEATURE 4 — AI Interview
// ═══════════════════════════════════════════════════════════════════

/**
 * POST /api/ai/interview/generate
 * Recruiter generates interview questions for a specific candidate+job.
 */
export const generateInterview = async (req, res) => {
  try {
    const recruiterId = req.id;
    const { jobId, candidateId } = req.body;

    if (!jobId || !candidateId) {
      return res.status(400).json({
        message: "jobId and candidateId are required.",
        success: false,
      });
    }

    // Verify recruiter owns job
    const job = await Job.findById(jobId);
    if (!job || job.created_by.toString() !== recruiterId) {
      return res.status(403).json({ message: "Unauthorized", success: false });
    }

    // Check if interview already exists
    const existing = await Interview.findOne({ job: jobId, candidate: candidateId });
    if (existing) {
      return res.status(400).json({
        message: "Interview already exists for this candidate-job pair.",
        success: false,
        interview: existing,
      });
    }

    // Get candidate's resume analysis for skills
    const analysis = await ResumeAnalysis.findOne({ user: candidateId });
    const candidateSkills = analysis?.skills || [];

    let questionsList = null;

    // Call Python service first
    try {
      const aiResult = await callAI("/generate-interview", {
        jobTitle: job.title,
        requirements: job.requirements || [],
        candidateSkills,
      });
      if (aiResult && aiResult.success && aiResult.questions?.length) {
        questionsList = aiResult.questions;
      }
    } catch (aiErr) {
      console.warn("Python generate-interview failed:", aiErr.message);
    }

    // Fallback: use direct interview generator (with optional Gemini support)
    if (!questionsList || questionsList.length === 0) {
      questionsList = await generateCustomInterviewQuestions({
        jobTitle: job.title,
        requirements: job.requirements || [],
        candidateSkills,
      });
    }

    // Save interview
    const interview = new Interview({
      job: jobId,
      candidate: candidateId,
      recruiter: recruiterId,
      status: "generated",
      questions: questionsList.map((q) => ({
        questionText: q.questionText,
        skill: q.skill || "Technical Competency",
        goldenAnswer: q.goldenAnswer || "Candidate should explain with relevant experience and best practices.",
        candidateAnswer: "",
        score: null,
        feedback: "",
      })),
      generatedAt: new Date(),
    });

    await interview.save();

    return res.status(201).json({
      success: true,
      message: "Interview questions generated successfully.",
      interview,
    });
  } catch (error) {
    console.error("generateInterview error:", error);
    return res.status(500).json({
      message: "Server error generating interview",
      success: false,
    });
  }
};

/**
 * GET /api/ai/interview/:id
 * Get interview details. Hides goldenAnswer from students.
 */
export const getInterview = async (req, res) => {
  try {
    const userId = req.id;
    const interview = await Interview.findById(req.params.id)
      .populate("job", "title company")
      .populate("candidate", "fullname email")
      .populate("recruiter", "fullname");

    if (!interview) {
      return res.status(404).json({ message: "Interview not found", success: false });
    }

    // Check authorization
    const isCandidate = interview.candidate._id.toString() === userId;
    const isRecruiter = interview.recruiter._id.toString() === userId;

    if (!isCandidate && !isRecruiter) {
      return res.status(403).json({ message: "Unauthorized", success: false });
    }

    // Hide golden answers from students (unless evaluated)
    let interviewData = interview.toObject();
    if (isCandidate && interview.status !== "evaluated") {
      interviewData.questions = interviewData.questions.map((q) => ({
        ...q,
        goldenAnswer: undefined,
        score: undefined,
        feedback: undefined,
      }));
    }

    return res.status(200).json({ success: true, interview: interviewData });
  } catch (error) {
    console.error("getInterview error:", error);
    return res.status(500).json({
      message: "Server error fetching interview",
      success: false,
    });
  }
};

/**
 * POST /api/ai/interview/:id/submit
 * Student submits their answers.
 */
export const submitInterview = async (req, res) => {
  try {
    const userId = req.id;
    const { answers } = req.body;

    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found", success: false });
    }

    if (interview.candidate.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized", success: false });
    }

    if (interview.status === "completed" || interview.status === "evaluated") {
      return res.status(400).json({
        message: "Interview already submitted.",
        success: false,
      });
    }

    if (!answers || !Array.isArray(answers) || answers.length !== interview.questions.length) {
      return res.status(400).json({
        message: `Please answer all ${interview.questions.length} questions.`,
        success: false,
      });
    }

    // Save answers
    for (let i = 0; i < interview.questions.length; i++) {
      interview.questions[i].candidateAnswer = answers[i] || "";
    }
    interview.status = "completed";
    interview.completedAt = new Date();
    await interview.save();

    return res.status(200).json({
      success: true,
      message: "Answers submitted successfully.",
    });
  } catch (error) {
    console.error("submitInterview error:", error);
    return res.status(500).json({
      message: "Server error submitting answers",
      success: false,
    });
  }
};

/**
 * POST /api/ai/interview/:id/evaluate
 * Recruiter triggers AI evaluation of candidate answers.
 */
export const evaluateInterview = async (req, res) => {
  try {
    const recruiterId = req.id;
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found", success: false });
    }
    if (interview.recruiter.toString() !== recruiterId) {
      return res.status(403).json({ message: "Unauthorized", success: false });
    }
    if (interview.status !== "completed") {
      return res.status(400).json({
        message: "Interview must be completed before evaluation.",
        success: false,
      });
    }

    // Build Q&A pairs for Python
    const questionsWithAnswers = interview.questions.map((q) => ({
      questionText: q.questionText,
      goldenAnswer: q.goldenAnswer,
      candidateAnswer: q.candidateAnswer,
    }));

    let evaluation = null;

    try {
      const aiResult = await callAI("/evaluate-answers", { questionsWithAnswers });
      if (aiResult && aiResult.success && aiResult.evaluation) {
        evaluation = aiResult.evaluation;
      }
    } catch (aiErr) {
      console.warn("Python evaluate-answers failed:", aiErr.message);
    }

    if (!evaluation) {
      evaluation = evaluateCandidateAnswers({ questionsWithAnswers });
    }

    // Save scores and feedback
    for (let i = 0; i < interview.questions.length; i++) {
      interview.questions[i].score = evaluation.scores[i] || 0;
      interview.questions[i].feedback = evaluation.feedbacks[i] || "";
    }
    interview.overallScore = evaluation.overallScore;
    interview.status = "evaluated";
    interview.evaluatedAt = new Date();
    await interview.save();

    return res.status(200).json({
      success: true,
      message: "Interview evaluated successfully.",
      interview,
    });
  } catch (error) {
    console.error("evaluateInterview error:", error);
    return res.status(500).json({
      message: "Server error evaluating interview",
      success: false,
    });
  }
};

/**
 * GET /api/ai/interview/job/:jobId
 * Recruiter: list all interviews for a specific job.
 */
export const getJobInterviews = async (req, res) => {
  try {
    const recruiterId = req.id;
    const { jobId } = req.params;

    // Verify recruiter owns job
    const job = await Job.findById(jobId);
    if (!job || job.created_by.toString() !== recruiterId) {
      return res.status(403).json({ message: "Unauthorized", success: false });
    }

    const interviews = await Interview.find({ job: jobId })
      .populate("candidate", "fullname email profile.profilePhoto")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, interviews });
  } catch (error) {
    console.error("getJobInterviews error:", error);
    return res.status(500).json({
      message: "Server error fetching interviews",
      success: false,
    });
  }
};

// ═══════════════════════════════════════════════════════════════════
// FEATURE 5 — Explainable Report + Human Decision
// ═══════════════════════════════════════════════════════════════════

/**
 * POST /api/ai/report/generate
 * Recruiter generates an AI report for a specific application.
 */
export const generateReport = async (req, res) => {
  try {
    const recruiterId = req.id;
    const { applicationId } = req.body;

    if (!applicationId) {
      return res.status(400).json({
        message: "applicationId is required.",
        success: false,
      });
    }

    // Fetch application
    const application = await Application.findById(applicationId)
      .populate("applicant", "fullname")
      .populate("job");

    if (!application) {
      return res.status(404).json({ message: "Application not found", success: false });
    }

    // Verify recruiter owns the job
    if (application.job.created_by.toString() !== recruiterId) {
      return res.status(403).json({ message: "Unauthorized", success: false });
    }

    const candidateId = application.applicant._id;
    const jobId = application.job._id;

    // Gather AI data
    const resumeAnalysis = await ResumeAnalysis.findOne({ user: candidateId });
    const match = await CandidateMatch.findOne({ job: jobId, candidate: candidateId });
    const interview = await Interview.findOne({ job: jobId, candidate: candidateId });

    let reportData = null;

    // Call Python for report generation first
    try {
      const aiResult = await callAI("/generate-report", {
        resumeAnalysis: resumeAnalysis ? resumeAnalysis.toObject() : null,
        match: match ? match.toObject() : null,
        interview: interview ? interview.toObject() : null,
        candidateName: application.applicant.fullname,
        jobTitle: application.job.title,
      });
      if (aiResult && aiResult.success && aiResult.report) {
        reportData = aiResult.report;
      }
    } catch (aiErr) {
      console.warn("Python generate-report failed:", aiErr.message);
    }

    // Fallback: use direct report generator (with optional Gemini support)
    if (!reportData) {
      reportData = await generateCandidateReport({
        candidateName: application.applicant.fullname,
        jobTitle: application.job.title,
        jobRequirements: application.job.requirements || [],
        jobDescription: application.job.description || "",
        match: match ? match.toObject() : null,
        resumeAnalysis: resumeAnalysis ? resumeAnalysis.toObject() : null,
        interview: interview ? interview.toObject() : null,
      });
    }

    // Save/update report
    const savedReport = await AIReport.findOneAndUpdate(
      { application: applicationId },
      {
        application: applicationId,
        job: jobId,
        candidate: candidateId,
        recruiter: recruiterId,
        overallScore: reportData.overallScore,
        breakdown: reportData.breakdown,
        strengths: reportData.strengths || [],
        gaps: reportData.gaps || [],
        aiRecommendation: reportData.aiRecommendation || "",
        recruiterDecision: "pending",
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Report generated successfully.",
      report: savedReport,
    });
  } catch (error) {
    console.error("generateReport error:", error);
    return res.status(500).json({
      message: "Server error generating report",
      success: false,
    });
  }
};

/**
 * GET /api/ai/report/:id
 * Get a specific AI report.
 */
export const getReport = async (req, res) => {
  try {
    const report = await AIReport.findById(req.params.id)
      .populate("candidate", "fullname email profile.profilePhoto")
      .populate("job", "title")
      .populate("application");

    if (!report) {
      return res.status(404).json({ message: "Report not found", success: false });
    }

    // Verify access (recruiter who owns the report)
    if (report.recruiter.toString() !== req.id) {
      return res.status(403).json({ message: "Unauthorized", success: false });
    }

    return res.status(200).json({ success: true, report });
  } catch (error) {
    console.error("getReport error:", error);
    return res.status(500).json({
      message: "Server error fetching report",
      success: false,
    });
  }
};

/**
 * POST /api/ai/report/:id/decide
 * Recruiter makes a human decision on a report.
 */
export const makeDecision = async (req, res) => {
  try {
    const { decision, notes } = req.body;

    if (!decision || !["advance", "reject", "hold"].includes(decision)) {
      return res.status(400).json({
        message: "Decision must be 'advance', 'reject', or 'hold'.",
        success: false,
      });
    }

    const report = await AIReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found", success: false });
    }
    if (report.recruiter.toString() !== req.id) {
      return res.status(403).json({ message: "Unauthorized", success: false });
    }

    report.recruiterDecision = decision;
    report.recruiterNotes = notes || "";
    report.decidedAt = new Date();
    await report.save();

    return res.status(200).json({
      success: true,
      message: `Decision recorded: ${decision}`,
      report,
    });
  } catch (error) {
    console.error("makeDecision error:", error);
    return res.status(500).json({
      message: "Server error recording decision",
      success: false,
    });
  }
};

/**
 * GET /api/ai/report/application/:applicationId
 * Get report by application ID.
 */
export const getReportByApplication = async (req, res) => {
  try {
    const report = await AIReport.findOne({ application: req.params.applicationId })
      .populate("candidate", "fullname email profile.profilePhoto")
      .populate("job", "title");

    if (!report) {
      return res.status(404).json({ message: "No report found for this application.", success: false });
    }

    return res.status(200).json({ success: true, report });
  } catch (error) {
    console.error("getReportByApplication error:", error);
    return res.status(500).json({
      message: "Server error fetching report",
      success: false,
    });
  }
};
