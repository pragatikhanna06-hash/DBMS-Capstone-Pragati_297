import React, { useState } from 'react';
import { BookOpenCheck, CheckCircle2, PlayCircle, XCircle } from 'lucide-react';
import { apiRequest } from '../lib/api';

interface TestResultItem {
  id: string;
  description: string;
  input: string;
  expected: string;
  actual: string;
  status: 'PASS' | 'FAIL';
}

export function TestingDocsView() {
  const [tab, setTab] = useState<'tests' | 'report'>('tests');
  const [results, setResults] = useState<TestResultItem[] | null>(null);
  const [ranAt, setRanAt] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function runTests() {
    setRunning(true);
    try {
      const res = await apiRequest<{ ranAt: string; results: TestResultItem[] }>('/api/tests/run', { method: 'POST' });
      setResults(res.results);
      setRanAt(res.ranAt);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-white">Testing Suite &amp; Project Documentation</h1>
          <p className="text-xs text-slate-400">
            17 automated DBMS constraint &amp; workflow test cases plus complete academic project report
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-slate-900 p-1 text-xs">
            <button type="button" onClick={() => setTab('tests')} className={`rounded-md px-3 py-1.5 font-medium ${tab === 'tests' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}>
              Test Cases (17)
            </button>
            <button type="button" onClick={() => setTab('report')} className={`rounded-md px-3 py-1.5 font-medium ${tab === 'report' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400'}`}>
              Project Report &amp; Viva
            </button>
          </div>
          {tab === 'tests' && (
            <button type="button" onClick={runTests} disabled={running} className="btn-neon inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs">
              <PlayCircle className="h-3.5 w-3.5" /> {running ? 'Running Suite...' : 'Run All 17 Tests'}
            </button>
          )}
        </div>
      </div>

      {tab === 'tests' ? (
        <div className="glass-panel overflow-hidden rounded-xl">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3 text-xs">
            <span className="font-semibold text-white">Verification Matrix (Constraints, Transactions, RBAC, Lifecycle)</span>
            {ranAt && (
              <span className="font-mono text-emerald-400">
                {results?.filter((r) => r.status === 'PASS').length}/{results?.length} Passed · {new Date(ranAt).toLocaleTimeString()}
              </span>
            )}
          </div>
          {!results ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Click <span className="font-semibold text-cyan-300">Run All 17 Tests</span> to verify live relational constraints, allocation logic, rollback behavior, and RBAC guards.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-900/70 text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Test ID</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Input</th>
                    <th className="px-4 py-3">Expected Output</th>
                    <th className="px-4 py-3">Actual Output</th>
                    <th className="px-4 py-3 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {results.map((tc) => (
                    <tr key={tc.id} className="hover:bg-cyan-500/5">
                      <td className="px-4 py-3 font-mono font-semibold text-cyan-300">{tc.id}</td>
                      <td className="px-4 py-3 font-medium text-white">{tc.description}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-300">{tc.input}</td>
                      <td className="px-4 py-3 text-slate-300">{tc.expected}</td>
                      <td className="px-4 py-3 text-slate-200">{tc.actual}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center gap-1 font-mono font-bold ${tc.status === 'PASS' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {tc.status === 'PASS' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          {tc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 text-xs leading-relaxed text-slate-300">
          <div className="glass-panel rounded-xl p-5 space-y-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
              <BookOpenCheck className="h-4 w-4" /> 1. Abstract &amp; Problem Statement
            </h2>
            <p>
              Urban campuses suffer from fragmented parking registries, manual gate logs, overlapping bay bookings, and concurrent slot allocation race conditions. Project 6 solves this with a normalized MySQL 8.0+ InnoDB relational database coupled with a MongoDB event-log extension and a real-time React + Express control center.
            </p>
          </div>
          <div className="glass-panel rounded-xl p-5 space-y-2">
            <h2 className="text-sm font-semibold text-cyan-300">2. Objectives &amp; Scope</h2>
            <p>
              Model 10 BCNF-normalized entities; eliminate double-booking via <span className="font-mono text-purple-300">SELECT ... FOR UPDATE</span> and overlap triggers; automate duration/fee billing via stored functions; enforce least-privilege RBAC; and surface peak-hour demand through CTEs and window functions.
            </p>
          </div>
          <div className="glass-panel rounded-xl p-5 space-y-2">
            <h2 className="text-sm font-semibold text-purple-300">3. Functional &amp; Non-Functional Requirements</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>CRUD operations across Users, Vehicles, Zones, Slots, Reservations, Passes, Violations, and Payments.</li>
              <li>Dynamic Slot Allocation prioritizing vehicle type (EV, Accessible, VIP) and balanced zone utilization.</li>
              <li>ACID atomicity, sub-100ms indexed lookups, scrypt password hashing, and prepared SQL statements.</li>
            </ul>
          </div>
          <div className="glass-panel rounded-xl p-5 space-y-2">
            <h2 className="text-sm font-semibold text-purple-300">4. Business Rules &amp; Technology Stack</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>Unique user email, unique vehicle registration number, and unique <span className="font-mono">(zone_id, slot_number)</span>.</li>
              <li>Booking windows must satisfy <span className="font-mono">end_time &gt; start_time</span> without overlapping active bookings.</li>
              <li>Stack: React 19, TypeScript, Tailwind CSS, Recharts, Node.js, Express, MySQL 8.0+ (InnoDB), MongoDB.</li>
            </ul>
          </div>
          <div className="glass-panel rounded-xl p-5 space-y-2">
            <h2 className="text-sm font-semibold text-emerald-300">5. Database Design &amp; Implementation</h2>
            <p>
              Implemented in <span className="font-mono text-cyan-300">database/init_mysql.sql</span> with 10 InnoDB tables, 9 composite/secondary indexes, 4 views, 3 deterministic/SQL-data functions, 4 transactional stored procedures, and 3 validation/audit triggers.
            </p>
          </div>
          <div className="glass-panel rounded-xl p-5 space-y-2">
            <h2 className="text-sm font-semibold text-emerald-300">6. Conclusion &amp; Future Enhancements</h2>
            <p>
              The system proves how relational ACID guarantees and NoSQL telemetry work together in smart mobility. Future extensions include automated ANPR camera webhooks, OCPP smart EV charger billing, and predictive ML occupancy forecasting.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
