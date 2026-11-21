import React, { useEffect, useState } from 'react';
import { AlertTriangle, Lock, Play, RotateCcw } from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { DbConnectionInfo, DbParkingSlot } from '../types/dbms';

interface ConcurrencyProps {
  token: string | null;
  onRequireAuth: () => void;
  dbInfo: DbConnectionInfo;
  onDataChanged: () => void;
}

export function ConcurrencySimulator({ token, onRequireAuth, dbInfo, onDataChanged }: ConcurrencyProps) {
  const [slots, setSlots] = useState<DbParkingSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number>(2);
  const [running, setRunning] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<{ slots: DbParkingSlot[] }>('/api/slots').then((r) => setSlots(r.slots));
  }, []);

  async function runScenario(scenario: 'two-session-race' | 'rollback-failure') {
    if (!token) {
      onRequireAuth();
      return;
    }
    setRunning(true);
    setError(null);
    try {
      const res = await apiRequest<any>(
        '/api/concurrency/simulate',
        { method: 'POST', body: JSON.stringify({ scenario, slot_id: selectedSlotId }) },
        token
      );
      setSimResult(res);
      onDataChanged();
    } catch (err: any) {
      if (err?.status === 401) onRequireAuth();
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-white">TWO-SESSION CONCURRENCY SIMULATOR</h1>
          <p className="text-xs text-slate-400">
            Demonstrates InnoDB Row-Level Locking (<span className="font-mono text-cyan-300">SELECT ... FOR UPDATE</span>), ACID isolation, and failure ROLLBACK
          </p>
        </div>
        <span
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
            dbInfo.mysqlConnected
              ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
              : 'border-amber-500/35 bg-amber-500/10 text-amber-300'
          }`}
        >
          {dbInfo.mysqlConnected ? 'Live Dual-Connection MySQL Mode' : 'Conceptual Simulation (MySQL Disconnected)'}
        </span>
      </div>

      {/* Controls */}
      <div className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-xl p-4 text-xs">
        <div className="flex items-center gap-3">
          <label className="text-slate-300 font-medium">Target Contended Slot:</label>
          <select
            value={selectedSlotId}
            onChange={(e) => setSelectedSlotId(Number(e.target.value))}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-white"
          >
            {slots.map((s) => (
              <option key={s.slot_id} value={s.slot_id}>
                {s.slot_number} · {s.zone_name} ({s.status})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={running}
            onClick={() => runScenario('two-session-race')}
            className="btn-neon inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs"
          >
            <Play className="h-3.5 w-3.5" /> Run Concurrent Two-Session Race
          </button>
          <button
            type="button"
            disabled={running}
            onClick={() => runScenario('rollback-failure')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Run Error &amp; ROLLBACK Scenario
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>}

      {/* Two-Session Side-by-Side Visualization */}
      {simResult ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-cyan-300">
              Execution Mode:{' '}
              {simResult.simulationMode === 'mysql-live-dual-session'
                ? 'Live MySQL 8.0+ Dual Pool Connections (connA & connB)'
                : 'Conceptual Simulation (Non-MySQL Fallback)'}
            </span>
            <span className="font-mono text-slate-300">
              Final Slot State: <strong className="text-white">{simResult.finalSlotState?.slot_number}</strong> →{' '}
              <strong className="text-purple-300">{simResult.finalSlotState?.status}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {['Session A', 'Session B'].map((sess) => {
              const sessSteps = (simResult.steps || []).filter((st: any) => st.session === sess);
              return (
                <div key={sess} className="glass-panel rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className={`font-display text-sm font-bold ${sess === 'Session A' ? 'text-cyan-300' : 'text-purple-300'}`}>
                      {sess}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">InnoDB REPEATABLE READ</span>
                  </div>
                  {sessSteps.length === 0 ? (
                    <p className="text-xs text-slate-500">Single-session failure rollback scenario executed on Session A.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {sessSteps.map((st: any, idx: number) => (
                        <div key={idx} className="rounded-lg border border-slate-800 bg-[#060A12] p-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] font-semibold text-emerald-300">{st.state}</span>
                            <span className="font-mono text-[10px] text-slate-500">Step {idx + 1}</span>
                          </div>
                          <pre className="mt-1.5 overflow-x-auto font-mono text-[11px] text-cyan-200">{st.sql}</pre>
                          <div className="mt-1 text-[11px] text-slate-400">{st.detail}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-xl p-6 text-center text-xs text-slate-400">
          Choose a slot and click <span className="text-cyan-300 font-semibold">Run Concurrent Two-Session Race</span> or{' '}
          <span className="text-red-300 font-semibold">Run Error &amp; ROLLBACK Scenario</span> to inspect locking and rollback behavior.
        </div>
      )}

      {/* ACID, Isolation & Anomalies Reference */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 text-xs">
        <div className="glass-panel rounded-xl p-4">
          <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-cyan-300">
            <Lock className="h-3.5 w-3.5" /> ACID Properties
          </div>
          <p className="text-slate-300 leading-relaxed">
            <strong>Atomicity:</strong> Slot update &amp; reservation commit together or roll back. <strong>Consistency:</strong> CHECK &amp; FK invariants hold. <strong>Isolation:</strong> FOR UPDATE prevents double-booking. <strong>Durability:</strong> InnoDB redo logs persist commits.
          </p>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="mb-1.5 font-semibold text-purple-300">Read Phenomena</div>
          <ul className="space-y-1 text-slate-300">
            <li><strong>Dirty Read:</strong> Reading uncommitted slot writes (prevented by Read Committed+).</li>
            <li><strong>Non-Repeatable Read:</strong> Row changes mid-txn (prevented by Repeatable Read MVCC).</li>
            <li><strong>Phantom Read:</strong> New range rows appear (prevented by InnoDB Next-Key Gap Locks).</li>
          </ul>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="mb-1.5 font-semibold text-emerald-300">Row Locking &amp; Isolation</div>
          <p className="text-slate-300 leading-relaxed">
            MySQL InnoDB defaults to <span className="font-mono">REPEATABLE READ</span>. Using <span className="font-mono text-cyan-200">SELECT ... FOR UPDATE</span> acquires an exclusive X-lock on only the target slot row without locking the whole table.
          </p>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" /> Deadlock Handling
          </div>
          <p className="text-slate-300 leading-relaxed">
            InnoDB detects cyclic wait-for graphs automatically, rolls back the smaller transaction (<span className="font-mono">ER_LOCK_DEADLOCK 1213</span>), and our stored procedure orders lock acquisition consistently by <span className="font-mono">slot_id</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
