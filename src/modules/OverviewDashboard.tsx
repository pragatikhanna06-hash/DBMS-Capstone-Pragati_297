import React, { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { RefreshCw } from 'lucide-react';
import { apiRequest, formatCurrency } from '../lib/api';
import type { DbParkingSlot, DbParkingZone, NavSectionId } from '../types/dbms';

interface DashboardPayload {
  dbMode: 'mysql-live' | 'sample-preview';
  kpis: {
    totalUsers: number;
    totalVehicles: number;
    totalZones: number;
    totalSlots: number;
    availableSlots: number;
    occupiedSlots: number;
    reservedSlots: number;
    maintenanceSlots: number;
    activeReservations: number;
    activeVisitorPasses: number;
    totalViolations: number;
    totalRevenue: number;
  };
  occupancyBreakdown: Array<{ name: string; value: number; color: string }>;
  zoneUtilization: DbParkingZone[];
  hourlyDemand: Array<{ hour: string; entries: number }>;
  weeklyTrends: Array<{ day: string; activity: number }>;
  vehicleDistribution: Array<{ name: string; value: number }>;
  violationStatistics: Array<{ name: string; count: number; penalty: number }>;
  slots: DbParkingSlot[];
}

const CHART_COLORS = ['#00F0FF', '#9B5CFF', '#3B82F6', '#10B981', '#F59E0B', '#EC4899'];

const STATUS_STYLE: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  Available: {
    border: 'border-emerald-500/45',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
  },
  Occupied: {
    border: 'border-red-500/45',
    bg: 'bg-red-500/10',
    text: 'text-red-300',
    dot: 'bg-red-400',
  },
  Reserved: {
    border: 'border-purple-500/45',
    bg: 'bg-purple-500/10',
    text: 'text-purple-300',
    dot: 'bg-purple-400',
  },
  Maintenance: {
    border: 'border-amber-500/45',
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
  },
};

export function OverviewDashboard({ onNavigate }: { onNavigate: (id: NavSectionId) => void }) {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<DashboardPayload>('/api/dashboard');
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="glass-panel h-24 animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="glass-panel h-72 animate-pulse rounded-xl" />
          <div className="glass-panel h-72 animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel rounded-xl p-6 text-center">
        <p className="text-sm text-red-400">{error || 'No dashboard data available.'}</p>
        <button type="button" onClick={load} className="btn-neon mt-3 rounded-lg px-4 py-2 text-xs">
          Retry
        </button>
      </div>
    );
  }

  const k = data.kpis;
  const kpiCards = [
    { label: 'Total Registered Users', value: k.totalUsers, accent: 'text-cyan-300', target: 'users' as NavSectionId },
    { label: 'Total Vehicles', value: k.totalVehicles, accent: 'text-purple-300', target: 'vehicles' as NavSectionId },
    { label: 'Total Parking Zones', value: k.totalZones, accent: 'text-blue-300', target: 'zones' as NavSectionId },
    { label: 'Total Parking Slots', value: k.totalSlots, accent: 'text-white', target: 'slots' as NavSectionId },
    { label: 'Available Slots', value: k.availableSlots, accent: 'text-emerald-400', target: 'slots' as NavSectionId },
    { label: 'Occupied Slots', value: k.occupiedSlots, accent: 'text-red-400', target: 'slots' as NavSectionId },
    { label: 'Active Reservations', value: k.activeReservations, accent: 'text-purple-400', target: 'reservations' as NavSectionId },
    { label: 'Active Visitor Passes', value: k.activeVisitorPasses, accent: 'text-cyan-400', target: 'visitors' as NavSectionId },
    { label: 'Total Violations', value: k.totalViolations, accent: 'text-amber-400', target: 'violations' as NavSectionId },
    { label: 'Total Revenue', value: formatCurrency(k.totalRevenue), accent: 'text-emerald-300', target: 'payments' as NavSectionId },
  ];

  // Group slots by zone for Live Parking Status section
  const zoneGroups = data.zoneUtilization.map((z) => ({
    zone: z,
    slots: data.slots.filter((s) => s.zone_id === z.zone_id),
  }));

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-white sm:text-2xl">
            Parking Telemetry & Control Overview
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Data source: {data.dbMode === 'mysql-live' ? 'MySQL 8.0+ Live Relational Database' : 'Sample Preview Dataset (10 InnoDB-modeled tables)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('allocation')}
            className="btn-neon rounded-lg px-4 py-2 text-xs whitespace-nowrap"
          >
            Dynamic Allocation
          </button>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/25 bg-slate-900/80 px-3 py-2 text-xs font-medium text-cyan-300 hover:bg-slate-800 whitespace-nowrap"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* 10 KPI Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        {kpiCards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => onNavigate(card.target)}
            className="glass-panel glass-panel-hover rounded-xl p-4 text-left"
          >
            <div className="truncate text-xs text-slate-400">{card.label}</div>
            <div className={`mt-2 font-mono text-2xl font-bold tabular-nums ${card.accent}`}>
              {card.value}
            </div>
          </button>
        ))}
      </div>

      {/* 6 Charts Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {/* 1. Parking Occupancy Doughnut Chart */}
        <div className="glass-panel rounded-xl p-5">
          <h2 className="mb-1 text-sm font-semibold text-white">1. Parking Occupancy Breakdown</h2>
          <p className="mb-3 text-xs text-slate-400">Live distribution across {k.totalSlots} total slots</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.occupancyBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={82}
                  paddingAngle={3}
                >
                  {data.occupancyBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="rgba(10,15,24,0.8)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F1726', border: '1px solid rgba(0,240,255,0.25)', borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Zone-wise Utilization Bar Chart */}
        <div className="glass-panel rounded-xl p-5">
          <h2 className="mb-1 text-sm font-semibold text-white">2. Zone-wise Utilization (%)</h2>
          <p className="mb-3 text-xs text-slate-400">Occupied & reserved ratio per zone</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.zoneUtilization}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="zone_name" tick={{ fill: '#94A3B8', fontSize: 10 }} tickFormatter={(v) => String(v).split(' - ')[0]} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F1726', border: '1px solid rgba(0,240,255,0.25)', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="utilization_pct" name="Utilization %" fill="#00F0FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Hourly Parking Demand Line Chart */}
        <div className="glass-panel rounded-xl p-5">
          <h2 className="mb-1 text-sm font-semibold text-white">3. Hourly Parking Demand</h2>
          <p className="mb-3 text-xs text-slate-400">Gate entry counts grouped by hour</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.hourlyDemand}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="hour" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F1726', border: '1px solid rgba(0,240,255,0.25)', borderRadius: 8, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="entries" name="Vehicle Entries" stroke="#00F0FF" strokeWidth={2.5} dot={{ r: 3, fill: '#9B5CFF' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Weekly Parking Trends */}
        <div className="glass-panel rounded-xl p-5">
          <h2 className="mb-1 text-sm font-semibold text-white">4. Weekly Parking Trends</h2>
          <p className="mb-3 text-xs text-slate-400">Reservations & entry volume by weekday</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.weeklyTrends}>
                <defs>
                  <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9B5CFF" stopOpacity={0.55} />
                    <stop offset="95%" stopColor="#9B5CFF" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="day" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F1726', border: '1px solid rgba(155,92,255,0.3)', borderRadius: 8, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="activity" name="Sessions" stroke="#9B5CFF" fill="url(#purpleGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Vehicle Type Distribution */}
        <div className="glass-panel rounded-xl p-5">
          <h2 className="mb-1 text-sm font-semibold text-white">5. Vehicle Type Distribution</h2>
          <p className="mb-3 text-xs text-slate-400">Registered fleet breakdown by category</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.vehicleDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#CBD5E1', fontSize: 11 }} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F1726', border: '1px solid rgba(0,240,255,0.25)', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="value" name="Vehicles" radius={[0, 6, 6, 0]}>
                  {data.vehicleDistribution.map((entry, idx) => (
                    <Cell key={entry.name} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Violation Statistics */}
        <div className="glass-panel rounded-xl p-5">
          <h2 className="mb-1 text-sm font-semibold text-white">6. Violation Statistics</h2>
          <p className="mb-3 text-xs text-slate-400">Citations & penalty totals by violation type</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.violationStatistics}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 9 }} tickFormatter={(v) => String(v).split(' ')[0]} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F1726', border: '1px solid rgba(155,92,255,0.3)', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="count" name="Violations" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Parking Status Matrix */}
      <div className="glass-panel rounded-xl p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">Live Parking Slot Status Matrix</h2>
            <p className="text-xs text-slate-400">Real-time bay availability across all parking zones</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5 text-emerald-300">
              <span className="h-2.5 w-2.5 rounded-xs bg-emerald-400" /> Available ({k.availableSlots})
            </span>
            <span className="inline-flex items-center gap-1.5 text-red-300">
              <span className="h-2.5 w-2.5 rounded-xs bg-red-400" /> Occupied ({k.occupiedSlots})
            </span>
            <span className="inline-flex items-center gap-1.5 text-purple-300">
              <span className="h-2.5 w-2.5 rounded-xs bg-purple-400" /> Reserved ({k.reservedSlots})
            </span>
            <span className="inline-flex items-center gap-1.5 text-amber-300">
              <span className="h-2.5 w-2.5 rounded-xs bg-amber-400" /> Maintenance ({k.maintenanceSlots})
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {zoneGroups.map(({ zone, slots }) => (
            <div key={zone.zone_id} className="border-t border-slate-800/80 pt-4 first:border-t-0 first:pt-0">
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold text-cyan-300">
                  {zone.zone_name} <span className="text-slate-400 font-normal">· {zone.location}</span>
                </div>
                <div className="font-mono text-xs text-slate-400 tabular-nums">
                  {zone.available_slots} free / {slots.length} configured · {zone.utilization_pct}% utilized
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                {slots.map((slot) => {
                  const st = STATUS_STYLE[slot.status] || STATUS_STYLE.Available;
                  return (
                    <button
                      key={slot.slot_id}
                      type="button"
                      onClick={() => onNavigate('slots')}
                      className={`rounded-lg border ${st.border} ${st.bg} p-2.5 text-left transition-transform hover:scale-[1.02]`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-white">{slot.slot_number}</span>
                        <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                      </div>
                      <div className={`mt-1 text-[11px] font-medium ${st.text}`}>{slot.status}</div>
                      <div className="mt-0.5 text-[10px] text-slate-400">{slot.slot_type} · ₹{slot.hourly_rate}/h</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
