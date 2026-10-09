import { createTransporter, escapeHtml, getEmailTemplate, noteBox, paragraph } from "./emailService.js";
import { HOSPITAL_NAME } from "./hospital.js";

// Function to send OTP email
export const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('Email not configured - OTP email skipped');
      return { success: false };
    }

    const content =
      paragraph("We received a request to reset your password. Enter this code to continue:") +
      `<div style="text-align:center;margin:0 0 20px;">
        <div style="display:inline-block;font-size:32px;font-weight:700;letter-spacing:8px;color:#0F172A;background:#F1F5F9;border:1px solid #E2E8F0;border-radius:10px;padding:14px 24px;">${escapeHtml(otp)}</div>
        <p style="margin:12px 0 0;color:#475569;font-size:14px;">The code works for <strong>10 minutes</strong>.</p>
      </div>` +
      noteBox("Never share this code with anyone. Our staff will never ask for it.<br>If you didn't ask to reset your password, ignore this email; your password stays the same.", "warning");

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Your password reset code - ${HOSPITAL_NAME}`,
      html: getEmailTemplate('Reset your password', content, 'warning')
    };
    
    await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message);
    return { success: false, error: error.message };
  }
};