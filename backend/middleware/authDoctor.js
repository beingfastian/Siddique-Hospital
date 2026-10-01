import jwt from "jsonwebtoken";
import doctorModel from "../model/doctorModel.js";

// Doctor Authentication Middleware
const authDoctor = async (req, res, next) => {
  try {
    const token = req.headers.dtoken || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided. Please login again."
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again."
      });
    }

    if (decoded.role !== "doctor") {
      return res.status(401).json({ success: false, message: "Invalid token. Please login again." });
    }

    const doctor = await doctorModel.findById(decoded.id).select("-password");
    if (!doctor) {
      return res.status(401).json({
        success: false,
        message: "Doctor not found. Please login again."
      });
    }

    // Identity always comes from the token, never from the client
    req.doctorId = decoded.id;
    req.body.docId = decoded.id;
    req.doctor = doctor;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: "Authentication error"
    });
  }
};

export default authDoctor;
