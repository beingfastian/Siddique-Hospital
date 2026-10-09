// End-to-end checks for the hospital/doctor fee split and the profit reports,
// through the real HTTP routes. Run with: npm run check:integration
//
// Needs a LOCAL MongoDB (default mongodb://127.0.0.1:27017, or CHECK_MONGODB_URI).
// Uses its own throwaway database and deletes it at the end. Refuses remote URIs.
process.env.JWT_SECRET = process.env.JWT_SECRET || "check-profit-secret";
process.env.WHATSAPP_PROVIDER = "none";
process.env.HOSPITAL_UTC_OFFSET_MINUTES = "300";

const mongoose = (await import("mongoose")).default;
const baseUri = process.env.CHECK_MONGODB_URI || "mongodb://127.0.0.1:27017";
if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/.test(baseUri)) {
  console.error("Refusing to run: CHECK_MONGODB_URI must be a local MongoDB (this script deletes its test database).");
  process.exit(1);
}
await mongoose.connect(baseUri, { dbName: "qlinic_profitcheck_" + Date.now() });

const express = (await import("express")).default;
const jwt = (await import("jsonwebtoken")).default;
const { default: adminRouter } = await import("../routes/adminRoute.js");
const { default: doctorRouter } = await import("../routes/doctorRoute.js");
const { default: doctorModel } = await import("../model/doctorModel.js");
const { default: userModel } = await import("../model/userModel.js");
const { default: appointmentModel } = await import("../model/appointmentModel.js");
const svc = await import("../services/appointmentService.js");
const q = await import("../services/queueService.js");
const { profitReport, hospitalToday } = await import("../services/profitService.js");

const app = express();
app.use(express.json());
app.set("io", { to: () => ({ emit: () => {} }) });
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

let failures = 0;
const check = (label, cond, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${!cond && extra ? "  -> " + extra : ""}`);
  if (!cond) failures++;
};
const call = async (method, url, token, body) => {
  const response = await fetch(base + url, {
    method,
    headers: { ...(token || {}), ...(body && { "Content-Type": "application/json" }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, data: await response.json().catch(() => ({})) };
};

// A completed visit at a given hospital-time moment ("yyyy-mm-dd", "HH:MM")
const visitAt = async (doctor, patient, isoDay, hhmm, amount, { complete = true, withShare = true } = {}) => {
  const [h, m] = hhmm.split(":").map(Number);
  const [Y, M, D] = isoDay.split("-").map(Number);
  const startAt = new Date(Date.UTC(Y, M - 1, D, h, m) - 300 * 60000);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const apt = await appointmentModel.create({
    userId: String(patient._id), docId: String(doctor._id), slotDate: `${D}_${M}_${Y}`,
    slotTime: `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`,
    startAt, userData: { name: patient.name }, docData: { name: doctor.name }, amount, date: Date.now(), status: "booked",
  });
  if (complete && withShare) return svc.completeAppointment(apt._id, { role: "doctor", id: String(doctor._id) });
  if (complete) return appointmentModel.findByIdAndUpdate(apt._id, { isCompleted: true, status: "completed" }, { new: true });
  return apt;
};

try {
  const sign = (claims) => jwt.sign(claims, process.env.JWT_SECRET, { expiresIn: "1h" });
  const admin = { atoken: sign({ role: "admin" }) };
  const iqbal = await doctorModel.create({ name: "Muhammad Iqbal", email: "iqbal@test.pk", password: "x", image: "i", speciality: "Medicine", degree: "d", experience: "1", about: "a", fee: 1000, address: {}, date: Date.now(), hospitalSharePercent: 25 });
  const sana = await doctorModel.create({ name: "Sana Malik", email: "sana@test.pk", password: "x", image: "i", speciality: "Gynae", degree: "d", experience: "1", about: "a", fee: 2000, address: {}, date: Date.now(), hospitalSharePercent: 30 });
  const iqbalLogin = { dtoken: sign({ role: "doctor", id: String(iqbal._id) }) };
  const sanaLogin = { dtoken: sign({ role: "doctor", id: String(sana._id) }) };
  const patient = await userModel.create({ name: "Aslam", phone: "03001234567" });

  // --- The worked example ---
  const v1 = await visitAt(iqbal, patient, "2026-10-05", "10:00", 1000);
  check("Fee 1000 at 25%: hospital 250, doctor 750 saved on the visit", v1.share.percent === 25 && v1.share.hospital === 250 && v1.share.doctor === 750 && v1.completedAt);

  // --- Changing the share applies to new visits only ---
  let r = await call("PUT", `/api/admin/update-doctor/${iqbal._id}`, admin, {
    name: "Muhammad Iqbal", email: "iqbal@test.pk", experience: "1", fee: 1000, about: "a", speciality: "Medicine", degree: "d", address: {}, hospitalSharePercent: "30",
  });
  check("Admin changes the share to 30%", r.data.success, JSON.stringify(r.data));
  const after = await doctorModel.findById(iqbal._id).lean();
  check("Share change is recorded in history", after.hospitalSharePercent === 30 && after.shareHistory.at(-1).percent === 30);
  const v2 = await visitAt(iqbal, patient, "2026-10-06", "11:00", 1000);
  check("New visit uses 30%", v2.share.hospital === 300 && v2.share.doctor === 700);
  check("Old visit keeps 25%", (await appointmentModel.findById(v1._id)).share.hospital === 250);

  for (const bad of ["120", "-5", "abc", "25.123"]) {
    r = await call("PUT", `/api/admin/update-doctor/${iqbal._id}`, admin, {
      name: "Muhammad Iqbal", email: "iqbal@test.pk", experience: "1", fee: 1000, about: "a", speciality: "Medicine", degree: "d", address: {}, hospitalSharePercent: bad,
    });
    check(`Invalid share "${bad}" refused`, !r.data.success && /share/i.test(r.data.message));
  }
  check("Share unchanged after refused edits", (await doctorModel.findById(iqbal._id)).hospitalSharePercent === 30);

  // --- Discounts, free follow-ups, rounding ---
  const free = await visitAt(iqbal, patient, "2026-10-06", "12:00", 0);
  check("Free visit splits to 0 / 0", free.share.hospital === 0 && free.share.doctor === 0);
  const odd = await visitAt(sana, patient, "2026-10-06", "13:00", 1555);
  check("Odd amount: parts add up to the fee exactly", odd.share.hospital + odd.share.doctor === 1555 && odd.share.hospital === 467, JSON.stringify(odd.share));

  // --- Day boundary in Pakistan time: 11:30 pm counts on that day, 12:10 am on the next ---
  await visitAt(sana, patient, "2026-10-07", "23:30", 2000);
  await visitAt(sana, patient, "2026-10-08", "00:10", 2000);
  let rep = await profitReport({ from: "2026-10-07", to: "2026-10-07" });
  check("11:30 pm visit counts on its own day (Pakistan time)", rep.totals.visits === 1 && rep.totals.hospital === 600, JSON.stringify(rep.totals));
  rep = await profitReport({ from: "2026-10-08", to: "2026-10-08" });
  check("12:10 am visit counts on the next day", rep.totals.visits === 1);

  // --- Not completed / cancelled visits don't count ---
  await visitAt(iqbal, patient, "2026-10-06", "15:00", 1000, { complete: false });
  rep = await profitReport({ from: "2026-10-06", to: "2026-10-06", docId: String(iqbal._id) });
  check("Only completed visits count", rep.totals.visits === 2 && rep.totals.fees === 1000 && rep.totals.hospital === 300, JSON.stringify(rep.totals));

  // --- Visits completed before shares existed: estimated with the current share ---
  await visitAt(sana, patient, "2026-10-01", "10:00", 1000, { withShare: false });
  rep = await profitReport({ from: "2026-10-01", to: "2026-10-01" });
  check("Older visit without a saved split is estimated with the current share", rep.estimatedVisits === 1 && rep.totals.hospital === 300);

  // --- Ranges and grouping ---
  rep = await profitReport({ from: "2026-10-01", to: "2026-10-08", groupBy: "day" });
  check("Daily: one bar per day, empty days are 0", rep.series.length === 8 && rep.series.find((p) => p.key === "2026-10-02").visits === 0);
  const sum = (arr, k) => arr.reduce((s, x) => s + x[k], 0);
  check("Daily bars add up to the total", sum(rep.series, "hospital") === rep.totals.hospital && sum(rep.series, "doctor") === rep.totals.doctor && rep.totals.hospital + rep.totals.doctor === rep.totals.fees);
  check("By doctor adds up to the total", sum(rep.byDoctor, "hospital") === rep.totals.hospital && rep.byDoctor.length === 2);
  const expectedHospital = 250 + 300 + 0 + 467 + 600 + 600 + 300; // all visits 1-8 Oct
  check("Total hospital profit is exact", rep.totals.hospital === expectedHospital, `${rep.totals.hospital} vs ${expectedHospital}`);
  rep = await profitReport({ from: "2026-10-01", to: "2026-10-08", groupBy: "week" });
  check("Weekly: weeks start on Monday", rep.series.map((p) => p.key).join(",") === "2026-09-28,2026-10-05", rep.series.map((p) => p.key).join(","));
  rep = await profitReport({ from: "2026-09-15", to: "2026-10-08", groupBy: "month" });
  check("Monthly: Sep and Oct", rep.series.map((p) => p.label).join(",") === "Sep 2026,Oct 2026");
  rep = await profitReport({ from: "2026-10-05", to: "2026-10-06", docId: String(iqbal._id) });
  check("One doctor's profit (custom range)", rep.totals.hospital === 550 && rep.totals.doctor === 1450 && rep.byDoctor.length === 1);

  let err = "";
  try { await profitReport({ from: "2026-10-08", to: "2026-10-01" }); } catch (e) { err = e.message; }
  check("End before start is refused", /before/.test(err));
  try { err = ""; await profitReport({ from: "2026-02-31", to: "2026-03-01" }); } catch (e) { err = e.message; }
  check("Impossible dates are refused", /valid dates/.test(err));

  // --- HTTP: admin sees everyone; a doctor only their own ---
  r = await call("GET", "/api/admin/profit?from=2026-10-01&to=2026-10-08&groupBy=day", admin);
  check("Admin profit report", r.data.success && r.data.report.totals.hospital === expectedHospital);
  r = await call("GET", "/api/admin/profit?from=2026-10-01&to=2026-10-08", iqbalLogin);
  check("A doctor can't open the admin report", r.status === 401 || !r.data.success);
  r = await call("GET", `/api/doctor/earnings?from=2026-10-01&to=2026-10-08&docId=${sana._id}`, iqbalLogin);
  check("Doctor report shows only their own visits (docId in the query is ignored)", r.data.success && r.data.report.byDoctor.length === 1 && r.data.report.byDoctor[0].name === "Muhammad Iqbal" && r.data.report.totals.doctor === 750 + 700, JSON.stringify(r.data.report?.totals));
  r = await call("GET", "/api/doctor/dashboard", sanaLogin);
  const sanaVisits = [1555 - 467, 1400, 1400, 700]; // her completed visits, doctor's part
  check("Doctor dashboard earnings = the doctor's share, not the whole fee", r.data.success && r.data.dashData.earnings === sanaVisits.reduce((a, b) => a + b, 0) && r.data.dashData.hospitalSharePercent === 30, JSON.stringify(r.data.dashData && { e: r.data.dashData.earnings, f: r.data.dashData.fees }));

  // --- Visits finished from the live queue are split too ---
  const tok = (await q.issueToken({ docId: String(iqbal._id), patientName: "Queue Patient", fee: 1000, actor: { role: "admin" } })).token;
  await q.callNext(String(iqbal._id), { role: "admin" }, String(tok._id), "");
  await q.tokenAction(String(iqbal._id), tok._id, "done", { role: "admin" });
  const queued = await appointmentModel.findById(tok.appointmentId);
  check("Walk-in finished in the queue is split (30%)", queued.share.hospital === 300 && queued.share.doctor === 700);
  rep = await profitReport({});
  check("Default report is today", rep.from === hospitalToday() && rep.totals.visits >= 1);
} catch (error) {
  console.error("TEST CRASHED:", error);
  failures++;
} finally {
  server.close();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  console.log(failures ? `\n${failures} FAILED` : "\nALL PROFIT CHECKS PASSED");
  process.exitCode = failures ? 1 : 0;
}
