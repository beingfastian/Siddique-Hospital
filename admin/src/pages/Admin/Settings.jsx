import React, { useState, useEffect, useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { FaWhatsapp, FaEnvelope, FaCheck, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

// Shows which notification services the backend has credentials for.
// Services are configured through backend environment variables (see backend/.env.example).
const Settings = () => {
  const { aToken, backendUrl } = useContext(AdminContext);
  const [status, setStatus] = useState(null);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);

  const loadStatus = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/admin/system-status', {
        headers: { aToken }
      });
      if (data.success) {
        setStatus(data.status);
      }
    } catch (error) {
      console.error('Error loading system status:', error);
    }
  };

  const testWhatsApp = async () => {
    setTestingWhatsApp(true);
    try {
      const { data } = await axios.post(
        backendUrl + '/api/whatsapp/test',
        {},
        { headers: { aToken } }
      );

      if (data.success) {
        toast.success('Test WhatsApp message sent successfully!');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'WhatsApp test failed');
    } finally {
      setTestingWhatsApp(false);
    }
  };

  useEffect(() => {
    if (aToken) {
      loadStatus();
    }
  }, [aToken]);

  const StatusBadge = ({ configured }) =>
    configured ? (
      <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
        <FaCheck className="w-4 h-4" />
        Configured
      </span>
    ) : (
      <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
        <FaTimes className="w-4 h-4" />
        Not Configured
      </span>
    );

  const SettingCard = ({ icon, title, description, configured, children }) => (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>
          {status && <StatusBadge configured={configured} />}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );

  return (
    <div className="w-full p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">System Settings</h1>
        <p className="text-gray-600">Status of the notification services used for appointments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SettingCard
          icon={<FaWhatsapp className="text-2xl text-green-500" />}
          title="WhatsApp Notifications"
          description="Appointment confirmations via Twilio WhatsApp"
          configured={status?.whatsappConfigured}
        >
          {status?.whatsappConfigured ? (
            <button
              onClick={testWhatsApp}
              disabled={testingWhatsApp}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {testingWhatsApp ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                "Send Test WhatsApp Message"
              )}
            </button>
          ) : (
            <p className="text-sm text-yellow-800 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              Set the TWILIO_* variables in the backend environment to enable WhatsApp messages.
              Bookings still work without them.
            </p>
          )}
        </SettingCard>

        <SettingCard
          icon={<FaEnvelope className="text-2xl text-blue-500" />}
          title="Email Notifications"
          description="Appointment and password-reset emails via SMTP"
          configured={status?.emailConfigured}
        >
          {status?.emailConfigured ? (
            <p className="text-sm text-gray-600">
              Patients with an email address and doctors receive appointment confirmations by email.
            </p>
          ) : (
            <p className="text-sm text-blue-800 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              Set the EMAIL_* variables in the backend environment to enable emails.
              Doctor password reset needs email.
            </p>
          )}
        </SettingCard>
      </div>
    </div>
  );
};

export default Settings;
