import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Database, Plus, Search } from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { DbConnectionInfo, MongoParkingEvent } from '../types/dbms';

interface NosqlProps {
  token: string | null;
  onRequireAuth: () => void;
  dbInfo: DbConnectionInfo;
}

export function NosqlExtensionView({ token, onRequireAuth, dbInfo }: NosqlProps) {
  const [events, setEvents] = useState<MongoParkingEvent[]>([]);
  const [aggResults, setAggResults] = useState<Array<{ zone?: string; event_type?: string; _id?: any; count: number }>>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchPlate, setSearchPlate] = useState('');
  const [form, setForm] = useState({
    vehicle_number: 'HR26AB1234',
    event_type: 'GATE_SCAN' as MongoParkingEvent['event_type'],
    zone: 'Zone B - EV SuperHub',
    slot_number: 'B-02',
    device_id: 'ANPR-CAM-04',
    sensor_latency_ms: 14,
  });

  async function load() {
    const res = await apiRequest<{ events: MongoParkingEvent[] }>('/api/nosql/events');
    setEvents(res.events);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchPlate.trim().toLowerCase();
    return events.filter((e) => {
      if (filterType !== 'ALL' && e.event_type !== filterType) return false;
      if (q && !e.vehicle_number.toLowerCase().includes(q) && !e.zone.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [events, filterType, searchPlate]);

  async function handleInsert(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      onRequireAuth();
      return;
    }
    await apiRequest(
      '/api/nosql/events',
      {
        method: 'POST',
        body: JSON.stringify({
          vehicle_number: form.vehicle_number,
          event_type: form.event_type,
          zone: form.zone,
          slot_number: form.slot_number,
          metadata: { device_id: form.device_id, sensor_latency_ms: Number(form.sensor_latency_ms) },
        }),
      },
      token
    );
    await load();
  }

  async function runAggregation() {
    const res = await apiRequest<{ results: any[] }>('/api/nosql/aggregate', { method: 'POST' });
    setAggResults(res.results);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-white">NoSQL Extension — MongoDB Event Telemetry</h1>
          <p className="text-xs text-slate-400">
            Collection: <span className="font-mono text-cyan-300">parking_events</span> · Flexible semi-structured IoT &amp; ANPR gate logs
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs ${
            dbInfo.mongoConnected
              ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
              : 'border-amber-500/35 bg-amber-500/10 text-amber-300'
          }`}
        >
          <Database className="h-3.5 w-3.5" />
          {dbInfo.mongoConnected ? 'MongoDB Live Connected' : 'MongoDB Sample Preview'}
        </span>
      </div>

      {/* Insert & Aggregation */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <form onSubmit={handleInsert} className="glass-panel rounded-xl p-5 space-y-3 text-xs">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4 text-cyan-400" /> db.parking_events.insertOne(...)
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value.toUpperCase() })} placeholder="Plate" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-white" required />
            <select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value as any })} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
              {['ENTRY', 'EXIT', 'ALLOCATION', 'VIOLATION', 'GATE_SCAN', 'EV_CHARGE_START'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input type="text" value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} placeholder="Zone" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" required />
            <input type="text" value={form.slot_number} onChange={(e) => setForm({ ...form, slot_number: e.target.value.toUpperCase() })} placeholder="Slot" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-white" required />
            <input type="text" value={form.device_id} onChange={(e) => setForm({ ...form, device_id: e.target.value })} placeholder="Device ID" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-white" />
          </div>
          <button type="submit" className="btn-neon rounded-lg px-4 py-2">Insert Flexible JSON Document</button>
        </form>

        <div className="glass-panel rounded-xl p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <BarChart3 className="h-4 w-4 text-purple-400" /> Aggregation Pipeline ($group &amp; $sort)
            </div>
            <button type="button" onClick={runAggregation} className="rounded-lg border border-purple-500/40 bg-purple-500/15 px-3 py-1.5 font-semibold text-purple-200 hover:bg-purple-500/25">
              Run Pipeline
            </button>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-[#060A12] p-3 font-mono text-[11px] text-purple-200">
{`db.parking_events.aggregate([
  { $group: { _id: { zone: "$zone", event_type: "$event_type" }, count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])`}
          </pre>
          {aggResults.length > 0 && (
            <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900/70 p-2.5 font-mono text-[11px]">
              {aggResults.map((r, i) => (
                <div key={i} className="flex justify-between py-1 text-slate-200">
                  <span>{r.zone || r._id?.zone} · {r.event_type || r._id?.event_type}</span>
                  <span className="text-cyan-300 font-bold">{r.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Find Filter & Document Viewer */}
      <div className="glass-panel rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input type="text" value={searchPlate} onChange={(e) => setSearchPlate(e.target.value)} placeholder="db.parking_events.find({ vehicle_number / zone })..." className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-8 pr-3 text-white" />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
            <option value="ALL">All Event Types</option>
            {['ENTRY', 'EXIT', 'ALLOCATION', 'VIOLATION', 'GATE_SCAN', 'EV_CHARGE_START'].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((ev) => (
            <pre key={ev.event_id} className="overflow-x-auto rounded-lg border border-slate-800 bg-[#060A12] p-3.5 font-mono text-[11px] text-cyan-200">
              {JSON.stringify(ev, null, 2)}
            </pre>
          ))}
        </div>
      </div>

      {/* MySQL vs MongoDB Comparison */}
      <div className="glass-panel overflow-hidden rounded-xl p-5">
        <h2 className="mb-3 text-sm font-semibold text-white">Polyglot Persistence: MySQL vs MongoDB Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-2 pr-4">Dimension</th>
                <th className="py-2 pr-4 text-cyan-300">MySQL 8.0+ (InnoDB)</th>
                <th className="py-2 text-purple-300">MongoDB (NoSQL Document Store)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-300">
              <tr>
                <td className="py-2.5 pr-4 font-semibold text-white">Primary Role</td>
                <td className="py-2.5 pr-4">Transactional core: Users, Vehicles, Slots, Reservations, Billing</td>
                <td className="py-2.5">High-throughput IoT gate scans, ANPR telemetry, audit streams</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-semibold text-white">Schema &amp; Integrity</td>
                <td className="py-2.5 pr-4">Strict normalized BCNF tables, FK cascades, CHECK constraints</td>
                <td className="py-2.5">Schema-flexible JSON/BSON documents with nested metadata</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-semibold text-white">Concurrency Control</td>
                <td className="py-2.5 pr-4">ACID transactions, SELECT ... FOR UPDATE row-level locks</td>
                <td className="py-2.5">Append-optimized document writes &amp; aggregation pipelines</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-semibold text-white">Query Language</td>
                <td className="py-2.5 pr-4">Declarative SQL (Joins, CTEs, Window Functions, Views)</td>
                <td className="py-2.5">MQL find() filters &amp; multi-stage aggregation pipelines</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
