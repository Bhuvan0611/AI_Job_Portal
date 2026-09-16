import { createSlice } from "@reduxjs/toolkit";

const aiSlice = createSlice({
  name: "ai",
  initialState: {
    resumeAnalysis: null,
    currentMatch: null,
    assistantMessages: [],
    currentInterview: null,
    currentReport: null,
  },
  reducers: {
    setResumeAnalysis: (state, action) => {
      state.resumeAnalysis = action.payload;
    },
    setJobMatch: (state, action) => {
      state.currentMatch = action.payload;
    },
    addAssistantMessage: (state, action) => {
      state.assistantMessages.push(action.payload);
    },
    setAssistantMessages: (state, action) => {
      state.assistantMessages = action.payload;
    },
    setInterview: (state, action) => {
      state.currentInterview = action.payload;
    },
    setReport: (state, action) => {
      state.currentReport = action.payload;
    },
    clearAiState: (state) => {
      state.resumeAnalysis = null;
      state.currentMatch = null;
      state.assistantMessages = [];
      state.currentInterview = null;
      state.currentReport = null;
    },
  },
});

export const {
  setResumeAnalysis,
  setJobMatch,
  addAssistantMessage,
  setAssistantMessages,
  setInterview,
  setReport,
  clearAiState,
} = aiSlice.actions;

export default aiSlice.reducer;
