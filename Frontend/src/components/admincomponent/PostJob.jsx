import React, { useEffect, useState } from "react";
import Navbar from "../components_lite/Navbar";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { useSelector } from "react-redux";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import axios from "axios";
import { JOB_API_ENDPOINT } from "@/utils/data";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

const PostJob = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [input, setInput] = useState({
    title: "",
    description: "",
    requirements: "",
    salary: "",
    location: "",
    jobType: "",
    experience: "",
    position: 0,
    companyId: "",
  });
  const navigate = useNavigate();
  const { companies } = useSelector((store) => store.company);
  const changeEventHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };
  const [loading, setLoading] = useState(false);
  const [fetchingJob, setFetchingJob] = useState(isEditMode);
  const [selectedCompanyName, setSelectedCompanyName] = useState("");

  // In edit mode, load the existing job so the form can be pre-filled.
  useEffect(() => {
    if (!isEditMode) return;

    const fetchJob = async () => {
      try {
        const res = await axios.get(`${JOB_API_ENDPOINT}/get/${id}`, {
          withCredentials: true,
        });
        if (res.data.status) {
          const job = res.data.job;
          setInput({
            title: job.title || "",
            description: job.description || "",
            requirements: (job.requirements || []).join(","),
            salary: job.salary ?? "",
            location: job.location || "",
            jobType: job.jobType || "",
            experience: job.experienceLevel ?? "",
            position: job.position ?? 0,
            companyId: job.company?._id || "",
          });
          if (job.company?.name) {
            setSelectedCompanyName(job.company.name.toLowerCase());
          }
        } else {
          toast.error("Could not load this job.");
        }
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Could not load this job."
        );
      } finally {
        setFetchingJob(false);
      }
    };
    fetchJob();
  }, [id, isEditMode]);

  const selectChangeHandler = (value) => {
    const selectedCompany = companies.find(
      (company) => company.name.toLowerCase() === value
    );
    setSelectedCompanyName(value);
    setInput({ ...input, companyId: selectedCompany._id });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = isEditMode
        ? await axios.put(`${JOB_API_ENDPOINT}/update/${id}`, input, {
            headers: {
              "Content-Type": "application/json",
            },
            withCredentials: true,
          })
        : await axios.post(`${JOB_API_ENDPOINT}/post`, input, {
            headers: {
              "Content-Type": "application/json",
            },
            withCredentials: true,
          });
      if (res.data.status) {
        toast.success(res.data.message);
        navigate("/admin/jobs");
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      if (error.response && error.response.data) {
        toast.error(error.response.data.message || "Something went wrong");
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="flex items-center justify-center w-full my-5 px-4 md:px-0">
        {fetchingJob ? (
          <div className="flex items-center gap-2 text-gray-600 my-10">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading job...
          </div>
        ) : (
        <form
          onSubmit={submitHandler}
          className="p-4 sm:p-8 w-full max-w-4xl border border-gray-500 shadow-sm hover:shadow-xl hover:shadow-red-300 rounded-lg"
        >
          <h1 className="font-bold text-xl mb-4">
            {isEditMode ? "Edit Job" : "Post a New Job"}
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label>Title</Label>
              <Input
                type="text"
                name="title"
                value={input.title}
                placeholder="Enter job title"
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1 hover:shadow-blue-400"
                onChange={changeEventHandler}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                name="description"
                value={input.description}
                placeholder="Enter job description"
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1 hover:shadow-blue-400 "
                onChange={changeEventHandler}
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                type="text"
                name="location"
                value={input.location}
                placeholder="Enter job location"
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1 hover:shadow-blue-400"
                onChange={changeEventHandler}
              />
            </div>
            <div>
              <Label>Salary</Label>
              <Input
                type="number"
                name="salary"
                value={input.salary}
                placeholder="Enter job salary"
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1 hover:shadow-blue-400"
                onChange={changeEventHandler}
              />
            </div>
            <div>
              <Label>Position</Label>
              <Input
                type="number"
                name="position"
                value={input.position}
                placeholder="Enter job position"
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1 hover:shadow-blue-400"
                onChange={changeEventHandler}
              />
            </div>
            <div>
              <Label>Requirements</Label>
              <Input
                type="text"
                name="requirements"
                value={input.requirements}
                placeholder="Enter job requirements"
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1 hover:shadow-blue-400"
                onChange={changeEventHandler}
              />
            </div>

            <div>
              <Label>Experience</Label>
              <Input
                type="number"
                name="experience"
                value={input.experience}
                placeholder="Enter job experience"
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1 hover:shadow-blue-400"
                onChange={changeEventHandler}
              />
            </div>
            <div>
              <Label>Job Type</Label>
              <Input
                type="text"
                name="jobType"
                value={input.jobType}
                placeholder="Enter job type"
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1 hover:shadow-blue-400"
                onChange={changeEventHandler}
              />
            </div>

            <div>
              {companies.length > 0 && (
                <Select
                  onValueChange={selectChangeHandler}
                  value={selectedCompanyName || undefined}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a Company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {companies.map((company) => (
                        <SelectItem
                          key={company._id}
                          value={company.name.toLowerCase()}
                        >
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <div className="flex items-center justify-center mt-5">
            {loading ? (
              <Button className="w-full px-4 py-2 text-sm text-white bg-black rounded-md ">
                {" "}
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait{" "}
              </Button>
            ) : (
              <Button
                type="submit"
                className="w-full px-4 py-2 text-sm text-white bg-black rounded-md hover:bg-blue-600"
              >
                {isEditMode ? "Update Job" : "Post Job"}
              </Button>
            )}
          </div>
          {companies.length === 0 && (
            <p className="text-sm font-bold my-3 text-center text-red-600">
              *Please register a company to post jobs.*
            </p>
          )}
        </form>
        )}
      </div>
    </div>
  );
};

export default PostJob;
