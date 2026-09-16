import React, { useState } from "react";
import { Button } from "../ui/button";
import { Search } from "lucide-react";
import { PiBuildingOfficeBold } from "react-icons/pi";
import { useDispatch } from "react-redux";
import { setSearchedQuery } from "@/redux/jobSlice";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const [query, setQuery] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const searchjobHandler = () => {
    dispatch(setSearchedQuery(query));
    navigate("/browse");
  };
  return (
    <div className="px-4 md:px-0">
      <div className="text-center">
        <div className="flex flex-col gap-5 my-10">
          <span className="mx-auto flex justify-center items-center py-2 px-4 gap-2 rounded-full bg-gray-200 text-red-600 font-medium text-sm md:text-base">
            <span className="text-[#614232]">
              {" "}
              <PiBuildingOfficeBold />
            </span>{" "}
            No.1 Job Hunt Website
          </span>

          <h2 className="text-3xl md:text-5xl font-bold leading-tight">
            Search Apply & <br className="hidden md:block" />
            Get Your <span className="text-[#6A38C2]">Dream Job</span>
          </h2>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
            Start your hunt for the best, life-changing career opportunities
            from here in your selected areas conveniently and get hired quickly.
          </p>
          <div className="flex w-full sm:w-[85%] md:w-[65%] lg:w-[50%] shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-white rounded-full items-center p-2 mx-auto mt-8 border border-gray-100 transition-all hover:shadow-2xl">
            <input
              type="text"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  searchjobHandler();
                }
              }}
              placeholder="Find Your Dream Job..."
              className="outline-none border-none w-full py-3 px-6 bg-transparent text-gray-800 text-base md:text-lg placeholder:text-gray-400"
            />
            <Button 
              onClick={searchjobHandler} 
              className="rounded-full bg-[#6B3AC2] hover:bg-[#5b30a6] h-12 w-12 md:w-32 flex items-center justify-center gap-2 transition-colors shrink-0"
            >
              <Search className="h-5 w-5" />
              <span className="hidden md:block font-semibold">Search</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
