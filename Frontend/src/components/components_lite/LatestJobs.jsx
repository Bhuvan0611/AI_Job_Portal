import React from "react";
import JobCards from "./JobCards";

const LatestJobs = ({ jobs, loading }) => {
  const allJobs = jobs || [];

  return (
    <div className="max-w-7xl mx-auto my-20 px-4 md:px-8">
      <h2 className="text-3xl md:text-4xl font-bold">
        <span className="text-[#6A38C2]">Latest & Top </span>Job Openings
      </h2>

      {/* Job Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-5">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="p-5 rounded-md shadow-xl bg-white border border-gray-200 animate-pulse"
            >
              <div className="h-4 w-1/3 rounded bg-gray-200" />
              <div className="h-5 w-3/4 rounded bg-gray-200 my-3" />
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
          ))
        ) : allJobs.length === 0 ? (
          <span>No Job Available</span>
        ) : (
          allJobs
            .slice(0, 6)
            .map((job, index) =>
              job?._id ? (
                <JobCards key={job._id} job={job}></JobCards>
              ) : (
                <span key={index}>Invalid Job Data</span>
              )
            )
        )}
      </div>
    </div>
  );
};

export default LatestJobs;
