import jwt from "jsonwebtoken";

// Like isAuthenticated, but never blocks the request - it just attaches
// req.id when a valid token cookie is present. Use this on routes that
// are public but behave slightly differently for a logged-in user
// (e.g. "isApplied" on a job details page).
const optionalAuth = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return next();
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded) {
      req.id = decoded.userId;
    }
    next();
  } catch (error) {
    // an invalid/expired token on a public route just means "not logged in"
    next();
  }
};

export default optionalAuth;
