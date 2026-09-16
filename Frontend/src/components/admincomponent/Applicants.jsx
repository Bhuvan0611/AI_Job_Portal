import React, { useEffect, useState } from "react";
import ApplicantsTable from "./ApplicantsTable";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setJobWithApplicants } from "@/redux/applicationSlice";
import { APPLICATION_API_ENDPOINT } from "@/utils/data";
import Navbar from "../components_lite/Navbar";
import { Button } from "../ui/button";
import { Bot, Sparkles } from "lucide-react";
import AIAssistantDrawer from "./AIAssistantDrawer";

const Applicants = () => {
  const params = useParams();
  const dispatch = useDispatch();
  const { jobWithApplicants } = useSelector((store) => store.application);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchAllApplicants = async () => {
    try {
      const res = await axios.get(
        `${APPLICATION_API_ENDPOINT}/${params.id}/applicants`,
        { withCredentials: true }
      );
      dispatch(setJobWithApplicants(res.data.job));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAllApplicants();
  }, [params.id, dispatch]);

  return (
    <div className="min-h-screen bg-gray-50/40">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 md:px-0 py-6">
        {/* Header with Title and AI Assistant Trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
          <div>
            <h1 className="font-extrabold text-2xl text-gray-900 flex items-center gap-2">
              Applicants
              <span className="text-sm font-semibold bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full">
                {jobWithApplicants?.applications?.length || 0}
              </span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Job: <span className="font-medium text-gray-700">{jobWithApplicants?.title || "Loading..."}</span>
            </p>
          </div>

          {/* AI Assistant Button */}
          <Button
            onClick={() => setDrawerOpen(true)}
            className="bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 hover:from-purple-800 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all gap-2 self-start sm:self-auto"
          >
            <Bot className="h-4 w-4 text-yellow-300" />
            <span>Ask AI Assistant</span>
            <Sparkles className="h-3.5 w-3.5 text-yellow-300 animate-pulse" />
          </Button>
        </div>

        {/* Applicants Table with AI Integration */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <ApplicantsTable onRefresh={fetchAllApplicants} />
        </div>
      </div>

      {/* Recruiter RAG AI Chat Drawer */}
      <AIAssistantDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        jobId={params.id}
      />
    </div>
  );
};

export default Applicants;
