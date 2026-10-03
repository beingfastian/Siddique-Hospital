import React, { useContext, useEffect, useMemo, useState } from "react";
import { DoctorContext } from "../context/DoctorContext";
import { getUpcomingSlots, toSlotDate } from "../utils/slots";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Doctor picks a date and time for a patient's follow-up visit.
const FollowUpModal = ({ appointment, onClose }) => {
  const { profileData, getProfileData, scheduleFollowUp } = useContext(DoctorContext);
  const [loading, setLoading] = useState(true);
  const [dayIndex, setDayIndex] = useState(0);
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);

  // Fresh profile so booked slots are current
  useEffect(() => {
    getProfileData().finally(() => setLoading(false));
  }, []);

  // Close with Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const days = useMemo(() => (profileData ? getUpcomingSlots(profileData, 60) : []), [profileData]);
  const selectedDay = days[dayIndex];

  const submit = async () => {
    if (!selectedDay || !time) return;
    setSaving(true);
    const ok = await scheduleFollowUp(appointment._id, toSlotDate(selectedDay.date), time);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="follow-up-title"
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100">
          <h2 id="follow-up-title" className="text-lg font-semibold text-gray-900">Schedule Follow-up</h2>
          <p className="text-sm text-gray-500 mt-1">
            Patient: <span className="font-medium text-gray-700">{appointment.userData?.name}</span>
          </p>
        </div>

        <div className="p-5 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-gray-500">Loading your available times…</p>
          ) : days.length === 0 ? (
            <p className="text-sm text-gray-600">
              No free slots in the next 60 days. Check your timings and sitting days in your profile.
            </p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700 mb-2">Date</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {days.map((day, index) => (
                  <button
                    key={day.date.toISOString()}
                    type="button"
                    onClick={() => { setDayIndex(index); setTime(""); }}
                    className={`flex-shrink-0 w-16 py-2 rounded-xl border text-center transition-colors ${
                      index === dayIndex
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-gray-200 text-gray-700 hover:border-blue-300"
                    }`}
                  >
                    <span className="block text-xs">{DAY_SHORT[day.date.getDay()]}</span>
                    <span className="block text-lg font-semibold">{day.date.getDate()}</span>
                    <span className="block text-xs">{MONTH_SHORT[day.date.getMonth()]}</span>
                  </button>
                ))}
              </div>

              <p className="text-sm font-medium text-gray-700 mt-4 mb-2">Time</p>
              <div className="flex flex-wrap gap-2">
                {selectedDay.slots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setTime(slot.time)}
                    className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                      slot.time === time
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-gray-200 text-gray-700 hover:border-blue-300"
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!time || saving}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving
              ? "Scheduling…"
              : time && selectedDay
                ? `Schedule for ${DAY_SHORT[selectedDay.date.getDay()]} ${selectedDay.date.getDate()} ${MONTH_SHORT[selectedDay.date.getMonth()]}, ${time}`
                : "Pick a date and time"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FollowUpModal;
