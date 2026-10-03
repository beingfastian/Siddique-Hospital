import React, { useContext, useEffect, useState } from "react";
import { DoctorContext } from "../context/DoctorContext";
import SlotPickerDialog from "./SlotPickerDialog";

// Doctor picks a date and time for a patient's follow-up visit.
const FollowUpModal = ({ appointment, onClose }) => {
  const { profileData, getProfileData, scheduleFollowUp } = useContext(DoctorContext);
  const [loaded, setLoaded] = useState(false);

  // Fresh profile so booked slots and leave are current
  useEffect(() => {
    getProfileData().finally(() => setLoaded(true));
  }, []);

  return (
    <SlotPickerDialog
      title="Schedule Follow-up"
      subtitle={`Patient: ${appointment.userData?.name}`}
      doctor={loaded ? profileData : null}
      confirmVerb="Schedule for"
      onConfirm={(slotDate, slotTime) => scheduleFollowUp(appointment._id, slotDate, slotTime)}
      onClose={onClose}
    />
  );
};

export default FollowUpModal;
