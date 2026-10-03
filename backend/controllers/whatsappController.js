import twilio from 'twilio';
import appointmentModel from "../model/appointmentModel.js";
import userModel from "../model/userModel.js";
import crypto from 'crypto';
import { sendWhatsAppConfirmation, sendWhatsAppReminder, sendWhatsAppText } from "../config/whatsappService.js";
import { phoneVariants } from "../whatsapp/phone.js";
import { formatSlotDate as formatDisplayDate } from "../utils/slots.js";
import { cancelAppointment } from "../services/appointmentService.js";
import { HOSPITAL_PHONE } from "../config/hospital.js";

// Reply text for an incoming WhatsApp message (STATUS / CANCEL / BOOK / CONTACT / HELP).
// Shared by the Twilio and Kapso webhooks.
const buildBotReply = async (phoneNumber, userMessage) => {
  let responseMessage = '';

    // Find user by WhatsApp number
    const variants = phoneVariants(phoneNumber);
    const user = await userModel.findOne({
      $or: [
        { whatsappNumber: { $in: variants } },
        { phone: { $in: variants } }
      ]
    });
    
    if (!user) {
      responseMessage = `
*Welcome to Siddique Hospital! 🏥*

We couldn't find your account with this number.
Please contact us at ${HOSPITAL_PHONE} to register or book an appointment.

Thank you for choosing Siddique Hospital!
      `;
    } else {
      switch(userMessage) {
        case 'status':
          try {
            const appointments = await appointmentModel.find({ 
              userId: user._id.toString()
            }).sort({ date: -1 }).limit(3);
            
            if (appointments.length > 0) {
              let statusText = `*Hello ${user.name}! 👋*\n\n*Your Recent Appointments:*\n\n`;
              
              appointments.forEach((apt, index) => {
                const status = apt.cancelled ? '❌ Cancelled' : 
                             apt.isCompleted ? '✅ Completed' : 
                             '⏰ Upcoming';
                             
                statusText += `${index + 1}. *Dr. ${apt.docData.name}*\n`;
                statusText += `   📅 ${formatDisplayDate(apt.slotDate)}\n`;
                statusText += `   🕐 ${apt.slotTime}\n`;
                statusText += `   ${status}\n\n`;
              });
              
              statusText += `Need help? Reply *HELP* for more options.`;
              responseMessage = statusText;
            } else {
              responseMessage = `
*Hello ${user.name}! 👋*

You currently have no appointments.

To book an appointment:
🌐 Visit: siddiquehospital.com
📞 Call: ${HOSPITAL_PHONE}
💬 WhatsApp: ${HOSPITAL_PHONE}

Reply *HELP* for more options.
              `;
            }
          } catch (error) {
            console.error('Error fetching appointments:', error);
            responseMessage = 'Sorry, there was an error fetching your appointments. Please try again later.';
          }
          break;
          
        case 'cancel':
          try {
            const appointment = await appointmentModel.findOne({ 
              userId: user._id.toString(), 
              cancelled: false,
              isCompleted: false 
            }).sort({ date: -1 });
            
            if (appointment) {
              // Cancel (frees the slot); the bot reply below tells the patient
              await cancelAppointment(appointment._id, { role: "patient", id: user._id.toString() }, {
                reason: "Cancelled by patient on WhatsApp",
                notifyPatient: false,
              });
              
              responseMessage = `
*Appointment Cancelled Successfully ❌*

Details:
👨‍⚕️ Dr. ${appointment.docData.name}
📅 ${formatDisplayDate(appointment.slotDate)}
🕐 ${appointment.slotTime}

To book a new appointment:
🌐 Visit: siddiquehospital.com
📞 Call: ${HOSPITAL_PHONE}

Thank you!
              `;
            } else {
              responseMessage = `
*No Active Appointment Found*

You don't have any upcoming appointments to cancel.

To book a new appointment:
🌐 Visit: siddiquehospital.com
📞 Call: ${HOSPITAL_PHONE}

Reply *HELP* for more options.
              `;
            }
          } catch (error) {
            console.error('Error cancelling appointment:', error);
            responseMessage = 'Sorry, there was an error cancelling your appointment. Please try again later or contact us directly.';
          }
          break;
          
        case 'book':
        case 'appointment':
          responseMessage = `
*Book New Appointment 📅*

To book an appointment with our doctors:

🌐 *Website:* siddiquehospital.com
📞 *Call:* ${HOSPITAL_PHONE}  
💬 *WhatsApp:* ${HOSPITAL_PHONE}

*Our Specialties:*
• General Medicine
• Pediatrics  
• Gynecology
• Dermatology
• Neurology
• Gastroenterology

We're here to help! 🏥
          `;
          break;
          
        case 'contact':
        case 'info':
          responseMessage = `
*Siddique Hospital Contact Info 🏥*

📍 *Address:*
Civil Lines, Lahore-Sargodha Road
Sheikhupura, Pakistan

📞 *Phone:* ${HOSPITAL_PHONE}
💬 *WhatsApp:* ${HOSPITAL_PHONE}
📧 *Email:* Siddiquehospital@gmail.com

🌐 *Website:* siddiquehospital.com

*Social Media:*
📘 Facebook: Siddique Hospital
📸 Instagram: @siddique.hospital

We're here 24/7 for emergencies! 🚑
          `;
          break;
          
        case 'help':
        case 'menu':
        default:
          responseMessage = `
*Welcome to Siddique Hospital Bot! 🏥*

*Available Commands:*
• *STATUS* - Check your appointments
• *CANCEL* - Cancel latest appointment  
• *BOOK* - Get booking information
• *CONTACT* - Hospital contact details
• *HELP* - Show this menu

*Quick Actions:*
🌐 Book Online: siddiquehospital.com
📞 Call Direct: ${HOSPITAL_PHONE}

How can we help you today?
          `;
      }
    }

  return responseMessage.trim();
};

const twimlReply = (res, text) => {
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(text);
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
};

// Twilio webhook: replies in the HTTP response (TwiML)
export const handleWhatsAppWebhook = async (req, res) => {
  try {
    const { Body, From } = req.body;
    if (!Body || !From) {
      return res.status(400).send('Invalid request');
    }
    const reply = await buildBotReply(From.replace('whatsapp:', ''), Body.toLowerCase().trim());
    twimlReply(res, reply);
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    twimlReply(res, `Sorry, there was an error processing your request. Please try again later or contact us directly at ${HOSPITAL_PHONE}.`);
  }
};

// Kapso webhook: verifies the signature, acknowledges at once, then replies via the API.
// The reply is free because it is sent within 24 hours of the patient's message.
export const handleKapsoWebhook = async (req, res) => {
  const secret = process.env.KAPSO_WEBHOOK_SECRET;
  const signature = req.get('X-Webhook-Signature') || '';
  if (!secret || !req.rawBody) {
    return res.status(500).json({ success: false, message: 'Webhook secret not configured' });
  }
  const expected = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
  const valid =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) {
    return res.status(401).json({ success: false, message: 'Invalid signature' });
  }

  res.status(200).json({ received: true });

  if (req.get('X-Webhook-Event') !== 'whatsapp.message.received') return;
  const events = req.body?.batch ? req.body.data || [] : [req.body];
  for (const event of events) {
    const message = event?.message;
    if (message?.type !== 'text' || !message.from || !message.text?.body) continue;
    try {
      const reply = await buildBotReply(message.from, message.text.body.toLowerCase().trim());
      await sendWhatsAppText(message.from, reply);
    } catch (error) {
      console.error('Kapso webhook reply failed:', error.message);
    }
  }
};

// Send WhatsApp reminder
export const sendWhatsAppAppointmentReminder = async (req, res) => {
  try {
    const { phoneNumber, userName, doctorName, appointmentDate, appointmentTime } = req.body;
    
    if (!phoneNumber || !userName || !doctorName || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required for reminder' 
      });
    }
    
    const result = await sendWhatsAppReminder(
      phoneNumber,
      userName,
      doctorName,
      appointmentDate,
      appointmentTime
    );
    
    res.json(result);
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Test WhatsApp connection
export const testWhatsApp = async (req, res) => {
  try {
    const testNumber = process.env.TEST_WHATSAPP_NUMBER;
    if (!testNumber) {
      return res.json({ success: false, message: "Set TEST_WHATSAPP_NUMBER in the backend .env" });
    }
    
    const result = await sendWhatsAppConfirmation(
      testNumber,
      "Test User",
      "Test Doctor",
      "General Medicine",
      "1_1_2024",
      "10:00 AM",
      "100",
      "test123"
    );
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: "WhatsApp test message sent successfully",
        messageId: result.messageId 
      });
    } else {
      res.json({ 
        success: false, 
        message: "WhatsApp test failed: " + result.error 
      });
    }
  } catch (error) {
    console.error('WhatsApp test error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};