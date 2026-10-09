import { useCallback, useEffect, useState } from "react";
import { useDialog } from "../../components/ui/Dialog";
import { toast } from "react-toastify";
import { FaUserPlus, FaUsersCog } from "react-icons/fa";
import { labGet, labPost, labPut, errorText, when } from "../../lab/api";

// Admin: lab staff logins. Lab staff sign in on the same login page ("Lab" tab)
// and only see lab requests, the test list and their notifications.
const emptyForm = { name: "", email: "", phone: "", password: "" };

const LabStaff = () => {
  const { confirm, prompt } = useDialog();
  const [staff, setStaff] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await labGet("/staff");
      data.success ? setStaff(data.staff) : toast.error(data.message);
    } catch (e) {
      toast.error(errorText(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn) => {
    if (busy) return false;
    setBusy(true);
    try {
      const data = await fn();
      data.success ? toast.success(data.message) : toast.error(data.message);
      if (data.success) await load();
      return data.success;
    } catch (e) {
      toast.error(errorText(e));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const add = async (e) => {
    e.preventDefault();
    if (await run(() => labPost("/staff", form))) setForm(emptyForm);
  };

  const resetPassword = async (s) => {
    const password = await prompt({
      title: `New password for ${s.name}`,
      message: "Give the new password to them in person. Their current password stops working.",
      label: "New password",
      inputType: "password",
      confirmLabel: "Set password",
      validate: (v) => (v.length < 8 ? "Use at least 8 characters" : ""),
    });
    if (password === null) return;
    run(() => labPut(`/staff/${s._id}`, { password }));
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1"><FaUsersCog className="text-primary" /> Lab Staff</h1>
      <p className="text-sm text-gray-500 mb-4">
        Logins for the lab. They sign in on the normal login page using the “Lab” tab, and only see lab requests and the test list.
      </p>

      <form onSubmit={add} className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="s-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input id="s-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label htmlFor="s-email" className="block text-sm font-medium text-gray-700 mb-1">Email (used to log in)</label>
          <input id="s-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label htmlFor="s-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
          <input id="s-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label htmlFor="s-pass" className="block text-sm font-medium text-gray-700 mb-1">Password (at least 8 characters)</label>
          <input id="s-pass" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium disabled:opacity-50">
            <FaUserPlus /> Add lab account
          </button>
        </div>
      </form>

      {!staff ? (
        <p className="text-gray-500">Loading…</p>
      ) : staff.length === 0 ? (
        <p className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-500">No lab accounts yet.</p>
      ) : (
        <ul className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
          {staff.map((s) => (
            <li key={s._id} className={`p-4 flex flex-wrap items-center gap-3 ${s.active ? "" : "opacity-60"}`}>
              <div className="flex-1 min-w-[12rem]">
                <p className="font-medium text-gray-900">{s.name}</p>
                <p className="text-sm text-gray-500">{s.email}{s.phone ? ` · ${s.phone}` : ""}</p>
                <p className="text-xs text-gray-400">Added {when(s.createdAt)}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {s.active ? "Active" : "Turned off"}
              </span>
              <button onClick={() => resetPassword(s)} disabled={busy} className="text-sm text-primary">Reset password</button>
              <button
                onClick={async () =>
                  (s.active
                    ? await confirm({ title: `Turn off ${s.name}'s login?`, message: "They lose access straight away. You can turn it on again later.", confirmLabel: "Turn off login", tone: "danger" })
                    : true) && run(() => labPut(`/staff/${s._id}`, { active: !s.active }))
                }
                disabled={busy}
                className={`text-sm ${s.active ? "text-gray-500 hover:text-red-600" : "text-green-700"}`}
              >
                {s.active ? "Turn off" : "Turn on"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LabStaff;
