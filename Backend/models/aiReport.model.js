import mongoose from "mongoose";

const aiReportSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    overallScore: {
      type: Number,
    },
    breakdown: {
      skillScore: { type: Number },
      semanticScore: { type: Number },
      interviewScore: { type: Number },
    },
    strengths: [{ type: String }],
    gaps: [{ type: String }],
    aiRecommendation: {
      type: String,
    },
    recruiterDecision: {
      type: String,
      enum: ["pending", "advance", "reject", "hold"],
      default: "pending",
    },
    recruiterNotes: {
      type: String,
    },
    decidedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const AIReport = mongoose.model("AIReport", aiReportSchema);
