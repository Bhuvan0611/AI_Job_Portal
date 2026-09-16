import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { AI_API_ENDPOINT } from "@/utils/data";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Sparkles, Loader2 } from "lucide-react";

/**
 * On-demand AI match score for a job (student view). The backend endpoint
 * (GET /api/ai/match/job/:jobId) already existed but nothing in the
 * frontend ever called it.
 */
const JobMatchScore = ({ jobId }) => {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [needsResume, setNeedsResume] = useState(false);

  const checkMatch = async () => {
    setLoading(true);
    setNeedsResume(false);
    try {
      const res = await axios.get(`${AI_API_ENDPOINT}/match/job/${jobId}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setMatch(res.data.match);
      }
    } catch (error) {
      if (error?.response?.status === 400) {
        setNeedsResume(true);
      } else {
        toast.error(
          error?.response?.data?.message || "Could not compute match score"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-4 p-4 rounded-lg border border-purple-100 bg-purple-50/50">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-purple-600" />
        <h3 className="font-bold text-sm text-gray-900">AI Match Score</h3>
      </div>

      {needsResume ? (
        <p className="text-sm text-gray-600">
          Upload your resume on your{" "}
          <Link to="/Profile" className="text-purple-700 font-semibold hover:underline">
            profile page
          </Link>{" "}
          to see how well you match this job.
        </p>
      ) : match ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-purple-700">
              {Math.round(match.matchScore)}%
            </span>
            <span className="text-sm text-gray-500">match</span>
          </div>
          {match.explanation && (
            <p className="text-sm text-gray-700">{match.explanation}</p>
          )}
          {match.matchedSkills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {match.matchedSkills.map((skill, i) => (
                <Badge key={i} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
          {match.missingSkills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {match.missingSkills.map((skill, i) => (
                <Badge key={i} variant="outline" className="border-orange-300 text-orange-700">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ) : (
        <Button
          onClick={checkMatch}
          disabled={loading}
          size="sm"
          className="bg-purple-700 hover:bg-purple-800"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1" /> Checking...
            </>
          ) : (
            "Check My Match Score"
          )}
        </Button>
      )}
    </div>
  );
};

export default JobMatchScore;
