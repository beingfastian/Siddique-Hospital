// What is happening today, per doctor: appointments still to see, seen, no-shows, and
// the live queue. Feeds the "Today" dashboards for reception and doctors.
import appointmentModel from "../model/appointmentModel.js";
import doctorModel from "../model/doctorModel.js";
import { queueDayModel, queueTokenModel } from "../model/queueModel.js";
import { hospitalSlotDate } from "../utils/slots.js";

const emptyRow = (docId) => ({
  docId,
  toSee: 0, // booked or checked in, not finished yet
  seen: 0,
  noShow: 0,
  cancelled: 0,
  waiting: 0, // in the queue now
  nowServing: null, // token number with the doctor
  paused: false,
});

// docId given: that doctor only. Otherwise every doctor, busiest first.
export const todaySummary = async ({ docId } = {}) => {
  const day = hospitalSlotDate(new Date());
  const byDoctor = docId ? { docId: String(docId) } : {};
  const [appointments, tokens, days, doctors] = await Promise.all([
    appointmentModel.find({ slotDate: day, ...byDoctor }).select("docId status cancelled isCompleted").lean(),
    queueTokenModel.find({ day, ...byDoctor }).select("docId status number calledAt").lean(),
    queueDayModel.find({ day, ...byDoctor }).select("docId paused").lean(),
    doctorModel.find(docId ? { _id: docId } : {}).select("name speciality image available").lean(),
  ]);

  const rows = new Map(doctors.map((d) => [String(d._id), emptyRow(String(d._id))]));
  const rowFor = (id) => rows.get(String(id));

  for (const a of appointments) {
    const row = rowFor(a.docId);
    if (!row) continue;
    if (a.cancelled) row.cancelled++;
    else if (a.isCompleted) row.seen++;
    else if (a.status === "no_show") row.noShow++;
    else row.toSee++;
  }

  const latestCall = new Map();
  for (const t of tokens) {
    const row = rowFor(t.docId);
    if (!row) continue;
    if (t.status === "waiting") row.waiting++;
    if (t.status === "called") {
      const previous = latestCall.get(row.docId);
      if (!previous || new Date(t.calledAt) > new Date(previous.calledAt)) latestCall.set(row.docId, t);
    }
  }
  for (const [id, t] of latestCall) rows.get(id).nowServing = t.number;
  for (const d of days) if (rowFor(d.docId)) rowFor(d.docId).paused = Boolean(d.paused);

  const list = doctors.map((d) => ({
    ...rows.get(String(d._id)),
    name: d.name,
    speciality: d.speciality,
    image: d.image,
    available: d.available !== false,
  }));
  const activity = (r) => r.toSee + r.seen + r.noShow + r.waiting + (r.nowServing ? 1 : 0);
  list.sort((a, b) => activity(b) - activity(a) || a.name.localeCompare(b.name));

  const totals = list.reduce(
    (sum, r) => ({
      toSee: sum.toSee + r.toSee,
      seen: sum.seen + r.seen,
      noShow: sum.noShow + r.noShow,
      cancelled: sum.cancelled + r.cancelled,
      waiting: sum.waiting + r.waiting,
    }),
    { toSee: 0, seen: 0, noShow: 0, cancelled: 0, waiting: 0 }
  );
  return { day, totals, doctors: list };
};
