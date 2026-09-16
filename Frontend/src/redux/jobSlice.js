import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  allJobs: [],
  allAdminJobs: [], // This will hold
  singleJob: null, // This will hold the job details when a user clicks on a job
  searchJobByText: "",
  allAppliedJobs: [], // This will hold
  searchedQuery: [],
  savedJobs: [], // New state to hold saved jobs
};

const jobSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {
    setAllJobs(state, action) {
      state.allJobs = action.payload; // Update state with fetched jobs
    },
    setSingleJob(state, action) {
      state.singleJob = action.payload; // Update state with fetched job details
    },
    setAllAdminJobs(state, action) {
      state.allAdminJobs = action.payload; // Update state with fetched admin jobs
    },
    setSearchJobByText(state, action) {
      state.searchJobByText = action.payload;
    },
    setAllAppliedJobs(state, action) {
      state.allAppliedJobs = action.payload;
    },
    setSearchedQuery(state, action) {
      state.searchedQuery = action.payload;
    },
    saveJob(state, action) {
      const job = action.payload;
      if (!state.savedJobs) {
        state.savedJobs = [];
      }
      const existingIndex = state.savedJobs.findIndex(
        (savedJob) => savedJob._id === job._id
      );
      if (existingIndex >= 0) {
        // If already saved, remove it (toggle off)
        state.savedJobs.splice(existingIndex, 1);
      } else {
        // If not saved, add it
        state.savedJobs.push(job);
      }
    },
  },
});

export const {
  setAllJobs,
  setSingleJob,
  setAllAdminJobs,
  setSearchJobByText,
  setAllAppliedJobs,
  setSearchedQuery,
  saveJob,
} = jobSlice.actions;
export default jobSlice.reducer;
