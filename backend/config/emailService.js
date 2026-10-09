import nodemailer from 'nodemailer';
import { formatSlotDate as formatDate } from '../utils/slots.js';
import { HOSPITAL_ADDRESS, HOSPITAL_EMAIL, HOSPITAL_NAME, HOSPITAL_PHONE, PRODUCT_NAME, PRODUCT_TAGLINE } from './hospital.js';
// Check if email configuration is available
export const isEmailConfigured = () => {
  return !!(
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    process.env.EMAIL_FROM
  );
};
// One shared, pooled SMTP transporter. Opening a connection and logging in to
// Gmail takes 1-2 seconds, so connections are kept open and reused.
let transporter = null;
const createTransporter = () => {
  if (!isEmailConfigured()) {
    console.warn('Email configuration incomplete. Emails will not be sent.');
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      pool: true,
      maxConnections: 2,
      maxMessages: 100,
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      debug: process.env.NODE_ENV === 'development',
      logger: process.env.NODE_ENV === 'development'
    });
  }
  return transporter;
};
// --- Email layout (design-system/qclinics/MASTER.md: brand teal, slate text) ---
// Inline styles and a system font stack: email apps ignore web fonts and <style>.
const BRAND = "#0E7490";
const TEXT = "#0F172A";
const MUTED = "#475569";
const LINE = "#E2E8F0";
const FONT = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// Names and notes are typed by staff: never put them into the HTML unescaped
const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);

// Label / value rows (values are escaped here)
export const detailsTable = (rows) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 20px;">
    ${rows
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(
        ([label, value]) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${LINE};color:${MUTED};font-size:14px;width:40%;">${escapeHtml(label)}</td>
        <td style="padding:10px 0;border-bottom:1px solid ${LINE};color:${TEXT};font-size:14px;font-weight:600;">${escapeHtml(value)}</td>
      </tr>`
      )
      .join("")}
  </table>`;

export const paragraph = (html) => `<p style="margin:0 0 16px;color:${TEXT};font-size:15px;line-height:1.6;">${html}</p>`;

// Light box for notes; tone "warning" for security notices
export const noteBox = (html, tone = "info") => {
  const [bg, border] = tone === "warning" ? ["#FFFBEB", "#FDE68A"] : ["#F8FAFC", LINE];
  return `<div style="background:${bg};border:1px solid ${border};border-radius:8px;padding:14px 16px;margin:0 0 20px;color:${MUTED};font-size:14px;line-height:1.6;">${html}</div>`;
};

// The frame every email uses: hospital name on top, contact details and
// "Powered by" at the bottom. `type` is kept for older callers (no longer used).
// eslint-disable-next-line no-unused-vars
const getEmailTemplate = (title, content, type = "info") => `
<!doctype html>
<html><body style="margin:0;padding:0;background:#F1F5F9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:24px 12px;font-family:${FONT};">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid ${LINE};border-radius:12px;overflow:hidden;">
        <tr><td style="background:${BRAND};padding:18px 24px;">
          <div style="color:#FFFFFF;font-size:18px;font-weight:700;">${escapeHtml(HOSPITAL_NAME)}</div>
        </td></tr>
        <tr><td style="padding:24px;">
          <h1 style="margin:0 0 16px;color:${TEXT};font-size:20px;line-height:1.3;">${escapeHtml(title)}</h1>
          ${content}
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid ${LINE};background:#F8FAFC;color:${MUTED};font-size:13px;line-height:1.6;">
          <strong style="color:${TEXT};">${escapeHtml(HOSPITAL_NAME)}</strong><br>
          ${HOSPITAL_ADDRESS ? `${escapeHtml(HOSPITAL_ADDRESS)}<br>` : ""}
          Phone / WhatsApp: ${escapeHtml(HOSPITAL_PHONE)}${HOSPITAL_EMAIL ? ` · ${escapeHtml(HOSPITAL_EMAIL)}` : ""}
        </td></tr>
      </table>
      <p style="margin:14px 0 0;color:#64748B;font-size:12px;font-family:${FONT};">
        This is an automated email, please don't reply.<br>
        Powered by <strong style="color:${BRAND};">${PRODUCT_NAME}</strong> · ${PRODUCT_TAGLINE}
      </p>
    </td></tr>
  </table>
</body></html>`;

const feeText = (fee) => `Rs. ${Number(fee || 0).toLocaleString("en-PK")}`;

// Send appointment confirmation to user
export const sendUserAppointmentConfirmation = async (userEmail, userName, doctorName, doctorSpeciality, appointmentDate, appointmentTime, fee) => {
  try {
    if (!isEmailConfigured()) {
      return { success: false, error: 'Email not configured' };
    }
    const transporter = createTransporter();
    const content =
      paragraph(`Dear ${escapeHtml(userName)}, your appointment is booked.`) +
      detailsTable([
        ["Doctor", `Dr. ${doctorName}`],
        ["Speciality", doctorSpeciality],
        ["Date", formatDate(appointmentDate)],
        ["Time", appointmentTime],
        ["Fee", feeText(fee)],
      ]) +
      noteBox(
        `Please arrive 10 minutes early and bring your CNIC and any previous reports.<br>` +
          `On the day, reception gives you a token and you can follow your turn on your phone.<br>` +
          `To change or cancel, call or WhatsApp us on ${escapeHtml(HOSPITAL_PHONE)}.`
      );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: `Appointment confirmed: Dr. ${doctorName}, ${formatDate(appointmentDate)} at ${appointmentTime}`,
      html: getEmailTemplate('Appointment confirmed', content, 'success')
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
// Send appointment notification to doctor
export const sendDoctorAppointmentNotification = async (doctorEmail, doctorName, userName, userEmail, appointmentDate, appointmentTime, fee) => {
  try {
    if (!isEmailConfigured()) {
      return { success: false, error: 'Email not configured' };
    }
    const transporter = createTransporter();
    const content =
      paragraph(`Dear Dr. ${escapeHtml(doctorName)}, a new appointment has been booked with you.`) +
      detailsTable([
        ["Patient", userName],
        ["Patient email", userEmail],
        ["Date", formatDate(appointmentDate)],
        ["Time", appointmentTime],
        ["Fee", feeText(fee)],
      ]) +
      noteBox(`Sign in to ${PRODUCT_NAME} to see your day, the queue and the patient's history.`);

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: doctorEmail,
      subject: `New appointment: ${userName}, ${formatDate(appointmentDate)} at ${appointmentTime}`,
      html: getEmailTemplate('New appointment', content, 'info')
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
// Test email connection on startup
export const testEmailConnection = async () => {
  if (!isEmailConfigured()) {
    console.log('⚠️ Email configuration incomplete - emails disabled');
    return false;
  }
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email server connection successful');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error.message);
    return false;
  }
};

export { createTransporter, getEmailTemplate };
