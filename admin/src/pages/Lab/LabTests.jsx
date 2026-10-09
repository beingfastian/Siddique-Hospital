import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FaPlus, FaSearch, FaListUl } from "react-icons/fa";
import { labGet, labPost, labPut, errorText } from "../../lab/api";

// The tests doctors can request. Lab staff and admin keep it up to date.
// A test that's no longer offered is turned off (not deleted), so old requests keep their names.
const LabTests = () => {
  const [tests, setTests] = useState(null);
  const [sampleTypes, setSampleTypes] = useState(["Blood"]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", sampleType: "Blood", price: "" });
  const [editing, setEditing] = useState(null); // { _id, name, sampleType, price }
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await labGet("/tests", { all: "true" });
      if (data.success) {
        setTests(data.tests);
        setSampleTypes(data.sampleTypes);
      } else toast.error(data.message);
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
      if (data.success) {
        toast.success(data.message);
        await load();
      } else toast.error(data.message);
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
    if (!form.name.trim()) return toast.error("Please enter the test name");
    if (await run(() => labPost("/tests", form))) setForm({ name: "", sampleType: form.sampleType, price: "" });
  };

  const save = async () => {
    if (await run(() => labPut(`/tests/${editing._id}`, { name: editing.name, sampleType: editing.sampleType, price: editing.price }))) setEditing(null);
  };

  const shown = useMemo(() => {
    const text = search.trim().toLowerCase();
    return (tests || []).filter((t) => !text || t.name.toLowerCase().includes(text));
  }, [tests, search]);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><FaListUl className="text-primary" /> Lab Tests</h1>
          <p className="text-sm text-gray-500">The list doctors choose from. Turn a test off if the lab stops offering it.</p>
        </div>
        <button
          onClick={() => run(() => labPost("/tests/add-common", {}))}
          disabled={busy}
          className="self-start px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50"
          title="Adds CBC, LFT, RFT, sugar, urine R/E and other common tests that aren't in the list yet"
        >
          Add common tests
        </button>
      </div>

      <form onSubmit={add} className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
        <div className="sm:col-span-3">
          <label htmlFor="t-name" className="block text-sm font-medium text-gray-700 mb-1">New test</label>
          <input id="t-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g. Serum Ferritin" />
        </div>
        <div>
          <label htmlFor="t-sample" className="block text-sm font-medium text-gray-700 mb-1">Sample</label>
          <select id="t-sample" value={form.sampleType} onChange={(e) => setForm({ ...form, sampleType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
            {sampleTypes.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="t-price" className="block text-sm font-medium text-gray-700 mb-1">Price (optional)</label>
          <input id="t-price" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium disabled:opacity-50">
          <FaPlus /> Add
        </button>
      </form>

      <div className="relative mb-3">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tests" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg" aria-label="Search tests" />
      </div>

      {!tests ? (
        <p className="text-gray-500">Loading…</p>
      ) : tests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">
          No tests yet. Add them above, or click “Add common tests” to start with the usual list.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
          {shown.map((t) =>
            editing?._id === t._id ? (
              <div key={t._id} className="p-3 grid grid-cols-1 sm:grid-cols-6 gap-2 items-center">
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="sm:col-span-3 px-3 py-1.5 border border-gray-300 rounded-lg" aria-label="Test name" />
                <select value={editing.sampleType} onChange={(e) => setEditing({ ...editing, sampleType: e.target.value })} className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white" aria-label="Sample">
                  {sampleTypes.map((s) => <option key={s}>{s}</option>)}
                </select>
                <input type="number" min="0" value={editing.price ?? ""} onChange={(e) => setEditing({ ...editing, price: e.target.value })} className="px-3 py-1.5 border border-gray-300 rounded-lg" aria-label="Price" />
                <div className="flex gap-2">
                  <button onClick={save} disabled={busy} className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm">Save</button>
                  <button onClick={() => setEditing(null)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div key={t._id} className={`p-3 flex flex-wrap items-center gap-3 ${t.active ? "" : "opacity-60"}`}>
                <span className="flex-1 min-w-[12rem] text-gray-900">{t.name}</span>
                <span className="text-sm text-gray-500 w-20">{t.sampleType}</span>
                <span className="text-sm text-gray-500 w-24">{typeof t.price === "number" ? `Rs. ${t.price}` : "—"}</span>
                <button onClick={() => setEditing({ _id: t._id, name: t.name, sampleType: t.sampleType, price: t.price ?? "" })} className="text-sm text-primary">Edit</button>
                <button
                  onClick={() => run(() => labPut(`/tests/${t._id}`, { active: !t.active }))}
                  disabled={busy}
                  className={`text-sm ${t.active ? "text-gray-500 hover:text-red-600" : "text-green-700"}`}
                >
                  {t.active ? "Turn off" : "Turn on"}
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default LabTests;
