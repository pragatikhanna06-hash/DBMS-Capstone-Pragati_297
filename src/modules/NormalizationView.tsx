import React, { useState } from 'react';
import { ArrowRight, Layers } from 'lucide-react';

type NormStage = 'UNF' | '1NF' | '2NF' | '3NF' | 'BCNF';

const STAGES: Array<{ id: NormStage; label: string; title: string }> = [
  { id: 'UNF', label: 'UNF', title: 'Unnormalized Form' },
  { id: '1NF', label: '1NF', title: 'First Normal Form (Atomic Values)' },
  { id: '2NF', label: '2NF', title: 'Second Normal Form (No Partial Dependencies)' },
  { id: '3NF', label: '3NF', title: 'Third Normal Form (No Transitive Dependencies)' },
  { id: 'BCNF', label: 'BCNF', title: 'Boyce-Codd Normal Form' },
];

export function NormalizationView() {
  const [stage, setStage] = useState<NormStage>('UNF');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-white">Relational Normalization Pipeline (UNF → BCNF)</h1>
        <p className="text-xs text-slate-400">
          Step-by-step elimination of repeating groups, anomalies, partial dependencies, and transitive dependencies
        </p>
      </div>

      {/* Stage Stepper */}
      <div className="flex flex-wrap items-center gap-2">
        {STAGES.map((st, idx) => (
          <React.Fragment key={st.id}>
            <button
              type="button"
              onClick={() => setStage(st.id)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition-colors ${
                stage === st.id
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                  : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{st.label}</span>
            </button>
            {idx < STAGES.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-slate-600" />}
          </React.Fragment>
        ))}
      </div>

      {stage === 'UNF' && (
        <div className="space-y-5">
          <div className="glass-panel rounded-xl p-5 space-y-3 text-xs">
            <h2 className="text-base font-semibold text-cyan-300">Stage 0: Unnormalized Form (UNF) — Raw Campus Parking Sheet</h2>
            <p className="text-slate-300">
              A single flat table stores multi-valued repeating groups (multiple vehicles and multiple reservations inside comma-separated cells), causing severe insertion, update, and deletion anomalies.
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left font-mono text-[11px]">
                <thead className="bg-slate-900 text-cyan-300">
                  <tr>
                    <th className="p-2.5">user_id</th>
                    <th className="p-2.5">full_name</th>
                    <th className="p-2.5">vehicles (multi-valued)</th>
                    <th className="p-2.5">zone_name &amp; location</th>
                    <th className="p-2.5">slot_bookings (repeating)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  <tr>
                    <td className="p-2.5">3</td>
                    <td className="p-2.5">Ananya Sharma</td>
                    <td className="p-2.5 text-red-300">HR26AB1234 (EV), HR26XY9900 (Moto)</td>
                    <td className="p-2.5">Zone B - EV SuperHub, Central Plaza</td>
                    <td className="p-2.5 text-red-300">B-01 (08:30–14:30), A-02 (15:00–17:00)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 pt-2">
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                <div className="font-semibold text-red-300">Insertion Anomaly</div>
                <p className="mt-1 text-slate-400">Cannot register a new parking zone or slot until a user makes a booking in it.</p>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <div className="font-semibold text-amber-300">Update Anomaly</div>
                <p className="mt-1 text-slate-400">Changing Zone B&apos;s hourly rate or location requires updating every historical booking row.</p>
              </div>
              <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
                <div className="font-semibold text-purple-300">Deletion Anomaly</div>
                <p className="mt-1 text-slate-400">Deleting a user&apos;s sole reservation erases all record of the vehicle and parking zone.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {stage === '1NF' && (
        <div className="glass-panel rounded-xl p-5 space-y-4 text-xs">
          <h2 className="text-base font-semibold text-cyan-300">Stage 1: First Normal Form (1NF) — Atomic Attributes & Composite Key</h2>
          <p className="text-slate-300">
            All repeating groups and multi-valued cells are flattened so every attribute holds a single atomic value. Composite primary key: <span className="font-mono text-purple-300">(user_id, registration_number, reservation_id)</span>.
          </p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <div className="mb-2 font-semibold text-white">Functional Dependencies in 1NF</div>
              <ul className="space-y-1 font-mono text-[11px] text-cyan-200">
                <li>user_id → full_name, email, phone, user_type, department</li>
                <li>registration_number → vehicle_type, brand, model, user_id</li>
                <li>slot_id → zone_id, slot_number, slot_type, hourly_rate</li>
                <li>zone_id → zone_name, location, total_capacity</li>
                <li>reservation_id → user_id, vehicle_id, slot_id, start_time, end_time</li>
              </ul>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="mb-2 font-semibold text-amber-300">Remaining Partial Dependencies</div>
              <p className="text-slate-300 leading-relaxed">
                Non-key attributes like <span className="font-mono">full_name</span> depend only on <span className="font-mono">user_id</span> (a proper subset of the composite key), violating 2NF.
              </p>
            </div>
          </div>
        </div>
      )}

      {stage === '2NF' && (
        <div className="glass-panel rounded-xl p-5 space-y-4 text-xs">
          <h2 className="text-base font-semibold text-cyan-300">Stage 2: Second Normal Form (2NF) — Eliminate Partial Dependencies</h2>
          <p className="text-slate-300">
            We decompose the 1NF relation so every non-prime attribute is fully functionally dependent on the entire primary key of its relation:
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 font-mono text-[11px]">
            <div className="rounded-lg border border-cyan-500/30 bg-slate-900/70 p-3">
              <div className="font-bold text-cyan-300">USER (PK: user_id)</div>
              <div className="mt-1 text-slate-300">full_name, email, phone, user_type, department, status</div>
            </div>
            <div className="rounded-lg border border-cyan-500/30 bg-slate-900/70 p-3">
              <div className="font-bold text-cyan-300">VEHICLE (PK: vehicle_id)</div>
              <div className="mt-1 text-slate-300">user_id (FK), registration_number, vehicle_type, brand, model</div>
            </div>
            <div className="rounded-lg border border-cyan-500/30 bg-slate-900/70 p-3">
              <div className="font-bold text-cyan-300">RESERVATION (PK: reservation_id)</div>
              <div className="mt-1 text-slate-300">user_id (FK), vehicle_id (FK), slot_id (FK), start_time, end_time</div>
            </div>
          </div>
          <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3.5">
            <span className="font-semibold text-purple-300">Remaining Transitive Dependency (Violates 3NF):</span>{' '}
            If <span className="font-mono">PARKING_SLOT</span> still embeds <span className="font-mono">zone_name</span> and <span className="font-mono">location</span> via <span className="font-mono">slot_id → zone_id → zone_name, location</span>, updating a zone&apos;s location still causes redundancy.
          </div>
        </div>
      )}

      {stage === '3NF' && (
        <div className="glass-panel rounded-xl p-5 space-y-4 text-xs">
          <h2 className="text-base font-semibold text-cyan-300">Stage 3: Third Normal Form (3NF) — Eliminate Transitive Dependencies</h2>
          <p className="text-slate-300">
            Every transitive dependency <span className="font-mono">X → Y → Z</span> is decomposed into independent relations. Specifically, <span className="font-mono">PARKING_ZONE</span> is separated from <span className="font-mono">PARKING_SLOT</span>, and <span className="font-mono">PAYMENT</span> is separated from <span className="font-mono">RESERVATION</span> and <span className="font-mono">VIOLATION</span>.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
              <div className="mb-2 font-semibold text-red-300">Before 3NF (Transitive Dependency)</div>
              <div className="font-mono text-[11px] text-slate-300">
                SLOT_ZONE(slot_id, slot_number, zone_id, zone_name, location, total_capacity)
                <br />
                FD: slot_id → zone_id → (zone_name, location, total_capacity)
              </div>
            </div>
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="mb-2 font-semibold text-emerald-300">After 3NF (Lossless Join Decomposition)</div>
              <div className="font-mono text-[11px] text-slate-300">
                PARKING_ZONE(<u>zone_id</u>, zone_name, location, zone_type, total_capacity)
                <br />
                PARKING_SLOT(<u>slot_id</u>, zone_id (FK), slot_number, slot_type, status, hourly_rate)
              </div>
            </div>
          </div>
        </div>
      )}

      {stage === 'BCNF' && (
        <div className="glass-panel rounded-xl p-5 space-y-4 text-xs">
          <h2 className="text-base font-semibold text-cyan-300">Stage 4: Boyce-Codd Normal Form (BCNF) — Every Determinant Is a Superkey</h2>
          <p className="text-slate-300">
            In every one of the 10 final tables (<span className="font-mono">USER, VEHICLE, PARKING_ZONE, PARKING_SLOT, RESERVATION, ENTRY_LOG, EXIT_LOG, VISITOR_PASS, VIOLATION, PAYMENT</span>), every non-trivial functional dependency <span className="font-mono">X → Y</span> has <span className="font-mono">X</span> as a superkey (either the surrogate Primary Key or a declared <span className="font-mono">UNIQUE</span> candidate key such as <span className="font-mono">email</span>, <span className="font-mono">registration_number</span>, <span className="font-mono">(zone_id, slot_number)</span>, or <span className="font-mono">transaction_reference</span>).
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5 font-mono text-[11px]">
            {['USER', 'VEHICLE', 'PARKING_ZONE', 'PARKING_SLOT', 'RESERVATION', 'ENTRY_LOG', 'EXIT_LOG', 'VISITOR_PASS', 'VIOLATION', 'PAYMENT'].map((t) => (
              <div key={t} className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-center font-semibold text-cyan-200">
                {t} · BCNF ✓
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
