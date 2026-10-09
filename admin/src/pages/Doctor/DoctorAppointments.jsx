import { useContext, useEffect, useMemo, useState } from "react";
import { FaWhatsapp, FaEnvelope, FaSearch, FaCalendarPlus, FaExchangeAlt, FaCalendarDay, FaUserSlash, FaFlask, FaCheck, FaTimes } from "react-icons/fa";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import LabOrderModal from "../../components/LabOrderModal";
import { useLabEnabled } from "../../lab/api";
import FollowUpModal from "../../components/FollowUpModal";
import { DoctorRescheduleModal } from "../../components/RescheduleModal";
import DayActionsDialog from "../../components/DayActionsDialog";
import { appointmentTime, compareSlotDates, hasStarted, hospitalSlotDate } from "../../utils/slots";
import { Avatar, Badge, Button, Card, EmptyState, Input, Menu, Segmented, Select, useDialog } from "../../components/ui";

const PAGE_SIZE = 50;

const StatusBadge = ({ item }) => {
  if (item.cancelled) return <Badge tone="danger">Cancelled</Badge>;
  if (item.isCompleted) return <Badge tone="success">Seen</Badge>;
  if (item.status === "no_show") return <Badge tone="warning">No-show</Badge>;
  if (item.type === "walk_in" || (item.history || []).some((h) => h.action === "checked_in")) return <Badge tone="info">In queue</Badge>;
  return <Badge tone="neutral">Booked</Badge>;
};

const TypeBadge = ({ item }) =>
  item.type === "walk_in" ? (
    <Badge tone="neutral" title="Came without an appointment (live queue)">Walk-in</Badge>
  ) : item.type === "follow_up" ? (
    <Badge tone="followup">Follow-up</Badge>
  ) : null;

const DoctorAppointments = () => {
  const { confirm } = useDialog();
  const { dToken, appointments, getAppointments, completeAppointment, cancelAppointment, rescheduleDay, cancelDay, profileData, markNoShow } =
    useContext(DoctorContext);
  const { calculateAge, slotDateFormat, currency } = useContext(AppContext);
  const labEnabled = useLabEnabled();

  const [range, setRange] = useState("today");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [followUpFor, setFollowUpFor] = useState(null);
  const [labFor, setLabFor] = useState(null);
  const [rescheduleFor, setRescheduleFor] = useState(null);
  const [showDayActions, setShowDayActions] = useState(false);

  useEffect(() => {
    dToken && getAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dToken]);
  useEffect(() => setShown(PAGE_SIZE), [range, searchTerm, filterStatus]);

  // Follow-up booked from each visit: parent appointment id -> follow-up appointment
  const followUps = useMemo(() => {
    const map = {};
    appointments.forEach((a) => {
      if (a.parentAppointmentId && !a.cancelled) map[a.parentAppointmentId] = a;
    });
    return map;
  }, [appointments]);

  const today = hospitalSlotDate();
  const inRange = useMemo(() => {
    const groups = { today: [], upcoming: [], past: [], all: appointments };
    for (const item of appointments) {
      const order = compareSlotDates(item.slotDate, today);
      if (order === 0) groups.today.push(item);
      else if (order > 0) groups.upcoming.push(item);
      else groups.past.push(item);
    }
    return groups;
  }, [appointments, today]);

  const filteredAppointments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const list = inRange[range].filter((item) => {
      if (term && !`${item.userData?.name} ${item.userData?.phone || ""} ${item.userData?.whatsappNumber || ""}`.toLowerCase().includes(term)) return false;
      if (filterStatus === "completed" && !item.isCompleted) return false;
      if (filterStatus === "cancelled" && !item.cancelled) return false;
      if (filterStatus === "no_show" && item.status !== "no_show") return false;
      if (filterStatus === "pending" && (item.isCompleted || item.cancelled || item.status === "no_show")) return false;
      return true;
    });
    const direction = range === "today" || range === "upcoming" ? 1 : -1;
    return list.sort((a, b) => direction * (appointmentTime(a) - appointmentTime(b)));
  }, [inRange, range, searchTerm, filterStatus]);

  const askComplete = async (item) =>
    (await confirm({
      title: `Mark ${item.userData.name} as seen?`,
      message: "The visit is finished and its fee counts in your earnings.",
      confirmLabel: "Mark seen",
    })) && completeAppointment(item._id);

  const askNoShow = async (item) =>
    (await confirm({
      title: `Mark ${item.userData.name} as no-show?`,
      message: "Use this when the patient didn't come. If they arrive late, you can still complete the visit.",
      confirmLabel: "Mark no-show",
    })) && markNoShow(item._id);

  const askCancel = async (item) =>
    (await confirm({
      title: `Cancel ${item.userData.name}'s appointment?`,
      message: "The time slot is freed and the patient is told on WhatsApp (if they agreed to messages).",
      confirmLabel: "Cancel appointment",
      tone: "danger",
    })) && cancelAppointment(item._id);

  const rowActions = (item) => {
    const active = !item.cancelled && !item.isCompleted;
    // Next step: see the patient; after the visit, book the follow-up
    const primary = active
      ? { key: "complete", label: "Mark seen", icon: <FaCheck />, onClick: () => askComplete(item) }
      : item.isCompleted && !followUps[item._id]
        ? { key: "followup", label: "Follow-up", icon: <FaCalendarPlus />, onClick: () => setFollowUpFor(item) }
        : null;
    const items = [
      { label: "Request lab tests", icon: <FaFlask />, onClick: () => setLabFor(item), hidden: !labEnabled || item.cancelled },
      { label: "Schedule follow-up", icon: <FaCalendarPlus />, onClick: () => setFollowUpFor(item), hidden: item.cancelled || primary?.key === "followup" },
      { label: "Reschedule", icon: <FaExchangeAlt />, onClick: () => setRescheduleFor(item), hidden: !active || item.type === "walk_in" },
      { label: "Mark no-show", icon: <FaUserSlash />, onClick: () => askNoShow(item), hidden: !active || item.status === "no_show" || !hasStarted(item) },
      { divider: true, hidden: !active },
      { label: "Cancel appointment", icon: <FaTimes />, onClick: () => askCancel(item), tone: "danger", hidden: !active },
    ];
    return (
      <div className="flex items-center justify-end gap-1">
        {primary && (
          <Button size="sm" variant={primary.key === "complete" ? "primary" : "secondary"} icon={primary.icon} onClick={primary.onClick}>
            {primary.label}
          </Button>
        )}
        <Menu label={`More actions for ${item.userData.name}`} items={items} />
      </div>
    );
  };

  const followUpNote = (item) =>
    followUps[item._id] && (
      <p className="mt-0.5 text-xs text-violet-700">
        Follow-up: {slotDateFormat(followUps[item._id].slotDate)}, {followUps[item._id].slotTime}
      </p>
    );

  const age = (dob) => (calculateAge(dob) !== "—" ? `${calculateAge(dob)} yrs` : "");
  const fee = (item) => `${currency} ${item.amount ?? ""} · ${item.payment ? "Online" : "Cash"}`;
  const filtersOn = searchTerm || filterStatus !== "all";
  const visible = filteredAppointments.slice(0, shown);

  return (
    <div className="w-full p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Appointments</h1>
          <p className="mt-1 text-sm text-slate-600">Mark visits seen, request lab tests and book follow-ups.</p>
        </div>
        <Button icon={<FaCalendarDay />} onClick={() => setShowDayActions(true)}>
          Manage a day
        </Button>
      </div>

      <Card className="mb-4 space-y-3">
        <Segmented
          label="Which appointments"
          value={range}
          onChange={setRange}
          options={[
            { value: "today", label: "Today", count: inRange.today.length },
            { value: "upcoming", label: "Upcoming", count: inRange.upcoming.length },
            { value: "past", label: "Past", count: inRange.past.length },
            { value: "all", label: "All", count: appointments.length },
          ]}
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <FaSearch aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              aria-label="Search appointments"
              placeholder="Search by patient name or phone"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select aria-label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="sm:w-48">
            <option value="all">Any status</option>
            <option value="pending">Booked</option>
            <option value="completed">Seen</option>
            <option value="no_show">No-show</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </Card>

      {/* No overflow-hidden: the "More" menus must not be clipped */}
      <Card padded={false}>
        <div className="hidden lg:grid grid-cols-12 gap-4 rounded-t-xl border-b border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-700">
          <div className="col-span-2">{range === "today" ? "Time" : "Date & time"}</div>
          <div className="col-span-4">Patient</div>
          <div className="col-span-2">Fee</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {visible.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {visible.map((item) => (
              <li key={item._id} className="px-5 py-3">
                <div className="hidden lg:grid grid-cols-12 items-center gap-4">
                  <div className="col-span-2 text-sm">
                    {range !== "today" && <p className="font-medium text-slate-900">{slotDateFormat(item.slotDate)}</p>}
                    <p className={range === "today" ? "font-medium tabular-nums text-slate-900" : "tabular-nums text-slate-600"}>{item.slotTime}</p>
                    {followUpNote(item)}
                  </div>
                  <div className="col-span-4 flex min-w-0 items-center gap-3">
                    <Avatar src={item.userData.image} name={item.userData.name} className="h-9 w-9 shrink-0" textClass="text-sm" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{item.userData.name}</p>
                      <p className="flex items-center gap-1.5 truncate text-sm text-slate-600">
                        {item.userData.whatsappEnabled ? (
                          <FaWhatsapp className="shrink-0 text-emerald-700" title="WhatsApp messages on" aria-label="WhatsApp messages on" />
                        ) : (
                          <FaEnvelope className="shrink-0 text-slate-500" title="Email only" aria-label="Email only" />
                        )}
                        <span className="truncate">{[item.userData.whatsappNumber || item.userData.phone, age(item.userData.dob)].filter(Boolean).join(" · ")}</span>
                      </p>
                    </div>
                  </div>
                  <div className="col-span-2 text-sm tabular-nums text-slate-900">{fee(item)}</div>
                  <div className="col-span-2 flex flex-wrap items-center gap-1">
                    <StatusBadge item={item} />
                    <TypeBadge item={item} />
                  </div>
                  <div className="col-span-2">{rowActions(item)}</div>
                </div>

                <div className="space-y-2 lg:hidden">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar src={item.userData.image} name={item.userData.name} className="h-10 w-10 shrink-0" textClass="text-sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{item.userData.name}</p>
                        <p className="text-sm text-slate-600">
                          {range !== "today" && `${slotDateFormat(item.slotDate)}, `}
                          {item.slotTime}
                          {age(item.userData.dob) && ` · ${age(item.userData.dob)}`}
                        </p>
                        {followUpNote(item)}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge item={item} />
                      <TypeBadge item={item} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm tabular-nums text-slate-600">{fee(item)}</span>
                    {rowActions(item)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<FaSearch />}
            title={filtersOn ? "No matching appointments" : range === "today" ? "No appointments today" : "No appointments here"}
            description={filtersOn ? "Try a different name or status." : "Your appointments will appear here once patients book with you."}
            action={
              filtersOn && (
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("all");
                  }}
                >
                  Clear filters
                </Button>
              )
            }
          />
        )}

        {filteredAppointments.length > shown && (
          <div className="border-t border-slate-100 p-4 text-center">
            <Button onClick={() => setShown(shown + PAGE_SIZE)}>
              Show {Math.min(PAGE_SIZE, filteredAppointments.length - shown)} more ({filteredAppointments.length - shown} left)
            </Button>
          </div>
        )}
      </Card>

      {followUpFor && <FollowUpModal appointment={followUpFor} onClose={() => setFollowUpFor(null)} />}
      {labFor && <LabOrderModal source={{ appointmentId: labFor._id }} patientName={labFor.userData?.name} onClose={() => setLabFor(null)} />}
      {rescheduleFor && <DoctorRescheduleModal appointment={rescheduleFor} onClose={() => setRescheduleFor(null)} />}
      {showDayActions && (
        <DayActionsDialog
          doctorName={profileData?.name}
          appointments={appointments}
          onMove={rescheduleDay}
          onCancelDay={cancelDay}
          onClose={() => setShowDayActions(false)}
        />
      )}
    </div>
  );
};

export default DoctorAppointments;
