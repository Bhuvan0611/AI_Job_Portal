import React, { useState, useEffect } from "react";
import axios from "axios";
import { AI_API_ENDPOINT } from "@/utils/data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Sparkles,
  Loader2,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

const AIInterviewModal = ({
  open,
  setOpen,
  jobId,
  candidateId,
  candidateName,
  jobTitle,
}) => {
  const [loading, setLoading] = useState(false);
  const [interview, setInterview] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !jobId || !candidateId) return;

    // Reset state on open
    setInterview(null);
    setExpandedIndex(null);

    // Fetch existing interview or trigger generation
    fetchOrGenerate();
  }, [open, jobId, candidateId]);

  const fetchOrGenerate = async () => {
    try {
      setLoading(true);
      const res = await axios.post(
        `${AI_API_ENDPOINT}/interview/generate`,
        { jobId, candidateId },
        { withCredentials: true }
      );

      if (res.data.success && res.data.interview) {
        setInterview(res.data.interview);
        toast.success(res.data.message || "Interview questions generated!");
      }
    } catch (error) {
      // If already exists, error response might have existing interview
      if (error?.response?.data?.interview) {
        setInterview(error.response.data.interview);
      } else {
        toast.error(
          error?.response?.data?.message || "Failed to generate interview questions"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const copyAllQuestions = () => {
    if (!interview?.questions?.length) return;
    const text = interview.questions
      .map(
        (q, idx) =>
          `Q${idx + 1} (${q.skill}): ${q.questionText}\nIdeal Answer Guide: ${
            q.goldenAnswer
          }\n`
      )
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Questions copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[88vh] overflow-hidden flex flex-col p-0 rounded-xl">
        <DialogHeader className="p-5 bg-gradient-to-r from-purple-700 to-indigo-700 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <Sparkles className="h-5 w-5 text-yellow-300" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white">
                  AI Tailored Interview Questions
                </DialogTitle>
                <p className="text-xs text-purple-200 mt-0.5">
                  Custom questions generated for{" "}
                  <span className="font-semibold text-white">
                    {candidateName || "Candidate"}
                  </span>{" "}
                  • {jobTitle || "Position"}
                </p>
              </div>
            </div>
            {interview?.questions?.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={copyAllQuestions}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs gap-1.5"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy All"}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/60">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
              <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
              <p className="text-sm font-medium text-gray-700">
                Generating targeted interview questions with Gemini AI...
              </p>
              <p className="text-xs text-gray-400">
                Analyzing candidate skills against job requirements
              </p>
            </div>
          ) : interview?.questions?.length ? (
            interview.questions.map((q, idx) => {
              const isExpanded = expandedIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1">
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-800 leading-snug">
                          {q.questionText}
                        </p>
                        {q.skill && (
                          <Badge
                            variant="secondary"
                            className="text-[11px] bg-purple-50 text-purple-700 font-medium"
                          >
                            Skill Focus: {q.skill}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {q.goldenAnswer && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setExpandedIndex(isExpanded ? null : idx)
                        }
                        className="text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-50 shrink-0 gap-1 px-2 h-7"
                      >
                        {isExpanded ? (
                          <>
                            Hide Guide <ChevronUp className="h-3.5 w-3.5" />
                          </>
                        ) : (
                          <>
                            Ideal Answer <ChevronDown className="h-3.5 w-3.5" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {isExpanded && q.goldenAnswer && (
                    <div className="bg-purple-50/70 border border-purple-100 rounded-lg p-3 text-xs text-purple-950 mt-2 space-y-1 animate-in fade-in">
                      <div className="font-semibold text-purple-900 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
                        Ideal Evaluation Guide:
                      </div>
                      <p className="leading-relaxed pl-5 text-gray-700">
                        {q.goldenAnswer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-gray-400">
              <HelpCircle className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No interview questions generated yet.</p>
              <Button
                onClick={fetchOrGenerate}
                className="mt-4 bg-purple-700 hover:bg-purple-800 text-white"
              >
                Generate Interview Questions
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="p-3.5 bg-white border-t border-gray-200 shrink-0 flex items-center justify-between sm:justify-between">
          <p className="text-xs text-gray-500">
            Powered by Gemini AI • Tailored to candidate background
          </p>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIInterviewModal;
