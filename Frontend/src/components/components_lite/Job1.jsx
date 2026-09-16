import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Bookmark } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { saveJob } from "@/redux/jobSlice";
import { toast } from "sonner";

const Job1 = ({ job }) => {
  const navigate = useNavigate(); 

  const daysAgoFunction = (mongodbTime) => {
    const createdAt = new Date(mongodbTime);
    const currentTime = new Date();
    const timeDifference = currentTime - createdAt;
    return Math.floor(timeDifference / (1000 * 24 * 60 * 60));
  };

  const dispatch = useDispatch();
  const { savedJobs } = useSelector((store) => store.job);
  const { user } = useSelector((store) => store.auth);
  const isSaved = savedJobs?.some((savedJob) => savedJob._id === job._id);

  const handleSaveJob = () => {
    if (!user) {
      toast.error("Please login to save jobs");
      navigate("/login");
      return;
    }
    dispatch(saveJob(job));
  };

  return (
    <div className="p-5 rounded-md shadow-xl bg-white border border-gray-100 w-full h-full flex flex-col">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {daysAgoFunction(job?.createdAt) === 0
            ? "Today"
            : `${daysAgoFunction(job?.createdAt)} days ago`}
        </p>
        <Button variant="outline" className="rounded-full" size="icon" onClick={handleSaveJob}>
          <Bookmark fill={isSaved ? "black" : "none"} />
        </Button>
      </div>

      <div className="flex items-center gap-2 my-2">
        <Button className="p-6 shrink-0" variant="outline" size="icon">
          <Avatar>
            <AvatarImage src={job?.company?.logo} />
            <AvatarFallback>
              {job?.company?.name?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        </Button>
        <div>
          <h1 className="font-medium text-lg">{job?.company?.name}</h1>
          <p className="text-sm text-gray-500">India</p>
        </div>
      </div>

      <div className="flex-1">
        <h1 className="font-bold text-lg my-2">{job?.title}</h1>
        <p className="text-sm text-gray-600">{job?.description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <Badge className={"text-blue-700 font-bold"} variant="ghost">
          {job?.position} Positions
        </Badge>
        <Badge className={"text-[#F83002] font-bold"} variant="ghost">
          {job?.jobType}
        </Badge>
        <Badge className={"text-[#7209b7] font-bold"} variant="ghost">
          {job?.salary}LPA
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-4 mt-4">
        <Button
          onClick={() => navigate(`/description/${job?._id}`)}
          variant="outline"
          className="flex-1 sm:flex-none"
        >
          Details
        </Button>
        <Button 
          className={isSaved ? "bg-gray-400 flex-1 sm:flex-none" : "bg-[#7209b7] flex-1 sm:flex-none"}
          onClick={handleSaveJob}
        >
          {isSaved ? "Saved" : "Save For Later"}
        </Button>
      </div>
    </div>
  );
};

export default Job1;

