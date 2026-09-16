import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  MoreHorizontal,
  Sparkles,
  CheckCircle,
  XCircle,
  FileText,
  Mic,
  Loader2,
  Award,
  RefreshCw,
} from "lucide-react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import axios from "axios";
import { APPLICATION_API_ENDPOINT, AI_API_ENDPOINT } from "@/utils/data";
import AIInterviewModal from "./AIInterviewModal";
import AIReportModal from "./AIReportModal";

const shortlistingStatus = ["Accepted", "Rejected"];

const getMatchBadgeStyle = (score) => {
  if (score >= 80) {
    return "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100";
  }
  if (score >= 60) {
    return "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100";
  }
  if (score >= 40) {
    return "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100";
  }
  return "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100";
};

const ApplicantsTable = ({ onRefresh }) => {
  const { jobWithApplicants } = useSelector((store) => store.application);
  const jobId = jobWithApplicants?._id;

  const [matches, setMatches] = useState({});
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [localStatuses, setLocalStatuses] = useState({});

  // Modals state
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // Fetch candidate AI match scores for this job
  const fetchMatches = async (force = false) => {
    if (!jobId) return;
    try {
      setLoadingMatches(true);
      const url = `${AI_API_ENDPOINT}/match/candidates/${jobId}${force ? "?refresh=true" : ""}`;
      const res = await axios.get(url, {
        withCredentials: true,
      });
      if (res.data.success && res.data.matches) {
        const matchMap = {};
        res.data.matches.forEach((m) => {
          if (m.candidate?._id) {
            matchMap[m.candidate._id] = m;
          }
        });
        setMatches(matchMap);
        if (force) {
          toast.success("AI match scores refreshed successfully!");
        }
      }
    } catch (error) {
      console.error("Failed to load candidate AI matches:", error);
    } finally {
      setLoadingMatches(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [jobId]);

  const statusHandler = async (status, id) => {
    // Optimistically update UI immediately
    setLocalStatuses((prev) => ({ ...prev, [id]: status.toLowerCase() }));

    try {
      const res = await axios.post(
        `${APPLICATION_API_ENDPOINT}/status/${id}/update`,
        { status },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      // Revert optimistic update on failure
      setLocalStatuses((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      toast.error(error?.response?.data?.message || "Something went wrong");
    }
  };

  const handleOpenInterview = (applicant) => {
    setSelectedApplicant(applicant);
    setInterviewOpen(true);
  };

  const handleOpenReport = (applicant) => {
    setSelectedApplicant(applicant);
    setReportOpen(true);
  };

  return (
    <div>
      <Table>
        <TableCaption>A list of your recent applied candidates</TableCaption>
        <TableHeader>
          <TableRow className="bg-gray-50/70">
            <TableHead className="font-semibold text-gray-700">FullName</TableHead>
            <TableHead className="font-semibold text-gray-700">Email</TableHead>
            <TableHead className="font-semibold text-gray-700">Contact</TableHead>
            <TableHead className="font-semibold text-gray-700">Resume / Portfolio</TableHead>
            <TableHead className="font-semibold text-purple-800">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span>AI Match Score</span>
                <button
                  type="button"
                  onClick={() => fetchMatches(true)}
                  disabled={loadingMatches}
                  title="Re-calculate AI Match Scores"
                  className="p-1 hover:bg-purple-100 rounded-md transition-colors text-purple-600 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingMatches ? "animate-spin" : ""}`} />
                </button>
              </div>
            </TableHead>
            <TableHead className="font-semibold text-gray-700">Date</TableHead>
            <TableHead className="font-semibold text-gray-700">Status</TableHead>
            <TableHead className="text-right font-semibold text-gray-700">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobWithApplicants?.applications?.length ? (
            jobWithApplicants.applications.map((item) => {
              const candidateId = item?.applicant?._id;
              const match = matches[candidateId];
              const score = match ? Math.round(match.matchScore || 0) : null;

              return (
                <TableRow key={item._id} className="hover:bg-purple-50/30 transition-colors">
                  <TableCell className="font-medium text-gray-900">
                    {item?.applicant?.fullname}
                  </TableCell>
                  <TableCell className="text-gray-600">{item?.applicant?.email}</TableCell>
                  <TableCell className="text-gray-600">{item?.applicant?.phoneNumber}</TableCell>
                  <TableCell>
                    {item.applicant?.profile?.resume ? (
                      <a
                        className="text-blue-600 hover:underline cursor-pointer font-medium"
                        href={item?.applicant?.profile?.resume}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Link
                      </a>
                    ) : (
                      <span className="text-gray-400">NA</span>
                    )}
                  </TableCell>

                  {/* AI Match Score Column */}
                  <TableCell>
                    {loadingMatches ? (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />
                        Analyzing...
                      </div>
                    ) : match ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-sm ${getMatchBadgeStyle(
                              score
                            )}`}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            {score}% Match
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4 shadow-xl border-purple-100">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between border-b pb-2">
                              <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                                <Sparkles className="h-4 w-4 text-purple-600" />
                                AI Match Breakdown
                              </h4>
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getMatchBadgeStyle(
                                  score
                                )}`}
                              >
                                {score}%
                              </span>
                            </div>

                            {/* Matched Skills */}
                            <div>
                              <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1 mb-1.5">
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                Matched Skills:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {match.matchedSkills?.length ? (
                                  match.matchedSkills.map((s, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="secondary"
                                      className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    >
                                      {s}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-[11px] text-gray-400">None detected</span>
                                )}
                              </div>
                            </div>

                            {/* Missing Skills */}
                            <div>
                              <span className="text-xs font-semibold text-amber-800 flex items-center gap-1 mb-1.5">
                                <XCircle className="h-3.5 w-3.5 text-amber-600" />
                                Missing / Recommended Skills:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {match.missingSkills?.length ? (
                                  match.missingSkills.map((s, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="secondary"
                                      className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200"
                                    >
                                      {s}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-[11px] text-gray-400">No missing skills</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <span className="text-xs text-gray-400">Pending</span>
                    )}
                  </TableCell>

                  <TableCell className="text-gray-500">
                    {item?.createdAt?.split("T")[0]}
                  </TableCell>

                  {/* Shortlisting Status */}
                  <TableCell>
                    {(() => {
                      const currentStatus = (localStatuses[item._id] || item?.status || "").toLowerCase();
                      if (currentStatus === "accepted") {
                        return (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                            Accepted
                          </Badge>
                        );
                      }
                      if (currentStatus === "rejected") {
                        return (
                          <Badge className="bg-red-100 text-red-800 border-red-200">
                            Rejected
                          </Badge>
                        );
                      }
                      return (
                        <Badge variant="outline" className="text-gray-600">
                          Pending
                        </Badge>
                      );
                    })()}
                  </TableCell>

                  {/* Actions Dropdown */}
                  <TableCell className="text-right">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2" align="end">
                        <div className="space-y-1">
                          {/* AI Feature 1: Generate AI Interview */}
                          <button
                            onClick={() => handleOpenInterview(item)}
                            className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-purple-700 hover:bg-purple-50 rounded-md transition-colors text-left"
                          >
                            <Mic className="h-3.5 w-3.5 text-purple-600" />
                            Generate AI Interview
                          </button>

                          {/* AI Feature 2: View AI Hiring Report */}
                          <button
                            onClick={() => handleOpenReport(item)}
                            className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors text-left"
                          >
                            <Award className="h-3.5 w-3.5 text-indigo-600" />
                            AI Hiring Report
                          </button>

                          <div className="border-t my-1" />

                          {/* Status Management */}
                          <div className="px-2 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            Update Status
                          </div>
                          {shortlistingStatus.map((status, index) => (
                            <button
                              key={index}
                              onClick={() => statusHandler(status, item?._id)}
                              className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md text-left transition-colors ${
                                status === "Accepted"
                                  ? "hover:bg-emerald-50 text-emerald-700"
                                  : "hover:bg-red-50 text-red-700"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  status === "Accepted" ? "bg-emerald-500" : "bg-red-500"
                                }`}
                              />
                              Mark as {status}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                No applicants yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* AI Interview Modal */}
      {selectedApplicant && (
        <AIInterviewModal
          open={interviewOpen}
          setOpen={setInterviewOpen}
          jobId={jobId}
          candidateId={selectedApplicant?.applicant?._id}
          candidateName={selectedApplicant?.applicant?.fullname}
          jobTitle={jobWithApplicants?.title}
        />
      )}

      {/* AI Hiring Report Modal */}
      {selectedApplicant && (
        <AIReportModal
          open={reportOpen}
          setOpen={setReportOpen}
          applicationId={selectedApplicant?._id}
          candidateName={selectedApplicant?.applicant?.fullname}
          jobTitle={jobWithApplicants?.title}
          onStatusUpdated={onRefresh}
        />
      )}
    </div>
  );
};

export default ApplicantsTable;
