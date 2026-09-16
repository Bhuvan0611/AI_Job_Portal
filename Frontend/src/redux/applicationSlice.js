import { createSlice } from "@reduxjs/toolkit";

const applicationSlice = createSlice({
    name:'application',
    initialState:{
        // Holds the job document (with its populated `applications` array),
        // not a list of applicants directly.
        jobWithApplicants:null,
    },
    reducers:{
        setJobWithApplicants:(state,action) => {
            state.jobWithApplicants = action.payload;
        }
    }
});

export const {setJobWithApplicants} = applicationSlice.actions;
export default applicationSlice.reducer;
