import jwt from "jsonwebtoken";

// Admin Authentication Middleware
const authAdmin = async (req, res, next) => {
  try {
    const { atoken } = req.headers;
    if (!atoken) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized Access denied",
      });
    }
    const token_decode = jwt.verify(atoken, process.env.JWT_SECRET);
    if (token_decode.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: "Invalid Credentials",
      });
    }
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Session expired. Please login again." });
  }
};

export default authAdmin;
