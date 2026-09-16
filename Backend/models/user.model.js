import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
    otpExpiry: {
      type: Date,
    },
    role: {
      type: String,
      enum: ["Student", "Recruiter"],
      default: "Student",
      required: true,
    },
    profile: {
      bio: {
        type: String,
      },
      skills: [{ type: String }],
      resume: {
        type: String, // URL to resume file
      },
      resumeFile: {
        type: String, // Cloudinary URL of uploaded PDF (for AI analysis)
      },
      resumeOriginalName: {
        type: String, // Original filename of the uploaded PDF
      },
      company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
      },
        profilePhoto: {
          type: String, // URL to profile photo file
          default: "",
        },
      },
      termsAcceptedAt: {
        type: Date,
      },
    },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
