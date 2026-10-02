import express from "express";
import twilio from "twilio";
import {
  handleWhatsAppWebhook,
  handleKapsoWebhook,
  sendWhatsAppAppointmentReminder,
  testWhatsApp
} from "../controllers/whatsappController.js";
import authAdmin from "../middleware/authAdmin.js";

const whatsappRouter = express.Router();

// Twilio webhook for incoming WhatsApp messages. Only requests signed by Twilio
// (X-Twilio-Signature, checked with TWILIO_AUTH_TOKEN) are accepted.
// Set TWILIO_WEBHOOK_URL to the exact URL configured in the Twilio console
// so the signature matches behind a proxy.
whatsappRouter.post(
  "/webhook",
  twilio.webhook({ url: process.env.TWILIO_WEBHOOK_URL || undefined }),
  handleWhatsAppWebhook
);

// Kapso webhook for incoming WhatsApp messages. Signature (X-Webhook-Signature)
// is checked with KAPSO_WEBHOOK_SECRET inside the handler.
whatsappRouter.post("/kapso-webhook", handleKapsoWebhook);

// Send WhatsApp reminder (requires admin auth)
whatsappRouter.post("/send-reminder", authAdmin, sendWhatsAppAppointmentReminder);

// Test WhatsApp connection (requires admin auth)
whatsappRouter.post("/test", authAdmin, testWhatsApp);

export default whatsappRouter;
