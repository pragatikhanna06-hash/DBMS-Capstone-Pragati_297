import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, Search, Trash2, X } from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { DbUser, DbVehicle, VehicleType } from '../types/dbms';

interface VehicleManagementProps {
  token: string | null;
  onRequireAuth: () => void;
  onDataChanged: () => void;
}

const VEHICLE_TYPES: VehicleType[] = ['Sedan', 'SUV', 'EV', 'Motorcycle', 'Accessible', 'VIP'];

export function VehicleManagement({ token, onRequireAuth, onDataChanged }: VehicleManagementProps) {
  const [vehicles, setVehicles] = useState<DbVehicle[]>([]);
  const [users, setUsers] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DbVehicle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    user_id: 3,
    registration_number: '',
    vehicle_type: 'Sedan' as VehicleType,
    brand: '',
    model: '',
    color: '',
  });

  async function load() {
    setLoading(true);
    try {
      const [vRes, uRes] = await Promise.all([
        apiRequest<{ vehicles: DbVehicle[] }>('/api/vehicles'),
        apiRequest<{ users: DbUser[] }>('/api/users'),
      ]);
      setVehicles(vRes.vehicles);
      setUsers(uRes.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vehicles.filter((v) => {
      if (typeFilter !== 'ALL' && v.vehicle_type !== typeFilter) return false;
      if (!q) return true;
      return (
        v.registration_number.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        (v.owner_name || '').toLowerCase().includes(q)
      );
    });
  }, [vehicles, search, typeFilter]);

  function openCreate() {
    setEditing(null);
    setForm({
      user_id: users[0]?.user_id || 3,
      registration_number: '',
      vehicle_type: 'Sedan',
      brand: '',
      model: '',
      color: '',
    });
    setError(null);
    setFormOpen(true);
  }

  function openEdit(v: DbVehicle) {
    setEditing(v);
    setForm({
      user_id: v.user_id,
      registration_number: v.registration_number,
      vehicle_type: v.vehicle_type,
      brand: v.brand,
      model: v.model,
      color: v.color,
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
        await apiRequest(`/api/vehicles/${editing.vehicle_id}`, { method: 'PUT', body: JSON.stringify(form) }, token);
      } else {
        await apiRequest('/api/vehicles', { method: 'POST', body: JSON.stringify(form) }, token);
      }
      setFormOpen(false);
      await load();
      onDataChanged();
    } catch (err: any) {
      if (err?.status === 401) onRequireAuth();
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  async function handleDelete(v: DbVehicle) {
    if (!token) {
      onRequireAuth();
      return;
    }
    try {
      await apiRequest(`/api/vehicles/${v.vehicle_id}`, { method: 'DELETE' }, token);
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
          <h1 className="font-display text-xl font-bold text-white">Vehicle Management</h1>
          <p className="text-xs text-slate-400">
            MySQL Table: <span className="font-mono text-cyan-300">VEHICLE</span> · Unique registration plate & FK{' '}
            <span className="font-mono text-purple-300">user_id → USER</span>
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-neon inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs">
          <Plus className="h-3.5 w-3.5" /> Register Vehicle
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
          {error}
        </div>
      )}

      <div className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-xl p-3.5">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by registration number, brand, model, or owner..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 py-2 pl-8 pr-3 text-xs text-white focus:border-cyan-400 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-900/90 p-1">
          {['ALL', ...VEHICLE_TYPES].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                typeFilter === t ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t === 'ALL' ? 'All Types' : t}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/70 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Vehicle ID</th>
                <th className="px-4 py-3 font-medium">Registration Plate</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Make & Model</th>
                <th className="px-4 py-3 font-medium">Owner Details</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading vehicles...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No vehicles found.</td></tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.vehicle_id} className="hover:bg-cyan-500/5">
                    <td className="px-4 py-3 font-mono text-cyan-300 tabular-nums">#{v.vehicle_id}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-white">{v.registration_number}</td>
                    <td className="px-4 py-3 text-purple-300">{v.vehicle_type}</td>
                    <td className="px-4 py-3 text-slate-200">
                      {v.brand} {v.model} <span className="text-slate-400">· {v.color}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{v.owner_name}</div>
                      <div className="text-[11px] text-slate-400">{v.owner_type} · {v.owner_email}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button type="button" onClick={() => openEdit(v)} className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-300">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => handleDelete(v)} className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">{editing ? 'Update Vehicle' : 'Register New Vehicle'}</h3>
              <button type="button" onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block text-slate-300">Owner (FK → USER)</label>
                <select
                  value={form.user_id}
                  onChange={(e) => setForm({ ...form, user_id: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                >
                  {users.map((u) => (
                    <option key={u.user_id} value={u.user_id}>{u.full_name} ({u.user_type})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-slate-300">Registration Number (UNIQUE)</label>
                  <input
                    type="text"
                    value={form.registration_number}
                    onChange={(e) => setForm({ ...form, registration_number: e.target.value.toUpperCase() })}
                    placeholder="HR26EV2026"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-white"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-slate-300">Vehicle Type</label>
                  <select
                    value={form.vehicle_type}
                    onChange={(e) => setForm({ ...form, vehicle_type: e.target.value as VehicleType })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  >
                    {VEHICLE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-slate-300">Brand</label>
                  <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" required />
                </div>
                <div>
                  <label className="mb-1 block text-slate-300">Model</label>
                  <input type="text" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" required />
                </div>
                <div>
                  <label className="mb-1 block text-slate-300">Color</label>
                  <input type="text" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" required />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300">Cancel</button>
                <button type="submit" className="btn-neon rounded-lg px-4 py-2">{editing ? 'Update' : 'Register'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
