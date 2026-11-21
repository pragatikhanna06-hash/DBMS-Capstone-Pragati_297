import React, { useState } from 'react';
import { Key, Link2, ShieldAlert, Table2 } from 'lucide-react';

interface ColumnSpec {
  name: string;
  type: string;
  nullable: boolean;
  key?: 'PK' | 'FK' | 'UQ';
  references?: string;
  defaultVal?: string;
}

interface TableSpec {
  name: string;
  engine: string;
  purpose: string;
  columns: ColumnSpec[];
  checks: string[];
  indexes: string[];
  relationships: string[];
}

const SCHEMA_TABLES: TableSpec[] = [
  {
    name: 'USER',
    engine: 'InnoDB',
    purpose: 'Stores registered campus members, administrators, and gate security personnel.',
    columns: [
      { name: 'user_id', type: 'INT AUTO_INCREMENT', nullable: false, key: 'PK' },
      { name: 'full_name', type: 'VARCHAR(120)', nullable: false },
      { name: 'email', type: 'VARCHAR(160)', nullable: false, key: 'UQ' },
      { name: 'phone', type: 'VARCHAR(20)', nullable: false },
      { name: 'user_type', type: "ENUM('Student','Employee','Resident','Admin','Security')", nullable: false },
      { name: 'department', type: 'VARCHAR(100)', nullable: false },
      { name: 'created_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP' },
      { name: 'status', type: "ENUM('Active','Suspended','Inactive')", nullable: false, defaultVal: "'Active'" },
    ],
    checks: ['chk_user_phone: CHAR_LENGTH(phone) >= 7', 'uq_user_email: UNIQUE (email)'],
    indexes: ['PRIMARY (user_id)', 'uq_user_email (email)', 'idx_user_type_status (user_type, status)'],
    relationships: ['1:M → VEHICLE.user_id', '1:M → RESERVATION.user_id', '1:M → VISITOR_PASS.host_user_id', '1:M → PAYMENT.user_id'],
  },
  {
    name: 'VEHICLE',
    engine: 'InnoDB',
    purpose: 'Registered user vehicles linked via foreign key with unique license plate enforcement.',
    columns: [
      { name: 'vehicle_id', type: 'INT AUTO_INCREMENT', nullable: false, key: 'PK' },
      { name: 'user_id', type: 'INT', nullable: false, key: 'FK', references: 'USER(user_id) ON DELETE CASCADE' },
      { name: 'registration_number', type: 'VARCHAR(24)', nullable: false, key: 'UQ' },
      { name: 'vehicle_type', type: "ENUM('Sedan','SUV','EV','Motorcycle','Accessible','VIP')", nullable: false },
      { name: 'brand', type: 'VARCHAR(60)', nullable: false },
      { name: 'model', type: 'VARCHAR(60)', nullable: false },
      { name: 'color', type: 'VARCHAR(40)', nullable: false },
      { name: 'created_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP' },
    ],
    checks: ['uq_vehicle_reg: UNIQUE (registration_number)'],
    indexes: ['PRIMARY (vehicle_id)', 'uq_vehicle_reg (registration_number)', 'idx_vehicle_user (user_id)'],
    relationships: ['M:1 → USER.user_id', '1:M → RESERVATION.vehicle_id', '1:M → ENTRY_LOG.vehicle_id', '1:M → EXIT_LOG.vehicle_id', '1:M → VIOLATION.vehicle_id'],
  },
  {
    name: 'PARKING_ZONE',
    engine: 'InnoDB',
    purpose: 'Logical parking decks/zones grouped by permit type and geographic block.',
    columns: [
      { name: 'zone_id', type: 'INT AUTO_INCREMENT', nullable: false, key: 'PK' },
      { name: 'zone_name', type: 'VARCHAR(80)', nullable: false, key: 'UQ' },
      { name: 'location', type: 'VARCHAR(150)', nullable: false },
      { name: 'zone_type', type: "ENUM('General','EV Charging','Faculty & Staff','Resident','VIP','Visitor')", nullable: false },
      { name: 'total_capacity', type: 'INT', nullable: false },
      { name: 'description', type: 'VARCHAR(255)', nullable: true },
      { name: 'status', type: "ENUM('Active','Full','Maintenance')", nullable: false, defaultVal: "'Active'" },
    ],
    checks: ['chk_zone_capacity: total_capacity > 0', 'uq_zone_name: UNIQUE (zone_name)'],
    indexes: ['PRIMARY (zone_id)', 'uq_zone_name (zone_name)'],
    relationships: ['1:M → PARKING_SLOT.zone_id', '1:M → VISITOR_PASS.zone_id'],
  },
  {
    name: 'PARKING_SLOT',
    engine: 'InnoDB',
    purpose: 'Individual parking bays supporting row-level FOR UPDATE locking and composite uniqueness.',
    columns: [
      { name: 'slot_id', type: 'INT AUTO_INCREMENT', nullable: false, key: 'PK' },
      { name: 'zone_id', type: 'INT', nullable: false, key: 'FK', references: 'PARKING_ZONE(zone_id) ON DELETE CASCADE' },
      { name: 'slot_number', type: 'VARCHAR(20)', nullable: false, key: 'UQ' },
      { name: 'slot_type', type: "ENUM('Regular','EV','Accessible','VIP')", nullable: false, defaultVal: "'Regular'" },
      { name: 'status', type: "ENUM('Available','Occupied','Reserved','Maintenance')", nullable: false, defaultVal: "'Available'" },
      { name: 'hourly_rate', type: 'DECIMAL(8,2)', nullable: false, defaultVal: '30.00' },
    ],
    checks: ['uq_zone_slot_number: UNIQUE (zone_id, slot_number)', 'chk_slot_rate: hourly_rate >= 0'],
    indexes: ['PRIMARY (slot_id)', 'uq_zone_slot_number (zone_id, slot_number)', 'idx_slot_zone_status (zone_id, status, slot_type)'],
    relationships: ['M:1 → PARKING_ZONE.zone_id', '1:M → RESERVATION.slot_id', '1:M → ENTRY_LOG.slot_id'],
  },
  {
    name: 'RESERVATION',
    engine: 'InnoDB',
    purpose: 'Time-bounded slot bookings with trigger-enforced overlap prevention.',
    columns: [
      { name: 'reservation_id', type: 'INT AUTO_INCREMENT', nullable: false, key: 'PK' },
      { name: 'user_id', type: 'INT', nullable: false, key: 'FK', references: 'USER(user_id) ON DELETE CASCADE' },
      { name: 'vehicle_id', type: 'INT', nullable: false, key: 'FK', references: 'VEHICLE(vehicle_id) ON DELETE CASCADE' },
      { name: 'slot_id', type: 'INT', nullable: false, key: 'FK', references: 'PARKING_SLOT(slot_id) ON DELETE RESTRICT' },
      { name: 'start_time', type: 'DATETIME', nullable: false },
      { name: 'end_time', type: 'DATETIME', nullable: false },
      { name: 'reservation_status', type: "ENUM('Confirmed','Active','Completed','Cancelled','No-Show')", nullable: false },
      { name: 'created_at', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP' },
    ],
    checks: ['chk_reservation_window: end_time > start_time'],
    indexes: ['PRIMARY (reservation_id)', 'idx_reservation_slot_window (slot_id, start_time, end_time, reservation_status)', 'idx_reservation_user_status (user_id, reservation_status)'],
    relationships: ['M:1 → USER', 'M:1 → VEHICLE', 'M:1 → PARKING_SLOT', '1:0..M → PAYMENT.reservation_id'],
  },
  {
    name: 'ENTRY_LOG',
    engine: 'InnoDB',
    purpose: 'Records gate entry scans verified by security personnel.',
    columns: [
      { name: 'entry_id', type: 'INT AUTO_INCREMENT', nullable: false, key: 'PK' },
      { name: 'vehicle_id', type: 'INT', nullable: false, key: 'FK', references: 'VEHICLE(vehicle_id) ON DELETE CASCADE' },
      { name: 'slot_id', type: 'INT', nullable: false, key: 'FK', references: 'PARKING_SLOT(slot_id) ON DELETE RESTRICT' },
      { name: 'entry_time', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP' },
      { name: 'security_id', type: 'INT', nullable: false, key: 'FK', references: 'USER(user_id) ON DELETE RESTRICT' },
      { name: 'entry_status', type: "ENUM('Entered','Denied','Flagged')", nullable: false },
    ],
    checks: ['NOT NULL on vehicle_id, slot_id, security_id'],
    indexes: ['PRIMARY (entry_id)', 'idx_entry_vehicle_time (vehicle_id, entry_time)'],
    relationships: ['M:1 → VEHICLE', 'M:1 → PARKING_SLOT', 'M:1 → USER (Security)'],
  },
  {
    name: 'EXIT_LOG',
    engine: 'InnoDB',
    purpose: 'Records exit timestamps, calculated stay duration (minutes), and total fee.',
    columns: [
      { name: 'exit_id', type: 'INT AUTO_INCREMENT', nullable: false, key: 'PK' },
      { name: 'vehicle_id', type: 'INT', nullable: false, key: 'FK', references: 'VEHICLE(vehicle_id) ON DELETE CASCADE' },
      { name: 'slot_id', type: 'INT', nullable: false, key: 'FK', references: 'PARKING_SLOT(slot_id) ON DELETE RESTRICT' },
      { name: 'exit_time', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP' },
      { name: 'parking_duration', type: 'INT', nullable: false },
      { name: 'total_amount', type: 'DECIMAL(10,2)', nullable: false },
      { name: 'security_id', type: 'INT', nullable: false, key: 'FK', references: 'USER(user_id) ON DELETE RESTRICT' },
    ],
    checks: ['chk_exit_duration: parking_duration >= 0', 'chk_exit_amount: total_amount >= 0'],
    indexes: ['PRIMARY (exit_id)', 'idx_exit_vehicle_time (vehicle_id, exit_time)'],
    relationships: ['M:1 → VEHICLE', 'M:1 → PARKING_SLOT', 'M:1 → USER (Security)'],
  },
  {
    name: 'VISITOR_PASS',
    engine: 'InnoDB',
    purpose: 'Time-limited guest passes sponsored by campus hosts with optional pre-assigned bay.',
    columns: [
      { name: 'pass_id', type: 'INT AUTO_INCREMENT', nullable: false, key: 'PK' },
      { name: 'visitor_name', type: 'VARCHAR(120)', nullable: false },
      { name: 'visitor_phone', type: 'VARCHAR(20)', nullable: false },
      { name: 'vehicle_number', type: 'VARCHAR(24)', nullable: false },
      { name: 'host_user_id', type: 'INT', nullable: false, key: 'FK', references: 'USER(user_id) ON DELETE CASCADE' },
      { name: 'zone_id', type: 'INT', nullable: false, key: 'FK', references: 'PARKING_ZONE(zone_id) ON DELETE RESTRICT' },
      { name: 'slot_id', type: 'INT', nullable: true, key: 'FK', references: 'PARKING_SLOT(slot_id) ON DELETE SET NULL' },
      { name: 'valid_from', type: 'DATETIME', nullable: false },
      { name: 'valid_until', type: 'DATETIME', nullable: false },
      { name: 'pass_status', type: "ENUM('Pending','Approved','Rejected','Expired')", nullable: false },
    ],
    checks: ['chk_pass_validity: valid_until > valid_from'],
    indexes: ['PRIMARY (pass_id)'],
    relationships: ['M:1 → USER (Host)', 'M:1 → PARKING_ZONE', '0..M:1 → PARKING_SLOT'],
  },
  {
    name: 'VIOLATION',
    engine: 'InnoDB',
    purpose: 'Tracks parking infractions and automatically spawns pending penalties via trigger.',
    columns: [
      { name: 'violation_id', type: 'INT AUTO_INCREMENT', nullable: false, key: 'PK' },
      { name: 'vehicle_id', type: 'INT', nullable: false, key: 'FK', references: 'VEHICLE(vehicle_id) ON DELETE CASCADE' },
      { name: 'slot_id', type: 'INT', nullable: false, key: 'FK', references: 'PARKING_SLOT(slot_id) ON DELETE RESTRICT' },
      { name: 'violation_type', type: 'ENUM(...5 categories)', nullable: false },
      { name: 'description', type: 'VARCHAR(255)', nullable: false },
      { name: 'violation_time', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP' },
      { name: 'penalty_amount', type: 'DECIMAL(8,2)', nullable: false },
      { name: 'violation_status', type: "ENUM('Unpaid','Paid','Disputed','Waived')", nullable: false },
    ],
    checks: ['chk_penalty_amount: penalty_amount >= 0'],
    indexes: ['PRIMARY (violation_id)', 'idx_violation_vehicle_status (vehicle_id, violation_status)'],
    relationships: ['M:1 → VEHICLE', 'M:1 → PARKING_SLOT', '1:0..M → PAYMENT.violation_id'],
  },
  {
    name: 'PAYMENT',
    engine: 'InnoDB',
    purpose: 'Financial ledger unifying parking reservation fees and violation penalty settlements.',
    columns: [
      { name: 'payment_id', type: 'INT AUTO_INCREMENT', nullable: false, key: 'PK' },
      { name: 'user_id', type: 'INT', nullable: false, key: 'FK', references: 'USER(user_id) ON DELETE CASCADE' },
      { name: 'reservation_id', type: 'INT', nullable: true, key: 'FK', references: 'RESERVATION(reservation_id) ON DELETE SET NULL' },
      { name: 'violation_id', type: 'INT', nullable: true, key: 'FK', references: 'VIOLATION(violation_id) ON DELETE SET NULL' },
      { name: 'amount', type: 'DECIMAL(10,2)', nullable: false },
      { name: 'payment_method', type: "ENUM('UPI','Card','Campus Wallet','NetBanking','Cash')", nullable: false },
      { name: 'payment_status', type: "ENUM('Paid','Pending','Failed','Refunded')", nullable: false },
      { name: 'payment_date', type: 'DATETIME', nullable: false, defaultVal: 'CURRENT_TIMESTAMP' },
      { name: 'transaction_reference', type: 'VARCHAR(64)', nullable: false, key: 'UQ' },
    ],
    checks: ['chk_payment_amount: amount >= 0', 'uq_payment_ref: UNIQUE (transaction_reference)'],
    indexes: ['PRIMARY (payment_id)', 'uq_payment_ref (transaction_reference)', 'idx_payment_user_status (user_id, payment_status, payment_date)'],
    relationships: ['M:1 → USER', '0..M:1 → RESERVATION', '0..M:1 → VIOLATION'],
  },
];

export function DatabaseSchema() {
  const [selectedName, setSelectedName] = useState<string>('USER');
  const active = SCHEMA_TABLES.find((t) => t.name === selectedName) || SCHEMA_TABLES[0];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-white">Relational Database Schema (MySQL 8.0+ InnoDB)</h1>
        <p className="text-xs text-slate-400">
          10 normalized BCNF/3NF tables with referential integrity actions, composite indexes, and CHECK constraints
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="glass-panel rounded-xl p-3 lg:col-span-4 space-y-1.5">
          {SCHEMA_TABLES.map((t, i) => (
            <button
              key={t.name}
              type="button"
              onClick={() => setSelectedName(t.name)}
              className={`flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-left text-xs transition-colors ${
                active.name === t.name
                  ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200'
                  : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-cyan-500/30'
              }`}
            >
              <span className="flex items-center gap-2 font-mono font-semibold">
                <Table2 className="h-3.5 w-3.5 text-cyan-400" />
                {String(i + 1).padStart(2, '0')}. {t.name}
              </span>
              <span className="text-[11px] text-slate-400">{t.columns.length} cols</span>
            </button>
          ))}
        </div>

        <div className="glass-panel rounded-xl p-5 lg:col-span-8 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-mono text-lg font-bold text-cyan-300">{active.name}</h2>
              <span className="font-mono text-xs text-purple-300">Engine: {active.engine} · utf8mb4</span>
            </div>
            <p className="mt-1 text-xs text-slate-300">{active.purpose}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/70 text-slate-400">
                <tr>
                  <th className="px-3 py-2">Key</th>
                  <th className="px-3 py-2">Column Name</th>
                  <th className="px-3 py-2">MySQL Data Type</th>
                  <th className="px-3 py-2">Nullable</th>
                  <th className="px-3 py-2">Reference / Default</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-mono">
                {active.columns.map((c) => (
                  <tr key={c.name} className="hover:bg-cyan-500/5">
                    <td className="px-3 py-2.5">
                      {c.key === 'PK' ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-cyan-300"><Key className="h-3 w-3" /> PK</span>
                      ) : c.key === 'FK' ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-purple-300"><Link2 className="h-3 w-3" /> FK</span>
                      ) : c.key === 'UQ' ? (
                        <span className="font-semibold text-emerald-300">UQ</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-white">{c.name}</td>
                    <td className="px-3 py-2.5 text-slate-300">{c.type}</td>
                    <td className="px-3 py-2.5 text-slate-400">{c.nullable ? 'NULL' : 'NOT NULL'}</td>
                    <td className="px-3 py-2.5 text-[11px] text-purple-200">{c.references || c.defaultVal || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5">
              <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-amber-300">
                <ShieldAlert className="h-3.5 w-3.5" /> CHECK & UNIQUE
              </div>
              <ul className="space-y-1 font-mono text-[11px] text-slate-300">
                {active.checks.map((ck) => <li key={ck}>{ck}</li>)}
              </ul>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5">
              <div className="mb-1.5 font-semibold text-cyan-300">Indexes</div>
              <ul className="space-y-1 font-mono text-[11px] text-slate-300">
                {active.indexes.map((ix) => <li key={ix}>{ix}</li>)}
              </ul>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5">
              <div className="mb-1.5 font-semibold text-purple-300">Relationships</div>
              <ul className="space-y-1 font-mono text-[11px] text-slate-300">
                {active.relationships.map((rl) => <li key={rl}>{rl}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
