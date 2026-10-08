import React, { useEffect, useState } from "react";
import { FaPrint, FaCheckCircle } from "react-icons/fa";

// The patient's copy: a small slip printed on 80mm thermal paper (what receptions
// usually have) or any printer the browser's print dialog offers. No dependencies —
// it opens a window, writes the slip, prints and closes. Same hospital details as
// backend/config and frontend/src/config.js.
const HOSPITAL = {
  name: "Siddique Hospital",
  address: "Civil Lines, Lahore-Sargodha Road, Sheikhupura",
  phone: "+92 313 4294093",
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Free follow-ups are a real thing here (FOLLOW_UP_FREE_DAYS), but a missing
// fee should never print as "Free" — it means we don't know.
const feeText = (fee) =>
  typeof fee === "number" ? (fee > 0 ? `Rs. ${fee}` : "Free") : "See at counter";

// details: { patientName, doctorName, speciality, dateText, time, fee }
// Returns false when the popup was blocked so the caller can tell the user.
export const printAppointmentSlip = (details) => {
  const win = window.open("", "_blank", "width=380,height=640");
  if (!win) return false;

  win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Appointment Slip</title>
<style>
  @page { margin: 4mm; }
  body { width: 66mm; margin: 0; font-family: "Courier New", monospace; font-size: 12px; color: #000; }
  h1 { font-size: 14px; text-align: center; margin: 0 0 2px; text-transform: uppercase; letter-spacing: 1px; }
  .addr { text-align: center; font-size: 10px; margin-bottom: 6px; }
  hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
  .type { text-align: center; font-weight: bold; text-transform: uppercase; margin: 4px 0; }
  .row { display: flex; justify-content: space-between; gap: 6px; margin: 3px 0; }
  .k { color: #333; }
  .v { font-weight: bold; text-align: right; }
  .foot { text-align: center; font-size: 10px; margin-top: 8px; }
</style>
</head>
<body>
  <h1>${escapeHtml(HOSPITAL.name)}</h1>
  <div class="addr">${escapeHtml(HOSPITAL.address)}<br>Ph: ${escapeHtml(HOSPITAL.phone)}</div>
  <hr>
  <div class="type">Appointment Slip</div>
  <div class="row"><span class="k">Patient</span><span class="v">${escapeHtml(details.patientName)}</span></div>
  <div class="row"><span class="k">Doctor</span><span class="v">Dr. ${escapeHtml(details.doctorName)}</span></div>
  ${details.speciality ? `<div class="row"><span class="k">Speciality</span><span class="v">${escapeHtml(details.speciality)}</span></div>` : ""}
  <div class="row"><span class="k">Date</span><span class="v">${escapeHtml(details.dateText)}</span></div>
  <div class="row"><span class="k">Time</span><span class="v">${escapeHtml(details.time)}</span></div>
  <div class="row"><span class="k">Fee</span><span class="v">${escapeHtml(feeText(details.fee))}</span></div>
  <hr>
  <div class="foot">Please arrive 15 minutes early.<br>Keep this slip for your next visit.</div>
</body>
</html>`);
  win.document.close();
  win.focus();
  // Close the window once the print dialog is done (Chrome/Firefox/Edge)
  win.onafterprint = () => win.close();
  win.print();
  return true;
};

// Shown after a booking/follow-up is saved: summary + Print slip + Done.
// details: { patientName, doctorName, speciality, dateText, time, fee }
const PrintSlipDialog = ({ title = "Appointment booked", details, onClose }) => {
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handlePrint = () => {
    if (!printAppointmentSlip(details)) {
      setError("The print window was blocked. Allow pop-ups for this site and try again.");
    }
  };

  const rows = [
    ["Patient", details.patientName],
    ["Doctor", `Dr. ${details.doctorName}`],
    ...(details.speciality ? [["Speciality", details.speciality]] : []),
    ["Date", details.dateText],
    ["Time", details.time],
    ["Fee", feeText(details.fee)],
  ];

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="print-slip-title"
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <FaCheckCircle className="text-green-600 text-xl" />
          <h2 id="print-slip-title" className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>

        <div className="p-5 space-y-1.5">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-900">{value}</span>
            </div>
          ))}
          <p className="text-xs text-gray-500 pt-2">
            The patient also gets a WhatsApp message (if enabled). The slip gets them
            through the door faster on their next visit.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="p-5 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Done
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            <FaPrint />
            Print slip
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintSlipDialog;
