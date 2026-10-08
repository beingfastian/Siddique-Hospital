import { createTransporter, getEmailTemplate } from "./emailService.js";
import { HOSPITAL_NAME } from "./hospital.js";

// Function to send OTP email
export const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('Email not configured - OTP email skipped');
      return { success: false };
    }

    const content = `
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin-top: 0;">Password Reset Request</h3>
        <p style="color: #666; line-height: 1.6;">
          We received a request to reset your password. Use the OTP below to proceed:
        </p>
      </div>
      
      <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
        <h2 style="color: #1976d2; margin-top: 0; margin-bottom: 15px;">Your OTP Code</h2>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1976d2; background-color: #f0f4ff; padding: 15px 25px; border-radius: 8px; display: inline-block;">
          ${otp}
        </div>
        <p style="color: #666; margin-top: 15px;">
          This OTP is valid for <strong>10 minutes</strong> only.
        </p>
      </div>
      
      <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="color: #c62828; margin-top: 0;">🔒 Security Notice:</h4>
        <ul style="color: #666; line-height: 1.6; margin: 0; padding-left: 20px;">
          <li>Never share your OTP with anyone</li>
          <li>Our staff will never ask for your OTP</li>
          <li>If you didn't request this, please ignore this email</li>
        </ul>
      </div>
    `;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `🔐 Password Reset OTP - ${HOSPITAL_NAME}`,
      html: getEmailTemplate('Password Reset Request', content, 'warning')
    };
    
    await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message);
    return { success: false, error: error.message };
  }
};