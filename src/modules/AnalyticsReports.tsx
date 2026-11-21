import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download } from 'lucide-react';
import { apiRequest, exportToCsv, formatCurrency } from '../lib/api';
import type { DbParkingZone } from '../types/dbms';

export function AnalyticsReports() {
  const [zones, setZones] = useState<DbParkingZone[]>([]);
  const [zoneId, setZoneId] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [userType, setUserType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);

  async function load() {
    const params = new URLSearchParams();
    if (zoneId) params.set('zoneId', zoneId);
    if (vehicleType) params.set('vehicleType', vehicleType);
    if (userType) params.set('userType', userType);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);

    const [aRes, zRes] = await Promise.all([
      apiRequest<any>(`/api/analytics?${params.toString()}`),
      apiRequest<{ zones: DbParkingZone[] }>('/api/zones'),
    ]);
    setAnalytics(aRes);
    setZones(zRes.zones);
  }

  useEffect(() => {
    load();
  }, [zoneId, vehicleType, userType, dateFrom, dateTo]);

  function handleExportCsv() {
    if (!analytics?.zoneUtilization) return;
    exportToCsv(
      'smart_parking_zone_analytics.csv',
      analytics.zoneUtilization.map((z: DbParkingZone) => ({
        zone_id: z.zone_id,
        zone_name: z.zone_name,
        zone_type: z.zone_type,
        total_capacity: z.total_capacity,
        available_slots: z.available_slots,
        occupied_slots: z.occupied_slots,
        reserved_slots: z.reserved_slots,
        utilization_pct: z.utilization_pct,
      }))
    );
  }

  const summary = analytics?.summary || {};

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-white">Analytics & DBMS Reports</h1>
          <p className="text-xs text-slate-400">
            Powered by CTEs, window ranking, & filtered aggregate queries with CSV export
          </p>
        </div>
        <button type="button" onClick={handleExportCsv} className="btn-neon inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs">
          <Download className="h-3.5 w-3.5" /> Export Report CSV
        </button>
      </div>

      {/* Filters */}
      <div className="glass-panel grid grid-cols-1 gap-3 rounded-xl p-4 text-xs sm:grid-cols-2 lg:grid-cols-5">
        <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
          <option value="">All Parking Zones</option>
          {zones.map((z) => <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>)}
        </select>
        <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
          <option value="">All Vehicle Categories</option>
          {['Sedan', 'SUV', 'EV', 'Motorcycle', 'Accessible', 'VIP'].map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={userType} onChange={(e) => setUserType(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
          <option value="">All User Categories</option>
          {['Student', 'Employee', 'Resident', 'Admin', 'Security'].map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" />
      </div>

      {/* Summary KPI Row */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        <div className="glass-panel rounded-xl p-4">
          <div className="text-xs text-slate-400">Total Capacity</div>
          <div className="mt-1 font-mono text-xl font-bold text-white tabular-nums">{summary.totalCapacity ?? 0}</div>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="text-xs text-slate-400">Available vs Occupied</div>
          <div className="mt-1 font-mono text-xl font-bold text-cyan-300 tabular-nums">
            {summary.availableSlots ?? 0} / {summary.occupiedSlots ?? 0}
          </div>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="text-xs text-slate-400">Avg Duration</div>
          <div className="mt-1 font-mono text-xl font-bold text-purple-300 tabular-nums">{summary.avgDurationMinutes ?? 0}m</div>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="text-xs text-slate-400">Cancellation Rate</div>
          <div className="mt-1 font-mono text-xl font-bold text-amber-300 tabular-nums">{summary.cancellationRate ?? 0}%</div>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="text-xs text-slate-400">No-Show Bookings</div>
          <div className="mt-1 font-mono text-xl font-bold text-red-400 tabular-nums">{analytics?.noShows?.length ?? 0}</div>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="text-xs text-slate-400">Filtered Revenue</div>
          <div className="mt-1 font-mono text-xl font-bold text-emerald-400 tabular-nums">{formatCurrency(summary.totalRevenue ?? 0)}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="glass-panel rounded-xl p-5">
          <h2 className="mb-3 text-sm font-semibold text-white">Zone Utilization & Active Demand</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.zoneUtilization || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="zone_name" tick={{ fill: '#94A3B8', fontSize: 10 }} tickFormatter={(v) => String(v).split(' - ')[0]} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0F1726', border: '1px solid rgba(0,240,255,0.25)', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="available_slots" name="Available" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="occupied_slots" name="Occupied" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reserved_slots" name="Reserved" fill="#9B5CFF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5">
          <h2 className="mb-3 text-sm font-semibold text-white">Daily Revenue Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.dailyRevenue || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0F1726', border: '1px solid rgba(0,240,255,0.25)', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#00F0FF" strokeWidth={2.5} dot={{ r: 4, fill: '#9B5CFF' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Repeated Violators & No-Show Reservations */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="glass-panel rounded-xl p-5">
          <h2 className="mb-3 text-sm font-semibold text-white">Repeated Violators Report (GROUP BY + HAVING &ge; 2)</h2>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-2">Plate</th>
                <th className="py-2">Owner</th>
                <th className="py-2">Violations</th>
                <th className="py-2 text-right">Penalty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {(analytics?.repeatViolators || []).map((rv: any) => (
                <tr key={rv.registration_number}>
                  <td className="py-2.5 font-mono text-cyan-300">{rv.registration_number}</td>
                  <td className="py-2.5 text-white">{rv.owner_name}</td>
                  <td className="py-2.5 font-mono text-amber-300">{rv.violation_count}</td>
                  <td className="py-2.5 text-right font-mono text-red-400">{formatCurrency(rv.total_penalty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="glass-panel rounded-xl p-5">
          <h2 className="mb-3 text-sm font-semibold text-white">No-Show / Unentered Reservations (NOT EXISTS)</h2>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-2">Res ID</th>
                <th className="py-2">User</th>
                <th className="py-2">Plate</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {(analytics?.noShows || []).map((ns: any) => (
                <tr key={ns.reservation_id}>
                  <td className="py-2.5 font-mono text-cyan-300">#{ns.reservation_id}</td>
                  <td className="py-2.5 text-white">{ns.full_name}</td>
                  <td className="py-2.5 font-mono text-purple-300">{ns.registration_number}</td>
                  <td className="py-2.5 text-amber-300">{ns.reservation_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
