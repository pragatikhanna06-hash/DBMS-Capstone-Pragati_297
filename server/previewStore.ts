import type {
  DbEntryLog,
  DbExitLog,
  DbParkingSlot,
  DbParkingZone,
  DbPayment,
  DbReservation,
  DbUser,
  DbVehicle,
  DbViolation,
  DbVisitorPass,
  MongoParkingEvent,
} from '../src/types/dbms.ts';

export class PreviewDatabaseStore {
  users: DbUser[] = [
    { user_id: 1, full_name: 'Pragati Khanna', email: 'pragati.khanna@campus.edu', phone: '+91-9811044210', user_type: 'Admin', department: 'IT & Infrastructure', created_at: '2026-09-01 09:00:00', status: 'Active' },
    { user_id: 2, full_name: 'Vikram Singh', email: 'vikram.security@campus.edu', phone: '+91-9811044211', user_type: 'Security', department: 'Campus Security Gate-1', created_at: '2026-09-02 08:30:00', status: 'Active' },
    { user_id: 3, full_name: 'Ananya Sharma', email: 'ananya.sharma@campus.edu', phone: '+91-9876543210', user_type: 'Student', department: 'Computer Science', created_at: '2026-09-05 10:15:00', status: 'Active' },
    { user_id: 4, full_name: 'Dr. Rajesh Iyer', email: 'rajesh.iyer@campus.edu', phone: '+91-9822113344', user_type: 'Employee', department: 'Data Science Faculty', created_at: '2026-09-06 11:00:00', status: 'Active' },
    { user_id: 5, full_name: 'Priya Nair', email: 'priya.nair@campus.edu', phone: '+91-9845098765', user_type: 'Resident', department: 'Faculty Towers Block-B', created_at: '2026-09-08 14:20:00', status: 'Active' },
    { user_id: 6, full_name: 'Kabir Verma', email: 'kabir.verma@campus.edu', phone: '+91-9899123456', user_type: 'Student', department: 'Mechanical Engg', created_at: '2026-09-10 09:45:00', status: 'Active' },
    { user_id: 7, full_name: 'Meera Krishnan', email: 'meera.krishnan@campus.edu', phone: '+91-9818223399', user_type: 'Employee', department: 'Administration', created_at: '2026-09-12 12:10:00', status: 'Active' },
    { user_id: 8, full_name: 'Rohan Malhotra', email: 'rohan.malhotra@campus.edu', phone: '+91-9871002233', user_type: 'Resident', department: 'Staff Quarters Block-A', created_at: '2026-09-15 16:00:00', status: 'Active' },
    { user_id: 9, full_name: 'Sana Qureshi', email: 'sana.qureshi@campus.edu', phone: '+91-9810998877', user_type: 'Student', department: 'Electrical Engg', created_at: '2026-09-18 10:00:00', status: 'Active' },
    { user_id: 10, full_name: 'Deepak Chauhan', email: 'deepak.security@campus.edu', phone: '+91-9811556677', user_type: 'Security', department: 'Campus Security Gate-2', created_at: '2026-09-20 07:45:00', status: 'Active' },
  ];

  vehicles: DbVehicle[] = [
    { vehicle_id: 1, user_id: 3, registration_number: 'HR26AB1234', vehicle_type: 'EV', brand: 'Tata', model: 'Nexon EV Max', color: 'Teal Cyan', created_at: '2026-09-05 10:30:00' },
    { vehicle_id: 2, user_id: 4, registration_number: 'DL3CAF8891', vehicle_type: 'Sedan', brand: 'Honda', model: 'City ZX', color: 'Silver', created_at: '2026-09-06 11:15:00' },
    { vehicle_id: 3, user_id: 5, registration_number: 'KA01MX4420', vehicle_type: 'SUV', brand: 'Hyundai', model: 'Creta', color: 'Obsidian Black', created_at: '2026-09-08 14:30:00' },
    { vehicle_id: 4, user_id: 6, registration_number: 'MH12PQ7712', vehicle_type: 'Motorcycle', brand: 'Royal Enfield', model: 'Meteor 350', color: 'Matte Blue', created_at: '2026-09-10 10:00:00' },
    { vehicle_id: 5, user_id: 7, registration_number: 'DL8SAA5501', vehicle_type: 'VIP', brand: 'BMW', model: 'iX1 xDrive', color: 'Mineral White', created_at: '2026-09-12 12:30:00' },
    { vehicle_id: 6, user_id: 8, registration_number: 'UP16BZ3109', vehicle_type: 'Accessible', brand: 'Maruti', model: 'Baleno', color: 'Midnight Navy', created_at: '2026-09-15 16:20:00' },
    { vehicle_id: 7, user_id: 9, registration_number: 'HR51CD9042', vehicle_type: 'EV', brand: 'MG', model: 'ZS EV', color: 'Arctic White', created_at: '2026-09-18 10:20:00' },
    { vehicle_id: 8, user_id: 3, registration_number: 'HR26XY9900', vehicle_type: 'Motorcycle', brand: 'Yamaha', model: 'MT-15', color: 'Cyan Storm', created_at: '2026-09-22 15:10:00' },
    { vehicle_id: 9, user_id: 4, registration_number: 'DL3CBB2044', vehicle_type: 'EV', brand: 'BYD', model: 'Atto 3', color: 'Graphite Gray', created_at: '2026-09-25 09:40:00' },
    { vehicle_id: 10, user_id: 6, registration_number: 'MH12RT1188', vehicle_type: 'Sedan', brand: 'Skoda', model: 'Slavia', color: 'Steel Blue', created_at: '2026-09-28 11:50:00' },
  ];

  zones: DbParkingZone[] = [
    { zone_id: 1, zone_name: 'Zone A - Academic Core', location: 'North Block, Level B1', zone_type: 'General', total_capacity: 8, description: 'Primary multi-vehicle smart bay near Academic Center', status: 'Active' },
    { zone_id: 2, zone_name: 'Zone B - EV SuperHub', location: 'Central Plaza, Ground Deck', zone_type: 'EV Charging', total_capacity: 6, description: 'High-output 22kW & 60kW DC fast-charging parking deck', status: 'Active' },
    { zone_id: 3, zone_name: 'Zone C - Faculty & VIP', location: 'Executive Wing, East Gate', zone_type: 'Faculty & Staff', total_capacity: 6, description: 'Protected bays for faculty, VIP, and accessible permits', status: 'Active' },
    { zone_id: 4, zone_name: 'Zone D - Resident Annex', location: 'Residential Towers West', zone_type: 'Resident', total_capacity: 6, description: '24/7 overnight resident permit deck', status: 'Active' },
    { zone_id: 5, zone_name: 'Zone E - Visitor Plaza', location: 'Main Gate Entry Courtyard', zone_type: 'Visitor', total_capacity: 4, description: 'Short-stay visitor pass & security check bays', status: 'Active' },
  ];

  slots: DbParkingSlot[] = [
    { slot_id: 1, zone_id: 1, slot_number: 'A-01', slot_type: 'Regular', status: 'Occupied', hourly_rate: 30 },
    { slot_id: 2, zone_id: 1, slot_number: 'A-02', slot_type: 'Regular', status: 'Available', hourly_rate: 30 },
    { slot_id: 3, zone_id: 1, slot_number: 'A-03', slot_type: 'Regular', status: 'Reserved', hourly_rate: 30 },
    { slot_id: 4, zone_id: 1, slot_number: 'A-04', slot_type: 'Regular', status: 'Available', hourly_rate: 30 },
    { slot_id: 5, zone_id: 1, slot_number: 'A-05', slot_type: 'Accessible', status: 'Available', hourly_rate: 20 },
    { slot_id: 6, zone_id: 1, slot_number: 'A-06', slot_type: 'Regular', status: 'Occupied', hourly_rate: 30 },
    { slot_id: 7, zone_id: 1, slot_number: 'A-07', slot_type: 'Regular', status: 'Maintenance', hourly_rate: 30 },
    { slot_id: 8, zone_id: 1, slot_number: 'A-08', slot_type: 'Regular', status: 'Available', hourly_rate: 30 },
    { slot_id: 9, zone_id: 2, slot_number: 'B-01', slot_type: 'EV', status: 'Occupied', hourly_rate: 55 },
    { slot_id: 10, zone_id: 2, slot_number: 'B-02', slot_type: 'EV', status: 'Available', hourly_rate: 55 },
    { slot_id: 11, zone_id: 2, slot_number: 'B-03', slot_type: 'EV', status: 'Reserved', hourly_rate: 55 },
    { slot_id: 12, zone_id: 2, slot_number: 'B-04', slot_type: 'EV', status: 'Available', hourly_rate: 55 },
    { slot_id: 13, zone_id: 2, slot_number: 'B-05', slot_type: 'EV', status: 'Available', hourly_rate: 55 },
    { slot_id: 14, zone_id: 2, slot_number: 'B-06', slot_type: 'EV', status: 'Maintenance', hourly_rate: 55 },
    { slot_id: 15, zone_id: 3, slot_number: 'C-01', slot_type: 'VIP', status: 'Occupied', hourly_rate: 80 },
    { slot_id: 16, zone_id: 3, slot_number: 'C-02', slot_type: 'VIP', status: 'Available', hourly_rate: 80 },
    { slot_id: 17, zone_id: 3, slot_number: 'C-03', slot_type: 'Accessible', status: 'Occupied', hourly_rate: 20 },
    { slot_id: 18, zone_id: 3, slot_number: 'C-04', slot_type: 'Regular', status: 'Available', hourly_rate: 40 },
    { slot_id: 19, zone_id: 3, slot_number: 'C-05', slot_type: 'Regular', status: 'Reserved', hourly_rate: 40 },
    { slot_id: 20, zone_id: 3, slot_number: 'C-06', slot_type: 'Regular', status: 'Available', hourly_rate: 40 },
    { slot_id: 21, zone_id: 4, slot_number: 'D-01', slot_type: 'Regular', status: 'Occupied', hourly_rate: 25 },
    { slot_id: 22, zone_id: 4, slot_number: 'D-02', slot_type: 'Regular', status: 'Available', hourly_rate: 25 },
    { slot_id: 23, zone_id: 4, slot_number: 'D-03', slot_type: 'EV', status: 'Available', hourly_rate: 45 },
    { slot_id: 24, zone_id: 4, slot_number: 'D-04', slot_type: 'Regular', status: 'Occupied', hourly_rate: 25 },
    { slot_id: 25, zone_id: 4, slot_number: 'D-05', slot_type: 'Regular', status: 'Available', hourly_rate: 25 },
    { slot_id: 26, zone_id: 4, slot_number: 'D-06', slot_type: 'Accessible', status: 'Available', hourly_rate: 20 },
    { slot_id: 27, zone_id: 5, slot_number: 'E-01', slot_type: 'Regular', status: 'Reserved', hourly_rate: 35 },
    { slot_id: 28, zone_id: 5, slot_number: 'E-02', slot_type: 'Regular', status: 'Available', hourly_rate: 35 },
    { slot_id: 29, zone_id: 5, slot_number: 'E-03', slot_type: 'Regular', status: 'Available', hourly_rate: 35 },
    { slot_id: 30, zone_id: 5, slot_number: 'E-04', slot_type: 'Accessible', status: 'Available', hourly_rate: 20 },
  ];

  reservations: DbReservation[] = [
    { reservation_id: 1, user_id: 3, vehicle_id: 1, slot_id: 9, start_time: '2026-11-21 08:30:00', end_time: '2026-11-21 14:30:00', reservation_status: 'Active', created_at: '2026-11-21 07:45:00' },
    { reservation_id: 2, user_id: 4, vehicle_id: 2, slot_id: 19, start_time: '2026-11-21 11:00:00', end_time: '2026-11-21 17:00:00', reservation_status: 'Confirmed', created_at: '2026-11-21 09:00:00' },
    { reservation_id: 3, user_id: 7, vehicle_id: 5, slot_id: 15, start_time: '2026-11-21 09:00:00', end_time: '2026-11-21 18:00:00', reservation_status: 'Active', created_at: '2026-11-20 19:00:00' },
    { reservation_id: 4, user_id: 9, vehicle_id: 7, slot_id: 11, start_time: '2026-11-21 12:00:00', end_time: '2026-11-21 16:00:00', reservation_status: 'Confirmed', created_at: '2026-11-21 10:00:00' },
    { reservation_id: 5, user_id: 6, vehicle_id: 4, slot_id: 3, start_time: '2026-11-21 13:00:00', end_time: '2026-11-21 17:00:00', reservation_status: 'Confirmed', created_at: '2026-11-21 10:15:00' },
    { reservation_id: 6, user_id: 5, vehicle_id: 3, slot_id: 21, start_time: '2026-11-20 08:00:00', end_time: '2026-11-20 12:30:00', reservation_status: 'Completed', created_at: '2026-11-19 20:00:00' },
    { reservation_id: 7, user_id: 8, vehicle_id: 6, slot_id: 17, start_time: '2026-11-20 09:30:00', end_time: '2026-11-20 15:00:00', reservation_status: 'Completed', created_at: '2026-11-19 21:10:00' },
    { reservation_id: 8, user_id: 6, vehicle_id: 10, slot_id: 4, start_time: '2026-11-19 10:00:00', end_time: '2026-11-19 13:00:00', reservation_status: 'No-Show', created_at: '2026-11-18 18:00:00' },
    { reservation_id: 9, user_id: 9, vehicle_id: 7, slot_id: 12, start_time: '2026-11-18 14:00:00', end_time: '2026-11-18 17:00:00', reservation_status: 'Cancelled', created_at: '2026-11-18 09:00:00' },
    { reservation_id: 10, user_id: 4, vehicle_id: 9, slot_id: 10, start_time: '2026-11-17 09:00:00', end_time: '2026-11-17 13:00:00', reservation_status: 'Completed', created_at: '2026-11-16 22:00:00' },
  ];

  entryLogs: DbEntryLog[] = [
    { entry_id: 1, vehicle_id: 1, slot_id: 9, entry_time: '2026-11-21 08:34:00', security_id: 2, entry_status: 'Entered' },
    { entry_id: 2, vehicle_id: 5, slot_id: 15, entry_time: '2026-11-21 09:05:00', security_id: 2, entry_status: 'Entered' },
    { entry_id: 3, vehicle_id: 6, slot_id: 17, entry_time: '2026-11-21 09:20:00', security_id: 10, entry_status: 'Entered' },
    { entry_id: 4, vehicle_id: 3, slot_id: 21, entry_time: '2026-11-21 09:50:00', security_id: 2, entry_status: 'Entered' },
    { entry_id: 5, vehicle_id: 4, slot_id: 1, entry_time: '2026-11-21 10:10:00', security_id: 10, entry_status: 'Entered' },
    { entry_id: 6, vehicle_id: 10, slot_id: 6, entry_time: '2026-11-21 10:25:00', security_id: 2, entry_status: 'Entered' },
    { entry_id: 7, vehicle_id: 2, slot_id: 24, entry_time: '2026-11-20 10:00:00', security_id: 2, entry_status: 'Entered' },
    { entry_id: 8, vehicle_id: 9, slot_id: 10, entry_time: '2026-11-17 09:12:00', security_id: 10, entry_status: 'Entered' },
  ];

  exitLogs: DbExitLog[] = [
    { exit_id: 1, vehicle_id: 2, slot_id: 24, exit_time: '2026-11-20 14:15:00', parking_duration: 255, total_amount: 125, security_id: 2 },
    { exit_id: 2, vehicle_id: 9, slot_id: 10, exit_time: '2026-11-17 13:05:00', parking_duration: 233, total_amount: 220, security_id: 10 },
    { exit_id: 3, vehicle_id: 3, slot_id: 21, exit_time: '2026-11-20 12:25:00', parking_duration: 265, total_amount: 125, security_id: 2 },
    { exit_id: 4, vehicle_id: 6, slot_id: 17, exit_time: '2026-11-20 14:45:00', parking_duration: 315, total_amount: 120, security_id: 10 },
  ];

  visitorPasses: DbVisitorPass[] = [
    { pass_id: 1, visitor_name: 'Siddharth Kapoor', visitor_phone: '+91-9810112233', vehicle_number: 'DL10CK4091', host_user_id: 4, zone_id: 5, slot_id: 27, valid_from: '2026-11-21 09:00:00', valid_until: '2026-11-21 19:00:00', pass_status: 'Approved' },
    { pass_id: 2, visitor_name: 'Neha Deshmukh', visitor_phone: '+91-9820445566', vehicle_number: 'MH02ER8832', host_user_id: 7, zone_id: 5, slot_id: null, valid_from: '2026-11-21 11:30:00', valid_until: '2026-11-21 17:30:00', pass_status: 'Pending' },
    { pass_id: 3, visitor_name: 'Arjun Batra', visitor_phone: '+91-9811990011', vehicle_number: 'HR26DK5510', host_user_id: 5, zone_id: 5, slot_id: 28, valid_from: '2026-11-19 10:00:00', valid_until: '2026-11-19 18:00:00', pass_status: 'Expired' },
  ];

  violations: DbViolation[] = [
    { violation_id: 1, vehicle_id: 4, slot_id: 15, violation_type: 'Reserved Slot Violation', description: 'Parked motorcycle in VIP bay C-01 without permit', violation_time: '2026-11-18 11:20:00', penalty_amount: 500, violation_status: 'Paid' },
    { violation_id: 2, vehicle_id: 4, slot_id: 9, violation_type: 'Wrong Zone Parking', description: 'Non-EV vehicle parked inside EV SuperHub charging slot B-01', violation_time: '2026-11-20 15:40:00', penalty_amount: 750, violation_status: 'Unpaid' },
    { violation_id: 3, vehicle_id: 10, slot_id: 6, violation_type: 'Overstay', description: 'Exceeded reserved window by 95 minutes in Zone A', violation_time: '2026-11-19 16:30:00', penalty_amount: 300, violation_status: 'Unpaid' },
    { violation_id: 4, vehicle_id: 3, slot_id: 3, violation_type: 'Unauthorized Parking', description: 'Entered reserved slot A-03 prior to reservation window', violation_time: '2026-11-17 14:10:00', penalty_amount: 400, violation_status: 'Paid' },
  ];

  payments: DbPayment[] = [
    { payment_id: 1, user_id: 4, reservation_id: 10, violation_id: null, amount: 220, payment_method: 'UPI', payment_status: 'Paid', payment_date: '2026-11-17 13:10:00', transaction_reference: 'TXN-20261117-001' },
    { payment_id: 2, user_id: 5, reservation_id: 6, violation_id: null, amount: 125, payment_method: 'Card', payment_status: 'Paid', payment_date: '2026-11-20 12:30:00', transaction_reference: 'TXN-20261120-002' },
    { payment_id: 3, user_id: 8, reservation_id: 7, violation_id: null, amount: 120, payment_method: 'Campus Wallet', payment_status: 'Paid', payment_date: '2026-11-20 14:50:00', transaction_reference: 'TXN-20261120-003' },
    { payment_id: 4, user_id: 6, reservation_id: null, violation_id: 1, amount: 500, payment_method: 'UPI', payment_status: 'Paid', payment_date: '2026-11-18 14:00:00', transaction_reference: 'PEN-20261118-004' },
    { payment_id: 5, user_id: 5, reservation_id: null, violation_id: 4, amount: 400, payment_method: 'NetBanking', payment_status: 'Paid', payment_date: '2026-11-17 17:45:00', transaction_reference: 'PEN-20261117-005' },
    { payment_id: 6, user_id: 6, reservation_id: null, violation_id: 2, amount: 750, payment_method: 'Campus Wallet', payment_status: 'Pending', payment_date: '2026-11-20 15:45:00', transaction_reference: 'PEN-20261120-006' },
    { payment_id: 7, user_id: 6, reservation_id: null, violation_id: 3, amount: 300, payment_method: 'Campus Wallet', payment_status: 'Pending', payment_date: '2026-11-19 16:35:00', transaction_reference: 'PEN-20261119-007' },
    { payment_id: 8, user_id: 3, reservation_id: 1, violation_id: null, amount: 330, payment_method: 'UPI', payment_status: 'Paid', payment_date: '2026-11-21 08:30:00', transaction_reference: 'TXN-20261121-008' },
  ];

  mongoEvents: MongoParkingEvent[] = [
    {
      event_id: 'EVT1001',
      vehicle_number: 'HR26AB1234',
      event_type: 'ENTRY',
      zone: 'Zone B - EV SuperHub',
      slot_number: 'B-01',
      timestamp: '2026-11-21T08:34:00Z',
      metadata: { device_id: 'GATE01', security_id: 2, anpr_confidence: 0.992, ev_charger_port: 'DC-60kW-01' },
    },
    {
      event_id: 'EVT1002',
      vehicle_number: 'DL8SAA5501',
      event_type: 'ENTRY',
      zone: 'Zone C - Faculty & VIP',
      slot_number: 'C-01',
      timestamp: '2026-11-21T09:05:00Z',
      metadata: { device_id: 'GATE02', security_id: 2, rfid_tag: 'VIP-9918', barrier_ms: 420 },
    },
    {
      event_id: 'EVT1003',
      vehicle_number: 'MH12PQ7712',
      event_type: 'VIOLATION',
      zone: 'Zone B - EV SuperHub',
      slot_number: 'B-01',
      timestamp: '2026-11-20T15:40:00Z',
      metadata: { device_id: 'CAM-B01', sensor_alert: 'NON_EV_IN_EV_BAY', penalty_inr: 750 },
    },
    {
      event_id: 'EVT1004',
      vehicle_number: 'DL3CAF8891',
      event_type: 'EXIT',
      zone: 'Zone D - Resident Annex',
      slot_number: 'D-04',
      timestamp: '2026-11-20T14:15:00Z',
      metadata: { device_id: 'EXIT01', security_id: 2, duration_min: 255, fee_inr: 125 },
    },
    {
      event_id: 'EVT1005',
      vehicle_number: 'HR51CD9042',
      event_type: 'ALLOCATION',
      zone: 'Zone B - EV SuperHub',
      slot_number: 'B-03',
      timestamp: '2026-11-21T10:00:00Z',
      metadata: { procedure: 'sp_dynamic_allocate_slot', lock_mode: 'FOR UPDATE', latency_ms: 8 },
    },
  ];

  // Enriched view helpers
  getZonesWithStats(): DbParkingZone[] {
    return this.zones.map((z) => {
      const zSlots = this.slots.filter((s) => s.zone_id === z.zone_id);
      const available = zSlots.filter((s) => s.status === 'Available').length;
      const occupied = zSlots.filter((s) => s.status === 'Occupied').length;
      const reserved = zSlots.filter((s) => s.status === 'Reserved').length;
      const maintenance = zSlots.filter((s) => s.status === 'Maintenance').length;
      const util = zSlots.length > 0 ? Number((((occupied + reserved) / zSlots.length) * 100).toFixed(1)) : 0;
      return {
        ...z,
        available_slots: available,
        occupied_slots: occupied,
        reserved_slots: reserved,
        maintenance_slots: maintenance,
        utilization_pct: util,
      };
    });
  }

  getEnrichedSlots(): DbParkingSlot[] {
    return this.slots.map((s) => ({
      ...s,
      zone_name: this.zones.find((z) => z.zone_id === s.zone_id)?.zone_name || 'Unknown Zone',
    }));
  }

  getEnrichedVehicles(): DbVehicle[] {
    return this.vehicles.map((v) => {
      const owner = this.users.find((u) => u.user_id === v.user_id);
      return {
        ...v,
        owner_name: owner?.full_name || 'Unknown',
        owner_email: owner?.email || '',
        owner_type: owner?.user_type,
      };
    });
  }

  getEnrichedReservations(): DbReservation[] {
    return this.reservations.map((r) => {
      const u = this.users.find((x) => x.user_id === r.user_id);
      const v = this.vehicles.find((x) => x.vehicle_id === r.vehicle_id);
      const s = this.slots.find((x) => x.slot_id === r.slot_id);
      const z = s ? this.zones.find((x) => x.zone_id === s.zone_id) : undefined;
      return {
        ...r,
        user_name: u?.full_name,
        registration_number: v?.registration_number,
        slot_number: s?.slot_number,
        zone_name: z?.zone_name,
      };
    });
  }

  getEnrichedEntryLogs(): DbEntryLog[] {
    return this.entryLogs.map((e) => {
      const v = this.vehicles.find((x) => x.vehicle_id === e.vehicle_id);
      const s = this.slots.find((x) => x.slot_id === e.slot_id);
      const z = s ? this.zones.find((x) => x.zone_id === s.zone_id) : undefined;
      const sec = this.users.find((x) => x.user_id === e.security_id);
      return {
        ...e,
        registration_number: v?.registration_number,
        slot_number: s?.slot_number,
        zone_name: z?.zone_name,
        security_name: sec?.full_name,
      };
    });
  }

  getEnrichedExitLogs(): DbExitLog[] {
    return this.exitLogs.map((e) => {
      const v = this.vehicles.find((x) => x.vehicle_id === e.vehicle_id);
      const s = this.slots.find((x) => x.slot_id === e.slot_id);
      const z = s ? this.zones.find((x) => x.zone_id === s.zone_id) : undefined;
      const sec = this.users.find((x) => x.user_id === e.security_id);
      return {
        ...e,
        registration_number: v?.registration_number,
        slot_number: s?.slot_number,
        zone_name: z?.zone_name,
        security_name: sec?.full_name,
      };
    });
  }

  getEnrichedVisitorPasses(): DbVisitorPass[] {
    return this.visitorPasses.map((p) => {
      const host = this.users.find((x) => x.user_id === p.host_user_id);
      const zone = this.zones.find((x) => x.zone_id === p.zone_id);
      const slot = p.slot_id ? this.slots.find((x) => x.slot_id === p.slot_id) : undefined;
      return {
        ...p,
        host_name: host?.full_name,
        zone_name: zone?.zone_name,
        slot_number: slot?.slot_number || null,
      };
    });
  }

  getEnrichedViolations(): DbViolation[] {
    return this.violations.map((vi) => {
      const v = this.vehicles.find((x) => x.vehicle_id === vi.vehicle_id);
      const owner = v ? this.users.find((x) => x.user_id === v.user_id) : undefined;
      const s = this.slots.find((x) => x.slot_id === vi.slot_id);
      const z = s ? this.zones.find((x) => x.zone_id === s.zone_id) : undefined;
      return {
        ...vi,
        registration_number: v?.registration_number,
        owner_name: owner?.full_name,
        slot_number: s?.slot_number,
        zone_name: z?.zone_name,
      };
    });
  }

  getEnrichedPayments(): DbPayment[] {
    return this.payments.map((p) => {
      const u = this.users.find((x) => x.user_id === p.user_id);
      return {
        ...p,
        user_name: u?.full_name,
      };
    });
  }

  nextId<T extends Record<string, unknown>>(arr: T[], key: keyof T): number {
    return arr.reduce((max, item) => Math.max(max, Number(item[key] || 0)), 0) + 1;
  }
}

export const previewStore = new PreviewDatabaseStore();
