import React, { useState, useEffect } from "react";
import axios from "axios";
import { AI_API_ENDPOINT, APPLICATION_API_ENDPOINT } from "@/utils/data";
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
  CheckCircle,
  AlertTriangle,
  Award,
  TrendingUp,
  FileText,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

const getRecommendationStyle = (rec) => {
  const lower = (rec || "").toLowerCase();
  if (lower.includes("strong hire")) {
    return {
      bg: "bg-emerald-100 text-emerald-800 border-emerald-300",
      dot: "bg-emerald-500",
    };
  }
  if (lower.includes("hire")) {
    return {
      bg: "bg-green-100 text-green-800 border-green-300",
      dot: "bg-green-500",
    };
  }
  if (lower.includes("hold")) {
    return {
      bg: "bg-amber-100 text-amber-800 border-amber-300",
      dot: "bg-amber-500",
    };
  }
  return {
    bg: "bg-red-100 text-red-800 border-red-300",
    dot: "bg-red-500",
  };
};

const AIReportModal = ({
  open,
  setOpen,
  applicationId,
  candidateName,
  jobTitle,
  onStatusUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [deciding, setDeciding] = useState(false);

  useEffect(() => {
    if (!open || !applicationId) return;

    setReport(null);
    fetchReport();
  }, [open, applicationId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      // Try generating or fetching report
      const res = await axios.post(
        `${AI_API_ENDPOINT}/report/generate`,
        { applicationId },
        { withCredentials: true }
      );

      if (res.data.success && res.data.report) {
        setReport(res.data.report);
      }
    } catch (error) {
      // If error, try getReportByApplication
      try {
        const getRes = await axios.get(
          `${AI_API_ENDPOINT}/report/application/${applicationId}`,
          { withCredentials: true }
        );
        if (getRes.data.success && getRes.data.report) {
          setReport(getRes.data.report);
          return;
        }
      } catch (e) {
        // ignore
      }
      toast.error(
        error?.response?.data?.message || "Failed to generate AI hiring report"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (status) => {
    try {
      setDeciding(true);
      const res = await axios.post(
        `${APPLICATION_API_ENDPOINT}/status/${applicationId}/update`,
        { status },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(`Candidate marked as ${status}`);
        if (onStatusUpdated) onStatusUpdated();
        setOpen(false);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update decision");
    } finally {
      setDeciding(false);
    }
  };

  const recStyle = getRecommendationStyle(report?.aiRecommendation);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-xl">
        <DialogHeader className="p-5 bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-lg">
              <Award className="h-6 w-6 text-yellow-300" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                AI Candidate Evaluation Report
                <Sparkles className="h-4 w-4 text-yellow-300" />
              </DialogTitle>
              <p className="text-xs text-indigo-200 mt-0.5">
                Evaluation for{" "}
                <span className="font-semibold text-white">
                  {candidateName || "Candidate"}
                </span>{" "}
                • {jobTitle || "Position"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gray-50/70">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
              <p className="text-sm font-medium text-gray-700">
                Compiling AI hiring scorecard & recommendations...
              </p>
              <p className="text-xs text-gray-400">
                Evaluating resume fit, semantic similarity, and skill match
              </p>
            </div>
          ) : report ? (
            <>
              {/* Score & Recommendation Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-purple-50 to-indigo-100 border-4 border-purple-500 text-purple-700 font-extrabold text-2xl shadow-inner">
                    {Math.round(report.overallScore || 0)}
                    <span className="text-xs font-semibold">%</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">
                      Overall Candidate Fit
                    </h4>
                    <p className="text-xs text-gray-500">
                      Calculated using weighted AI scoring
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center sm:items-end">
                  <span className="text-xs text-gray-500 font-medium mb-1">
                    AI Recommendation
                  </span>
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${recStyle.bg}`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${recStyle.dot} animate-pulse`}
                    />
                    {report.aiRecommendation || "Hire"}
                  </div>
                </div>
              </div>

              {/* Strengths & Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="bg-white border border-emerald-100 rounded-xl p-4 shadow-sm space-y-2">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Key Strengths
                  </h4>
                  <ul className="space-y-1.5">
                    {report.strengths?.length ? (
                      report.strengths.map((item, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-gray-700 flex items-start gap-1.5 leading-relaxed"
                        >
                          <span className="text-emerald-500 font-bold">•</span>
                          {item}
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-gray-400">
                        No specific strengths highlighted
                      </li>
                    )}
                  </ul>
                </div>

                {/* Gaps */}
                <div className="bg-white border border-amber-100 rounded-xl p-4 shadow-sm space-y-2">
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Gaps & Areas to Verify
                  </h4>
                  <ul className="space-y-1.5">
                    {report.gaps?.length ? (
                      report.gaps.map((item, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-gray-700 flex items-start gap-1.5 leading-relaxed"
                        >
                          <span className="text-amber-500 font-bold">•</span>
                          {item}
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-gray-400">
                        No significant gaps identified
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <FileText className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No report generated.</p>
              <Button
                onClick={fetchReport}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Generate Report
              </Button>
            </div>
          )}
        </div>

        {/* Action Decision Footer */}
        <DialogFooter className="p-4 bg-white border-t border-gray-200 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={() => handleDecision("Accepted")}
              disabled={deciding}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-initial gap-1.5 text-xs font-semibold h-9"
            >
              <UserCheck className="h-4 w-4" /> Accept Candidate
            </Button>
            <Button
              onClick={() => handleDecision("Rejected")}
              disabled={deciding}
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 flex-1 sm:flex-initial gap-1.5 text-xs font-semibold h-9"
            >
              <UserX className="h-4 w-4" /> Reject Candidate
            </Button>
          </div>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIReportModal;
