import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
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
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["generated", "in_progress", "completed", "evaluated"],
      default: "generated",
    },
    questions: [
      {
        questionText: { type: String },
        skill: { type: String },
        goldenAnswer: { type: String },
        candidateAnswer: { type: String },
        score: { type: Number },
        feedback: { type: String },
      },
    ],
    overallScore: {
      type: Number,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    evaluatedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// One interview per candidate per job
interviewSchema.index({ job: 1, candidate: 1 }, { unique: true });

export const Interview = mongoose.model("Interview", interviewSchema);
