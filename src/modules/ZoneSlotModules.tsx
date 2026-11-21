import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, MapPin, Plus, Trash2, X } from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { DbParkingSlot, DbParkingZone, SlotStatus, SlotType, ZoneStatus, ZoneType } from '../types/dbms';

interface ModuleProps {
  token: string | null;
  onRequireAuth: () => void;
  onDataChanged: () => void;
}

const ZONE_TYPES: ZoneType[] = ['General', 'EV Charging', 'Faculty & Staff', 'Resident', 'VIP', 'Visitor'];
const ZONE_STATUSES: ZoneStatus[] = ['Active', 'Full', 'Maintenance'];
const SLOT_TYPES: SlotType[] = ['Regular', 'EV', 'Accessible', 'VIP'];
const SLOT_STATUSES: SlotStatus[] = ['Available', 'Occupied', 'Reserved', 'Maintenance'];

export function ParkingZonesModule({ token, onRequireAuth, onDataChanged }: ModuleProps) {
  const [zones, setZones] = useState<DbParkingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DbParkingZone | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    zone_name: '',
    location: '',
    zone_type: 'General' as ZoneType,
    total_capacity: 10,
    description: '',
    status: 'Active' as ZoneStatus,
  });

  async function load() {
    setLoading(true);
    try {
      const res = await apiRequest<{ zones: DbParkingZone[] }>('/api/zones');
      setZones(res.zones);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ zone_name: '', location: '', zone_type: 'General', total_capacity: 8, description: '', status: 'Active' });
    setError(null);
    setFormOpen(true);
  }

  function openEdit(z: DbParkingZone) {
    setEditing(z);
    setForm({
      zone_name: z.zone_name,
      location: z.location,
      zone_type: z.zone_type,
      total_capacity: z.total_capacity,
      description: z.description,
      status: z.status,
    });
    setError(null);
    setFormOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      onRequireAuth();
      return;
    }
    setError(null);
    try {
      if (editing) {
        await apiRequest(`/api/zones/${editing.zone_id}`, { method: 'PUT', body: JSON.stringify(form) }, token);
      } else {
        await apiRequest('/api/zones', { method: 'POST', body: JSON.stringify(form) }, token);
      }
      setFormOpen(false);
      await load();
      onDataChanged();
    } catch (err: any) {
      if (err?.status === 401) onRequireAuth();
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  async function handleDelete(z: DbParkingZone) {
    if (!token) {
      onRequireAuth();
      return;
    }
    try {
      await apiRequest(`/api/zones/${z.zone_id}`, { method: 'DELETE' }, token);
      await load();
      onDataChanged();
    } catch (err: any) {
      if (err?.status === 401) onRequireAuth();
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-white">Parking Zones</h1>
          <p className="text-xs text-slate-400">
            MySQL Table: <span className="font-mono text-cyan-300">PARKING_ZONE</span> · Live capacity & utilization metrics
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-neon inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add Zone
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="glass-panel h-48 animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {zones.map((z) => {
            const util = Number(z.utilization_pct || 0);
            return (
              <div key={z.zone_id} className="glass-panel glass-panel-hover flex flex-col justify-between rounded-xl p-5">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-base font-semibold text-white">{z.zone_name}</h2>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                        <span>{z.location}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold ${z.status === 'Active' ? 'text-emerald-400' : z.status === 'Full' ? 'text-red-400' : 'text-amber-400'}`}>
                      {z.status}
                    </span>
                  </div>
                  <p className="mt-2.5 text-xs text-slate-400">{z.description}</p>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-y border-slate-800/80 py-3 font-mono text-xs tabular-nums">
                    <div>
                      <div className="text-[11px] text-slate-500">Capacity</div>
                      <div className="text-sm font-bold text-white">{z.total_capacity}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500">Available</div>
                      <div className="text-sm font-bold text-emerald-400">{z.available_slots ?? 0}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500">Occupied</div>
                      <div className="text-sm font-bold text-red-400">{z.occupied_slots ?? 0}</div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-slate-400">Utilization ({z.zone_type})</span>
                      <span className="font-mono font-semibold text-cyan-300 tabular-nums">{util}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all"
                        style={{ width: `${Math.min(100, util)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => openEdit(z)} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-cyan-400 hover:text-cyan-300">
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(z)} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-red-400 hover:text-red-400">
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">{editing ? 'Update Zone' : 'Create Parking Zone'}</h3>
              <button type="button" onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block text-slate-300">Zone Name (UNIQUE)</label>
                <input type="text" value={form.zone_name} onChange={(e) => setForm({ ...form, zone_name: e.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" required />
              </div>
              <div>
                <label className="mb-1 block text-slate-300">Location</label>
                <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-slate-300">Zone Type</label>
                  <select value={form.zone_type} onChange={(e) => setForm({ ...form, zone_type: e.target.value as ZoneType })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
                    {ZONE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-slate-300">Capacity</label>
                  <input type="number" min={1} value={form.total_capacity} onChange={(e) => setForm({ ...form, total_capacity: Number(e.target.value) })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" required />
                </div>
                <div>
                  <label className="mb-1 block text-slate-300">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ZoneStatus })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
                    {ZONE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-slate-300">Description</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300">Cancel</button>
                <button type="submit" className="btn-neon rounded-lg px-4 py-2">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function ParkingSlotsModule({ token, onRequireAuth, onDataChanged }: ModuleProps) {
  const [slots, setSlots] = useState<DbParkingSlot[]>([]);
  const [zones, setZones] = useState<DbParkingZone[]>([]);
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedSlot, setSelectedSlot] = useState<DbParkingSlot | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DbParkingSlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    zone_id: 1,
    slot_number: '',
    slot_type: 'Regular' as SlotType,
    status: 'Available' as SlotStatus,
    hourly_rate: 30,
  });

  async function load() {
    const [sRes, zRes] = await Promise.all([
      apiRequest<{ slots: DbParkingSlot[] }>('/api/slots'),
      apiRequest<{ zones: DbParkingZone[] }>('/api/zones'),
    ]);
    setSlots(sRes.slots);
    setZones(zRes.zones);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return slots.filter((s) => {
      if (zoneFilter !== 'ALL' && s.zone_id !== Number(zoneFilter)) return false;
      if (typeFilter !== 'ALL' && s.slot_type !== typeFilter) return false;
      return true;
    });
  }, [slots, zoneFilter, typeFilter]);

  function openCreate() {
    setEditing(null);
    setForm({ zone_id: zones[0]?.zone_id || 1, slot_number: '', slot_type: 'Regular', status: 'Available', hourly_rate: 30 });
    setError(null);
    setFormOpen(true);
  }

  function openEdit(s: DbParkingSlot) {
    setEditing(s);
    setForm({ zone_id: s.zone_id, slot_number: s.slot_number, slot_type: s.slot_type, status: s.status, hourly_rate: s.hourly_rate });
    setError(null);
    setFormOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      onRequireAuth();
      return;
    }
    setError(null);
    try {
      if (editing) {
        await apiRequest(`/api/slots/${editing.slot_id}`, { method: 'PUT', body: JSON.stringify(form) }, token);
      } else {
        await apiRequest('/api/slots', { method: 'POST', body: JSON.stringify(form) }, token);
      }
      setFormOpen(false);
      await load();
      onDataChanged();
    } catch (err: any) {
      if (err?.status === 401) onRequireAuth();
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  async function changeStatus(slotId: number, status: SlotStatus) {
    if (!token) {
      onRequireAuth();
      return;
    }
    try {
      await apiRequest(`/api/slots/${slotId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, token);
      await load();
      if (selectedSlot?.slot_id === slotId) setSelectedSlot((prev) => (prev ? { ...prev, status } : null));
      onDataChanged();
    } catch (err: any) {
      if (err?.status === 401) onRequireAuth();
      setError(err instanceof Error ? err.message : 'Status update failed');
    }
  }

  const slotGlow: Record<SlotStatus, string> = {
    Available: 'border-emerald-400/50 bg-emerald-500/10 shadow-[0_0_16px_rgba(16,185,129,0.16)]',
    Occupied: 'border-red-400/50 bg-red-500/10 shadow-[0_0_16px_rgba(239,68,68,0.16)]',
    Reserved: 'border-purple-400/50 bg-purple-500/10 shadow-[0_0_16px_rgba(155,92,255,0.18)]',
    Maintenance: 'border-amber-400/50 bg-amber-500/10 shadow-[0_0_16px_rgba(245,158,11,0.16)]',
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-white">Parking Slots Visual Grid</h1>
          <p className="text-xs text-slate-400">
            MySQL Table: <span className="font-mono text-cyan-300">PARKING_SLOT</span> · Composite UNIQUE <span className="font-mono text-purple-300">(zone_id, slot_number)</span> prevents duplicates
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-neon inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add Slot
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">{error}</div>}

      <div className="glass-panel flex flex-wrap items-center gap-3 rounded-xl p-3.5 text-xs">
        <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
          <option value="ALL">All Zones</option>
          {zones.map((z) => <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>)}
        </select>
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-900/90 p-1">
          {['ALL', ...SLOT_TYPES].map((t) => (
            <button key={t} type="button" onClick={() => setTypeFilter(t)} className={`rounded-md px-2.5 py-1.5 font-medium ${typeFilter === t ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'}`}>
              {t === 'ALL' ? 'All Slot Types' : t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:col-span-2">
          {filtered.map((s) => (
            <button
              key={s.slot_id}
              type="button"
              onClick={() => setSelectedSlot(s)}
              className={`rounded-xl border p-3.5 text-left transition-all hover:scale-[1.02] ${slotGlow[s.status]} ${
                selectedSlot?.slot_id === s.slot_id ? 'ring-2 ring-cyan-400' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-white">{s.slot_number}</span>
                <span className="font-mono text-[11px] text-slate-300">₹{s.hourly_rate}/h</span>
              </div>
              <div className="mt-1 text-xs font-medium text-slate-200">{s.status}</div>
              <div className="mt-0.5 truncate text-[11px] text-slate-400">{s.slot_type} · {s.zone_name?.split(' - ')[0]}</div>
            </button>
          ))}
        </div>

        <div className="glass-panel rounded-xl p-5">
          <h2 className="mb-3 text-sm font-semibold text-white">Slot Inspector & Controls</h2>
          {selectedSlot ? (
            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-800 pb-3">
                <div className="font-mono text-xl font-bold text-cyan-300">{selectedSlot.slot_number}</div>
                <div className="mt-1 text-slate-300">{selectedSlot.zone_name}</div>
                <div className="mt-1 text-slate-400">Type: {selectedSlot.slot_type} · Rate: ₹{selectedSlot.hourly_rate}/hr</div>
              </div>
              <div>
                <div className="mb-2 font-medium text-slate-300">Quick Status Transition</div>
                <div className="grid grid-cols-2 gap-2">
                  {SLOT_STATUSES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => changeStatus(selectedSlot.slot_id, st)}
                      className={`rounded-lg border px-3 py-2 font-medium transition-colors ${
                        selectedSlot.status === st
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                          : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" onClick={() => openEdit(selectedSlot)} className="w-full rounded-lg border border-purple-500/40 bg-purple-500/10 py-2 font-medium text-purple-200 hover:bg-purple-500/20">
                Edit Slot Details
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Click any glowing slot bay on the grid to inspect details, change status, or edit hourly rates.</p>
          )}
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">{editing ? 'Update Slot' : 'Add Parking Slot'}</h3>
              <button type="button" onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block text-slate-300">Zone (FK → PARKING_ZONE)</label>
                <select value={form.zone_id} onChange={(e) => setForm({ ...form, zone_id: Number(e.target.value) })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
                  {zones.map((z) => <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-slate-300">Slot Number (UNIQUE per Zone)</label>
                  <input type="text" value={form.slot_number} onChange={(e) => setForm({ ...form, slot_number: e.target.value.toUpperCase() })} placeholder="A-09" className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-white" required />
                </div>
                <div>
                  <label className="mb-1 block text-slate-300">Hourly Rate (₹)</label>
                  <input type="number" min={0} step="5" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: Number(e.target.value) })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-slate-300">Slot Type</label>
                  <select value={form.slot_type} onChange={(e) => setForm({ ...form, slot_type: e.target.value as SlotType })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
                    {SLOT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-slate-300">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as SlotStatus })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
                    {SLOT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300">Cancel</button>
                <button type="submit" className="btn-neon rounded-lg px-4 py-2">{editing ? 'Update Slot' : 'Add Slot'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
