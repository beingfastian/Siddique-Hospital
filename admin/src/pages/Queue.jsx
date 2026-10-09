import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaBullhorn,
  FaCheck,
  FaUserClock,
  FaPrint,
  FaUndo,
  FaTimes,
  FaExclamationTriangle,
  FaPause,
  FaPlay,
  FaWhatsapp,
  FaTv,
  FaUserPlus,
  FaSignInAlt,
  FaSyncAlt,
  FaWifi,
  FaFlask,
} from "react-icons/fa";
import { AdminContext } from "../context/AdminContext";
import { DoctorContext } from "../context/DoctorContext";
import { AppContext } from "../context/AppContext";
import LanguageSelect from "../components/LanguageSelect";
import { openPrintWindow, printTokenSlip } from "../components/PrintSlip";
import LabOrderModal from "../components/LabOrderModal";
import { useLabEnabled } from "../lab/api";

// Live OPD queue for reception (admin login, any doctor) and doctors (their own).
// Polls every few seconds; keeps working through short internet drops and shows
// when it is offline, because the waiting room depends on it.
const POLL_MS = 8000;
const DOCTOR_KEY = "queueDoctorId";
const AUTO_PRINT_KEY = "queueAutoPrint";

const readStorage = (key, fallback) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};
const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode: setting just isn't remembered */
  }
};

const timeOf = (value) =>
  value ? new Date(value).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" }) : "";

// Short, at the bottom: reception issues tokens quickly and toasts must not
// cover the doctor selector or the pause button
const TOAST = { autoClose: 2500, position: "bottom-right" };

const emptyWalkIn = { patientName: "", age: "", gender: "", phone: "", notify: false, language: "ur", fee: "", urgent: false };

const Badge = ({ className, children, title }) => (
  <span title={title} className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${className}`}>
    {children}
  </span>
);

const Queue = () => {
  const { aToken, doctors, getAllDoctors } = useContext(AdminContext);
  const { dToken, profileData, getProfileData } = useContext(DoctorContext);
  const { slotDateFormat } = useContext(AppContext);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
  const publicSite = (import.meta.env.VITE_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
  const isAdmin = Boolean(aToken);
  const headers = useMemo(() => (aToken ? { atoken: aToken } : { dtoken: dToken }), [aToken, dToken]);

  const [docId, setDocId] = useState(() => (isAdmin ? readStorage(DOCTOR_KEY, "") : ""));
  const [queue, setQueue] = useState(null);
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(""); // which action is running, to disable double clicks
  const [walkIn, setWalkIn] = useState(emptyWalkIn);
  const [autoPrint, setAutoPrint] = useState(() => readStorage(AUTO_PRINT_KEY, "true") === "true");
  const [showFinished, setShowFinished] = useState(false);
  const [labFor, setLabFor] = useState(null); // token the doctor is requesting tests for
  const labEnabled = useLabEnabled();
  const nameInput = useRef(null);

  useEffect(() => {
    if (isAdmin) getAllDoctors();
    else getProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Admin: default to the first doctor, also when the remembered one no longer exists
  useEffect(() => {
    if (isAdmin && doctors.length && !doctors.some((d) => d._id === docId)) setDocId(doctors[0]._id);
  }, [isAdmin, docId, doctors]);
  useEffect(() => {
    if (isAdmin && docId) writeStorage(DOCTOR_KEY, docId);
  }, [isAdmin, docId]);

  const doctor = isAdmin ? doctors.find((d) => d._id === docId) : profileData || null;
  const doctorName = doctor?.name || "";

  // The doctor whose queue is on screen, so a late answer for another doctor is ignored
  const shownDoctor = useRef(docId);
  shownDoctor.current = docId;

  const load = useCallback(async () => {
    if (isAdmin && !docId) return;
    try {
      const { data } = await axios.get(`${backendUrl}/api/queue`, {
        headers,
        params: isAdmin ? { docId } : {},
        timeout: 15000,
      });
      if (shownDoctor.current !== docId) return;
      setOffline(false);
      if (data.success) setQueue(data.queue);
      else toast.error(data.message);
    } catch {
      setOffline(true);
    }
  }, [backendUrl, headers, isAdmin, docId]);

  // Poll while the tab is visible; refresh at once when it becomes visible again
  useEffect(() => {
    setQueue(null);
    load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", load);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", load);
    };
  }, [load]);

  const post = async (path, body, key) => {
    if (busy) return null;
    setBusy(key);
    try {
      const { data } = await axios.post(`${backendUrl}/api/queue/${path}`, { ...body, ...(isAdmin && { docId }) }, { headers, timeout: 15000 });
      if (!data.success) toast.error(data.message, TOAST);
      await load();
      return data.success ? data : null;
    } catch (error) {
      toast.error(error.response?.data?.message || "No connection. Please try again.", TOAST);
      return null;
    } finally {
      setBusy("");
    }
  };

  const slipDetails = (token, estimate) => ({
    number: token.number,
    patientName: token.patientName,
    doctorName,
    dateText: slotDateFormat(token.day),
    issuedTime: timeOf(token.issuedAt),
    ahead: estimate?.ahead,
    waitMinutes: estimate?.waitMinutes,
    urgent: token.urgent,
    trackUrl: token.trackUrl,
  });

  const reprint = (token) => {
    if (!printTokenSlip(slipDetails(token, token.estimate))) {
      toast.error("The print window was blocked. Allow pop-ups for this site.");
    }
  };

  // Issue a token. The print window opens now (inside the click) and is filled
  // after the server answers, so the browser doesn't block it as a popup.
  const issue = async (body, key) => {
    const win = autoPrint ? openPrintWindow() : null;
    const data = await post("issue", body, key);
    if (!data) {
      win?.close();
      return null;
    }
    toast.success(data.message, TOAST);
    if (win) {
      // Estimate from the fresh queue (load() ran inside post)
      const { data: fresh } = await axios
        .get(`${backendUrl}/api/queue`, { headers, params: isAdmin ? { docId } : {} })
        .catch(() => ({ data: null }));
      const latest = fresh?.queue?.tokens?.find((t) => t._id === data.token._id);
      printTokenSlip(slipDetails(data.token, latest?.estimate), win);
    }
    return data;
  };

  const submitWalkIn = async (e) => {
    e.preventDefault();
    if (!walkIn.patientName.trim()) {
      toast.error("Please enter the patient's name");
      return;
    }
    if (walkIn.notify && !walkIn.phone.trim()) {
      toast.error("Enter a phone number for WhatsApp updates, or turn them off");
      return;
    }
    const data = await issue(
      {
        patientName: walkIn.patientName,
        age: walkIn.age,
        gender: walkIn.gender,
        phone: walkIn.phone,
        notify: walkIn.notify,
        language: walkIn.language,
        fee: walkIn.fee,
        urgent: walkIn.urgent,
      },
      "walkin"
    );
    if (data) {
      setWalkIn(emptyWalkIn);
      nameInput.current?.focus();
    }
  };

  // Sends who this screen shows with the doctor, so a screen that is a few seconds
  // out of date can't finish a patient someone else just called
  const callNext = (tokenId) =>
    post(
      "call",
      { ...(tokenId && { tokenId }), expectedCurrentId: queue?.current?._id || "" },
      tokenId ? `call-${tokenId}` : "next"
    );
  const act = (tokenId, action) => post("action", { tokenId, action }, `${action}-${tokenId}`);

  const togglePause = () => {
    if (queue?.paused) return post("pause", { paused: false }, "pause");
    const note = window.prompt("Reason shown on the waiting-room screen (optional), e.g. Namaz break, Ward round", "Break");
    if (note === null) return null;
    return post("pause", { paused: true, note }, "pause");
  };

  const current = queue?.current;
  const finished = (queue?.tokens || []).filter((t) => t.status === "done" || t.status === "left");
  const skipped = (queue?.tokens || []).filter((t) => t.status === "skipped");

  const tokenBadges = (t) => (
    <>
      {t.urgent && <Badge className="bg-red-100 text-red-700">Urgent</Badge>}
      {t.kind === "appointment" ? (
        <Badge className="bg-purple-100 text-purple-700" title="Has an appointment">Appointment</Badge>
      ) : (
        <Badge className="bg-gray-100 text-gray-600">Walk-in</Badge>
      )}
      {t.notify && (
        <span title="Gets WhatsApp updates" className="text-green-600">
          <FaWhatsapp />
        </span>
      )}
    </>
  );

  if (isAdmin && !doctors.length) {
    return <div className="p-6 text-gray-500">No doctors yet. Add a doctor first, then their queue appears here.</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Queue</h1>
          <p className="text-sm text-gray-500">
            {queue ? slotDateFormat(queue.day) : "Today"} · tokens restart at 1 every day
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <select
              value={docId}
              onChange={(e) => setDocId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
              aria-label="Doctor"
            >
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  Dr. {d.name} — {d.speciality}
                  {d.available ? "" : " (unavailable)"}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={togglePause}
            disabled={!queue || Boolean(busy)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${
              queue?.paused ? "bg-amber-50 border-amber-300 text-amber-800" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {queue?.paused ? <FaPlay /> : <FaPause />}
            {queue?.paused ? "Resume" : "Pause (break)"}
          </button>
          {publicSite && (
            <a
              href={`${publicSite}/queue`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              title="Open on the waiting-room TV"
            >
              <FaTv /> Waiting-room screen
            </a>
          )}
          <button onClick={load} className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50" title="Refresh">
            <FaSyncAlt />
          </button>
        </div>
      </div>

      {offline && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
          <FaWifi /> No connection to the server. Showing the last known queue and retrying. Keep giving paper tokens until it is back.
        </div>
      )}
      {queue?.paused && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
          The doctor is on a break{queue.pauseNote ? `: ${queue.pauseNote}` : ""}. The waiting-room screen shows this.
        </div>
      )}

      {!queue ? (
        <div className="p-6 text-gray-500">Loading queue…</div>
      ) : (
        <>
          {/* Now serving */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="text-center sm:text-left">
                <p className="text-xs uppercase tracking-wide text-gray-500">With the doctor</p>
                <p className="text-6xl font-bold text-primary leading-none mt-1">{current ? current.number : "—"}</p>
              </div>
              <div className="flex-1 min-w-0">
                {current ? (
                  <>
                    <p className="text-lg font-semibold text-gray-900 truncate">{current.patientName}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">{tokenBadges(current)}</div>
                    <p className="text-xs text-gray-500 mt-1">Called at {timeOf(current.calledAt)}</p>
                  </>
                ) : (
                  <p className="text-gray-500">
                    {queue.waiting.length ? "No one is with the doctor. Call the first patient." : "No one is waiting."}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:w-56">
                <button
                  onClick={() => callNext()}
                  disabled={Boolean(busy) || (!queue.waiting.length && !current)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white font-semibold text-base disabled:opacity-50"
                >
                  <FaBullhorn />
                  {current ? "Done & call next" : "Call next"}
                </button>
                {current && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => act(current._id, "skip")}
                      disabled={Boolean(busy)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                      title="Called but not here; can be put back in line later"
                    >
                      <FaUserClock /> Not here
                    </button>
                    <button
                      onClick={() => act(current._id, "done")}
                      disabled={Boolean(busy)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                      title="Finish without calling anyone"
                    >
                      <FaCheck /> Done
                    </button>
                  </div>
                )}
                {current && !isAdmin && labEnabled && (
                  <button
                    onClick={() => setLabFor(current)}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-teal-200 text-sm font-medium text-teal-700 hover:bg-teal-50"
                    title="Send test requests to the lab for this patient"
                  >
                    <FaFlask /> Request lab tests
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Waiting</p>
                <p className="text-2xl font-bold text-gray-900">{queue.counts.waiting}</p>
              </div>
              <div>
                <p className="text-gray-500">Seen</p>
                <p className="text-2xl font-bold text-gray-900">{queue.counts.done}</p>
              </div>
              <div>
                <p className="text-gray-500">Walk-ins today</p>
                <p className="text-2xl font-bold text-gray-900">{queue.counts.walkIns}</p>
              </div>
              <div>
                <p className="text-gray-500">Walk-in fees</p>
                <p className="text-2xl font-bold text-gray-900">Rs. {queue.counts.walkInFees}</p>
              </div>
              <p className="col-span-2 text-xs text-gray-400">
                About {queue.avgMinutes} min per patient{queue.started ? " (from today's visits)" : " (default until the doctor starts)"}.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Left: new walk-in + check-in */}
            <div className="lg:col-span-2 space-y-4">
              <form onSubmit={submitWalkIn} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FaUserPlus className="text-primary" /> New walk-in token
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="q-name">Patient name *</label>
                  <input
                    id="q-name"
                    ref={nameInput}
                    value={walkIn.patientName}
                    onChange={(e) => setWalkIn({ ...walkIn, patientName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    autoComplete="off"
                    maxLength={80}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="q-age">Age (optional)</label>
                    <input
                      id="q-age"
                      inputMode="numeric"
                      value={walkIn.age}
                      onChange={(e) => setWalkIn({ ...walkIn, age: e.target.value })}
                      placeholder="e.g. 45"
                      maxLength={20}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="q-gender">Gender (optional)</label>
                    <select
                      id="q-gender"
                      value={walkIn.gender}
                      onChange={(e) => setWalkIn({ ...walkIn, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="">—</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="q-phone">Phone (optional)</label>
                    <input
                      id="q-phone"
                      type="tel"
                      inputMode="tel"
                      value={walkIn.phone}
                      onChange={(e) => setWalkIn({ ...walkIn, phone: e.target.value })}
                      placeholder="03xx xxxxxxx"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="q-fee">Fee (Rs.)</label>
                    <input
                      id="q-fee"
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={walkIn.fee}
                      onChange={(e) => setWalkIn({ ...walkIn, fee: e.target.value })}
                      placeholder={doctor?.fee != null ? String(doctor.fee) : ""}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={walkIn.notify}
                    onChange={(e) => setWalkIn({ ...walkIn, notify: e.target.checked })}
                  />
                  <span>
                    Send WhatsApp updates to this number
                    <span className="block text-xs text-gray-500">
                      Only if the patient agreed. Can be a family member&apos;s phone. They get the token number and a message when their turn is near.
                    </span>
                  </span>
                </label>
                {walkIn.notify && (
                  <LanguageSelect value={walkIn.language} onChange={(language) => setWalkIn({ ...walkIn, language })} />
                )}
                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={walkIn.urgent}
                    onChange={(e) => setWalkIn({ ...walkIn, urgent: e.target.checked })}
                  />
                  <span>
                    Urgent
                    <span className="block text-xs text-gray-500">Emergency, very old, disabled or pregnant: seen before the regular line.</span>
                  </span>
                </label>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={autoPrint}
                      onChange={(e) => {
                        setAutoPrint(e.target.checked);
                        writeStorage(AUTO_PRINT_KEY, String(e.target.checked));
                      }}
                    />
                    Print token slip
                  </label>
                  <button
                    type="submit"
                    disabled={Boolean(busy)}
                    className="px-5 py-2 rounded-lg bg-primary text-white font-medium disabled:opacity-50"
                  >
                    {busy === "walkin" ? "Issuing…" : "Issue token"}
                  </button>
                </div>
              </form>

              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <FaSignInAlt className="text-primary" /> Today&apos;s appointments: check in on arrival
                </h2>
                {queue.appointmentsToCheckIn.length === 0 ? (
                  <p className="text-sm text-gray-500">Everyone with an appointment today has been checked in.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {queue.appointmentsToCheckIn.map((a) => (
                      <li key={a._id} className="py-2 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{a.patientName}</p>
                          <p className="text-xs text-gray-500">
                            {a.slotTime}
                            {a.noShow && <span className="ml-2 text-orange-600">marked no-show (arrived late?)</span>}
                          </p>
                        </div>
                        <button
                          onClick={() => issue({ appointmentId: a._id }, `checkin-${a._id}`)}
                          disabled={Boolean(busy)}
                          className="px-3 py-1.5 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary hover:text-white disabled:opacity-50"
                        >
                          Check in
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Right: the line */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Waiting ({queue.waiting.length})</h2>
                  <span className="text-xs text-gray-400">In calling order</span>
                </div>
                {queue.waiting.length === 0 ? (
                  <p className="p-5 text-sm text-gray-500">No one is waiting.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {queue.waiting.map((t, index) => (
                      <li key={t._id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className={`w-12 text-center text-2xl font-bold ${t.urgent ? "text-red-600" : "text-gray-900"}`}>{t.number}</span>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{t.patientName}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              {tokenBadges(t)}
                              <span className="text-xs text-gray-500">
                                {index === 0 ? "Next" : `${index} ahead`}
                                {t.estimate ? ` · ~${t.estimate.waitMinutes} min` : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 sm:justify-end">
                          <button
                            onClick={() => callNext(t._id)}
                            disabled={Boolean(busy)}
                            className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary hover:text-white"
                            title="Call this patient now"
                          >
                            Call
                          </button>
                          <button
                            onClick={() => act(t._id, "urgent")}
                            disabled={Boolean(busy)}
                            className={`p-2 rounded-lg hover:bg-red-50 ${t.urgent ? "text-red-600" : "text-gray-400"}`}
                            title={t.urgent ? "Remove urgent" : "Mark urgent"}
                          >
                            <FaExclamationTriangle />
                          </button>
                          <button onClick={() => reprint(t)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-50" title="Print slip again">
                            <FaPrint />
                          </button>
                          <button
                            onClick={() => window.confirm(`Remove token ${t.number} (${t.patientName}) from the line?`) && act(t._id, "left")}
                            disabled={Boolean(busy)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                            title="Left / remove from line"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {skipped.length > 0 && (
                <div className="bg-white rounded-2xl border border-amber-200">
                  <div className="px-5 py-3 border-b border-amber-100">
                    <h2 className="font-semibold text-amber-900">Not here when called ({skipped.length})</h2>
                    <p className="text-xs text-amber-700">When they come back, put them back in line: they go to the front.</p>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {skipped.map((t) => (
                      <li key={t._id} className="px-5 py-2 flex items-center gap-3">
                        <span className="w-12 text-center text-xl font-bold text-gray-500">{t.number}</span>
                        <span className="flex-1 truncate text-gray-800">{t.patientName}</span>
                        <button
                          onClick={() => act(t._id, "back_in_line")}
                          disabled={Boolean(busy)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
                        >
                          <FaUndo /> Back in line
                        </button>
                        <button
                          onClick={() => act(t._id, "left")}
                          disabled={Boolean(busy)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                          title="Left / remove"
                        >
                          <FaTimes />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {finished.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100">
                  <button
                    onClick={() => setShowFinished(!showFinished)}
                    className="w-full px-5 py-3 text-left font-semibold text-gray-700 flex justify-between"
                  >
                    <span>Seen / left today ({finished.length})</span>
                    <span className="text-sm text-gray-400">{showFinished ? "Hide" : "Show"}</span>
                  </button>
                  {showFinished && (
                    <ul className="divide-y divide-gray-100 border-t border-gray-100">
                      {finished
                        .slice()
                        .reverse()
                        .map((t) => (
                          <li key={t._id} className="px-5 py-2 flex items-center gap-3 text-sm">
                            <span className="w-12 text-center font-bold text-gray-400">{t.number}</span>
                            <span className="flex-1 truncate text-gray-700">{t.patientName}</span>
                            {t.status === "done" ? (
                              <Badge className="bg-green-100 text-green-700">Seen {timeOf(t.doneAt)}</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-500">Left</Badge>
                            )}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {labFor && (
        <LabOrderModal
          source={{ queueTokenId: labFor._id }}
          patientName={labFor.patientName}
          doctorName={doctorName}
          onClose={() => setLabFor(null)}
        />
      )}
    </div>
  );
};

export default Queue;
