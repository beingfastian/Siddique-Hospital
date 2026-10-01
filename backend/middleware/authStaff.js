import jwt from "jsonwebtoken";

// Accepts either an admin token (atoken) or a doctor token (dtoken)
// and sets req.recipient / req.recipientType for notification queries.
const authStaff = (req, res, next) => {
  try {
    const { atoken, dtoken } = req.headers;
    const token = atoken || dtoken;
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized Access denied" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === "admin") {
      req.recipient = "admin";
      req.recipientType = "admin";
    } else if (decoded.role === "doctor" && decoded.id) {
      req.recipient = decoded.id;
      req.recipientType = "doctor";
    } else {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Session expired. Please login again." });
  }
};

export default authStaff;
