// WhatsApp messaging via Twilio
import twilio from 'twilio';
import { formatSlotDate as formatDate } from '../utils/slots.js';
import { HOSPITAL_PHONE } from './hospital.js';

// Check if WhatsApp configuration is available
const isWhatsAppConfigured = () => {
  const configured = !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_NUMBER
  );
  
  if (!configured) {
    console.log('WhatsApp Configuration Status:');
    console.log('  - TWILIO_ACCOUNT_SID:', !!process.env.TWILIO_ACCOUNT_SID);
    console.log('  - TWILIO_AUTH_TOKEN:', !!process.env.TWILIO_AUTH_TOKEN);
    console.log('  - TWILIO_WHATSAPP_NUMBER:', !!process.env.TWILIO_WHATSAPP_NUMBER);
  }
  
  return configured;
};

// Initialize Twilio client with enhanced error handling
let twilioClient = null;
try {
  if (isWhatsAppConfigured()) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('Twilio WhatsApp client initialized successfully');
    console.log('WhatsApp number configured:', process.env.TWILIO_WHATSAPP_NUMBER);
  } else {
    console.log('Twilio WhatsApp configuration incomplete - messages will be skipped');
  }
} catch (initError) {
  console.error('Failed to initialize Twilio client:', initError.message);
  twilioClient = null;
}

// Enhanced phone number formatting with validation
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) {
    console.log('No phone number provided');
    return null;
  }
  
  let formatted = phoneNumber.toString().trim();
  console.log('Original phone number:', formatted);
  
  // Remove any existing whatsapp: prefix
  formatted = formatted.replace('whatsapp:', '');
  
  // Remove spaces, dashes, parentheses
  formatted = formatted.replace(/[\s\-\(\)]/g, '');
  
  // Add country code if missing
  if (!formatted.startsWith('+')) {
    if (formatted.startsWith('92')) {
      formatted = '+' + formatted;
    } else if (formatted.startsWith('3')) {
      // Pakistani mobile number starting with 3
      formatted = '+92' + formatted;
    } else {
      // Assume Pakistani number
      formatted = '+92' + formatted;
    }
  }
  
  console.log('Formatted phone number:', formatted);
  
  // Basic validation for Pakistani numbers
  const pakistaniPattern = /^\+923[0-9]{9}$/;
  if (!pakistaniPattern.test(formatted)) {
    console.log('Phone number may not be valid Pakistani mobile:', formatted);
  }
  
  return formatted;
};

// Send appointment confirmation via WhatsApp to patient
export const sendWhatsAppConfirmation = async (phoneNumber, userName, doctorName, doctorSpecialty, appointmentDate, appointmentTime, fee, appointmentId) => {
  console.log('sendWhatsAppConfirmation called with:', {
    phoneNumber: phoneNumber ? '***' + phoneNumber.slice(-4) : 'null',
    userName,
    doctorName,
    doctorSpecialty,
    appointmentDate,
    appointmentTime,
    fee,
    appointmentId
  });

  try {
    // Configuration check
    if (!isWhatsAppConfigured()) {
      const error = 'WhatsApp service not configured - check environment variables';
      console.log(error);
      return { success: false, message: error };
    }

    if (!twilioClient) {
      throw new Error('Twilio client not initialized');
    }

    // Parameter validation
    if (!phoneNumber || !userName || !doctorName) {
      throw new Error('Missing required parameters: phoneNumber, userName, or doctorName');
    }

    // Format and validate phone number
    const formattedNumber = formatPhoneNumber(phoneNumber);
    if (!formattedNumber) {
      throw new Error('Invalid phone number format');
    }

    // Create message
    const message = `
*🏥 Appointment Confirmed - Siddique Hospital*

Dear ${userName},

Your appointment has been successfully booked!

*📋 Appointment Details:*
• Doctor: Dr. ${doctorName}
• Specialty: ${doctorSpecialty || 'General Medicine'}
• Date: ${formatDate(appointmentDate)}
• Time: ${appointmentTime}
• Fee: Rs. ${fee}
• Appointment ID: ${appointmentId}

*📝 Important Notes:*
• Please arrive 10 minutes early
• Bring valid ID and medical documents
• Reply CANCEL to cancel appointment
• Reply STATUS to check appointment status

*📍 Location:*
Civil Lines, Lahore-Sargodha Road
Sheikhupura, Pakistan

*📞 Contact:*
Phone: ${HOSPITAL_PHONE}
WhatsApp: ${HOSPITAL_PHONE}

Thank you for choosing Siddique Hospital! 🙏
    `.trim();

    console.log(`Sending WhatsApp message to: ${formattedNumber}`);
    console.log(`Message preview: ${message.substring(0, 100)}...`);

    // Send message via Twilio
    const result = await twilioClient.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedNumber}`
    });

    console.log('WhatsApp confirmation sent successfully');
    console.log('Message details:', {
      sid: result.sid,
      status: result.status,
      to: formattedNumber,
      from: process.env.TWILIO_WHATSAPP_NUMBER
    });

    return { 
      success: true, 
      messageId: result.sid,
      status: result.status,
      to: formattedNumber
    };

  } catch (error) {
    console.error('WhatsApp sending failed:', error.message);
    
    // Log detailed error for debugging
    if (error.code) {
      console.error('Twilio error details:', {
        code: error.code,
        status: error.status,
        message: error.message,
        moreInfo: error.moreInfo
      });
    }

    return { 
      success: false, 
      error: error.message,
      code: error.code,
      moreInfo: error.moreInfo
    };
  }
};

// Send appointment reminder via WhatsApp to patient
export const sendWhatsAppReminder = async (phoneNumber, userName, doctorName, appointmentDate, appointmentTime) => {
  console.log('sendWhatsAppReminder called for:', userName);
  
  try {
    if (!isWhatsAppConfigured()) {
      return { success: false, message: 'WhatsApp not configured' };
    }

    if (!twilioClient) {
      throw new Error('Twilio client not initialized');
    }

    const formattedNumber = formatPhoneNumber(phoneNumber);
    if (!formattedNumber) {
      throw new Error('Invalid phone number format');
    }

    const message = `
*⏰ Appointment Reminder - Siddique Hospital*

Hi ${userName},

This is a reminder for your appointment:

*📋 Details:*
• Doctor: Dr. ${doctorName}
• Date: ${formatDate(appointmentDate)}
• Time: ${appointmentTime}

*📍 Location:*
Civil Lines, Lahore-Sargodha Road
Sheikhupura, Pakistan

Please arrive 10 minutes early with valid ID.

Reply STATUS for details or CANCEL to cancel.

📞 Contact: ${HOSPITAL_PHONE}
    `.trim();

    console.log(`Sending reminder to: ${formattedNumber}`);

    const result = await twilioClient.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedNumber}`
    });

    console.log('WhatsApp reminder sent successfully:', result.sid);
    return { success: true, messageId: result.sid };
    
  } catch (error) {
    console.error('Error sending reminder:', error.message);
    return { success: false, error: error.message };
  }
};

// Send appointment confirmation to doctor via WhatsApp
export const sendDoctorWhatsAppConfirmation = async (
  phoneNumber,
  doctorName,
  patientName,
  patientPhone,
  appointmentDate,
  appointmentTime,
  fee,
  appointmentId
) => {
  console.log('sendDoctorWhatsAppConfirmation called for Dr.', doctorName);

  try {
    if (!isWhatsAppConfigured()) {
      return { success: false, message: 'WhatsApp not configured' };
    }
    
    if (!twilioClient) {
      throw new Error('Twilio client not initialized');
    }

    const formattedNumber = formatPhoneNumber(phoneNumber);
    if (!formattedNumber) {
      throw new Error('Invalid doctor phone number format');
    }

    const message = `
*📅 New Appointment Booked - Siddique Hospital*

Dear Dr. ${doctorName},

A new appointment has been booked.

*Patient:* ${patientName}
*Phone:* ${patientPhone}
*Date:* ${formatDate(appointmentDate)}
*Time:* ${appointmentTime}
*Fee:* Rs. ${fee}
*Appointment ID:* ${appointmentId}

Please check your dashboard for more details.

Thank you!
    `.trim();

    console.log(`Sending doctor WhatsApp to: ${formattedNumber}`);

    const result = await twilioClient.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedNumber}`
    });

    console.log('Doctor WhatsApp notification sent successfully');
    console.log('Message SID:', result.sid);

    return { 
      success: true, 
      messageId: result.sid,
      to: formattedNumber 
    };

  } catch (error) {
    console.error('Doctor WhatsApp sending failed:', error.message);
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
};

export { isWhatsAppConfigured };
