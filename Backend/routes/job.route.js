import express from "express";

import authenticateToken from "../middleware/isAuthenticated.js";
import optionalAuth from "../middleware/optionalAuth.js";
import {
  getAdminJobs,
  getAllJobs,
  getJobById,
  getRecommendedJobs,
  postJob,
  updateJob,
} from "../controllers/job.controller.js";

const router = express.Router();

router.route("/post").post(authenticateToken, postJob);
// public - anyone can browse jobs without logging in
router.route("/get").get(getAllJobs);
router.route("/getadminjobs").get(authenticateToken, getAdminJobs);
// public, but attaches req.id when the visitor is logged in (so we can
// tell them whether they've already applied)
router.route("/get/:id").get(optionalAuth, getJobById);
router.route("/update/:id").put(authenticateToken, updateJob);
router.route("/recommendations/:id").get(getRecommendedJobs);
export default router;
