import mongoose from "mongoose";

const candidateMatchSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    matchScore: {
      type: Number,
    },
    semanticScore: {
      type: Number,
    },
    skillScore: {
      type: Number,
    },
    matchedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    explanation: {
      type: String,
    },
    resumeEmbedding: [{ type: Number }],
    jobEmbedding: [{ type: Number }],
    computedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Each candidate can have at most one match score per job
candidateMatchSchema.index({ job: 1, candidate: 1 }, { unique: true });

export const CandidateMatch = mongoose.model(
  "CandidateMatch",
  candidateMatchSchema
);
