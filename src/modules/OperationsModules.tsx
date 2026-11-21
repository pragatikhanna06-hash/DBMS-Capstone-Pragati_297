import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Check, Clock, Plus, Search, X } from 'lucide-react';
import { apiRequest, formatCurrency } from '../lib/api';
import type {
  DbEntryLog,
  DbExitLog,
  DbParkingSlot,
  DbParkingZone,
  DbPayment,
  DbUser,
  DbVehicle,
  DbViolation,
  DbVisitorPass,
  PaymentMethod,
  ViolationType,
} from '../types/dbms';

interface ModuleProps {
  token: string | null;
  onRequireAuth: () => void;
  onDataChanged: () => void;
}

export function EntryExitModule({ token, onRequireAuth, onDataChanged }: ModuleProps) {
  const [entries, setEntries] = useState<DbEntryLog[]>([]);
  const [exits, setExits] = useState<DbExitLog[]>([]);
  const [vehicles, setVehicles] = useState<DbVehicle[]>([]);
  const [slots, setSlots] = useState<DbParkingSlot[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'entry' | 'exit'>('entry');
  const [entryForm, setEntryForm] = useState({ vehicle_id: 2, slot_id: 2 });
  const [exitForm, setExitForm] = useState({ vehicle_id: 1, slot_id: 9 });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [ee, vRes, sRes] = await Promise.all([
      apiRequest<{ entries: DbEntryLog[]; exits: DbExitLog[] }>('/api/entry-exit'),
      apiRequest<{ vehicles: DbVehicle[] }>('/api/vehicles'),
      apiRequest<{ slots: DbParkingSlot[] }>('/api/slots'),
    ]);
    setEntries(ee.entries);
    setExits(ee.exits);
    setVehicles(vRes.vehicles);
    setSlots(sRes.slots);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      onRequireAuth();
      return;
    }
    setError(null);
    try {
      await apiRequest('/api/entry', { method: 'POST', body: JSON.stringify(entryForm) }, token);
      await load();
      onDataChanged();
    } catch (err: any) {
      if (err?.status === 401) onRequireAuth();
      setError(err instanceof Error ? err.message : 'Entry failed');
    }
  }

  async function handleExit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      onRequireAuth();
      return;
    }
    setError(null);
    try {
      await apiRequest('/api/exit', { method: 'POST', body: JSON.stringify(exitForm) }, token);
      await load();
      onDataChanged();
    } catch (err: any) {
      if (err?.status === 401) onRequireAuth();
      setError(err instanceof Error ? err.message : 'Exit failed');
    }
  }

  const q = search.trim().toLowerCase();
  const filteredEntries = entries.filter((e) => !q || (e.registration_number || '').toLowerCase().includes(q));
  const filteredExits = exits.filter((e) => !q || (e.registration_number || '').toLowerCase().includes(q));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-white">Entry & Exit Gate Management</h1>
        <p className="text-xs text-slate-400">
          MySQL Tables: <span className="font-mono text-cyan-300">ENTRY_LOG</span> &{' '}
          <span className="font-mono text-purple-300">EXIT_LOG</span> · Automatic duration, billing & slot release
        </p>
      </div>

      {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">{error}</div>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <form onSubmit={handleEntry} className="glass-panel rounded-xl p-5 space-y-3 text-xs">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
            <ArrowDownLeft className="h-4 w-4" /> Register Vehicle Entry (sp_vehicle_entry)
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select value={entryForm.vehicle_id} onChange={(e) => setEntryForm({ ...entryForm, vehicle_id: Number(e.target.value) })} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
              {vehicles.map((v) => <option key={v.vehicle_id} value={v.vehicle_id}>{v.registration_number} ({v.vehicle_type})</option>)}
            </select>
            <select value={entryForm.slot_id} onChange={(e) => setEntryForm({ ...entryForm, slot_id: Number(e.target.value) })} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
              {slots.filter((s) => s.status === 'Available' || s.status === 'Reserved').map((s) => (
                <option key={s.slot_id} value={s.slot_id}>{s.slot_number} ({s.status})</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-neon rounded-lg px-4 py-2">Log Gate Entry & Occupy Slot</button>
        </form>

        <form onSubmit={handleExit} className="glass-panel rounded-xl p-5 space-y-3 text-xs">
          <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
            <ArrowUpRight className="h-4 w-4" /> Register Vehicle Exit (sp_vehicle_exit)
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select value={exitForm.vehicle_id} onChange={(e) => setExitForm({ ...exitForm, vehicle_id: Number(e.target.value) })} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
              {vehicles.map((v) => <option key={v.vehicle_id} value={v.vehicle_id}>{v.registration_number} ({v.owner_name})</option>)}
            </select>
            <select value={exitForm.slot_id} onChange={(e) => setExitForm({ ...exitForm, slot_id: Number(e.target.value) })} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
              {slots.filter((s) => s.status === 'Occupied').map((s) => (
                <option key={s.slot_id} value={s.slot_id}>{s.slot_number} (₹{s.hourly_rate}/hr)</option>
              ))}
            </select>
          </div>
          <button type="submit" className="rounded-lg border border-cyan-400/50 bg-cyan-500/15 px-4 py-2 font-semibold text-cyan-200 hover:bg-cyan-500/25">
            Calculate Fee, Log Exit & Release Slot
          </button>
        </form>
      </div>

      <div className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-xl p-3.5 text-xs">
        <div className="flex items-center gap-1 rounded-lg bg-slate-900 p-1">
          <button type="button" onClick={() => setTab('entry')} className={`rounded-md px-3 py-1.5 font-medium ${tab === 'entry' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}>
            Entry Logs ({filteredEntries.length})
          </button>
          <button type="button" onClick={() => setTab('exit')} className={`rounded-md px-3 py-1.5 font-medium ${tab === 'exit' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}>
            Exit & Billing Logs ({filteredExits.length})
          </button>
        </div>
        <div className="relative min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search plate..." className="w-full rounded-lg border border-slate-700 bg-slate-900 py-1.5 pl-8 pr-3 text-white" />
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          {tab === 'entry' ? (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/70 text-slate-400">
                <tr>
                  <th className="px-4 py-3">Entry ID</th>
                  <th className="px-4 py-3">Registration</th>
                  <th className="px-4 py-3">Slot & Zone</th>
                  <th className="px-4 py-3">Entry Time</th>
                  <th className="px-4 py-3">Security Officer</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredEntries.map((e) => (
                  <tr key={e.entry_id} className="hover:bg-cyan-500/5">
                    <td className="px-4 py-3 font-mono text-cyan-300">#{e.entry_id}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-white">{e.registration_number}</td>
                    <td className="px-4 py-3">{e.slot_number} <span className="text-slate-400">· {e.zone_name}</span></td>
                    <td className="px-4 py-3 font-mono text-slate-300 tabular-nums">{e.entry_time}</td>
                    <td className="px-4 py-3 text-slate-300">{e.security_name}</td>
                    <td className="px-4 py-3 text-emerald-400">{e.entry_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/70 text-slate-400">
                <tr>
                  <th className="px-4 py-3">Exit ID</th>
                  <th className="px-4 py-3">Registration</th>
                  <th className="px-4 py-3">Slot & Zone</th>
                  <th className="px-4 py-3">Exit Time</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3 text-right">Fee Charged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredExits.map((e) => (
                  <tr key={e.exit_id} className="hover:bg-cyan-500/5">
                    <td className="px-4 py-3 font-mono text-cyan-300">#{e.exit_id}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-white">{e.registration_number}</td>
                    <td className="px-4 py-3">{e.slot_number} <span className="text-slate-400">· {e.zone_name}</span></td>
                    <td className="px-4 py-3 font-mono text-slate-300 tabular-nums">{e.exit_time}</td>
                    <td className="px-4 py-3 font-mono text-purple-300 tabular-nums">{e.parking_duration} mins</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-400 tabular-nums">{formatCurrency(e.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export function VisitorPassesModule({ token, onRequireAuth, onDataChanged }: ModuleProps) {
  const [passes, setPasses] = useState<DbVisitorPass[]>([]);
  const [users, setUsers] = useState<DbUser[]>([]);
  const [zones, setZones] = useState<DbParkingZone[]>([]);
  const [slots, setSlots] = useState<DbParkingSlot[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    visitor_name: '',
    visitor_phone: '',
    vehicle_number: '',
    host_user_id: 4,
    zone_id: 5,
    slot_id: 28,
    valid_from: new Date().toISOString().slice(0, 16),
    valid_until: new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 16),
  });

  async function load() {
    const [pRes, uRes, zRes, sRes] = await Promise.all([
      apiRequest<{ passes: DbVisitorPass[] }>('/api/visitor-passes'),
      apiRequest<{ users: DbUser[] }>('/api/users'),
      apiRequest<{ zones: DbParkingZone[] }>('/api/zones'),
      apiRequest<{ slots: DbParkingSlot[] }>('/api/slots'),
    ]);
    setPasses(pRes.passes);
    setUsers(uRes.users);
    setZones(zRes.zones);
    setSlots(sRes.slots);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'ACTIVE') return passes.filter((p) => p.pass_status === 'Approved' || p.pass_status === 'Pending');
    if (filter === 'EXPIRED') return passes.filter((p) => p.pass_status === 'Expired' || p.pass_status === 'Rejected');
    return passes;
  }, [passes, filter]);

  async function createPass(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      onRequireAuth();
      return;
    }
    setError(null);
    try {
      await apiRequest('/api/visitor-passes', { method: 'POST', body: JSON.stringify(form) }, token);
      setFormOpen(false);
      await load();
      onDataChanged();
    } catch (err: any) {
      if (err?.status === 401) onRequireAuth();
      setError(err instanceof Error ? err.message : 'Failed to issue visitor pass');
    }
  }

  async function setStatus(id: number, pass_status: string) {
    if (!token) {
      onRequireAuth();
      return;
    }
    await apiRequest(`/api/visitor-passes/${id}/status`, { method: 'PATCH', body: JSON.stringify({ pass_status }) }, token);
    await load();
    onDataChanged();
  }

  async function expireOverdue() {
    if (!token) {
      onRequireAuth();
      return;
    }
    await apiRequest('/api/visitor-passes/expire-overdue', { method: 'POST' }, token);
    await load();
    onDataChanged();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-white">Visitor Pass Management</h1>
          <p className="text-xs text-slate-400">
            MySQL Table: <span className="font-mono text-cyan-300">VISITOR_PASS</span> · Host authorization & validity expiry enforcement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={expireOverdue} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-300 hover:bg-amber-500/20">
            <Clock className="h-3.5 w-3.5" /> Expire Overdue Passes
          </button>
          <button type="button" onClick={() => setFormOpen(true)} className="btn-neon inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs">
            <Plus className="h-3.5 w-3.5" /> Issue Visitor Pass
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">{error}</div>}

      <div className="flex items-center gap-1 rounded-lg bg-slate-900/90 p-1 w-fit text-xs">
        {(['ALL', 'ACTIVE', 'EXPIRED'] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded-md px-3 py-1.5 font-medium ${filter === f ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}>
            {f === 'ALL' ? 'All Passes' : f === 'ACTIVE' ? 'Active & Pending' : 'Expired / Rejected'}
          </button>
        ))}
      </div>

      <div className="glass-panel overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/70 text-slate-400">
              <tr>
                <th className="px-4 py-3">Pass ID</th>
                <th className="px-4 py-3">Visitor & Vehicle</th>
                <th className="px-4 py-3">Host & Zone</th>
                <th className="px-4 py-3">Validity Window</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filtered.map((p) => (
                <tr key={p.pass_id} className="hover:bg-cyan-500/5">
                  <td className="px-4 py-3 font-mono text-cyan-300">#{p.pass_id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{p.visitor_name}</div>
                    <div className="font-mono text-[11px] text-purple-300">{p.vehicle_number} · {p.visitor_phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-200">Host: {p.host_name}</div>
                    <div className="text-[11px] text-slate-400">{p.zone_name} {p.slot_number ? `· Slot ${p.slot_number}` : ''}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-300 tabular-nums">
                    <div>{p.valid_from}</div>
                    <div className="text-slate-500">→ {p.valid_until}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={p.pass_status === 'Approved' ? 'text-emerald-400' : p.pass_status === 'Pending' ? 'text-amber-300' : 'text-red-400'}>
                      {p.pass_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.pass_status === 'Pending' && (
                      <div className="inline-flex gap-1.5">
                        <button type="button" onClick={() => setStatus(p.pass_id, 'Approved')} className="rounded border border-emerald-500/40 px-2.5 py-1 text-[11px] text-emerald-300 hover:bg-emerald-500/15">
                          Approve
                        </button>
                        <button type="button" onClick={() => setStatus(p.pass_id, 'Rejected')} className="rounded border border-red-500/40 px-2.5 py-1 text-[11px] text-red-300 hover:bg-red-500/15">
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Generate Visitor Pass</h3>
              <button type="button" onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={createPass} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Visitor Name" value={form.visitor_name} onChange={(e) => setForm({ ...form, visitor_name: e.target.value })} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" required />
                <input type="text" placeholder="Phone" value={form.visitor_phone} onChange={(e) => setForm({ ...form, visitor_phone: e.target.value })} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Vehicle Plate" value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value.toUpperCase() })} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-white" required />
                <select value={form.host_user_id} onChange={(e) => setForm({ ...form, host_user_id: Number(e.target.value) })} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
                  {users.map((u) => <option key={u.user_id} value={u.user_id}>Host: {u.full_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.zone_id} onChange={(e) => setForm({ ...form, zone_id: Number(e.target.value) })} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
                  {zones.map((z) => <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>)}
                </select>
                <select value={form.slot_id} onChange={(e) => setForm({ ...form, slot_id: Number(e.target.value) })} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
                  {slots.filter((s) => s.zone_id === form.zone_id).map((s) => <option key={s.slot_id} value={s.slot_id}>{s.slot_number}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="datetime-local" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-white" required />
                <input type="datetime-local" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-white" required />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300">Cancel</button>
                <button type="submit" className="btn-neon rounded-lg px-4 py-2">Issue Pass</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const VIOLATION_TYPES: ViolationType[] = [
  'Unauthorized Parking',
  'Overstay',
  'Wrong Zone Parking',
  'Expired Visitor Pass',
  'Reserved Slot Violation',
];

export function ViolationsModule({ token, onRequireAuth, onDataChanged }: ModuleProps) {
  const [violations, setViolations] = useState<DbViolation[]>([]);
  const [vehicles, setVehicles] = useState<DbVehicle[]>([]);
  const [slots, setSlots] = useState<DbParkingSlot[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    vehicle_id: 4,
    slot_id: 9,
    violation_type: 'Wrong Zone Parking' as ViolationType,
    description: '',
    penalty_amount: 500,
  });

  async function load() {
    const [viRes, vRes, sRes] = await Promise.all([
      apiRequest<{ violations: DbViolation[] }>('/api/violations'),
      apiRequest<{ vehicles: DbVehicle[] }>('/api/vehicles'),
      apiRequest<{ slots: DbParkingSlot[] }>('/api/slots'),
    ]);
    setViolations(viRes.violations);
    setVehicles(vRes.vehicles);
    setSlots(sRes.slots);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => violations.filter((v) => typeFilter === 'ALL' || v.violation_type === typeFilter),
    [violations, typeFilter]
  );

  const repeatedViolators = useMemo(() => {
    const map = new Map<string, { reg: string; owner: string; count: number; total: number }>();
    for (const vi of violations) {
      const reg = vi.registration_number || `#${vi.vehicle_id}`;
      const cur = map.get(reg) || { reg, owner: vi.owner_name || 'Unknown', count: 0, total: 0 };
      cur.count += 1;
      cur.total += vi.penalty_amount;
      map.set(reg, cur);
    }
    return Array.from(map.values()).filter((x) => x.count >= 2);
  }, [violations]);

  const totalPenalties = violations.reduce((sum, v) => sum + v.penalty_amount, 0);

  async function reportViolation(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      onRequireAuth();
      return;
    }
    await apiRequest('/api/violations', { method: 'POST', body: JSON.stringify(form) }, token);
    setFormOpen(false);
    await load();
    onDataChanged();
  }

  async function updateStatus(id: number, violation_status: string) {
    if (!token) {
      onRequireAuth();
      return;
    }
    await apiRequest(`/api/violations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ violation_status }) }, token);
    await load();
    onDataChanged();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-white">Violation Management</h1>
          <p className="text-xs text-slate-400">
            MySQL Table: <span className="font-mono text-cyan-300">VIOLATION</span> · Trigger{' '}
            <span className="font-mono text-purple-300">trg_after_violation_insert</span> auto-creates pending penalty payment
          </p>
        </div>
        <button type="button" onClick={() => setFormOpen(true)} className="btn-neon inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs">
          <Plus className="h-3.5 w-3.5" /> Report Violation
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-panel rounded-xl p-4">
          <div className="text-xs text-slate-400">Total Violations Recorded</div>
          <div className="mt-1 font-mono text-2xl font-bold text-amber-400 tabular-nums">{violations.length}</div>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="text-xs text-slate-400">Cumulative Penalty Assessed</div>
          <div className="mt-1 font-mono text-2xl font-bold text-red-400 tabular-nums">{formatCurrency(totalPenalties)}</div>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="text-xs text-slate-400">Repeated Violators (&ge; 2)</div>
          <div className="mt-1 font-mono text-2xl font-bold text-purple-300 tabular-nums">
            {repeatedViolators.map((r) => `${r.reg} (${r.count})`).join(', ') || 'None'}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-900/90 p-1 w-fit text-xs">
        {['ALL', ...VIOLATION_TYPES].map((t) => (
          <button key={t} type="button" onClick={() => setTypeFilter(t)} className={`rounded-md px-2.5 py-1.5 font-medium ${typeFilter === t ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'}`}>
            {t === 'ALL' ? 'All Violations' : t}
          </button>
        ))}
      </div>

      <div className="glass-panel overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/70 text-slate-400">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Vehicle & Owner</th>
                <th className="px-4 py-3">Violation Type</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Penalty</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filtered.map((vi) => (
                <tr key={vi.violation_id} className="hover:bg-cyan-500/5">
                  <td className="px-4 py-3 font-mono text-cyan-300">#{vi.violation_id}</td>
                  <td className="px-4 py-3">
                    <div className="font-mono font-semibold text-white">{vi.registration_number}</div>
                    <div className="text-[11px] text-slate-400">{vi.owner_name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-amber-300">{vi.violation_type}</div>
                    <div className="text-[11px] text-slate-400">{vi.description}</div>
                  </td>
                  <td className="px-4 py-3">{vi.slot_number} · {vi.zone_name}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-white tabular-nums">{formatCurrency(vi.penalty_amount)}</td>
                  <td className="px-4 py-3">
                    <span className={vi.violation_status === 'Paid' ? 'text-emerald-400' : vi.violation_status === 'Unpaid' ? 'text-red-400' : 'text-amber-300'}>
                      {vi.violation_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {vi.violation_status === 'Unpaid' && (
                      <button type="button" onClick={() => updateStatus(vi.violation_id, 'Paid')} className="rounded border border-emerald-500/40 px-2.5 py-1 text-[11px] text-emerald-300 hover:bg-emerald-500/15">
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Report Parking Violation</h3>
              <button type="button" onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={reportViolation} className="space-y-3 text-xs">
              <select value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: Number(e.target.value) })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
                {vehicles.map((v) => <option key={v.vehicle_id} value={v.vehicle_id}>{v.registration_number} ({v.owner_name})</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.slot_id} onChange={(e) => setForm({ ...form, slot_id: Number(e.target.value) })} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
                  {slots.map((s) => <option key={s.slot_id} value={s.slot_id}>{s.slot_number}</option>)}
                </select>
                <input type="number" min={0} value={form.penalty_amount} onChange={(e) => setForm({ ...form, penalty_amount: Number(e.target.value) })} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" required />
              </div>
              <select value={form.violation_type} onChange={(e) => setForm({ ...form, violation_type: e.target.value as ViolationType })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
                {VIOLATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <textarea rows={2} placeholder="Violation description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" required />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300">Cancel</button>
                <button type="submit" className="btn-neon rounded-lg px-4 py-2">Submit Citation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Card', 'Campus Wallet', 'NetBanking', 'Cash'];

export function PaymentsModule({ token, onRequireAuth, onDataChanged }: ModuleProps) {
  const [payments, setPayments] = useState<DbPayment[]>([]);
  const [users, setUsers] = useState<DbUser[]>([]);
  const [form, setForm] = useState({ user_id: 3, amount: 150, payment_method: 'UPI' as PaymentMethod });

  async function load() {
    const [pRes, uRes] = await Promise.all([
      apiRequest<{ payments: DbPayment[] }>('/api/payments'),
      apiRequest<{ users: DbUser[] }>('/api/users'),
    ]);
    setPayments(pRes.payments);
    setUsers(uRes.users);
  }

  useEffect(() => {
    load();
  }, []);

  const paidTotal = payments.filter((p) => p.payment_status === 'Paid').reduce((s, p) => s + p.amount, 0);
  const pendingTotal = payments.filter((p) => p.payment_status === 'Pending').reduce((s, p) => s + p.amount, 0);

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      onRequireAuth();
      return;
    }
    await apiRequest('/api/payments', { method: 'POST', body: JSON.stringify(form) }, token);
    await load();
    onDataChanged();
  }

  async function settlePending(id: number) {
    if (!token) {
      onRequireAuth();
      return;
    }
    await apiRequest(`/api/payments/${id}/settle`, { method: 'PATCH' }, token);
    await load();
    onDataChanged();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-white">Payments & Penalty Ledger</h1>
        <p className="text-xs text-slate-400">
          MySQL Table: <span className="font-mono text-cyan-300">PAYMENT</span> · Simulated academic transaction records & penalty settlement
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="glass-panel rounded-xl p-4">
          <div className="text-xs text-slate-400">Collected Revenue (Paid)</div>
          <div className="mt-1 font-mono text-2xl font-bold text-emerald-400 tabular-nums">{formatCurrency(paidTotal)}</div>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="text-xs text-slate-400">Pending Receivables</div>
          <div className="mt-1 font-mono text-2xl font-bold text-amber-400 tabular-nums">{formatCurrency(pendingTotal)}</div>
        </div>
        <form onSubmit={recordPayment} className="glass-panel flex flex-wrap items-center gap-2 rounded-xl p-4 text-xs">
          <select value={form.user_id} onChange={(e) => setForm({ ...form, user_id: Number(e.target.value) })} className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-white">
            {users.map((u) => <option key={u.user_id} value={u.user_id}>{u.full_name}</option>)}
          </select>
          <input type="number" min={10} value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="w-20 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 font-mono text-white" />
          <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value as PaymentMethod })} className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-white">
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <button type="submit" className="btn-neon rounded-lg px-3 py-2">Record</button>
        </form>
      </div>

      <div className="glass-panel overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/70 text-slate-400">
              <tr>
                <th className="px-4 py-3">Transaction Ref</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {payments.map((p) => (
                <tr key={p.payment_id} className="hover:bg-cyan-500/5">
                  <td className="px-4 py-3 font-mono text-cyan-300">{p.transaction_reference}</td>
                  <td className="px-4 py-3 font-medium text-white">{p.user_name}</td>
                  <td className="px-4 py-3 text-slate-300">
                    {p.violation_id ? `Violation Penalty #${p.violation_id}` : p.reservation_id ? `Reservation #${p.reservation_id}` : 'Parking Fee'}
                  </td>
                  <td className="px-4 py-3 text-purple-300">{p.payment_method}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-white tabular-nums">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={p.payment_status === 'Paid' ? 'text-emerald-400' : 'text-amber-400'}>{p.payment_status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.payment_status === 'Pending' && (
                      <button type="button" onClick={() => settlePending(p.payment_id)} className="inline-flex items-center gap-1 rounded border border-emerald-500/40 px-2.5 py-1 text-[11px] text-emerald-300 hover:bg-emerald-500/15">
                        <Check className="h-3 w-3" /> Settle Now
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
