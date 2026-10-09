import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { FaFlask, FaSearch, FaCheckCircle, FaPrint, FaTimes } from "react-icons/fa";
import { labGet, labPost, errorText, labChanged, when } from "../lab/api";
import { printLabRequestSlip } from "./PrintSlip";

// Doctor picks tests for the patient in front of them and sends them to the lab.
// source: { appointmentId } or { queueTokenId }; patientName for the heading.
const LabOrderModal = ({ source, patientName, doctorName, onClose }) => {
  const [tests, setTests] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [urgent, setUrgent] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(null);
  const searchInput = useRef(null);

  useEffect(() => {
    labGet("/tests")
      .then((data) => (data.success ? setTests(data.tests) : toast.error(data.message)))
      .catch((e) => toast.error(errorText(e)));
    searchInput.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const shown = useMemo(() => {
    const text = search.trim().toLowerCase();
    return (tests || []).filter((t) => !text || t.name.toLowerCase().includes(text));
  }, [tests, search]);

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const send = async () => {
    if (!selected.length) {
      toast.error("Choose at least one test");
      return;
    }
    setBusy(true);
    try {
      const data = await labPost("/orders", { ...source, testIds: selected, urgent, note });
      if (!data.success) {
        toast.error(data.message);
        return;
      }
      toast.success(data.message);
      labChanged();
      setSent(data.order);
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const printSlip = () => {
    const ok = printLabRequestSlip({
      orderNumber: sent.orderNumber,
      patientName: sent.patient?.name,
      doctorName: sent.doctor?.name || doctorName,
      tests: sent.tests,
      urgent: sent.urgent,
      when: when(sent.createdAt),
    });
    if (!ok) toast.error("The print window was blocked. Allow pop-ups for this site.");
  };

  const nameOf = (id) => tests?.find((t) => t._id === id)?.name;

  return (
    <div className="fixed inset-0 z-[90] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lab-order-title"
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
          <div>
            <h2 id="lab-order-title" className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FaFlask className="text-primary" /> {sent ? "Sent to the lab" : "Request lab tests"}
            </h2>
            <p className="text-sm text-gray-500">Patient: {patientName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600" aria-label="Close">
            <FaTimes />
          </button>
        </div>

        {sent ? (
          <div className="p-5 space-y-3">
            <p className="flex items-center gap-2 text-green-700 font-medium">
              <FaCheckCircle /> Request L-{sent.orderNumber} is on the lab&apos;s screen now.
            </p>
            <ul className="text-sm text-gray-700 list-disc pl-5">
              {sent.tests.map((t) => <li key={t.name}>{t.name}</li>)}
            </ul>
            <p className="text-sm text-gray-500">Tell the patient to go to the lab. You&apos;ll be alerted when the report is uploaded.</p>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">Done</button>
              <button onClick={printSlip} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium">
                <FaPrint /> Print slip for the patient
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-5 space-y-3 overflow-y-auto">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchInput}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tests, e.g. CBC, sugar, urine"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg"
                  aria-label="Search tests"
                />
              </div>

              {selected.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selected.map((id) => (
                    <button
                      key={id}
                      onClick={() => toggle(id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-sm"
                      title="Remove"
                    >
                      {nameOf(id)} <FaTimes className="text-xs" />
                    </button>
                  ))}
                </div>
              )}

              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                {!tests ? (
                  <p className="p-3 text-sm text-gray-500">Loading tests…</p>
                ) : tests.length === 0 ? (
                  <p className="p-3 text-sm text-gray-500">The lab hasn&apos;t added any tests yet. Ask the lab or admin to set up the test list.</p>
                ) : shown.length === 0 ? (
                  <p className="p-3 text-sm text-gray-500">No test matches “{search}”.</p>
                ) : (
                  shown.map((t) => (
                    <label key={t._id} className="flex items-center gap-3 px-3 py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={selected.includes(t._id)} onChange={() => toggle(t._id)} />
                      <span className="flex-1 text-sm text-gray-900">{t.name}</span>
                      <span className="text-xs text-gray-400">{t.sampleType}</span>
                    </label>
                  ))
                )}
              </div>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={1000}
                placeholder="Note for the lab (optional), e.g. fever 5 days, check platelets"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
                Urgent: the lab does this first
              </label>
            </div>
            <div className="p-5 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button
                onClick={send}
                disabled={busy || !selected.length}
                className="px-5 py-2 rounded-lg bg-primary text-white font-medium disabled:opacity-50"
              >
                {busy ? "Sending…" : `Send ${selected.length || ""} test${selected.length === 1 ? "" : "s"} to lab`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LabOrderModal;
