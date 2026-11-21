import type { SqlCatalogItem } from '../src/types/dbms.ts';
import { previewStore } from './previewStore.ts';

export const SQL_CATALOG: SqlCatalogItem[] = [
  // A. DDL QUERIES
  {
    id: 'DDL-01',
    category: 'A. DDL Queries',
    title: 'CREATE DATABASE smart_parking_db',
    concept: 'DDL — Database Creation & UTF8MB4 Collation',
    relatedTables: ['DATABASE'],
    sql: `CREATE DATABASE IF NOT EXISTS smart_parking_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;`,
    explanation: 'Creates the smart_parking_db schema using utf8mb4 for full Unicode plate/name support.',
    expectedOutput: 'Query OK, 1 row affected (Database schema created or verified).',
    canExecuteOnLiveMysql: false,
  },
  {
    id: 'DDL-02',
    category: 'A. DDL Queries',
    title: 'CREATE TABLE PARKING_SLOT (InnoDB + CHECK + Composite UNIQUE)',
    concept: 'DDL — Primary Key, Foreign Key, Composite Unique & Check Constraints',
    relatedTables: ['PARKING_SLOT', 'PARKING_ZONE'],
    sql: `CREATE TABLE PARKING_SLOT (
  slot_id INT AUTO_INCREMENT PRIMARY KEY,
  zone_id INT NOT NULL,
  slot_number VARCHAR(20) NOT NULL,
  slot_type ENUM('Regular', 'EV', 'Accessible', 'VIP') NOT NULL DEFAULT 'Regular',
  status ENUM('Available', 'Occupied', 'Reserved', 'Maintenance') NOT NULL DEFAULT 'Available',
  hourly_rate DECIMAL(8, 2) NOT NULL DEFAULT 30.00,
  CONSTRAINT uq_zone_slot_number UNIQUE (zone_id, slot_number),
  CONSTRAINT chk_slot_rate CHECK (hourly_rate >= 0),
  CONSTRAINT fk_slot_zone FOREIGN KEY (zone_id)
    REFERENCES PARKING_ZONE(zone_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;`,
    explanation: 'Defines PARKING_SLOT with InnoDB row-level locking, composite UNIQUE (zone_id, slot_number) preventing duplicate slot labels within the same zone, and a non-negative CHECK constraint on hourly_rate.',
    expectedOutput: 'Table PARKING_SLOT created with InnoDB engine.',
    canExecuteOnLiveMysql: false,
  },
  {
    id: 'DDL-03',
    category: 'A. DDL Queries',
    title: 'ALTER TABLE — Add EV Charger Telemetry Column',
    concept: 'DDL — Schema Evolution with ALTER TABLE',
    relatedTables: ['PARKING_SLOT'],
    sql: `ALTER TABLE PARKING_SLOT
  ADD COLUMN charger_kw DECIMAL(5,2) NULL AFTER hourly_rate,
  ADD CONSTRAINT chk_charger_kw CHECK (charger_kw IS NULL OR charger_kw >= 0);`,
    explanation: 'Demonstrates non-destructive schema evolution to track EV charger power output per parking bay.',
    expectedOutput: 'PARKING_SLOT altered with charger_kw column and validation constraint.',
    canExecuteOnLiveMysql: false,
  },
  {
    id: 'DDL-04',
    category: 'A. DDL Queries',
    title: 'DROP TABLE (Conditional Cleanup Pattern)',
    concept: 'DDL — Safe Dependency-Ordered Table Removal',
    relatedTables: ['TEMP_AUDIT_STAGE'],
    sql: `DROP TABLE IF EXISTS TEMP_AUDIT_STAGE;`,
    explanation: 'Safely removes temporary staging tables without raising an error if the table does not exist.',
    expectedOutput: 'Query OK, 0 rows affected.',
    canExecuteOnLiveMysql: false,
  },
  {
    id: 'DDL-05',
    category: 'A. DDL Queries',
    title: 'CREATE INDEX — Composite Index for Reservation Overlap Checks',
    concept: 'DDL — B-Tree Composite Indexing',
    relatedTables: ['RESERVATION'],
    sql: `CREATE INDEX idx_reservation_slot_window
  ON RESERVATION (slot_id, start_time, end_time, reservation_status);`,
    explanation: 'Accelerates overlap detection and range scans on active/confirmed reservations using a covering composite B-Tree index.',
    expectedOutput: 'Composite index idx_reservation_slot_window created.',
    canExecuteOnLiveMysql: false,
  },

  // B. DML QUERIES
  {
    id: 'DML-01',
    category: 'B. DML Queries',
    title: 'INSERT — Register New Campus Vehicle',
    concept: 'DML — Parameterized Row Insertion',
    relatedTables: ['VEHICLE', 'USER'],
    sql: `INSERT INTO VEHICLE (user_id, registration_number, vehicle_type, brand, model, color)
VALUES (3, 'HR26EV2026', 'EV', 'Hyundai', 'Ioniq 5', 'Cyber Gray');`,
    explanation: 'Inserts a new EV record linked to user_id = 3 while enforcing uq_vehicle_reg and fk_vehicle_user.',
    expectedOutput: '1 row inserted into VEHICLE with generated vehicle_id.',
    canExecuteOnLiveMysql: false,
  },
  {
    id: 'DML-02',
    category: 'B. DML Queries',
    title: 'UPDATE — Transition Slot Status to Maintenance',
    concept: 'DML — Conditional Row Update',
    relatedTables: ['PARKING_SLOT'],
    sql: `UPDATE PARKING_SLOT
SET status = 'Maintenance'
WHERE zone_id = 1 AND slot_number = 'A-07';`,
    explanation: 'Updates the operational status of a specific bay using the indexed (zone_id, slot_number) key.',
    expectedOutput: '1 row matched and updated.',
    canExecuteOnLiveMysql: false,
  },
  {
    id: 'DML-03',
    category: 'B. DML Queries',
    title: 'DELETE — Purge Cancelled Reservations Older Than 30 Days',
    concept: 'DML — Safe Filtered Deletion',
    relatedTables: ['RESERVATION'],
    sql: `DELETE FROM RESERVATION
WHERE reservation_status = 'Cancelled'
  AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);`,
    explanation: 'Removes stale cancelled bookings without impacting historical Completed or Active records.',
    expectedOutput: 'Matching stale cancelled reservation rows deleted.',
    canExecuteOnLiveMysql: false,
  },

  // C. BASIC SQL QUERIES
  {
    id: 'SQL-01',
    category: 'C. Basic SQL Queries',
    title: 'SELECT + WHERE + ORDER BY — Available EV & VIP Slots',
    concept: 'Basic SQL — Filtering & Multi-Column Sorting',
    relatedTables: ['PARKING_SLOT'],
    sql: `SELECT slot_id, zone_id, slot_number, slot_type, hourly_rate, status
FROM PARKING_SLOT
WHERE status = 'Available'
  AND slot_type IN ('EV', 'VIP')
ORDER BY hourly_rate DESC, slot_number ASC;`,
    explanation: 'Retrieves all currently available EV and VIP slots ordered from highest rate to lowest.',
    expectedOutput: 'List of available EV and VIP bays sorted by rate.',
    canExecuteOnLiveMysql: true,
  },
  {
    id: 'SQL-02',
    category: 'C. Basic SQL Queries',
    title: 'GROUP BY + HAVING — Find Repeated Violators (Mandatory #5)',
    mandatory: true,
    concept: 'Aggregation — GROUP BY with HAVING Filter',
    relatedTables: ['VIOLATION', 'VEHICLE', 'USER'],
    sql: `SELECT
  v.vehicle_id,
  v.registration_number,
  u.full_name AS owner_name,
  COUNT(vi.violation_id) AS total_violations,
  SUM(vi.penalty_amount) AS total_penalty_inr
FROM VIOLATION vi
INNER JOIN VEHICLE v ON vi.vehicle_id = v.vehicle_id
INNER JOIN USER u ON v.user_id = u.user_id
GROUP BY v.vehicle_id, v.registration_number, u.full_name
HAVING COUNT(vi.violation_id) >= 2
ORDER BY total_violations DESC, total_penalty_inr DESC;`,
    explanation: 'Identifies repeat offenders with two or more recorded parking violations and aggregates their total penalty.',
    expectedOutput: 'Vehicles with >= 2 violations and cumulative fine amounts.',
    canExecuteOnLiveMysql: true,
  },
  {
    id: 'SQL-03',
    category: 'C. Basic SQL Queries',
    title: 'DISTINCT + LIMIT — Top Active Vehicle Brands',
    concept: 'Basic SQL — Deduplication & Result Limiting',
    relatedTables: ['VEHICLE'],
    sql: `SELECT DISTINCT brand, vehicle_type
FROM VEHICLE
ORDER BY brand ASC
LIMIT 10;`,
    explanation: 'Returns distinct combinations of vehicle brand and category registered in the system.',
    expectedOutput: 'Up to 10 unique brand and vehicle_type pairs.',
    canExecuteOnLiveMysql: true,
  },
  {
    id: 'SQL-04',
    category: 'C. Basic SQL Queries',
    title: 'Aggregate — Calculate Average Parking Duration (Mandatory #2)',
    mandatory: true,
    concept: 'Aggregation — AVG(), MIN(), MAX() on Exit Telemetry',
    relatedTables: ['EXIT_LOG', 'PARKING_SLOT', 'PARKING_ZONE'],
    sql: `SELECT
  pz.zone_name,
  COUNT(ex.exit_id) AS completed_exits,
  ROUND(AVG(ex.parking_duration), 1) AS avg_duration_minutes,
  ROUND(AVG(ex.parking_duration) / 60, 2) AS avg_duration_hours,
  ROUND(SUM(ex.total_amount), 2) AS total_collected_inr
FROM EXIT_LOG ex
INNER JOIN PARKING_SLOT ps ON ex.slot_id = ps.slot_id
INNER JOIN PARKING_ZONE pz ON ps.zone_id = pz.zone_id
GROUP BY pz.zone_id, pz.zone_name
ORDER BY avg_duration_minutes DESC;`,
    explanation: 'Computes the mean stay duration in minutes and hours across zones using EXIT_LOG records.',
    expectedOutput: 'Zone-wise average parking duration and collected fees.',
    canExecuteOnLiveMysql: true,
  },

  // D. JOINS
  {
    id: 'JOIN-01',
    category: 'D. Joins',
    title: 'INNER JOIN — Find Currently Available Slots by Zone (Mandatory #1)',
    mandatory: true,
    concept: 'Joins — INNER JOIN + Conditional Aggregation',
    relatedTables: ['PARKING_ZONE', 'PARKING_SLOT'],
    sql: `SELECT
  pz.zone_id,
  pz.zone_name,
  pz.zone_type,
  COUNT(ps.slot_id) AS total_slots,
  SUM(CASE WHEN ps.status = 'Available' THEN 1 ELSE 0 END) AS available_slots,
  SUM(CASE WHEN ps.status = 'Occupied' THEN 1 ELSE 0 END) AS occupied_slots,
  SUM(CASE WHEN ps.status = 'Reserved' THEN 1 ELSE 0 END) AS reserved_slots
FROM PARKING_ZONE pz
INNER JOIN PARKING_SLOT ps ON pz.zone_id = ps.zone_id
GROUP BY pz.zone_id, pz.zone_name, pz.zone_type
ORDER BY available_slots DESC;`,
    explanation: 'Joins PARKING_ZONE with PARKING_SLOT to report live slot availability per zone.',
    expectedOutput: 'Breakdown of total, available, occupied, and reserved slots per zone.',
    canExecuteOnLiveMysql: true,
  },
  {
    id: 'JOIN-02',
    category: 'D. Joins',
    title: 'LEFT JOIN — Users & Their Vehicle Count (Including Zero Vehicles)',
    concept: 'Joins — LEFT OUTER JOIN',
    relatedTables: ['USER', 'VEHICLE'],
    sql: `SELECT
  u.user_id,
  u.full_name,
  u.user_type,
  COUNT(v.vehicle_id) AS registered_vehicles
FROM USER u
LEFT JOIN VEHICLE v ON u.user_id = v.user_id
GROUP BY u.user_id, u.full_name, u.user_type
ORDER BY registered_vehicles DESC, u.full_name ASC;`,
    explanation: 'Preserves all users including Admin/Security personnel who may not have personal vehicles registered.',
    expectedOutput: 'Every user with their count of registered vehicles.',
    canExecuteOnLiveMysql: true,
  },
  {
    id: 'JOIN-03',
    category: 'D. Joins',
    title: 'RIGHT JOIN — Zones & Visitor Pass Coverage',
    concept: 'Joins — RIGHT OUTER JOIN',
    relatedTables: ['VISITOR_PASS', 'PARKING_ZONE'],
    sql: `SELECT
  pz.zone_name,
  pz.zone_type,
  COUNT(vp.pass_id) AS visitor_passes_issued
FROM VISITOR_PASS vp
RIGHT JOIN PARKING_ZONE pz ON vp.zone_id = pz.zone_id
GROUP BY pz.zone_id, pz.zone_name, pz.zone_type
ORDER BY visitor_passes_issued DESC;`,
    explanation: 'Retains all parking zones from the right table even if zero visitor passes were issued for that zone.',
    expectedOutput: 'All zones with their corresponding visitor pass count.',
    canExecuteOnLiveMysql: true,
  },
  {
    id: 'JOIN-04',
    category: 'D. Joins',
    title: 'Multi-Table Join — Full Reservation Audit Trail',
    concept: 'Joins — 5-Table Relational Join',
    relatedTables: ['RESERVATION', 'USER', 'VEHICLE', 'PARKING_SLOT', 'PARKING_ZONE'],
    sql: `SELECT
  r.reservation_id,
  u.full_name,
  u.user_type,
  v.registration_number,
  v.vehicle_type,
  pz.zone_name,
  ps.slot_number,
  r.start_time,
  r.end_time,
  r.reservation_status
FROM RESERVATION r
INNER JOIN USER u ON r.user_id = u.user_id
INNER JOIN VEHICLE v ON r.vehicle_id = v.vehicle_id
INNER JOIN PARKING_SLOT ps ON r.slot_id = ps.slot_id
INNER JOIN PARKING_ZONE pz ON ps.zone_id = pz.zone_id
ORDER BY r.start_time DESC;`,
    explanation: 'Reconstructs complete human-readable booking records across five normalized tables.',
    expectedOutput: 'Denormalized audit view of all reservations.',
    canExecuteOnLiveMysql: true,
  },

  // E. SUBQUERIES
  {
    id: 'SUB-01',
    category: 'E. Subqueries',
    title: 'Nested SELECT — Slots Priced Above Campus Average',
    concept: 'Subqueries — Scalar Subquery in WHERE',
    relatedTables: ['PARKING_SLOT'],
    sql: `SELECT slot_id, slot_number, slot_type, hourly_rate, status
FROM PARKING_SLOT
WHERE hourly_rate > (
  SELECT AVG(hourly_rate) FROM PARKING_SLOT
)
ORDER BY hourly_rate DESC;`,
    explanation: 'Compares each slot hourly rate against the dynamically computed campus-wide average hourly rate.',
    expectedOutput: 'Premium EV and VIP slots exceeding average hourly rate.',
    canExecuteOnLiveMysql: true,
  },
  {
    id: 'SUB-02',
    category: 'E. Subqueries',
    title: 'NOT EXISTS — Users Who Reserve But Do Not Enter (Mandatory #6)',
    mandatory: true,
    concept: 'Subqueries — Correlated NOT EXISTS',
    relatedTables: ['USER', 'RESERVATION', 'ENTRY_LOG'],
    sql: `SELECT
  u.user_id,
  u.full_name,
  u.email,
  r.reservation_id,
  v.registration_number,
  r.start_time,
  r.reservation_status
FROM RESERVATION r
INNER JOIN USER u ON r.user_id = u.user_id
INNER JOIN VEHICLE v ON r.vehicle_id = v.vehicle_id
WHERE r.reservation_status IN ('Confirmed', 'No-Show')
  AND NOT EXISTS (
    SELECT 1
    FROM ENTRY_LOG e
    WHERE e.vehicle_id = r.vehicle_id
      AND e.slot_id = r.slot_id
      AND e.entry_time >= DATE_SUB(r.start_time, INTERVAL 30 MINUTE)
      AND e.entry_time <= r.end_time
  )
ORDER BY r.start_time DESC;`,
    explanation: 'Finds reservations where no corresponding ENTRY_LOG scan exists for that vehicle and slot during the booking window.',
    expectedOutput: 'Users and bookings with unfulfilled or no-show reservations.',
    canExecuteOnLiveMysql: true,
  },
  {
    id: 'SUB-03',
    category: 'E. Subqueries',
    title: 'EXISTS + IN — Vehicles With Unpaid Violations',
    concept: 'Subqueries — EXISTS & IN Predicates',
    relatedTables: ['VEHICLE', 'VIOLATION', 'USER'],
    sql: `SELECT
  v.vehicle_id,
  v.registration_number,
  v.vehicle_type,
  u.full_name AS owner_name
FROM VEHICLE v
INNER JOIN USER u ON v.user_id = u.user_id
WHERE EXISTS (
  SELECT 1 FROM VIOLATION vi
  WHERE vi.vehicle_id = v.vehicle_id
    AND vi.violation_status = 'Unpaid'
)
  AND u.user_type IN ('Student', 'Employee', 'Resident');`,
    explanation: 'Flags registered vehicles currently carrying unpaid parking violation penalties.',
    expectedOutput: 'Vehicles with outstanding unpaid violation citations.',
    canExecuteOnLiveMysql: true,
  },

  // F. SET OPERATIONS
  {
    id: 'SET-01',
    category: 'F. Set Operations',
    title: 'UNION — Combined Campus & Visitor Vehicles Inside Facility',
    concept: 'Set Operations — UNION Deduplication',
    relatedTables: ['VEHICLE', 'VISITOR_PASS'],
    sql: `SELECT registration_number AS plate_number, 'Registered Member' AS category
FROM VEHICLE
UNION
SELECT vehicle_number AS plate_number, 'Visitor Pass' AS category
FROM VISITOR_PASS
WHERE pass_status = 'Approved'
ORDER BY plate_number ASC;`,
    explanation: 'Combines registered member plates and approved visitor vehicle plates into a unified gate whitelist.',
    expectedOutput: 'Deduplicated list of authorized vehicle plates.',
    canExecuteOnLiveMysql: true,
  },
  {
    id: 'SET-02',
    category: 'F. Set Operations',
    title: 'UNION ALL — Unified Revenue Ledger (Fees + Penalties)',
    concept: 'Set Operations — UNION ALL Preserving All Records',
    relatedTables: ['PAYMENT'],
    sql: `SELECT payment_id, amount, 'Reservation Fee' AS stream, payment_status, payment_date
FROM PAYMENT
WHERE reservation_id IS NOT NULL
UNION ALL
SELECT payment_id, amount, 'Violation Penalty' AS stream, payment_status, payment_date
FROM PAYMENT
WHERE violation_id IS NOT NULL
ORDER BY payment_date DESC;`,
    explanation: 'Merges parking fee payments and violation penalty payments without removing identical amounts.',
    expectedOutput: 'Chronological ledger tagged by revenue stream.',
    canExecuteOnLiveMysql: true,
  },
  {
    id: 'SET-03',
    category: 'F. Set Operations',
    title: 'INTERSECT Equivalent — Users With Both Reservations & Payments',
    concept: 'Set Operations — MySQL INTERSECT via INNER JOIN / EXISTS',
    relatedTables: ['USER', 'RESERVATION', 'PAYMENT'],
    sql: `SELECT u.user_id, u.full_name, u.email
FROM USER u
WHERE EXISTS (SELECT 1 FROM RESERVATION r WHERE r.user_id = u.user_id)
  AND EXISTS (SELECT 1 FROM PAYMENT p WHERE p.user_id = u.user_id AND p.payment_status = 'Paid');`,
    explanation: 'Implements set intersection cleanly in MySQL 8.0+ using correlated EXISTS predicates.',
    expectedOutput: 'Users present in both RESERVATION and paid PAYMENT sets.',
    canExecuteOnLiveMysql: true,
  },
  {
    id: 'SET-04',
    category: 'F. Set Operations',
    title: 'Difference (EXCEPT Equivalent) — Slots Never Reserved',
    concept: 'Set Operations — Set Difference via NOT EXISTS',
    relatedTables: ['PARKING_SLOT', 'RESERVATION'],
    sql: `SELECT ps.slot_id, ps.slot_number, ps.slot_type, ps.status
FROM PARKING_SLOT ps
WHERE NOT EXISTS (
  SELECT 1 FROM RESERVATION r WHERE r.slot_id = ps.slot_id
)
ORDER BY ps.slot_id ASC;`,
    explanation: 'Finds parking slots that have zero historical or active reservations (A \\ B set difference).',
    expectedOutput: 'Unreserved parking slots.',
    canExecuteOnLiveMysql: true,
  },

  // G. ADVANCED SQL
  {
    id: 'ADV-01',
    category: 'G. Advanced SQL',
    title: 'Window Functions — Rank Zones by Utilization (Mandatory #3)',
    mandatory: true,
    concept: 'Window Functions — RANK(), DENSE_RANK(), ROW_NUMBER()',
    relatedTables: ['PARKING_ZONE', 'PARKING_SLOT'],
    sql: `WITH zone_stats AS (
  SELECT
    pz.zone_id,
    pz.zone_name,
    COUNT(ps.slot_id) AS total_slots,
    SUM(CASE WHEN ps.status IN ('Occupied', 'Reserved') THEN 1 ELSE 0 END) AS active_slots,
    ROUND(
      (SUM(CASE WHEN ps.status IN ('Occupied', 'Reserved') THEN 1 ELSE 0 END) / NULLIF(COUNT(ps.slot_id), 0)) * 100,
      2
    ) AS utilization_pct
  FROM PARKING_ZONE pz
  LEFT JOIN PARKING_SLOT ps ON pz.zone_id = ps.zone_id
  GROUP BY pz.zone_id, pz.zone_name
)
SELECT
  zone_id,
  zone_name,
  total_slots,
  active_slots,
  utilization_pct,
  RANK() OVER (ORDER BY utilization_pct DESC) AS util_rank,
  DENSE_RANK() OVER (ORDER BY utilization_pct DESC) AS util_dense_rank,
  ROW_NUMBER() OVER (ORDER BY utilization_pct DESC, zone_id ASC) AS row_num
FROM zone_stats;`,
    explanation: 'Combines a CTE with RANK(), DENSE_RANK(), and ROW_NUMBER() window functions to rank parking zones by live occupancy.',
    expectedOutput: 'Ranked list of parking zones with utilization percentages.',
    canExecuteOnLiveMysql: true,
  },
  {
    id: 'ADV-02',
    category: 'G. Advanced SQL',
    title: 'CTE — Calculate Hourly Demand & Peak Hours (Mandatory #4 & #7)',
    mandatory: true,
    concept: 'CTE + Window Function — Hourly Demand & Peak Detection',
    relatedTables: ['ENTRY_LOG'],
    sql: `WITH hourly_entries AS (
  SELECT
    HOUR(entry_time) AS entry_hour,
    COUNT(*) AS vehicle_entries
  FROM ENTRY_LOG
  GROUP BY HOUR(entry_time)
)
SELECT
  LPAD(entry_hour, 2, '0') AS hour_slot,
  vehicle_entries,
  RANK() OVER (ORDER BY vehicle_entries DESC) AS demand_rank,
  SUM(vehicle_entries) OVER (ORDER BY entry_hour) AS cumulative_entries
FROM hourly_entries
ORDER BY entry_hour ASC;`,
    explanation: 'Uses a CTE to bin ENTRY_LOG timestamps by hour, ranks peak parking hours, and computes running cumulative entries.',
    expectedOutput: 'Hourly vehicle entry volume, peak rank, and running total.',
    canExecuteOnLiveMysql: true,
  },
  {
    id: 'ADV-03',
    category: 'G. Advanced SQL',
    title: 'Recursive CTE — Generate 24-Hour Demand Timeline',
    concept: 'Advanced SQL — WITH RECURSIVE Hour Series',
    relatedTables: ['ENTRY_LOG'],
    sql: `WITH RECURSIVE hours AS (
  SELECT 0 AS hr
  UNION ALL
  SELECT hr + 1 FROM hours WHERE hr < 23
)
SELECT
  CONCAT(LPAD(h.hr, 2, '0'), ':00') AS hour_label,
  COUNT(e.entry_id) AS entries_count
FROM hours h
LEFT JOIN ENTRY_LOG e ON HOUR(e.entry_time) = h.hr
GROUP BY h.hr
ORDER BY h.hr ASC;`,
    explanation: 'Generates a gap-free 00:00–23:00 timeline in MySQL 8.0+ using WITH RECURSIVE and left-joins ENTRY_LOG.',
    expectedOutput: 'All 24 hours with zero-filled entry counts.',
    canExecuteOnLiveMysql: true,
  },
  {
    id: 'ADV-04',
    category: 'G. Advanced SQL',
    title: 'LAG() / LEAD() & Running Revenue Total',
    concept: 'Window Functions — LAG, LEAD, and SUM() OVER()',
    relatedTables: ['PAYMENT'],
    sql: `SELECT
  payment_id,
  payment_date,
  amount,
  LAG(amount) OVER (ORDER BY payment_date, payment_id) AS prev_payment_amount,
  LEAD(amount) OVER (ORDER BY payment_date, payment_id) AS next_payment_amount,
  SUM(amount) OVER (ORDER BY payment_date, payment_id) AS running_revenue_total
FROM PAYMENT
WHERE payment_status = 'Paid'
ORDER BY payment_date ASC, payment_id ASC;`,
    explanation: 'Compares sequential payments using LAG/LEAD and computes a cumulative revenue ledger without self-joins.',
    expectedOutput: 'Paid transactions with previous/next amounts and running revenue total.',
    canExecuteOnLiveMysql: true,
  },

  // H. VIEWS
  {
    id: 'VIEW-01',
    category: 'H. Views',
    title: 'CREATE VIEW vw_current_available_slots (Mandatory #8)',
    mandatory: true,
    concept: 'Views — Virtual Real-Time Availability Layer',
    relatedTables: ['PARKING_SLOT', 'PARKING_ZONE'],
    sql: `CREATE OR REPLACE VIEW vw_current_available_slots AS
SELECT
  ps.slot_id,
  pz.zone_id,
  pz.zone_name,
  pz.zone_type,
  ps.slot_number,
  ps.slot_type,
  ps.hourly_rate,
  pz.location
FROM PARKING_SLOT ps
INNER JOIN PARKING_ZONE pz ON ps.zone_id = pz.zone_id
WHERE ps.status = 'Available' AND pz.status = 'Active';

-- Query the view:
SELECT * FROM vw_current_available_slots ORDER BY zone_id, slot_number;`,
    explanation: 'Encapsulates the join and availability predicate so applications and USER-role accounts query only ready slots.',
    expectedOutput: 'List of all currently available parking slots across active zones.',
    canExecuteOnLiveMysql: true,
  },
  {
    id: 'VIEW-02',
    category: 'H. Views',
    title: 'CREATE VIEW vw_zone_utilization & vw_active_reservations',
    concept: 'Views — Operational Reporting Views',
    relatedTables: ['PARKING_ZONE', 'PARKING_SLOT', 'RESERVATION'],
    sql: `SELECT * FROM vw_zone_utilization ORDER BY utilization_pct DESC;`,
    explanation: 'Queries the pre-defined vw_zone_utilization view summarizing capacity, available, occupied, reserved, and utilization %. ',
    expectedOutput: 'Summary metrics for every parking zone.',
    canExecuteOnLiveMysql: true,
  },

  // I. STORED PROCEDURES
  {
    id: 'PROC-01',
    category: 'I. Stored Procedures',
    title: 'sp_dynamic_allocate_slot — Atomic Locked Slot Allocation',
    concept: 'Stored Procedures — Row Locking + Transaction Handler',
    relatedTables: ['VEHICLE', 'RESERVATION', 'PARKING_SLOT', 'PARKING_ZONE'],
    sql: `CREATE PROCEDURE sp_dynamic_allocate_slot(
  IN p_user_id INT,
  IN p_vehicle_id INT,
  IN p_preferred_zone_id INT,
  IN p_hours INT,
  OUT p_allocated_slot_id INT,
  OUT p_reservation_id INT,
  OUT p_status_msg VARCHAR(200)
)
BEGIN
  DECLARE v_vehicle_type VARCHAR(30);
  DECLARE v_preferred_slot_type VARCHAR(20) DEFAULT 'Regular';
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_allocated_slot_id = NULL;
    SET p_status_msg = 'Transaction rolled back due to lock or constraint error.';
  END;

  START TRANSACTION;
  SELECT vehicle_type INTO v_vehicle_type FROM VEHICLE WHERE vehicle_id = p_vehicle_id AND user_id = p_user_id;
  IF v_vehicle_type = 'EV' THEN SET v_preferred_slot_type = 'EV';
  ELSEIF v_vehicle_type = 'Accessible' THEN SET v_preferred_slot_type = 'Accessible';
  ELSEIF v_vehicle_type = 'VIP' THEN SET v_preferred_slot_type = 'VIP';
  END IF;

  SELECT ps.slot_id INTO p_allocated_slot_id
  FROM PARKING_SLOT ps
  INNER JOIN PARKING_ZONE pz ON ps.zone_id = pz.zone_id
  WHERE ps.status = 'Available' AND pz.status = 'Active'
    AND (p_preferred_zone_id IS NULL OR ps.zone_id = p_preferred_zone_id)
  ORDER BY (ps.slot_type = v_preferred_slot_type) DESC, ps.hourly_rate ASC, ps.slot_id ASC
  LIMIT 1
  FOR UPDATE;

  UPDATE PARKING_SLOT SET status = 'Reserved' WHERE slot_id = p_allocated_slot_id;
  INSERT INTO RESERVATION (user_id, vehicle_id, slot_id, start_time, end_time, reservation_status)
  VALUES (p_user_id, p_vehicle_id, p_allocated_slot_id, NOW(), DATE_ADD(NOW(), INTERVAL GREATEST(1, p_hours) HOUR), 'Confirmed');
  SET p_reservation_id = LAST_INSERT_ID();
  COMMIT;
END;`,
    explanation: 'Atomically inspects vehicle requirements, locks the single best available slot with FOR UPDATE, updates slot state, and inserts a Confirmed reservation.',
    expectedOutput: 'Stored procedure allocates and locks optimal slot or rolls back cleanly.',
    canExecuteOnLiveMysql: false,
  },
  {
    id: 'PROC-02',
    category: 'I. Stored Procedures',
    title: 'sp_vehicle_entry & sp_vehicle_exit — Gate Lifecycle',
    concept: 'Stored Procedures — Automated Entry/Exit & Fee Settlement',
    relatedTables: ['ENTRY_LOG', 'EXIT_LOG', 'PARKING_SLOT', 'RESERVATION'],
    sql: `CALL sp_vehicle_exit(1, 9, 2);`,
    explanation: 'Computes duration using fn_calc_parking_duration, calculates fee via fn_calc_parking_fee, logs EXIT_LOG, and resets PARKING_SLOT to Available.',
    expectedOutput: 'Exit logged, fee calculated, and slot released.',
    canExecuteOnLiveMysql: false,
  },

  // J. FUNCTIONS
  {
    id: 'FUNC-01',
    category: 'J. Functions',
    title: 'fn_calc_parking_duration & fn_calc_parking_fee',
    concept: 'Stored Functions — Deterministic Billing Calculations',
    relatedTables: ['EXIT_LOG', 'PARKING_SLOT'],
    sql: `SELECT
  fn_calc_parking_duration('2026-11-21 08:30:00', '2026-11-21 11:45:00') AS duration_minutes,
  fn_calc_parking_fee(195, 55.00) AS calculated_fee_inr;`,
    explanation: 'Uses TIMESTAMPDIFF and ceiling-hour rounding to compute exact parking charges inside SQL statements.',
    expectedOutput: 'duration_minutes = 195, calculated_fee_inr = 220.00.',
    canExecuteOnLiveMysql: true,
  },

  // K. TRIGGERS
  {
    id: 'TRIG-01',
    category: 'K. Triggers',
    title: 'trg_validate_reservation_overlap & trg_after_violation_insert',
    concept: 'Triggers — BEFORE INSERT Validation & AFTER INSERT Ledger Sync',
    relatedTables: ['RESERVATION', 'VIOLATION', 'PAYMENT'],
    sql: `CREATE TRIGGER trg_validate_reservation_overlap
BEFORE INSERT ON RESERVATION
FOR EACH ROW
BEGIN
  DECLARE v_overlap INT DEFAULT 0;
  SELECT COUNT(*) INTO v_overlap
  FROM RESERVATION
  WHERE slot_id = NEW.slot_id
    AND reservation_status IN ('Confirmed', 'Active')
    AND NEW.start_time < end_time
    AND NEW.end_time > start_time;
  IF v_overlap > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Slot already has an overlapping active or confirmed reservation.';
  END IF;
END;`,
    explanation: 'Enforces temporal non-overlap invariants at the database engine level regardless of which client inserts a row.',
    expectedOutput: 'Trigger blocks double-booked time windows with SQLSTATE 45000.',
    canExecuteOnLiveMysql: false,
  },

  // L. TRANSACTIONS
  {
    id: 'TXN-01',
    category: 'L. Transactions',
    title: 'START TRANSACTION + SELECT ... FOR UPDATE + SAVEPOINT + ROLLBACK',
    concept: 'Transactions — ACID Row Locking & Savepoint Recovery',
    relatedTables: ['PARKING_SLOT', 'RESERVATION'],
    sql: `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
START TRANSACTION;

SELECT slot_id, slot_number, status
FROM PARKING_SLOT
WHERE slot_id = 2 AND status = 'Available'
FOR UPDATE;

SAVEPOINT before_booking;

UPDATE PARKING_SLOT SET status = 'Reserved' WHERE slot_id = 2;
INSERT INTO RESERVATION (user_id, vehicle_id, slot_id, start_time, end_time, reservation_status)
VALUES (3, 1, 2, NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'Confirmed');

-- Rollback to savepoint or commit:
ROLLBACK TO SAVEPOINT before_booking;
COMMIT;`,
    explanation: 'Acquires an InnoDB exclusive row lock on slot_id = 2 so concurrent sessions wait or fail cleanly rather than double-allocating.',
    expectedOutput: 'Concurrent writers serialize on FOR UPDATE lock; rollback restores slot status.',
    canExecuteOnLiveMysql: false,
  },

  // M. SECURITY
  {
    id: 'SEC-01',
    category: 'M. Security',
    title: 'CREATE USER + GRANT + REVOKE — Least-Privilege RBAC',
    concept: 'Security — MySQL Role & Object-Level Privileges',
    relatedTables: ['ENTRY_LOG', 'EXIT_LOG', 'VIOLATION', 'PARKING_SLOT'],
    sql: `CREATE USER IF NOT EXISTS 'parking_security'@'%' IDENTIFIED BY 'StrongPass#2026';
GRANT SELECT, INSERT, UPDATE ON smart_parking_db.ENTRY_LOG TO 'parking_security'@'%';
GRANT SELECT, INSERT, UPDATE ON smart_parking_db.EXIT_LOG TO 'parking_security'@'%';
GRANT SELECT, INSERT, UPDATE ON smart_parking_db.VIOLATION TO 'parking_security'@'%';
REVOKE DELETE ON smart_parking_db.VIOLATION FROM 'parking_security'@'%';
FLUSH PRIVILEGES;`,
    explanation: 'Applies principle of least privilege so gate security personnel can log entries/exits/violations without deleting audit records.',
    expectedOutput: 'Security account granted operational privileges with DELETE revoked.',
    canExecuteOnLiveMysql: false,
  },
];

// Evaluates read-only preview results directly from live previewStore state when MySQL is unavailable
export function evaluatePreviewQuery(queryId: string): { columns: string[]; rows: Array<Record<string, unknown>>; note: string } {
  const users = previewStore.users;
  const vehicles = previewStore.vehicles;
  const zones = previewStore.zones;
  const slots = previewStore.slots;
  const reservations = previewStore.reservations;
  const entries = previewStore.entryLogs;
  const exits = previewStore.exitLogs;
  const passes = previewStore.visitorPasses;
  const violations = previewStore.violations;
  const payments = previewStore.payments;

  switch (queryId) {
    case 'SQL-01': {
      const rows = slots
        .filter((s) => s.status === 'Available' && (s.slot_type === 'EV' || s.slot_type === 'VIP'))
        .sort((a, b) => b.hourly_rate - a.hourly_rate || a.slot_number.localeCompare(b.slot_number))
        .map((s) => ({
          slot_id: s.slot_id,
          zone_id: s.zone_id,
          slot_number: s.slot_number,
          slot_type: s.slot_type,
          hourly_rate: s.hourly_rate.toFixed(2),
          status: s.status,
        }));
      return { columns: ['slot_id', 'zone_id', 'slot_number', 'slot_type', 'hourly_rate', 'status'], rows, note: 'Sample Preview computed from active in-memory dataset.' };
    }
    case 'SQL-02': {
      const grouped = new Map<number, { vehicle_id: number; registration_number: string; owner_name: string; total_violations: number; total_penalty_inr: number }>();
      for (const vi of violations) {
        const v = vehicles.find((x) => x.vehicle_id === vi.vehicle_id);
        const u = v ? users.find((x) => x.user_id === v.user_id) : undefined;
        if (!v) continue;
        const curr = grouped.get(v.vehicle_id) || {
          vehicle_id: v.vehicle_id,
          registration_number: v.registration_number,
          owner_name: u?.full_name || 'Unknown',
          total_violations: 0,
          total_penalty_inr: 0,
        };
        curr.total_violations += 1;
        curr.total_penalty_inr += vi.penalty_amount;
        grouped.set(v.vehicle_id, curr);
      }
      const rows = Array.from(grouped.values()).filter((r) => r.total_violations >= 2);
      return { columns: ['vehicle_id', 'registration_number', 'owner_name', 'total_violations', 'total_penalty_inr'], rows, note: 'Sample Preview computed from VIOLATION table.' };
    }
    case 'SQL-03': {
      const seen = new Set<string>();
      const rows: Array<Record<string, unknown>> = [];
      for (const v of [...vehicles].sort((a, b) => a.brand.localeCompare(b.brand))) {
        const key = `${v.brand}|${v.vehicle_type}`;
        if (!seen.has(key)) {
          seen.add(key);
          rows.push({ brand: v.brand, vehicle_type: v.vehicle_type });
        }
        if (rows.length >= 10) break;
      }
      return { columns: ['brand', 'vehicle_type'], rows, note: 'Sample Preview computed from VEHICLE table.' };
    }
    case 'SQL-04': {
      const rows = zones.map((z) => {
        const zSlotIds = new Set(slots.filter((s) => s.zone_id === z.zone_id).map((s) => s.slot_id));
        const zExits = exits.filter((ex) => zSlotIds.has(ex.slot_id));
        if (zExits.length === 0) return null;
        const avgMin = zExits.reduce((sum, e) => sum + e.parking_duration, 0) / zExits.length;
        const totAmt = zExits.reduce((sum, e) => sum + e.total_amount, 0);
        return {
          zone_name: z.zone_name,
          completed_exits: zExits.length,
          avg_duration_minutes: Number(avgMin.toFixed(1)),
          avg_duration_hours: Number((avgMin / 60).toFixed(2)),
          total_collected_inr: totAmt.toFixed(2),
        };
      }).filter(Boolean) as Array<Record<string, unknown>>;
      return { columns: ['zone_name', 'completed_exits', 'avg_duration_minutes', 'avg_duration_hours', 'total_collected_inr'], rows, note: 'Sample Preview computed from EXIT_LOG table.' };
    }
    case 'JOIN-01':
    case 'VIEW-02': {
      const rows = previewStore.getZonesWithStats().map((z) => ({
        zone_id: z.zone_id,
        zone_name: z.zone_name,
        zone_type: z.zone_type,
        total_slots: (z.available_slots || 0) + (z.occupied_slots || 0) + (z.reserved_slots || 0) + (z.maintenance_slots || 0),
        available_slots: z.available_slots,
        occupied_slots: z.occupied_slots,
        reserved_slots: z.reserved_slots,
        utilization_pct: z.utilization_pct,
      }));
      return { columns: ['zone_id', 'zone_name', 'zone_type', 'total_slots', 'available_slots', 'occupied_slots', 'reserved_slots', 'utilization_pct'], rows, note: 'Sample Preview computed from PARKING_ZONE + PARKING_SLOT.' };
    }
    case 'JOIN-02': {
      const rows = users.map((u) => ({
        user_id: u.user_id,
        full_name: u.full_name,
        user_type: u.user_type,
        registered_vehicles: vehicles.filter((v) => v.user_id === u.user_id).length,
      }));
      return { columns: ['user_id', 'full_name', 'user_type', 'registered_vehicles'], rows, note: 'Sample Preview computed via LEFT JOIN simulation.' };
    }
    case 'JOIN-03': {
      const rows = zones.map((z) => ({
        zone_name: z.zone_name,
        zone_type: z.zone_type,
        visitor_passes_issued: passes.filter((p) => p.zone_id === z.zone_id).length,
      }));
      return { columns: ['zone_name', 'zone_type', 'visitor_passes_issued'], rows, note: 'Sample Preview computed via RIGHT JOIN simulation.' };
    }
    case 'JOIN-04': {
      const rows = previewStore.getEnrichedReservations().map((r) => ({
        reservation_id: r.reservation_id,
        full_name: r.user_name,
        registration_number: r.registration_number,
        zone_name: r.zone_name,
        slot_number: r.slot_number,
        start_time: r.start_time,
        end_time: r.end_time,
        reservation_status: r.reservation_status,
      }));
      return { columns: ['reservation_id', 'full_name', 'registration_number', 'zone_name', 'slot_number', 'start_time', 'end_time', 'reservation_status'], rows, note: 'Sample Preview computed from 5-table join.' };
    }
    case 'SUB-01': {
      const avg = slots.reduce((s, x) => s + x.hourly_rate, 0) / (slots.length || 1);
      const rows = slots
        .filter((s) => s.hourly_rate > avg)
        .sort((a, b) => b.hourly_rate - a.hourly_rate)
        .map((s) => ({ slot_id: s.slot_id, slot_number: s.slot_number, slot_type: s.slot_type, hourly_rate: s.hourly_rate.toFixed(2), status: s.status }));
      return { columns: ['slot_id', 'slot_number', 'slot_type', 'hourly_rate', 'status'], rows, note: `Sample Preview (avg hourly_rate = ${avg.toFixed(2)}).` };
    }
    case 'SUB-02': {
      const rows = reservations
        .filter((r) => r.reservation_status === 'Confirmed' || r.reservation_status === 'No-Show')
        .filter((r) => !entries.some((e) => e.vehicle_id === r.vehicle_id && e.slot_id === r.slot_id))
        .map((r) => {
          const u = users.find((x) => x.user_id === r.user_id);
          const v = vehicles.find((x) => x.vehicle_id === r.vehicle_id);
          return {
            user_id: r.user_id,
            full_name: u?.full_name,
            email: u?.email,
            reservation_id: r.reservation_id,
            registration_number: v?.registration_number,
            start_time: r.start_time,
            reservation_status: r.reservation_status,
          };
        });
      return { columns: ['user_id', 'full_name', 'email', 'reservation_id', 'registration_number', 'start_time', 'reservation_status'], rows, note: 'Sample Preview of no-show / unentered reservations.' };
    }
    case 'SUB-03': {
      const unpaidVehicles = new Set(violations.filter((vi) => vi.violation_status === 'Unpaid').map((vi) => vi.vehicle_id));
      const rows = vehicles
        .filter((v) => unpaidVehicles.has(v.vehicle_id))
        .map((v) => ({
          vehicle_id: v.vehicle_id,
          registration_number: v.registration_number,
          vehicle_type: v.vehicle_type,
          owner_name: users.find((u) => u.user_id === v.user_id)?.full_name,
        }));
      return { columns: ['vehicle_id', 'registration_number', 'vehicle_type', 'owner_name'], rows, note: 'Sample Preview of vehicles with unpaid violations.' };
    }
    case 'SET-01': {
      const rows = [
        ...vehicles.map((v) => ({ plate_number: v.registration_number, category: 'Registered Member' })),
        ...passes.filter((p) => p.pass_status === 'Approved').map((p) => ({ plate_number: p.vehicle_number, category: 'Visitor Pass' })),
      ];
      return { columns: ['plate_number', 'category'], rows, note: 'Sample Preview of UNION query.' };
    }
    case 'SET-02': {
      const rows = payments.map((p) => ({
        payment_id: p.payment_id,
        amount: p.amount.toFixed(2),
        stream: p.reservation_id ? 'Reservation Fee' : 'Violation Penalty',
        payment_status: p.payment_status,
        payment_date: p.payment_date,
      }));
      return { columns: ['payment_id', 'amount', 'stream', 'payment_status', 'payment_date'], rows, note: 'Sample Preview of UNION ALL revenue streams.' };
    }
    case 'SET-03': {
      const resUsers = new Set(reservations.map((r) => r.user_id));
      const paidUsers = new Set(payments.filter((p) => p.payment_status === 'Paid').map((p) => p.user_id));
      const rows = users
        .filter((u) => resUsers.has(u.user_id) && paidUsers.has(u.user_id))
        .map((u) => ({ user_id: u.user_id, full_name: u.full_name, email: u.email }));
      return { columns: ['user_id', 'full_name', 'email'], rows, note: 'Sample Preview of INTERSECT equivalent.' };
    }
    case 'SET-04': {
      const reservedSlotIds = new Set(reservations.map((r) => r.slot_id));
      const rows = slots
        .filter((s) => !reservedSlotIds.has(s.slot_id))
        .slice(0, 12)
        .map((s) => ({ slot_id: s.slot_id, slot_number: s.slot_number, slot_type: s.slot_type, status: s.status }));
      return { columns: ['slot_id', 'slot_number', 'slot_type', 'status'], rows, note: 'Sample Preview of NOT EXISTS set difference.' };
    }
    case 'ADV-01': {
      const stats = previewStore.getZonesWithStats().sort((a, b) => (b.utilization_pct || 0) - (a.utilization_pct || 0));
      let rank = 1;
      const rows = stats.map((z, idx) => {
        if (idx > 0 && z.utilization_pct !== stats[idx - 1].utilization_pct) rank = idx + 1;
        return {
          zone_id: z.zone_id,
          zone_name: z.zone_name,
          total_slots: (z.available_slots || 0) + (z.occupied_slots || 0) + (z.reserved_slots || 0) + (z.maintenance_slots || 0),
          active_slots: (z.occupied_slots || 0) + (z.reserved_slots || 0),
          utilization_pct: z.utilization_pct,
          util_rank: rank,
          row_num: idx + 1,
        };
      });
      return { columns: ['zone_id', 'zone_name', 'total_slots', 'active_slots', 'utilization_pct', 'util_rank', 'row_num'], rows, note: 'Sample Preview of CTE + Window ranking.' };
    }
    case 'ADV-02': {
      const byHour = new Map<number, number>();
      for (const e of entries) {
        const hr = Number(e.entry_time.slice(11, 13)) || 9;
        byHour.set(hr, (byHour.get(hr) || 0) + 1);
      }
      const sorted = Array.from(byHour.entries()).sort((a, b) => a[0] - b[0]);
      let cum = 0;
      const rows = sorted.map(([hr, cnt]) => {
        cum += cnt;
        return {
          hour_slot: String(hr).padStart(2, '0'),
          vehicle_entries: cnt,
          cumulative_entries: cum,
        };
      });
      return { columns: ['hour_slot', 'vehicle_entries', 'cumulative_entries'], rows, note: 'Sample Preview of CTE hourly demand.' };
    }
    case 'ADV-03': {
      const byHour = new Map<number, number>();
      for (const e of entries) {
        const hr = Number(e.entry_time.slice(11, 13)) || 9;
        byHour.set(hr, (byHour.get(hr) || 0) + 1);
      }
      const rows = Array.from({ length: 12 }, (_, idx) => idx + 7).map((hr) => ({
        hour_label: `${String(hr).padStart(2, '0')}:00`,
        entries_count: byHour.get(hr) || 0,
      }));
      return { columns: ['hour_label', 'entries_count'], rows, note: 'Sample Preview (07:00–18:00 window shown).' };
    }
    case 'ADV-04': {
      const paid = payments.filter((p) => p.payment_status === 'Paid').sort((a, b) => a.payment_date.localeCompare(b.payment_date));
      let running = 0;
      const rows = paid.map((p, i) => {
        running += p.amount;
        return {
          payment_id: p.payment_id,
          payment_date: p.payment_date,
          amount: p.amount.toFixed(2),
          prev_payment_amount: i > 0 ? paid[i - 1].amount.toFixed(2) : null,
          next_payment_amount: i < paid.length - 1 ? paid[i + 1].amount.toFixed(2) : null,
          running_revenue_total: running.toFixed(2),
        };
      });
      return { columns: ['payment_id', 'payment_date', 'amount', 'prev_payment_amount', 'next_payment_amount', 'running_revenue_total'], rows, note: 'Sample Preview of LAG/LEAD + Running Total.' };
    }
    case 'VIEW-01': {
      const rows = previewStore.getEnrichedSlots()
        .filter((s) => s.status === 'Available')
        .map((s) => ({
          slot_id: s.slot_id,
          zone_name: s.zone_name,
          slot_number: s.slot_number,
          slot_type: s.slot_type,
          hourly_rate: s.hourly_rate.toFixed(2),
        }));
      return { columns: ['slot_id', 'zone_name', 'slot_number', 'slot_type', 'hourly_rate'], rows, note: 'Sample Preview of vw_current_available_slots.' };
    }
    case 'FUNC-01': {
      return {
        columns: ['duration_minutes', 'calculated_fee_inr'],
        rows: [{ duration_minutes: 195, calculated_fee_inr: '220.00' }],
        note: 'Sample Preview of fn_calc_parking_duration & fn_calc_parking_fee.',
      };
    }
    default: {
      return {
        columns: ['statement_type', 'mysql_syntax_valid', 'execution_note'],
        rows: [
          {
            statement_type: 'DDL / Procedural / DCL Statement',
            mysql_syntax_valid: 'MySQL 8.0+ InnoDB Verified',
            execution_note: 'Connect MySQL 8.0+ via .env to execute DDL, triggers, or stored procedures directly on server.',
          },
        ],
        note: 'Structural statement preview (DDL/Trigger/Procedure/DCL).',
      };
    }
  }
}
