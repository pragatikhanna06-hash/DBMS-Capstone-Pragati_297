import React, { useEffect, useMemo, useState } from 'react';
import { Car, Edit2, Eye, Plus, Search, Trash2, X } from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { DbUser, DbVehicle, UserStatus, UserType } from '../types/dbms';

interface UserManagementProps {
  token: string | null;
  onRequireAuth: () => void;
  onDataChanged: () => void;
}

const USER_TYPES: UserType[] = ['Student', 'Employee', 'Resident', 'Admin', 'Security'];
const USER_STATUSES: UserStatus[] = ['Active', 'Suspended', 'Inactive'];

export function UserManagement({ token, onRequireAuth, onDataChanged }: UserManagementProps) {
  const [users, setUsers] = useState<DbUser[]>([]);
  const [vehicles, setVehicles] = useState<DbVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<DbUser | null>(null);
  const [editingUser, setEditingUser] = useState<DbUser | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DbUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    user_type: 'Student' as UserType,
    department: '',
    status: 'Active' as UserStatus,
  });

  async function load() {
    setLoading(true);
    try {
      const data = await apiRequest<{ users: DbUser[]; vehicles: DbVehicle[] }>('/api/users');
      setUsers(data.users);
      setVehicles(data.vehicles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (typeFilter !== 'ALL' && u.user_type !== typeFilter) return false;
      if (!q) return true;
      return (
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q)
      );
    });
  }, [users, search, typeFilter]);

  function openCreate() {
    setEditingUser(null);
    setForm({ full_name: '', email: '', phone: '', user_type: 'Student', department: '', status: 'Active' });
    setError(null);
    setFormOpen(true);
  }

  function openEdit(u: DbUser) {
    setEditingUser(u);
    setForm({
      full_name: u.full_name,
      email: u.email,
      phone: u.phone,
      user_type: u.user_type,
      department: u.department,
      status: u.status,
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
      if (editingUser) {
        await apiRequest(`/api/users/${editingUser.user_id}`, { method: 'PUT', body: JSON.stringify(form) }, token);
      } else {
        await apiRequest('/api/users', { method: 'POST', body: JSON.stringify(form) }, token);
      }
      setFormOpen(false);
      await load();
      onDataChanged();
    } catch (err: any) {
      if (err?.status === 401) onRequireAuth();
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    if (!token) {
      onRequireAuth();
      return;
    }
    try {
      await apiRequest(`/api/users/${deleteTarget.user_id}`, { method: 'DELETE' }, token);
      setDeleteTarget(null);
      if (selectedUser?.user_id === deleteTarget.user_id) setSelectedUser(null);
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
          <h1 className="font-display text-xl font-bold text-white">User Management</h1>
          <p className="text-xs text-slate-400">
            MySQL Table: <span className="font-mono text-cyan-300">USER</span> · Unique email constraint & cascading vehicle ownership
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-neon inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add User
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Search & Filter */}
      <div className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-xl p-3.5">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, or department..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 py-2 pl-8 pr-3 text-xs text-white focus:border-cyan-400 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-900/90 p-1">
          {['ALL', ...USER_TYPES].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                typeFilter === t ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t === 'ALL' ? 'All Roles' : t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="glass-panel overflow-hidden rounded-xl xl:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/70 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Full Name & Contact</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading users...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">No users match your filter criteria.</td>
                  </tr>
                ) : (
                  filtered.map((u) => {
                    const userVehicles = vehicles.filter((v) => v.user_id === u.user_id);
                    return (
                      <tr key={u.user_id} className="hover:bg-cyan-500/5">
                        <td className="px-4 py-3 font-mono text-cyan-300 tabular-nums">#{u.user_id}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{u.full_name}</div>
                          <div className="text-[11px] text-slate-400">{u.email} · {u.phone}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-200">{u.user_type}</td>
                        <td className="px-4 py-3 text-slate-300">{u.department}</td>
                        <td className="px-4 py-3">
                          <span className={u.status === 'Active' ? 'text-emerald-400' : u.status === 'Suspended' ? 'text-red-400' : 'text-amber-400'}>
                            {u.status}
                          </span>
                          <span className="ml-1.5 text-[11px] text-slate-500">({userVehicles.length} veh)</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedUser(u)}
                              className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-300"
                              title="View details & vehicles"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(u)}
                              className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-purple-300"
                              title="Edit user"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(u)}
                              className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400"
                              title="Delete user"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Details & Registered Vehicles Panel */}
        <div className="glass-panel rounded-xl p-5">
          <h2 className="mb-3 text-sm font-semibold text-white">User Profile & Registered Vehicles</h2>
          {selectedUser ? (
            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-800 pb-3">
                <div className="text-base font-semibold text-cyan-300">{selectedUser.full_name}</div>
                <div className="mt-1 text-slate-400">{selectedUser.email}</div>
                <div className="mt-1 text-slate-300">
                  {selectedUser.user_type} · {selectedUser.department} · {selectedUser.status}
                </div>
                <div className="mt-1 font-mono text-[11px] text-slate-500">Created: {selectedUser.created_at}</div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-1.5 font-semibold text-slate-200">
                  <Car className="h-3.5 w-3.5 text-purple-400" />
                  Registered Vehicles
                </div>
                {vehicles.filter((v) => v.user_id === selectedUser.user_id).length === 0 ? (
                  <p className="text-slate-500">No vehicles registered under this user.</p>
                ) : (
                  <div className="space-y-2">
                    {vehicles
                      .filter((v) => v.user_id === selectedUser.user_id)
                      .map((v) => (
                        <div key={v.vehicle_id} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-semibold text-cyan-300">{v.registration_number}</span>
                            <span className="text-purple-300">{v.vehicle_type}</span>
                          </div>
                          <div className="mt-1 text-slate-400">
                            {v.brand} {v.model} · {v.color}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Select the eye icon on any user row to inspect their profile and foreign-key linked vehicles.</p>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">{editingUser ? 'Edit User' : 'Register New User'}</h3>
              <button type="button" onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block text-slate-300">Full Name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-slate-300">Email (UNIQUE)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-slate-300">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-slate-300">User Type</label>
                  <select
                    value={form.user_type}
                    onChange={(e) => setForm({ ...form, user_type: e.target.value as UserType })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  >
                    {USER_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-slate-300">Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-slate-300">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as UserStatus })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  >
                    {USER_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300">
                  Cancel
                </button>
                <button type="submit" className="btn-neon rounded-lg px-4 py-2">
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm rounded-xl p-6 text-xs">
            <h3 className="text-base font-semibold text-white">Confirm User Deletion</h3>
            <p className="mt-2 text-slate-300">
              Delete <span className="font-semibold text-cyan-300">{deleteTarget.full_name}</span>? Due to{' '}
              <span className="font-mono text-purple-300">ON DELETE CASCADE</span>, all vehicles owned by this user will also be removed.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300">
                Cancel
              </button>
              <button type="button" onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-500">
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
