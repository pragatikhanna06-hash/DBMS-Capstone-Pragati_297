import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Cpu, Lock, Plus, X } from 'lucide-react';
import { apiRequest } from '../lib/api';
import type {
  DbParkingSlot,
  DbParkingZone,
  DbReservation,
  DbUser,
  DbVehicle,
  NavSectionId,
} from '../types/dbms';

interface ModuleProps {
  token: string | null;
  onRequireAuth: () => void;
  onDataChanged: () => void;
}

export function ReservationsModule({ token, onRequireAuth, onDataChanged }: ModuleProps) {
  const [reservations, setReservations] = useState<DbReservation[]>([]);
  const [users, setUsers] = useState<DbUser[]>([]);
  const [vehicles, setVehicles] = useState<DbVehicle[]>([]);
  const [slots, setSlots] = useState<DbParkingSlot[]>([]);
  const [tab, setTab] = useState<'upcoming' | 'history' | 'all'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nowStr = new Date().toISOString().slice(0, 16);
  const laterStr = new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 16);
  const [form, setForm] = useState({
    user_id: 3,
    vehicle_id: 1,
    slot_id: 2,
    start_time: nowStr,
    end_time: laterStr,
  });

  async function load() {
    const [rRes, uRes, vRes, sRes] = await Promise.all([
      apiRequest<{ reservations: DbReservation[] }>('/api/reservations'),
      apiRequest<{ users: DbUser[] }>('/api/users'),
      apiRequest<{ vehicles: DbVehicle[] }>('/api/vehicles'),
      apiRequest<{ slots: DbParkingSlot[] }>('/api/slots'),
    ]);
    setReservations(rRes.reservations);
    setUsers(uRes.users);
    setVehicles(vRes.vehicles);
    setSlots(sRes.slots);
  }

  useEffect(() => {
    load();
  }, []);

  const userVehicles = useMemo(
    () => vehicles.filter((v) => v.user_id === Number(form.user_id)),
    [vehicles, form.user_id]
  );

  const filtered = useMemo(() => {
    if (tab === 'upcoming') {
      return reservations.filter((r) => ['Confirmed', 'Active'].includes(r.reservation_status));
    }
    if (tab === 'history') {
      return reservations.filter((r) => ['Completed', 'Cancelled', 'No-Show'].includes(r.reservation_status));
    }
    return reservations;
  }, [reservations, tab]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      onRequireAuth();
      return;
    }
    setError(null);
    try {
      await apiRequest('/api/reservations', { method: 'POST', body: JSON.stringify(form) }, token);
      setFormOpen(false);
      await load();
      onDataChanged();
    } catch (err: any) {
      if (err?.status === 401) onRequireAuth();
      setError(err instanceof Error ? err.message : 'Reservation failed');
    }
  }

  async function updateStatus(id: number, reservation_status: string) {
    if (!token) {
      onRequireAuth();
      return;
    }
    try {
      await apiRequest(`/api/reservations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ reservation_status }) }, token);
      await load();
      onDataChanged();
    } catch (err: any) {
      if (err?.status === 401) onRequireAuth();
      setError(err instanceof Error ? err.message : 'Status update failed');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-white">Reservation Management</h1>
          <p className="text-xs text-slate-400">
            MySQL Table: <span className="font-mono text-cyan-300">RESERVATION</span> · Temporal overlap prevention & transaction locking
          </p>
        </div>
        <button type="button" onClick={() => { setError(null); setFormOpen(true); }} className="btn-neon inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs">
          <Plus className="h-3.5 w-3.5" /> Create Reservation
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">{error}</div>}

      <div className="flex items-center gap-1 rounded-lg bg-slate-900/90 p-1 w-fit text-xs">
        {(['all', 'upcoming', 'history'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 font-medium capitalize ${
              tab === t ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t === 'all' ? 'All Reservations' : t === 'upcoming' ? 'Upcoming & Active' : 'History'}
          </button>
        ))}
      </div>

      <div className="glass-panel overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/70 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">User & Vehicle</th>
                <th className="px-4 py-3 font-medium">Zone & Slot</th>
                <th className="px-4 py-3 font-medium">Booking Window</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filtered.map((r) => (
                <tr key={r.reservation_id} className="hover:bg-cyan-500/5">
                  <td className="px-4 py-3 font-mono text-cyan-300 tabular-nums">#{r.reservation_id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{r.user_name}</div>
                    <div className="font-mono text-[11px] text-purple-300">{r.registration_number}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono font-semibold text-white">{r.slot_number}</div>
                    <div className="text-[11px] text-slate-400">{r.zone_name}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-300 tabular-nums">
                    <div>{r.start_time}</div>
                    <div className="text-slate-500">→ {r.end_time}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        r.reservation_status === 'Active'
                          ? 'text-emerald-400'
                          : r.reservation_status === 'Confirmed'
                          ? 'text-purple-300'
                          : r.reservation_status === 'Cancelled' || r.reservation_status === 'No-Show'
                          ? 'text-red-400'
                          : 'text-slate-400'
                      }
                    >
                      {r.reservation_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {['Confirmed', 'Active'].includes(r.reservation_status) && (
                      <div className="inline-flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateStatus(r.reservation_id, 'Completed')}
                          className="rounded border border-emerald-500/35 px-2.5 py-1 text-[11px] text-emerald-300 hover:bg-emerald-500/15"
                        >
                          Complete
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(r.reservation_id, 'Cancelled')}
                          className="rounded border border-red-500/35 px-2.5 py-1 text-[11px] text-red-300 hover:bg-red-500/15"
                        >
                          Cancel
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
              <h3 className="text-base font-semibold text-white">Create Slot Reservation</h3>
              <button type="button" onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block text-slate-300">User</label>
                <select
                  value={form.user_id}
                  onChange={(e) => {
                    const uid = Number(e.target.value);
                    const firstV = vehicles.find((v) => v.user_id === uid);
                    setForm({ ...form, user_id: uid, vehicle_id: firstV?.vehicle_id || 0 });
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                >
                  {users.map((u) => <option key={u.user_id} value={u.user_id}>{u.full_name} ({u.user_type})</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-slate-300">Vehicle</label>
                <select
                  value={form.vehicle_id}
                  onChange={(e) => setForm({ ...form, vehicle_id: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  required
                >
                  {userVehicles.length === 0 ? (
                    <option value="">No registered vehicles for this user</option>
                  ) : (
                    userVehicles.map((v) => <option key={v.vehicle_id} value={v.vehicle_id}>{v.registration_number} ({v.vehicle_type})</option>)
                  )}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-slate-300">Parking Slot (Availability Verified)</label>
                <select
                  value={form.slot_id}
                  onChange={(e) => setForm({ ...form, slot_id: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                >
                  {slots.map((s) => (
                    <option key={s.slot_id} value={s.slot_id}>
                      {s.slot_number} · {s.zone_name} ({s.status})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-slate-300">Start Time</label>
                  <input type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-white" required />
                </div>
                <div>
                  <label className="mb-1 block text-slate-300">End Time</label>
                  <input type="datetime-local" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-white" required />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300">Cancel</button>
                <button type="submit" disabled={!form.vehicle_id} className="btn-neon rounded-lg px-4 py-2 disabled:opacity-50">Reserve Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface DynamicAllocationProps extends ModuleProps {
  onNavigate: (id: NavSectionId) => void;
}

export function DynamicAllocationModule({ token, onRequireAuth, onDataChanged, onNavigate }: DynamicAllocationProps) {
  const [users, setUsers] = useState<DbUser[]>([]);
  const [vehicles, setVehicles] = useState<DbVehicle[]>([]);
  const [zones, setZones] = useState<DbParkingZone[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number>(3);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(8);
  const [preferredZoneId, setPreferredZoneId] = useState<string>('');
  const [durationHours, setDurationHours] = useState<number>(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  async function load() {
    const [uRes, vRes, zRes] = await Promise.all([
      apiRequest<{ users: DbUser[] }>('/api/users'),
      apiRequest<{ vehicles: DbVehicle[] }>('/api/vehicles'),
      apiRequest<{ zones: DbParkingZone[] }>('/api/zones'),
    ]);
    setUsers(uRes.users);
    setVehicles(vRes.vehicles);
    setZones(zRes.zones);
  }

  useEffect(() => {
    load();
  }, []);

  const userVehicles = useMemo(
    () => vehicles.filter((v) => v.user_id === selectedUserId),
    [vehicles, selectedUserId]
  );

  const activeUser = users.find((u) => u.user_id === selectedUserId);
  const activeVehicle = vehicles.find((v) => v.vehicle_id === selectedVehicleId);
  const requestedZone = preferredZoneId ? zones.find((z) => z.zone_id === Number(preferredZoneId)) : null;

  async function handleAutoAllocate() {
    if (!token) {
      onRequireAuth();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ allocation: any }>(
        '/api/allocate',
        {
          method: 'POST',
          body: JSON.stringify({
            user_id: selectedUserId,
            vehicle_id: selectedVehicleId,
            preferred_zone_id: preferredZoneId ? Number(preferredZoneId) : null,
            duration_hours: durationHours,
          }),
        },
        token
      );
      setResult(res.allocation);
      await load();
      onDataChanged();
    } catch (err: any) {
      if (err?.status === 401) onRequireAuth();
      setError(err instanceof Error ? err.message : 'Allocation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-white">Dynamic Parking Allocation Engine</h1>
          <p className="text-xs text-slate-400">
            Powered by MySQL Stored Procedure <span className="font-mono text-cyan-300">sp_dynamic_allocate_slot</span> +{' '}
            <span className="font-mono text-purple-300">SELECT ... FOR UPDATE</span> row locking
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('concurrency')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3.5 py-2 text-xs font-medium text-purple-200 hover:bg-purple-500/20"
        >
          <Lock className="h-3.5 w-3.5" /> Test Concurrent Race & Rollback
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Request Configurator */}
        <div className="glass-panel rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Allocation Request Parameters</h2>
          <div className="space-y-3 text-xs">
            <div>
              <label className="mb-1 block text-slate-300">1. Identify User</label>
              <select
                value={selectedUserId}
                onChange={(e) => {
                  const uid = Number(e.target.value);
                  setSelectedUserId(uid);
                  const first = vehicles.find((v) => v.user_id === uid);
                  setSelectedVehicleId(first?.vehicle_id || 0);
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              >
                {users.map((u) => <option key={u.user_id} value={u.user_id}>{u.full_name} ({u.user_type})</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-slate-300">2. Select Vehicle</label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              >
                {userVehicles.length === 0 ? (
                  <option value={0}>No vehicles registered for this user</option>
                ) : (
                  userVehicles.map((v) => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      {v.registration_number} · {v.vehicle_type} ({v.brand} {v.model})
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-slate-300">3. Requested Parking Zone</label>
              <select
                value={preferredZoneId}
                onChange={(e) => setPreferredZoneId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              >
                <option value="">Auto-Prioritize Optimal Zone (Lowest Utilization)</option>
                {zones.map((z) => (
                  <option key={z.zone_id} value={z.zone_id}>
                    {z.zone_name} ({z.available_slots ?? 0} free · {z.utilization_pct ?? 0}% used)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-slate-300">4. Duration (Hours)</label>
              <input
                type="number"
                min={1}
                max={24}
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-white"
              />
            </div>

            <button
              type="button"
              onClick={handleAutoAllocate}
              disabled={loading || !selectedVehicleId}
              className="btn-neon mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-xs uppercase tracking-wider disabled:opacity-50"
            >
              <Cpu className="h-4 w-4" />
              {loading ? 'Executing Transaction...' : 'AUTO ALLOCATE SLOT'}
            </button>
          </div>
          {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>}
        </div>

        {/* Live Allocation Output Card */}
        <div className="glass-panel rounded-xl p-5 lg:col-span-2 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-white">Allocation Telemetry & Recommended Slot</h2>
            {result && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> {result.status}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3.5">
              <div className="text-slate-400">User Details</div>
              <div className="mt-1 font-semibold text-white">{activeUser?.full_name || '—'}</div>
              <div className="mt-0.5 text-slate-400">{activeUser?.user_type} · {activeUser?.department}</div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3.5">
              <div className="text-slate-400">Vehicle Details</div>
              <div className="mt-1 font-mono font-semibold text-cyan-300">{activeVehicle?.registration_number || '—'}</div>
              <div className="mt-0.5 text-slate-400">{activeVehicle ? `${activeVehicle.vehicle_type} · ${activeVehicle.brand} ${activeVehicle.model}` : 'No vehicle selected'}</div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3.5">
              <div className="text-slate-400">Requested Zone</div>
              <div className="mt-1 font-semibold text-purple-300">{requestedZone ? requestedZone.zone_name : 'Optimal Auto-Select'}</div>
              <div className="mt-0.5 text-slate-400">{requestedZone ? `${requestedZone.available_slots} slots free` : 'Balances utilization across zones'}</div>
            </div>
          </div>

          {result ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 sm:grid-cols-3 text-xs">
                <div>
                  <div className="text-slate-400">Allocated Parking Slot</div>
                  <div className="mt-1 font-mono text-2xl font-bold text-cyan-300">{result.slot?.slot_number}</div>
                  <div className="text-slate-300">{result.slot?.zone_name}</div>
                </div>
                <div>
                  <div className="text-slate-400">Slot Classification</div>
                  <div className="mt-1 text-base font-semibold text-white">{result.slot?.slot_type}</div>
                  <div className="font-mono text-emerald-400">₹{result.slot?.hourly_rate}/hr · Reservation #{result.reservation_id}</div>
                </div>
                <div>
                  <div className="text-slate-400">Allocation Timestamp</div>
                  <div className="mt-1 font-mono text-sm text-white tabular-nums">{result.timestamp}</div>
                  <div className="mt-1 text-purple-300">{result.message}</div>
                </div>
              </div>

              {Array.isArray(result.steps) && (
                <div className="rounded-lg border border-slate-800 bg-[#070B12] p-4">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                    <CalendarClock className="h-3.5 w-3.5" /> Transactional Execution Trace (InnoDB Row Locking)
                  </div>
                  <ol className="space-y-1.5 font-mono text-[11px] text-slate-300">
                    {result.steps.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 text-center text-xs text-slate-400">
              Select a user and vehicle, then click <span className="font-semibold text-cyan-300">AUTO ALLOCATE SLOT</span> to run the transactional allocation engine.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
