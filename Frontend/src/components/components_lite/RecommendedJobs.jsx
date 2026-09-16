import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Badge } from "../ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { JOB_API_ENDPOINT } from "@/utils/data";

const RecommendedJobs = ({ jobId }) => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;

    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${JOB_API_ENDPOINT}/recommendations/${jobId}`,
          { withCredentials: true }
        );
        if (res.data.status) {
          setJobs(res.data.jobs);
        }
      } catch (error) {
        console.error("Failed to load recommendations:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [jobId]);

  if (loading) {
    return (
      <div className="mt-10">
        <h2 className="font-bold text-xl mb-5">Recommended For You</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-5 rounded-md shadow-lg bg-white border border-gray-200 animate-pulse"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-gray-200" />
                  <div className="h-2 w-1/3 rounded bg-gray-200" />
                </div>
              </div>
              <div className="h-4 w-3/4 rounded bg-gray-200 my-3" />
              <div className="space-y-2">
                <div className="h-2 w-full rounded bg-gray-200" />
                <div className="h-2 w-5/6 rounded bg-gray-200" />
              </div>
              <div className="flex gap-2 mt-4">
                <div className="h-5 w-16 rounded bg-gray-200" />
                <div className="h-5 w-12 rounded bg-gray-200" />
                <div className="h-5 w-14 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className="mt-10">
      <h2 className="font-bold text-xl mb-5">Recommended For You</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {jobs.map((job) => (
          <div
            key={job._id}
            onClick={() => navigate(`/description/${job._id}`)}
            className="p-5 rounded-md shadow-lg bg-white border border-gray-200 cursor-pointer hover:shadow-2xl hover:shadow-purple-100 transition-shadow flex flex-col"
          >
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={job?.company?.logo} />
                <AvatarFallback>
                  {job?.company?.name?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-medium text-base">{job?.company?.name}</h1>
                <p className="text-xs text-gray-500">{job?.location || "India"}</p>
              </div>
            </div>

            <h2 className="font-bold text-lg my-1">{job?.title}</h2>
            <p className="text-sm text-gray-600 line-clamp-2 flex-1">
              {job?.description}
            </p>

            <div className="flex flex-wrap gap-2 items-center mt-4">
              <Badge className="text-blue-600 font-bold" variant="ghost">
                {job?.position} Positions
              </Badge>
              <Badge className="text-[#FA4F09] font-bold" variant="ghost">
                {job?.salary}LPA
              </Badge>
              <Badge className="text-[#6B3AC2] font-bold" variant="ghost">
                {job?.jobType}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedJobs;
