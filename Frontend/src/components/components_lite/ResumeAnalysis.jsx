import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { AI_API_ENDPOINT } from "@/utils/data";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Sparkles, UploadCloud, Loader2, FileText, CheckCircle2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/authSlice";

/**
 * AI resume upload + analysis for the logged-in student.
 *
 * The backend/AI service for this (POST /api/ai/resume/upload,
 * GET /api/ai/resume/analysis) already existed, but there was no frontend
 * anywhere that called them — a student had no way to ever see this feature.
 */
const ResumeAnalysis = () => {
  const [analysis, setAnalysis] = useState(null);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchAnalysis = async () => {
    try {
      const res = await axios.get(`${AI_API_ENDPOINT}/resume/analysis`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setAnalysis(res.data.analysis);
      }
    } catch (error) {
      // 404 just means the student hasn't uploaded/analyzed a resume yet -
      // that's a normal empty state, not an error to surface.
      if (error?.response?.status !== 404) {
        toast.error(
          error?.response?.data?.message || "Could not load resume analysis"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fileChangeHandler = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type !== "application/pdf") {
      toast.error("Please select a PDF file.");
      e.target.value = "";
      return;
    }
    setSelectedFile(file || null);
  };

  const uploadHandler = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      setUploading(true);
      const res = await axios.post(
        `${AI_API_ENDPOINT}/resume/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );
      if (res.data.success) {
        toast.success(res.data.message || "Resume analyzed and profile skills updated!");
        setAnalysis(res.data.analysis);
        if (res.data.user) {
          dispatch(setUser(res.data.user));
        }
        setSelectedFile(null);
      } else {
        toast.error(res.data.message || "Analysis failed");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Could not analyze resume"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-5 w-5 text-purple-600" />
        <h2 className="font-bold text-lg text-gray-900">AI Resume Analysis</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Upload your resume (PDF) to get an AI-generated skills summary and
        role suggestions, and to unlock match scores on job listings.
      </p>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <label className="flex items-center gap-2 text-sm border border-dashed border-gray-300 rounded-lg px-4 py-2.5 cursor-pointer hover:bg-gray-50 w-full sm:w-auto">
          <UploadCloud className="h-4 w-4 text-gray-500 shrink-0" />
          <span className="text-gray-600 truncate">
            {selectedFile ? selectedFile.name : "Choose a PDF file"}
          </span>
          <input
            type="file"
            accept="application/pdf"
            onChange={fileChangeHandler}
            className="hidden"
          />
        </label>
        <Button
          onClick={uploadHandler}
          disabled={!selectedFile || uploading}
          className="w-full sm:w-auto bg-purple-700 hover:bg-purple-800"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1" /> Analyzing...
            </>
          ) : analysis ? (
            "Re-analyze Resume"
          ) : (
            "Analyze Resume"
          )}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading analysis...
        </div>
      ) : !analysis ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
          <FileText className="h-4 w-4" />
          No resume analyzed yet.
        </div>
      ) : (
        <div className="space-y-4 pt-2 border-t border-gray-100">
          {analysis.summary && (
            <p className="text-sm text-gray-700 leading-relaxed pt-4">
              {analysis.summary}
            </p>
          )}

          {analysis.skills?.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                <strong>{analysis.skills.length} skills</strong> extracted from your resume have been updated directly into your profile's Skills section above.
              </span>
            </div>
          )}

          {analysis.suggestedRoles?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1.5">
                Suggested Roles
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {analysis.suggestedRoles.map((role, i) => (
                  <Badge key={i} variant="outline" className="border-purple-300 text-purple-700">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {analysis.missingSkills?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1.5">
                Skills Worth Adding
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {analysis.missingSkills.map((skill, i) => (
                  <Badge key={i} variant="outline" className="border-orange-300 text-orange-700">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {analysis.experience?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1.5">
                Experience
              </h3>
              <ul className="text-sm text-gray-700 space-y-1">
                {analysis.experience.map((exp, i) => (
                  <li key={i}>
                    <span className="font-medium">{exp.role}</span>
                    {exp.company ? ` — ${exp.company}` : ""}
                    {exp.duration ? ` (${exp.duration})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.education?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1.5">
                Education
              </h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                {analysis.education.map((edu, i) => (
                  <li key={i}>{edu}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.certifications?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1.5">
                Certifications
              </h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                {analysis.certifications.map((cert, i) => (
                  <li key={i}>{cert}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeAnalysis;
