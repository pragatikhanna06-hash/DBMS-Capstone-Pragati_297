export type UserType = 'Student' | 'Employee' | 'Resident' | 'Admin' | 'Security';
export type UserStatus = 'Active' | 'Suspended' | 'Inactive';
export type VehicleType = 'Sedan' | 'SUV' | 'EV' | 'Motorcycle' | 'Accessible' | 'VIP';
export type ZoneType = 'General' | 'EV Charging' | 'Faculty & Staff' | 'Resident' | 'VIP' | 'Visitor';
export type ZoneStatus = 'Active' | 'Full' | 'Maintenance';
export type SlotType = 'Regular' | 'EV' | 'Accessible' | 'VIP';
export type SlotStatus = 'Available' | 'Occupied' | 'Reserved' | 'Maintenance';
export type ReservationStatus = 'Confirmed' | 'Active' | 'Completed' | 'Cancelled' | 'No-Show';
export type EntryStatus = 'Entered' | 'Denied' | 'Flagged';
export type PassStatus = 'Pending' | 'Approved' | 'Rejected' | 'Expired';
export type ViolationType =
  | 'Unauthorized Parking'
  | 'Overstay'
  | 'Wrong Zone Parking'
  | 'Expired Visitor Pass'
  | 'Reserved Slot Violation';
export type ViolationStatus = 'Unpaid' | 'Paid' | 'Disputed' | 'Waived';
export type PaymentMethod = 'UPI' | 'Card' | 'Campus Wallet' | 'NetBanking' | 'Cash';
export type PaymentStatus = 'Paid' | 'Pending' | 'Failed' | 'Refunded';
export type AppRole = 'ADMIN' | 'SECURITY' | 'PARKING_OPERATOR' | 'USER';

export interface DbUser {
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  user_type: UserType;
  department: string;
  created_at: string;
  status: UserStatus;
}

export interface DbVehicle {
  vehicle_id: number;
  user_id: number;
  registration_number: string;
  vehicle_type: VehicleType;
  brand: string;
  model: string;
  color: string;
  created_at: string;
  owner_name?: string;
  owner_email?: string;
  owner_type?: UserType;
}

export interface DbParkingZone {
  zone_id: number;
  zone_name: string;
  location: string;
  zone_type: ZoneType;
  total_capacity: number;
  description: string;
  status: ZoneStatus;
  available_slots?: number;
  occupied_slots?: number;
  reserved_slots?: number;
  maintenance_slots?: number;
  utilization_pct?: number;
}

export interface DbParkingSlot {
  slot_id: number;
  zone_id: number;
  zone_name?: string;
  slot_number: string;
  slot_type: SlotType;
  status: SlotStatus;
  hourly_rate: number;
}

export interface DbReservation {
  reservation_id: number;
  user_id: number;
  vehicle_id: number;
  slot_id: number;
  start_time: string;
  end_time: string;
  reservation_status: ReservationStatus;
  created_at: string;
  user_name?: string;
  registration_number?: string;
  slot_number?: string;
  zone_name?: string;
}

export interface DbEntryLog {
  entry_id: number;
  vehicle_id: number;
  slot_id: number;
  entry_time: string;
  security_id: number;
  entry_status: EntryStatus;
  registration_number?: string;
  slot_number?: string;
  zone_name?: string;
  security_name?: string;
}

export interface DbExitLog {
  exit_id: number;
  vehicle_id: number;
  slot_id: number;
  exit_time: string;
  parking_duration: number;
  total_amount: number;
  security_id: number;
  registration_number?: string;
  slot_number?: string;
  zone_name?: string;
  security_name?: string;
}

export interface DbVisitorPass {
  pass_id: number;
  visitor_name: string;
  visitor_phone: string;
  vehicle_number: string;
  host_user_id: number;
  zone_id: number;
  slot_id: number | null;
  valid_from: string;
  valid_until: string;
  pass_status: PassStatus;
  host_name?: string;
  zone_name?: string;
  slot_number?: string | null;
}

export interface DbViolation {
  violation_id: number;
  vehicle_id: number;
  slot_id: number;
  violation_type: ViolationType;
  description: string;
  violation_time: string;
  penalty_amount: number;
  violation_status: ViolationStatus;
  registration_number?: string;
  owner_name?: string;
  slot_number?: string;
  zone_name?: string;
}

export interface DbPayment {
  payment_id: number;
  user_id: number;
  reservation_id: number | null;
  violation_id: number | null;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_date: string;
  transaction_reference: string;
  user_name?: string;
}

export interface MongoParkingEvent {
  event_id: string;
  vehicle_number: string;
  event_type: 'ENTRY' | 'EXIT' | 'ALLOCATION' | 'VIOLATION' | 'GATE_SCAN' | 'EV_CHARGE_START';
  zone: string;
  slot_number: string;
  timestamp: string;
  metadata: Record<string, string | number | boolean>;
}

export interface AuthState {
  authenticated: boolean;
  adminClaimed: boolean;
  hasEnvPasscode: boolean;
  role: AppRole | null;
  userEmail: string | null;
  displayName: string | null;
}

export interface DbConnectionInfo {
  dbMode: 'mysql-live' | 'sample-preview';
  mysqlConfigured: boolean;
  mysqlConnected: boolean;
  mysqlError?: string | null;
  mongoMode: 'mongodb-live' | 'sample-preview';
  mongoConfigured: boolean;
  mongoConnected: boolean;
}

export interface SqlCatalogItem {
  id: string;
  category:
    | 'A. DDL Queries'
    | 'B. DML Queries'
    | 'C. Basic SQL Queries'
    | 'D. Joins'
    | 'E. Subqueries'
    | 'F. Set Operations'
    | 'G. Advanced SQL'
    | 'H. Views'
    | 'I. Stored Procedures'
    | 'J. Functions'
    | 'K. Triggers'
    | 'L. Transactions'
    | 'M. Security';
  title: string;
  mandatory?: boolean;
  concept: string;
  relatedTables: string[];
  sql: string;
  explanation: string;
  expectedOutput: string;
  canExecuteOnLiveMysql: boolean;
}

export type NavSectionId =
  | 'overview'
  | 'users'
  | 'vehicles'
  | 'zones'
  | 'slots'
  | 'reservations'
  | 'allocation'
  | 'entry-exit'
  | 'visitors'
  | 'violations'
  | 'payments'
  | 'analytics'
  | 'sql-explorer'
  | 'schema'
  | 'er-diagram'
  | 'normalization'
  | 'advanced-dbms'
  | 'concurrency'
  | 'security'
  | 'nosql'
  | 'testing';
