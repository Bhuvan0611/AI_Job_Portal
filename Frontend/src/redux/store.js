import { combineReducers, configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import jobReducer from "./jobSlice";
import companyReducer from "./companyslice";
import applicationSlice from "./applicationSlice";
import aiReducer from "./aiSlice";

import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

const persistConfig = {
  key: "root",
  version: 1,
  storage,
};

const appReducer = combineReducers({
  auth: authReducer,
  job: jobReducer,
  company: companyReducer,
  application: applicationSlice,
  ai: aiReducer,
});

// Every slice here (savedJobs, allAppliedJobs, singleCompany, etc.) is
// persisted to localStorage so it survives a page refresh. That also means
// logging out has to explicitly wipe it - otherwise the next person to log
// in on this browser (or the same person after logging out) would still see
// the previous user's saved jobs, applied jobs, and other private data.
// Dispatching { type: "RESET_STORE" } resets every slice back to its
// initialState by handing combineReducers `undefined` state.
export const RESET_STORE = "RESET_STORE";

const rootReducer = (state, action) => {
  if (action.type === RESET_STORE) {
    state = undefined;
  }
  return appReducer(state, action);
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export default store;
