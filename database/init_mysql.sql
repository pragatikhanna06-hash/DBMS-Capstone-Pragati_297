-- ============================================================================
-- PROJECT 6: SMART PARKING MANAGEMENT & ALLOCATION SYSTEM
-- Complete MySQL 8.0+ Initialization Script (InnoDB)
-- Includes: DDL, Constraints, Indexes, Views, Functions, Stored Procedures,
--           Triggers, RBAC Privileges, and Realistic Seed Data
-- ============================================================================

CREATE DATABASE IF NOT EXISTS smart_parking_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_parking_db;

-- Drop in reverse dependency order for clean re-initialization
DROP TRIGGER IF EXISTS trg_validate_reservation_overlap;
DROP TRIGGER IF EXISTS trg_after_reservation_insert;
DROP TRIGGER IF EXISTS trg_after_violation_insert;
DROP PROCEDURE IF EXISTS sp_dynamic_allocate_slot;
DROP PROCEDURE IF EXISTS sp_release_slot;
DROP PROCEDURE IF EXISTS sp_vehicle_entry;
DROP PROCEDURE IF EXISTS sp_vehicle_exit;
DROP FUNCTION IF EXISTS fn_calc_parking_duration;
DROP FUNCTION IF EXISTS fn_calc_parking_fee;
DROP FUNCTION IF EXISTS fn_zone_utilization_pct;
DROP VIEW IF EXISTS vw_current_available_slots;
DROP VIEW IF EXISTS vw_zone_utilization;
DROP VIEW IF EXISTS vw_active_reservations;
DROP VIEW IF EXISTS vw_user_parking_history;

DROP TABLE IF EXISTS PAYMENT;
DROP TABLE IF EXISTS VIOLATION;
DROP TABLE IF EXISTS VISITOR_PASS;
DROP TABLE IF EXISTS EXIT_LOG;
DROP TABLE IF EXISTS ENTRY_LOG;
DROP TABLE IF EXISTS RESERVATION;
DROP TABLE IF EXISTS PARKING_SLOT;
DROP TABLE IF EXISTS PARKING_ZONE;
DROP TABLE IF EXISTS VEHICLE;
DROP TABLE IF EXISTS USER;

-- ============================================================================
-- 1. USER TABLE
-- ============================================================================
CREATE TABLE USER (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  user_type ENUM('Student', 'Employee', 'Resident', 'Admin', 'Security') NOT NULL,
  department VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('Active', 'Suspended', 'Inactive') NOT NULL DEFAULT 'Active',
  CONSTRAINT uq_user_email UNIQUE (email),
  CONSTRAINT chk_user_phone CHECK (CHAR_LENGTH(phone) >= 7)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. VEHICLE TABLE
-- ============================================================================
CREATE TABLE VEHICLE (
  vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  registration_number VARCHAR(24) NOT NULL,
  vehicle_type ENUM('Sedan', 'SUV', 'EV', 'Motorcycle', 'Accessible', 'VIP') NOT NULL,
  brand VARCHAR(60) NOT NULL,
  model VARCHAR(60) NOT NULL,
  color VARCHAR(40) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_vehicle_reg UNIQUE (registration_number),
  CONSTRAINT fk_vehicle_user FOREIGN KEY (user_id)
    REFERENCES USER(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. PARKING_ZONE TABLE
-- ============================================================================
CREATE TABLE PARKING_ZONE (
  zone_id INT AUTO_INCREMENT PRIMARY KEY,
  zone_name VARCHAR(80) NOT NULL,
  location VARCHAR(150) NOT NULL,
  zone_type ENUM('General', 'EV Charging', 'Faculty & Staff', 'Resident', 'VIP', 'Visitor') NOT NULL,
  total_capacity INT NOT NULL,
  description VARCHAR(255) NULL,
  status ENUM('Active', 'Full', 'Maintenance') NOT NULL DEFAULT 'Active',
  CONSTRAINT uq_zone_name UNIQUE (zone_name),
  CONSTRAINT chk_zone_capacity CHECK (total_capacity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. PARKING_SLOT TABLE
-- ============================================================================
CREATE TABLE PARKING_SLOT (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. RESERVATION TABLE
-- ============================================================================
CREATE TABLE RESERVATION (
  reservation_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  slot_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  reservation_status ENUM('Confirmed', 'Active', 'Completed', 'Cancelled', 'No-Show') NOT NULL DEFAULT 'Confirmed',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_reservation_window CHECK (end_time > start_time),
  CONSTRAINT fk_res_user FOREIGN KEY (user_id)
    REFERENCES USER(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_res_vehicle FOREIGN KEY (vehicle_id)
    REFERENCES VEHICLE(vehicle_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_res_slot FOREIGN KEY (slot_id)
    REFERENCES PARKING_SLOT(slot_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. ENTRY_LOG TABLE
-- ============================================================================
CREATE TABLE ENTRY_LOG (
  entry_id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  slot_id INT NOT NULL,
  entry_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  security_id INT NOT NULL,
  entry_status ENUM('Entered', 'Denied', 'Flagged') NOT NULL DEFAULT 'Entered',
  CONSTRAINT fk_entry_vehicle FOREIGN KEY (vehicle_id)
    REFERENCES VEHICLE(vehicle_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_entry_slot FOREIGN KEY (slot_id)
    REFERENCES PARKING_SLOT(slot_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_entry_security FOREIGN KEY (security_id)
    REFERENCES USER(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. EXIT_LOG TABLE
-- ============================================================================
CREATE TABLE EXIT_LOG (
  exit_id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  slot_id INT NOT NULL,
  exit_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  parking_duration INT NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  security_id INT NOT NULL,
  CONSTRAINT chk_exit_duration CHECK (parking_duration >= 0),
  CONSTRAINT chk_exit_amount CHECK (total_amount >= 0),
  CONSTRAINT fk_exit_vehicle FOREIGN KEY (vehicle_id)
    REFERENCES VEHICLE(vehicle_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_exit_slot FOREIGN KEY (slot_id)
    REFERENCES PARKING_SLOT(slot_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_exit_security FOREIGN KEY (security_id)
    REFERENCES USER(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. VISITOR_PASS TABLE
-- ============================================================================
CREATE TABLE VISITOR_PASS (
  pass_id INT AUTO_INCREMENT PRIMARY KEY,
  visitor_name VARCHAR(120) NOT NULL,
  visitor_phone VARCHAR(20) NOT NULL,
  vehicle_number VARCHAR(24) NOT NULL,
  host_user_id INT NOT NULL,
  zone_id INT NOT NULL,
  slot_id INT NULL,
  valid_from DATETIME NOT NULL,
  valid_until DATETIME NOT NULL,
  pass_status ENUM('Pending', 'Approved', 'Rejected', 'Expired') NOT NULL DEFAULT 'Pending',
  CONSTRAINT chk_pass_validity CHECK (valid_until > valid_from),
  CONSTRAINT fk_pass_host FOREIGN KEY (host_user_id)
    REFERENCES USER(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pass_zone FOREIGN KEY (zone_id)
    REFERENCES PARKING_ZONE(zone_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_pass_slot FOREIGN KEY (slot_id)
    REFERENCES PARKING_SLOT(slot_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. VIOLATION TABLE
-- ============================================================================
CREATE TABLE VIOLATION (
  violation_id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  slot_id INT NOT NULL,
  violation_type ENUM(
    'Unauthorized Parking',
    'Overstay',
    'Wrong Zone Parking',
    'Expired Visitor Pass',
    'Reserved Slot Violation'
  ) NOT NULL,
  description VARCHAR(255) NOT NULL,
  violation_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  penalty_amount DECIMAL(8, 2) NOT NULL,
  violation_status ENUM('Unpaid', 'Paid', 'Disputed', 'Waived') NOT NULL DEFAULT 'Unpaid',
  CONSTRAINT chk_penalty_amount CHECK (penalty_amount >= 0),
  CONSTRAINT fk_violation_vehicle FOREIGN KEY (vehicle_id)
    REFERENCES VEHICLE(vehicle_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_violation_slot FOREIGN KEY (slot_id)
    REFERENCES PARKING_SLOT(slot_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 10. PAYMENT TABLE
-- ============================================================================
CREATE TABLE PAYMENT (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  reservation_id INT NULL,
  violation_id INT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('UPI', 'Card', 'Campus Wallet', 'NetBanking', 'Cash') NOT NULL,
  payment_status ENUM('Paid', 'Pending', 'Failed', 'Refunded') NOT NULL DEFAULT 'Pending',
  payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  transaction_reference VARCHAR(64) NOT NULL,
  CONSTRAINT uq_payment_ref UNIQUE (transaction_reference),
  CONSTRAINT chk_payment_amount CHECK (amount >= 0),
  CONSTRAINT fk_payment_user FOREIGN KEY (user_id)
    REFERENCES USER(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_payment_res FOREIGN KEY (reservation_id)
    REFERENCES RESERVATION(reservation_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_payment_violation FOREIGN KEY (violation_id)
    REFERENCES VIOLATION(violation_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- INDEXES FOR QUERY OPTIMIZATION
-- ============================================================================
CREATE INDEX idx_user_type_status ON USER (user_type, status);
CREATE INDEX idx_vehicle_user ON VEHICLE (user_id);
CREATE INDEX idx_slot_zone_status ON PARKING_SLOT (zone_id, status, slot_type);
CREATE INDEX idx_reservation_slot_window ON RESERVATION (slot_id, start_time, end_time, reservation_status);
CREATE INDEX idx_reservation_user_status ON RESERVATION (user_id, reservation_status);
CREATE INDEX idx_entry_vehicle_time ON ENTRY_LOG (vehicle_id, entry_time);
CREATE INDEX idx_exit_vehicle_time ON EXIT_LOG (vehicle_id, exit_time);
CREATE INDEX idx_violation_vehicle_status ON VIOLATION (vehicle_id, violation_status);
CREATE INDEX idx_payment_user_status ON PAYMENT (user_id, payment_status, payment_date);

-- ============================================================================
-- VIEWS
-- ============================================================================
CREATE VIEW vw_current_available_slots AS
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

CREATE VIEW vw_zone_utilization AS
SELECT
  pz.zone_id,
  pz.zone_name,
  pz.zone_type,
  pz.total_capacity,
  COUNT(ps.slot_id) AS configured_slots,
  SUM(CASE WHEN ps.status = 'Available' THEN 1 ELSE 0 END) AS available_slots,
  SUM(CASE WHEN ps.status = 'Occupied' THEN 1 ELSE 0 END) AS occupied_slots,
  SUM(CASE WHEN ps.status = 'Reserved' THEN 1 ELSE 0 END) AS reserved_slots,
  SUM(CASE WHEN ps.status = 'Maintenance' THEN 1 ELSE 0 END) AS maintenance_slots,
  ROUND(
    (SUM(CASE WHEN ps.status IN ('Occupied', 'Reserved') THEN 1 ELSE 0 END) / NULLIF(COUNT(ps.slot_id), 0)) * 100,
    2
  ) AS utilization_pct
FROM PARKING_ZONE pz
LEFT JOIN PARKING_SLOT ps ON pz.zone_id = ps.zone_id
GROUP BY pz.zone_id, pz.zone_name, pz.zone_type, pz.total_capacity;

CREATE VIEW vw_active_reservations AS
SELECT
  r.reservation_id,
  u.full_name AS user_name,
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
WHERE r.reservation_status IN ('Confirmed', 'Active');

CREATE VIEW vw_user_parking_history AS
SELECT
  u.user_id,
  u.full_name,
  v.registration_number,
  ps.slot_number,
  pz.zone_name,
  en.entry_time,
  ex.exit_time,
  ex.parking_duration,
  ex.total_amount
FROM USER u
INNER JOIN VEHICLE v ON u.user_id = v.user_id
INNER JOIN ENTRY_LOG en ON v.vehicle_id = en.vehicle_id
LEFT JOIN EXIT_LOG ex ON ex.vehicle_id = v.vehicle_id AND ex.slot_id = en.slot_id AND ex.exit_time >= en.entry_time
INNER JOIN PARKING_SLOT ps ON en.slot_id = ps.slot_id
INNER JOIN PARKING_ZONE pz ON ps.zone_id = pz.zone_id;

-- ============================================================================
-- STORED FUNCTIONS
-- ============================================================================
DELIMITER $$

CREATE FUNCTION fn_calc_parking_duration(p_entry DATETIME, p_exit DATETIME)
RETURNS INT
DETERMINISTIC
BEGIN
  DECLARE v_mins INT;
  SET v_mins = TIMESTAMPDIFF(MINUTE, p_entry, p_exit);
  RETURN IF(v_mins < 0, 0, v_mins);
END$$

CREATE FUNCTION fn_calc_parking_fee(p_minutes INT, p_hourly_rate DECIMAL(8,2))
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
  DECLARE v_hours DECIMAL(10,2);
  IF p_minutes <= 0 THEN
    RETURN 0.00;
  END IF;
  SET v_hours = CEIL(p_minutes / 60);
  RETURN ROUND(GREATEST(1, v_hours) * p_hourly_rate, 2);
END$$

CREATE FUNCTION fn_zone_utilization_pct(p_zone_id INT)
RETURNS DECIMAL(5,2)
READS SQL DATA
BEGIN
  DECLARE v_total INT DEFAULT 0;
  DECLARE v_used INT DEFAULT 0;
  SELECT COUNT(*), SUM(CASE WHEN status IN ('Occupied', 'Reserved') THEN 1 ELSE 0 END)
    INTO v_total, v_used
  FROM PARKING_SLOT
  WHERE zone_id = p_zone_id;
  IF v_total = 0 THEN
    RETURN 0.00;
  END IF;
  RETURN ROUND((v_used / v_total) * 100, 2);
END$$

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================
CREATE PROCEDURE sp_dynamic_allocate_slot(
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
  DECLARE v_existing_res INT DEFAULT NULL;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_allocated_slot_id = NULL;
    SET p_reservation_id = NULL;
    SET p_status_msg = 'Transaction rolled back due to SQL lock or constraint error.';
  END;

  START TRANSACTION;

  SELECT vehicle_type INTO v_vehicle_type
  FROM VEHICLE
  WHERE vehicle_id = p_vehicle_id AND user_id = p_user_id;

  IF v_vehicle_type = 'EV' THEN
    SET v_preferred_slot_type = 'EV';
  ELSEIF v_vehicle_type = 'Accessible' THEN
    SET v_preferred_slot_type = 'Accessible';
  ELSEIF v_vehicle_type = 'VIP' THEN
    SET v_preferred_slot_type = 'VIP';
  END IF;

  -- Check if user already has an active/confirmed reservation for this vehicle
  SELECT reservation_id, slot_id INTO v_existing_res, p_allocated_slot_id
  FROM RESERVATION
  WHERE vehicle_id = p_vehicle_id
    AND reservation_status IN ('Confirmed', 'Active')
    AND end_time > NOW()
  LIMIT 1
  FOR UPDATE;

  IF v_existing_res IS NOT NULL THEN
    SET p_reservation_id = v_existing_res;
    SET p_status_msg = 'Existing active reservation matched and locked.';
    COMMIT;
  ELSE
    -- Lock best matching available slot prioritizing preferred zone and slot type
    SELECT ps.slot_id INTO p_allocated_slot_id
    FROM PARKING_SLOT ps
    INNER JOIN PARKING_ZONE pz ON ps.zone_id = pz.zone_id
    WHERE ps.status = 'Available'
      AND pz.status = 'Active'
      AND (p_preferred_zone_id IS NULL OR ps.zone_id = p_preferred_zone_id)
    ORDER BY
      (ps.slot_type = v_preferred_slot_type) DESC,
      (ps.slot_type = 'Regular') DESC,
      ps.hourly_rate ASC,
      ps.slot_id ASC
    LIMIT 1
    FOR UPDATE;

    IF p_allocated_slot_id IS NULL THEN
      ROLLBACK;
      SET p_reservation_id = NULL;
      SET p_status_msg = 'No suitable available slot found in requested zone.';
    ELSE
      UPDATE PARKING_SLOT
      SET status = 'Reserved'
      WHERE slot_id = p_allocated_slot_id;

      INSERT INTO RESERVATION (user_id, vehicle_id, slot_id, start_time, end_time, reservation_status)
      VALUES (p_user_id, p_vehicle_id, p_allocated_slot_id, NOW(), DATE_ADD(NOW(), INTERVAL GREATEST(1, p_hours) HOUR), 'Confirmed');

      SET p_reservation_id = LAST_INSERT_ID();
      SET p_status_msg = 'Slot dynamically allocated and locked atomically.';
      COMMIT;
    END IF;
  END IF;
END$$

CREATE PROCEDURE sp_release_slot(IN p_slot_id INT)
BEGIN
  START TRANSACTION;
  UPDATE PARKING_SLOT
  SET status = 'Available'
  WHERE slot_id = p_slot_id;
  COMMIT;
END$$

CREATE PROCEDURE sp_vehicle_entry(
  IN p_vehicle_id INT,
  IN p_slot_id INT,
  IN p_security_id INT
)
BEGIN
  START TRANSACTION;
  SELECT slot_id FROM PARKING_SLOT WHERE slot_id = p_slot_id FOR UPDATE;
  INSERT INTO ENTRY_LOG (vehicle_id, slot_id, entry_time, security_id, entry_status)
  VALUES (p_vehicle_id, p_slot_id, NOW(), p_security_id, 'Entered');
  UPDATE PARKING_SLOT SET status = 'Occupied' WHERE slot_id = p_slot_id;
  UPDATE RESERVATION
  SET reservation_status = 'Active'
  WHERE vehicle_id = p_vehicle_id AND slot_id = p_slot_id AND reservation_status = 'Confirmed';
  COMMIT;
END$$

CREATE PROCEDURE sp_vehicle_exit(
  IN p_vehicle_id INT,
  IN p_slot_id INT,
  IN p_security_id INT
)
BEGIN
  DECLARE v_entry_time DATETIME;
  DECLARE v_rate DECIMAL(8,2);
  DECLARE v_duration INT;
  DECLARE v_amount DECIMAL(10,2);

  START TRANSACTION;
  SELECT MAX(entry_time) INTO v_entry_time
  FROM ENTRY_LOG
  WHERE vehicle_id = p_vehicle_id AND slot_id = p_slot_id AND entry_status = 'Entered';

  SELECT hourly_rate INTO v_rate FROM PARKING_SLOT WHERE slot_id = p_slot_id FOR UPDATE;

  SET v_duration = fn_calc_parking_duration(COALESCE(v_entry_time, DATE_SUB(NOW(), INTERVAL 60 MINUTE)), NOW());
  SET v_amount = fn_calc_parking_fee(v_duration, v_rate);

  INSERT INTO EXIT_LOG (vehicle_id, slot_id, exit_time, parking_duration, total_amount, security_id)
  VALUES (p_vehicle_id, p_slot_id, NOW(), v_duration, v_amount, p_security_id);

  UPDATE PARKING_SLOT SET status = 'Available' WHERE slot_id = p_slot_id;
  UPDATE RESERVATION
  SET reservation_status = 'Completed'
  WHERE vehicle_id = p_vehicle_id AND slot_id = p_slot_id AND reservation_status IN ('Active', 'Confirmed');
  COMMIT;
END$$

-- ============================================================================
-- TRIGGERS
-- ============================================================================
CREATE TRIGGER trg_validate_reservation_overlap
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
END$$

CREATE TRIGGER trg_after_reservation_insert
AFTER INSERT ON RESERVATION
FOR EACH ROW
BEGIN
  IF NEW.reservation_status IN ('Confirmed', 'Active') THEN
    UPDATE PARKING_SLOT
    SET status = IF(NEW.reservation_status = 'Active', 'Occupied', 'Reserved')
    WHERE slot_id = NEW.slot_id AND status = 'Available';
  END IF;
END$$

CREATE TRIGGER trg_after_violation_insert
AFTER INSERT ON VIOLATION
FOR EACH ROW
BEGIN
  DECLARE v_owner_id INT;
  SELECT user_id INTO v_owner_id FROM VEHICLE WHERE vehicle_id = NEW.vehicle_id;
  IF v_owner_id IS NOT NULL AND NEW.penalty_amount > 0 THEN
    INSERT INTO PAYMENT (user_id, reservation_id, violation_id, amount, payment_method, payment_status, transaction_reference)
    VALUES (
      v_owner_id,
      NULL,
      NEW.violation_id,
      NEW.penalty_amount,
      'Campus Wallet',
      IF(NEW.violation_status = 'Paid', 'Paid', 'Pending'),
      CONCAT('PEN-', NEW.violation_id, '-', UNIX_TIMESTAMP())
    );
  END IF;
END$$

DELIMITER ;

-- ============================================================================
-- REALISTIC SEED DATA
-- ============================================================================
INSERT INTO USER (user_id, full_name, email, phone, user_type, department, created_at, status) VALUES
(1, 'Pragati Mehta', 'pragati.mehta@campus.edu', '+91-9811044210', 'Admin', 'IT & Infrastructure', '2026-09-01 09:00:00', 'Active'),
(2, 'Vikram Singh', 'vikram.security@campus.edu', '+91-9811044211', 'Security', 'Campus Security Gate-1', '2026-09-02 08:30:00', 'Active'),
(3, 'Ananya Sharma', 'ananya.sharma@campus.edu', '+91-9876543210', 'Student', 'Computer Science', '2026-09-05 10:15:00', 'Active'),
(4, 'Dr. Rajesh Iyer', 'rajesh.iyer@campus.edu', '+91-9822113344', 'Employee', 'Data Science Faculty', '2026-09-06 11:00:00', 'Active'),
(5, 'Priya Nair', 'priya.nair@campus.edu', '+91-9845098765', 'Resident', 'Faculty Towers Block-B', '2026-09-08 14:20:00', 'Active'),
(6, 'Kabir Verma', 'kabir.verma@campus.edu', '+91-9899123456', 'Student', 'Mechanical Engg', '2026-09-10 09:45:00', 'Active'),
(7, 'Meera Krishnan', 'meera.krishnan@campus.edu', '+91-9818223399', 'Employee', 'Administration', '2026-09-12 12:10:00', 'Active'),
(8, 'Rohan Malhotra', 'rohan.malhotra@campus.edu', '+91-9871002233', 'Resident', 'Staff Quarters Block-A', '2026-09-15 16:00:00', 'Active'),
(9, 'Sana Qureshi', 'sana.qureshi@campus.edu', '+91-9810998877', 'Student', 'Electrical Engg', '2026-09-18 10:00:00', 'Active'),
(10, 'Deepak Chauhan', 'deepak.security@campus.edu', '+91-9811556677', 'Security', 'Campus Security Gate-2', '2026-09-20 07:45:00', 'Active');

INSERT INTO VEHICLE (vehicle_id, user_id, registration_number, vehicle_type, brand, model, color, created_at) VALUES
(1, 3, 'HR26AB1234', 'EV', 'Tata', 'Nexon EV Max', 'Teal Cyan', '2026-09-05 10:30:00'),
(2, 4, 'DL3CAF8891', 'Sedan', 'Honda', 'City ZX', 'Silver', '2026-09-06 11:15:00'),
(3, 5, 'KA01MX4420', 'SUV', 'Hyundai', 'Creta', 'Obsidian Black', '2026-09-08 14:30:00'),
(4, 6, 'MH12PQ7712', 'Motorcycle', 'Royal Enfield', 'Meteor 350', 'Matte Blue', '2026-09-10 10:00:00'),
(5, 7, 'DL8SAA5501', 'VIP', 'BMW', 'iX1 xDrive', 'Mineral White', '2026-09-12 12:30:00'),
(6, 8, 'UP16BZ3109', 'Accessible', 'Maruti', 'Baleno', 'Midnight Navy', '2026-09-15 16:20:00'),
(7, 9, 'HR51CD9042', 'EV', 'MG', 'ZS EV', 'Arctic White', '2026-09-18 10:20:00'),
(8, 3, 'HR26XY9900', 'Motorcycle', 'Yamaha', 'MT-15', 'Cyan Storm', '2026-09-22 15:10:00'),
(9, 4, 'DL3CBB2044', 'EV', 'BYD', 'Atto 3', 'Graphite Gray', '2026-09-25 09:40:00'),
(10, 6, 'MH12RT1188', 'Sedan', 'Skoda', 'Slavia', 'Steel Blue', '2026-09-28 11:50:00');

INSERT INTO PARKING_ZONE (zone_id, zone_name, location, zone_type, total_capacity, description, status) VALUES
(1, 'Zone A - Academic Core', 'North Block, Level B1', 'General', 8, 'Primary multi-vehicle smart bay near Academic Center', 'Active'),
(2, 'Zone B - EV SuperHub', 'Central Plaza, Ground Deck', 'EV Charging', 6, 'High-output 22kW & 60kW DC fast-charging parking deck', 'Active'),
(3, 'Zone C - Faculty & VIP', 'Executive Wing, East Gate', 'Faculty & Staff', 6, 'Protected bays for faculty, VIP, and accessible permits', 'Active'),
(4, 'Zone D - Resident Annex', 'Residential Towers West', 'Resident', 6, '24/7 overnight resident permit deck', 'Active'),
(5, 'Zone E - Visitor Plaza', 'Main Gate Entry Courtyard', 'Visitor', 4, 'Short-stay visitor pass & security check bays', 'Active');

INSERT INTO PARKING_SLOT (slot_id, zone_id, slot_number, slot_type, status, hourly_rate) VALUES
(1, 1, 'A-01', 'Regular', 'Occupied', 30.00),
(2, 1, 'A-02', 'Regular', 'Available', 30.00),
(3, 1, 'A-03', 'Regular', 'Reserved', 30.00),
(4, 1, 'A-04', 'Regular', 'Available', 30.00),
(5, 1, 'A-05', 'Accessible', 'Available', 20.00),
(6, 1, 'A-06', 'Regular', 'Occupied', 30.00),
(7, 1, 'A-07', 'Regular', 'Maintenance', 30.00),
(8, 1, 'A-08', 'Regular', 'Available', 30.00),
(9, 2, 'B-01', 'EV', 'Occupied', 55.00),
(10, 2, 'B-02', 'EV', 'Available', 55.00),
(11, 2, 'B-03', 'EV', 'Reserved', 55.00),
(12, 2, 'B-04', 'EV', 'Available', 55.00),
(13, 2, 'B-05', 'EV', 'Available', 55.00),
(14, 2, 'B-06', 'EV', 'Maintenance', 55.00),
(15, 3, 'C-01', 'VIP', 'Occupied', 80.00),
(16, 3, 'C-02', 'VIP', 'Available', 80.00),
(17, 3, 'C-03', 'Accessible', 'Occupied', 20.00),
(18, 3, 'C-04', 'Regular', 'Available', 40.00),
(19, 3, 'C-05', 'Regular', 'Reserved', 40.00),
(20, 3, 'C-06', 'Regular', 'Available', 40.00),
(21, 4, 'D-01', 'Regular', 'Occupied', 25.00),
(22, 4, 'D-02', 'Regular', 'Available', 25.00),
(23, 4, 'D-03', 'EV', 'Available', 45.00),
(24, 4, 'D-04', 'Regular', 'Occupied', 25.00),
(25, 4, 'D-05', 'Regular', 'Available', 25.00),
(26, 4, 'D-06', 'Accessible', 'Available', 20.00),
(27, 5, 'E-01', 'Regular', 'Reserved', 35.00),
(28, 5, 'E-02', 'Regular', 'Available', 35.00),
(29, 5, 'E-03', 'Regular', 'Available', 35.00),
(30, 5, 'E-04', 'Accessible', 'Available', 20.00);

INSERT INTO RESERVATION (reservation_id, user_id, vehicle_id, slot_id, start_time, end_time, reservation_status, created_at) VALUES
(1, 3, 1, 9, '2026-11-21 08:30:00', '2026-11-21 14:30:00', 'Active', '2026-11-21 07:45:00'),
(2, 4, 2, 19, '2026-11-21 11:00:00', '2026-11-21 17:00:00', 'Confirmed', '2026-11-21 09:00:00'),
(3, 7, 5, 15, '2026-11-21 09:00:00', '2026-11-21 18:00:00', 'Active', '2026-11-20 19:00:00'),
(4, 9, 7, 11, '2026-11-21 12:00:00', '2026-11-21 16:00:00', 'Confirmed', '2026-11-21 10:00:00'),
(5, 6, 4, 3, '2026-11-21 13:00:00', '2026-11-21 17:00:00', 'Confirmed', '2026-11-21 10:15:00'),
(6, 5, 3, 21, '2026-11-20 08:00:00', '2026-11-20 12:30:00', 'Completed', '2026-11-19 20:00:00'),
(7, 8, 6, 17, '2026-11-20 09:30:00', '2026-11-20 15:00:00', 'Completed', '2026-11-19 21:10:00'),
(8, 6, 10, 4, '2026-11-19 10:00:00', '2026-11-19 13:00:00', 'No-Show', '2026-11-18 18:00:00'),
(9, 9, 7, 12, '2026-11-18 14:00:00', '2026-11-18 17:00:00', 'Cancelled', '2026-11-18 09:00:00'),
(10, 4, 9, 10, '2026-11-17 09:00:00', '2026-11-17 13:00:00', 'Completed', '2026-11-16 22:00:00');

INSERT INTO ENTRY_LOG (entry_id, vehicle_id, slot_id, entry_time, security_id, entry_status) VALUES
(1, 1, 9, '2026-11-21 08:34:00', 2, 'Entered'),
(2, 5, 15, '2026-11-21 09:05:00', 2, 'Entered'),
(3, 6, 17, '2026-11-21 09:20:00', 10, 'Entered'),
(4, 3, 21, '2026-11-21 09:50:00', 2, 'Entered'),
(5, 4, 1, '2026-11-21 10:10:00', 10, 'Entered'),
(6, 10, 6, '2026-11-21 10:25:00', 2, 'Entered'),
(7, 2, 24, '2026-11-20 10:00:00', 2, 'Entered'),
(8, 9, 10, '2026-11-17 09:12:00', 10, 'Entered');

INSERT INTO EXIT_LOG (exit_id, vehicle_id, slot_id, exit_time, parking_duration, total_amount, security_id) VALUES
(1, 2, 24, '2026-11-20 14:15:00', 255, 125.00, 2),
(2, 9, 10, '2026-11-17 13:05:00', 233, 220.00, 10),
(3, 3, 21, '2026-11-20 12:25:00', 265, 125.00, 2),
(4, 6, 17, '2026-11-20 14:45:00', 315, 120.00, 10);

INSERT INTO VISITOR_PASS (pass_id, visitor_name, visitor_phone, vehicle_number, host_user_id, zone_id, slot_id, valid_from, valid_until, pass_status) VALUES
(1, 'Siddharth Kapoor', '+91-9810112233', 'DL10CK4091', 4, 5, 27, '2026-11-21 09:00:00', '2026-11-21 19:00:00', 'Approved'),
(2, 'Neha Deshmukh', '+91-9820445566', 'MH02ER8832', 7, 5, NULL, '2026-11-21 11:30:00', '2026-11-21 17:30:00', 'Pending'),
(3, 'Arjun Batra', '+91-9811990011', 'HR26DK5510', 5, 5, 28, '2026-11-19 10:00:00', '2026-11-19 18:00:00', 'Expired');

INSERT INTO VIOLATION (violation_id, vehicle_id, slot_id, violation_type, description, violation_time, penalty_amount, violation_status) VALUES
(1, 4, 15, 'Reserved Slot Violation', 'Parked motorcycle in VIP bay C-01 without permit', '2026-11-18 11:20:00', 500.00, 'Paid'),
(2, 4, 9, 'Wrong Zone Parking', 'Non-EV vehicle parked inside EV SuperHub charging slot B-01', '2026-11-20 15:40:00', 750.00, 'Unpaid'),
(3, 10, 6, 'Overstay', 'Exceeded reserved window by 95 minutes in Zone A', '2026-11-19 16:30:00', 300.00, 'Unpaid'),
(4, 3, 3, 'Unauthorized Parking', 'Entered reserved slot A-03 prior to reservation window', '2026-11-17 14:10:00', 400.00, 'Paid');

INSERT INTO PAYMENT (payment_id, user_id, reservation_id, violation_id, amount, payment_method, payment_status, payment_date, transaction_reference) VALUES
(1, 4, 10, NULL, 220.00, 'UPI', 'Paid', '2026-11-17 13:10:00', 'TXN-20261117-001'),
(2, 5, 6, NULL, 125.00, 'Card', 'Paid', '2026-11-20 12:30:00', 'TXN-20261120-002'),
(3, 8, 7, NULL, 120.00, 'Campus Wallet', 'Paid', '2026-11-20 14:50:00', 'TXN-20261120-003'),
(4, 6, NULL, 1, 500.00, 'UPI', 'Paid', '2026-11-18 14:00:00', 'PEN-20261118-004'),
(5, 5, NULL, 4, 400.00, 'NetBanking', 'Paid', '2026-11-17 17:45:00', 'PEN-20261117-005'),
(6, 6, NULL, 2, 750.00, 'Campus Wallet', 'Pending', '2026-11-20 15:45:00', 'PEN-20261120-006'),
(7, 6, NULL, 3, 300.00, 'Campus Wallet', 'Pending', '2026-11-19 16:35:00', 'PEN-20261119-007'),
(8, 3, 1, NULL, 330.00, 'UPI', 'Paid', '2026-11-21 08:30:00', 'TXN-20261121-008');

-- ============================================================================
-- ROLE-BASED ACCESS CONTROL (RBAC) MYSQL PRIVILEGES REFERENCE
-- ============================================================================
-- CREATE USER IF NOT EXISTS 'parking_admin'@'%' IDENTIFIED BY '<strong_password>';
-- CREATE USER IF NOT EXISTS 'parking_security'@'%' IDENTIFIED BY '<strong_password>';
-- CREATE USER IF NOT EXISTS 'parking_operator'@'%' IDENTIFIED BY '<strong_password>';
-- CREATE USER IF NOT EXISTS 'parking_user'@'%' IDENTIFIED BY '<strong_password>';
--
-- GRANT ALL PRIVILEGES ON smart_parking_db.* TO 'parking_admin'@'%';
-- GRANT SELECT, INSERT, UPDATE ON smart_parking_db.ENTRY_LOG TO 'parking_security'@'%';
-- GRANT SELECT, INSERT, UPDATE ON smart_parking_db.EXIT_LOG TO 'parking_security'@'%';
-- GRANT SELECT, INSERT, UPDATE ON smart_parking_db.VIOLATION TO 'parking_security'@'%';
-- GRANT SELECT, UPDATE ON smart_parking_db.VISITOR_PASS TO 'parking_security'@'%';
-- GRANT SELECT, UPDATE ON smart_parking_db.PARKING_SLOT TO 'parking_operator'@'%';
-- GRANT SELECT, INSERT, UPDATE ON smart_parking_db.RESERVATION TO 'parking_operator'@'%';
-- GRANT SELECT ON smart_parking_db.vw_current_available_slots TO 'parking_user'@'%';
-- GRANT SELECT, INSERT ON smart_parking_db.RESERVATION TO 'parking_user'@'%';
-- FLUSH PRIVILEGES;
