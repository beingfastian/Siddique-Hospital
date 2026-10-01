import doctorModel from "../model/doctorModel.js";
import otpModel from "../model/otpModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendOTPEmail } from "../config/nodemailer.js";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const GENERIC_OTP_MESSAGE = "If an account exists for this email, an OTP has been sent.";

// Generate a cryptographically random 6-digit OTP
const generateOTP = () => crypto.randomInt(100000, 1000000).toString();

// Request password reset
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Same response whether or not the doctor exists, so emails can't be enumerated
    const doctor = await doctorModel.findOne({ email });
    if (!doctor) {
      return res.json({ success: true, message: GENERIC_OTP_MESSAGE });
    }

    const otp = generateOTP();

    // Only the newest OTP is valid
    await otpModel.deleteMany({ email });
    await otpModel.create({
      email,
      otpHash: await bcrypt.hash(otp, 10),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });

    const emailResult = await sendOTPEmail(email, otp);
    if (!emailResult.success) {
      console.error("OTP email failed:", emailResult.error);
    }

    res.json({ success: true, message: GENERIC_OTP_MESSAGE });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// Verify OTP and return a short-lived reset token
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const otpRecord = await otpModel.findOne({ email });
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      await otpModel.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: "Too many attempts. Please request a new OTP." });
    }

    const isMatch = await bcrypt.compare(String(otp), otpRecord.otpHash);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    await otpModel.deleteOne({ _id: otpRecord._id });

    const resetToken = jwt.sign(
      { email, purpose: "password-reset" },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    res.json({ success: true, message: "OTP verified successfully", resetToken });
  } catch (error) {
    console.error("Error in verifyOTP:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// Reset password (requires the reset token from verifyOTP)
export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken) {
      return res.status(400).json({ success: false, message: "Please verify OTP first" });
    }

    let payload;
    try {
      payload = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ success: false, message: "Reset link expired. Please start over." });
    }
    if (payload.purpose !== "password-reset") {
      return res.status(400).json({ success: false, message: "Invalid reset token" });
    }

    if (!newPassword || newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password should be at least 8 characters long"
      });
    }

    const doctor = await doctorModel.findOne({ email: payload.email });
    if (!doctor) {
      return res.status(400).json({ success: false, message: "Invalid reset token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await doctorModel.findByIdAndUpdate(doctor._id, { password: hashedPassword });

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};
