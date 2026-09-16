import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import { Button } from "../ui/button";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setSearchedQuery } from "@/redux/jobSlice";
 
const Category = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Mern Developer",
  "Data Scientist",
  "DevOps Engineer",
  "Machine Learning Engineer",
  "Artificial Intelligence Engineer",
  "Cybersecurity Engineer",
  "Product Manager",
  "UX/UI Designer",
  "Graphics Engineer",
  "Graphics Designer",
  "Video Editor",
];

const Categories = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const searchjobHandler = (query) => {
      dispatch(setSearchedQuery(query));
      navigate("/browse");
  }
  return (
    <div className="px-10 md:px-0">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-center text-blue-600">
          Categories
        </h1>
        <p className="text-sm md:text-base text-center text-gray-600">
          Explore our extensive job market.
        </p>
      </div>
      <Carousel className="w-full max-w-xl mx-auto my-10">
        <CarouselContent>
          {Category.map((category, index) => {
            return (
              <CarouselItem key={index} className="basis-1/2 md:basis-1/3 lg:basis-1/4">
                <Button onClick={() => searchjobHandler(category)} variant="outline" className="w-full rounded-full text-xs md:text-sm text-center px-2 py-1 h-auto min-h-[40px] whitespace-normal">
                  {category}
                </Button>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>
    </div>
  );
};

export default Categories;
