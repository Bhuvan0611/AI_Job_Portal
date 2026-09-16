import mongoose from "mongoose";

const resumeAnalysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    rawText: {
      type: String,
    },
    skills: [{ type: String }],
    education: [{ type: String }],
    experience: [
      {
        role: { type: String },
        company: { type: String },
        duration: { type: String },
      },
    ],
    projects: [
      {
        name: { type: String },
        description: { type: String },
      },
    ],
    certifications: [{ type: String }],
    suggestedRoles: [{ type: String }],
    missingSkills: [{ type: String }],
    summary: {
      type: String,
    },
    analyzedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const ResumeAnalysis = mongoose.model(
  "ResumeAnalysis",
  resumeAnalysisSchema
);
