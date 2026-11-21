import React, { useState } from 'react';
import { Calculator, Cpu, Eye, ListTree, Zap } from 'lucide-react';

type AdvTab = 'indexing' | 'views' | 'procedures' | 'functions' | 'triggers';

export function AdvancedDbmsView() {
  const [tab, setTab] = useState<AdvTab>('indexing');
  const [calcMinutes, setCalcMinutes] = useState(195);
  const [calcRate, setCalcRate] = useState(55);

  const computedHours = calcMinutes <= 0 ? 0 : Math.max(1, Math.ceil(calcMinutes / 60));
  const computedFee = Number((computedHours * calcRate).toFixed(2));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-white">Advanced DBMS Concepts (MySQL 8.0+)</h1>
        <p className="text-xs text-slate-400">
          Practical implementation of B-Tree Indexes, Views, Stored Procedures, Deterministic Functions, and Triggers
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-900/90 p-1.5 w-fit text-xs">
        {[
          { id: 'indexing' as const, label: 'A. Indexing & EXPLAIN', icon: ListTree },
          { id: 'views' as const, label: 'B. Views', icon: Eye },
          { id: 'procedures' as const, label: 'C. Stored Procedures', icon: Cpu },
          { id: 'functions' as const, label: 'D. Functions', icon: Calculator },
          { id: 'triggers' as const, label: 'E. Triggers', icon: Zap },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-medium transition-colors ${
                tab === t.id ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'indexing' && (
        <div className="glass-panel rounded-xl p-5 space-y-4 text-xs">
          <h2 className="text-base font-semibold text-cyan-300">Primary, Secondary & Composite B-Tree Indexes</h2>
          <p className="text-slate-300">
            InnoDB organizes every table as a clustered B+Tree on its Primary Key. Secondary and composite indexes store the index columns plus the clustered PK pointer, turning O(N) full table scans into O(log N) range scans.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-[#060A12] p-4 font-mono text-cyan-200">
{`-- Secondary & Composite Indexes in smart_parking_db
CREATE INDEX idx_user_type_status ON USER (user_type, status);
CREATE INDEX idx_slot_zone_status ON PARKING_SLOT (zone_id, status, slot_type);
CREATE INDEX idx_reservation_slot_window ON RESERVATION (slot_id, start_time, end_time, reservation_status);
CREATE INDEX idx_entry_vehicle_time ON ENTRY_LOG (vehicle_id, entry_time);
CREATE INDEX idx_payment_user_status ON PAYMENT (user_id, payment_status, payment_date);

-- Query Execution Plan Verification
EXPLAIN SELECT slot_id, slot_number, hourly_rate
FROM PARKING_SLOT
WHERE zone_id = 2 AND status = 'Available' AND slot_type = 'EV';`}
          </pre>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3.5 font-mono text-[11px] text-emerald-300">
            EXPLAIN Result: type = ref · possible_keys = idx_slot_zone_status · key = idx_slot_zone_status · Extra = Using index condition (0 full table scans)
          </div>
        </div>
      )}

      {tab === 'views' && (
        <div className="glass-panel rounded-xl p-5 space-y-4 text-xs">
          <h2 className="text-base font-semibold text-cyan-300">Database Views (Logical Data Independence & Security)</h2>
          <pre className="overflow-x-auto rounded-lg bg-[#060A12] p-4 font-mono text-cyan-200">
{`-- 1. Current Available Slots View
CREATE VIEW vw_current_available_slots AS
SELECT ps.slot_id, pz.zone_id, pz.zone_name, ps.slot_number, ps.slot_type, ps.hourly_rate
FROM PARKING_SLOT ps
INNER JOIN PARKING_ZONE pz ON ps.zone_id = pz.zone_id
WHERE ps.status = 'Available' AND pz.status = 'Active';

-- 2. Zone Utilization View
CREATE VIEW vw_zone_utilization AS
SELECT pz.zone_id, pz.zone_name, pz.total_capacity,
  SUM(CASE WHEN ps.status = 'Available' THEN 1 ELSE 0 END) AS available_slots,
  SUM(CASE WHEN ps.status = 'Occupied' THEN 1 ELSE 0 END) AS occupied_slots,
  ROUND((SUM(CASE WHEN ps.status IN ('Occupied','Reserved') THEN 1 ELSE 0 END) / NULLIF(COUNT(ps.slot_id),0)) * 100, 2) AS utilization_pct
FROM PARKING_ZONE pz LEFT JOIN PARKING_SLOT ps ON pz.zone_id = ps.zone_id
GROUP BY pz.zone_id, pz.zone_name, pz.total_capacity;`}
          </pre>
        </div>
      )}

      {tab === 'procedures' && (
        <div className="glass-panel rounded-xl p-5 space-y-4 text-xs">
          <h2 className="text-base font-semibold text-cyan-300">Stored Procedures (Transactional Encapsulation)</h2>
          <p className="text-slate-300">
            Four MySQL 8.0+ stored procedures encapsulate atomic operations: <span className="font-mono text-purple-300">sp_dynamic_allocate_slot</span>, <span className="font-mono text-purple-300">sp_release_slot</span>, <span className="font-mono text-purple-300">sp_vehicle_entry</span>, and <span className="font-mono text-purple-300">sp_vehicle_exit</span>.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-[#060A12] p-4 font-mono text-cyan-200">
{`CALL sp_dynamic_allocate_slot(3, 8, NULL, 3, @slot_id, @res_id, @msg);
SELECT @slot_id AS allocated_slot, @res_id AS reservation_id, @msg AS status_message;

CALL sp_vehicle_entry(8, @slot_id, 2);
CALL sp_vehicle_exit(8, @slot_id, 2);
CALL sp_release_slot(@slot_id);`}
          </pre>
        </div>
      )}

      {tab === 'functions' && (
        <div className="glass-panel rounded-xl p-5 space-y-4 text-xs">
          <h2 className="text-base font-semibold text-cyan-300">Stored Functions & Live Fee Simulator</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-slate-300">Parking Duration (Minutes)</label>
              <input type="number" min={0} value={calcMinutes} onChange={(e) => setCalcMinutes(Number(e.target.value))} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-white" />
            </div>
            <div>
              <label className="mb-1 block text-slate-300">Slot Hourly Rate (₹/hr)</label>
              <input type="number" min={0} value={calcRate} onChange={(e) => setCalcRate(Number(e.target.value))} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-white" />
            </div>
            <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3">
              <div className="text-slate-300">fn_calc_parking_fee({calcMinutes}, {calcRate})</div>
              <div className="mt-1 font-mono text-xl font-bold text-cyan-300 tabular-nums">
                ₹{computedFee} <span className="text-xs font-normal text-slate-400">({computedHours} billable hr)</span>
              </div>
            </div>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-[#060A12] p-4 font-mono text-cyan-200">
{`CREATE FUNCTION fn_calc_parking_fee(p_minutes INT, p_hourly_rate DECIMAL(8,2))
RETURNS DECIMAL(10,2) DETERMINISTIC
BEGIN
  IF p_minutes <= 0 THEN RETURN 0.00; END IF;
  RETURN ROUND(GREATEST(1, CEIL(p_minutes / 60)) * p_hourly_rate, 2);
END;`}
          </pre>
        </div>
      )}

      {tab === 'triggers' && (
        <div className="glass-panel rounded-xl p-5 space-y-4 text-xs">
          <h2 className="text-base font-semibold text-cyan-300">Database Triggers (Engine-Level Invariants)</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5">
              <div className="font-mono font-semibold text-cyan-300">trg_validate_reservation_overlap</div>
              <p className="mt-1 text-slate-300">Fires BEFORE INSERT on RESERVATION. Raises SQLSTATE 45000 if any Confirmed/Active booking overlaps [start_time, end_time].</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5">
              <div className="font-mono font-semibold text-purple-300">trg_after_reservation_insert</div>
              <p className="mt-1 text-slate-300">Fires AFTER INSERT on RESERVATION. Synchronizes PARKING_SLOT.status automatically to Reserved or Occupied.</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5">
              <div className="font-mono font-semibold text-amber-300">trg_after_violation_insert</div>
              <p className="mt-1 text-slate-300">Fires AFTER INSERT on VIOLATION. Looks up vehicle owner and spawns a linked Pending PAYMENT fine record.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
