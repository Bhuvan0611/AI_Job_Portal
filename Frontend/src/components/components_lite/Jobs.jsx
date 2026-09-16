import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import FilterCard from "./Filtercard";
import Job1 from "./Job1";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";

const Jobs = () => {
  const { allJobs, searchedQuery } = useSelector((store) => store.job);
  const [filterJobs, setFilterJobs] = useState(allJobs);

  useEffect(() => {
    // If no search query is provided, reset to all jobs
    if (
      !searchedQuery ||
      (Array.isArray(searchedQuery) && searchedQuery.length === 0) ||
      (typeof searchedQuery === "string" && searchedQuery.trim() === "")
    ) {
      setFilterJobs(allJobs);
      return;
    }

    const queryArray = Array.isArray(searchedQuery)
      ? searchedQuery
      : [searchedQuery];

    // Filter based on the searched query across various fields
    const filteredJobs = allJobs.filter((job) => {
      // Check if job matches at least one of the selected filters
      return queryArray.some((query) => {
        const q = query.toLowerCase();
        return (
          job.title?.toLowerCase().includes(q) ||
          job.description?.toLowerCase().includes(q) ||
          job.location?.toLowerCase().includes(q) ||
          job.salary?.toLowerCase().includes(q)
        );
      });
    });

    setFilterJobs(filteredJobs);
  }, [allJobs, searchedQuery]);

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto mt-5 px-4 md:px-8">
        <div className="flex flex-col md:flex-row gap-5">
          <div className="w-full md:w-1/5 md:min-w-[250px] md:h-[88vh] md:overflow-y-auto pb-5 pr-2">
            <FilterCard />
          </div>

          {filterJobs.length <= 0 ? (
            <span>Job not found</span>
          ) : (
            <div className="flex-1 h-auto md:h-[88vh] md:overflow-y-auto pb-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterJobs.map((job) => (
                  <motion.div
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.4 }}
                    key={job._id}
                    className="h-full"
                  >
                    <Job1 job={job} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;
