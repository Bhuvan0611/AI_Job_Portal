import React, { useEffect, useState } from "react";
import Navbar from "../components_lite/Navbar";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import AdminJobsTable from "./AdminJobsTable";
import useGetAllAdminJobs from "@/hooks/useGetAllJAdminobs";
import { setSearchJobByText } from "@/redux/jobSlice";

const AdminJobs = () => {
  const { loading, error } = useGetAllAdminJobs();
  const navigate = useNavigate();

  const [input, setInput] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setSearchJobByText(input));
  }, [input, dispatch]);
  return (
    <div>
      <Navbar />
      <div className="max-w-6xl mx-auto my-10 px-4 md:px-0">
        <div className="flex flex-col sm:flex-row items-center justify-between my-5 gap-4 sm:gap-0">
          <Input
            className="w-full sm:w-fit"
            placeholder="Filter by Name & Jobs"
            onChange={(e) => setInput(e.target.value)}
          ></Input>
          <Button className="w-full sm:w-auto" onClick={() => navigate("/admin/jobs/create")}>
            Post new Job
          </Button>
        </div>
        {loading && <p className="text-center my-5">Loading jobs...</p>}
        {error && !loading && (
          <p className="text-center my-5 text-red-600">{error}</p>
        )}
        <div className="overflow-x-auto">
          <AdminJobsTable />
        </div>
      </div>
    </div>
  );
};

export default AdminJobs;
