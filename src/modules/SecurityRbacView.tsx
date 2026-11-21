import React, { useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, Lock, Shield, UserPlus } from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { AppRole, AuthState } from '../types/dbms';

interface SecurityRbacProps {
  token: string | null;
  adminToken: string | null;
  authState: AuthState;
  onRequireAuth: () => void;
  onSessionChange: (token: string, auth: AuthState, isAdminSession?: boolean) => void;
}

const ROLE_MATRIX: Array<{ role: AppRole; scope: string; tables: string; mysqlGrant: string }> = [
  {
    role: 'ADMIN',
    scope: 'Full system administration, user/zone CRUD, SQL Explorer, RBAC provisioning',
    tables: 'ALL (USER, VEHICLE, PARKING_ZONE, PARKING_SLOT, RESERVATION, LOGS, PAYMENT)',
    mysqlGrant: "GRANT ALL PRIVILEGES ON smart_parking_db.* TO 'parking_admin'@'%';",
  },
  {
    role: 'SECURITY',
    scope: 'Entry & exit gate registration, visitor pass approval, violation reporting',
    tables: 'ENTRY_LOG, EXIT_LOG, VISITOR_PASS, VIOLATION (No DELETE)',
    mysqlGrant: "GRANT SELECT, INSERT, UPDATE ON smart_parking_db.ENTRY_LOG TO 'parking_security'@'%';\nREVOKE DELETE ON smart_parking_db.VIOLATION FROM 'parking_security'@'%';",
  },
  {
    role: 'PARKING_OPERATOR',
    scope: 'Slot creation/status updates, reservations, dynamic allocation, payment settlement',
    tables: 'PARKING_SLOT, RESERVATION, PAYMENT, VEHICLE',
    mysqlGrant: "GRANT SELECT, INSERT, UPDATE ON smart_parking_db.PARKING_SLOT TO 'parking_operator'@'%';",
  },
  {
    role: 'USER',
    scope: 'View own vehicles, request dynamic slot allocation, create reservations & passes',
    tables: 'vw_current_available_slots, RESERVATION (INSERT/SELECT), VEHICLE',
    mysqlGrant: "GRANT SELECT ON smart_parking_db.vw_current_available_slots TO 'parking_user'@'%';\nGRANT SELECT, INSERT ON smart_parking_db.RESERVATION TO 'parking_user'@'%';",
  },
];

export function SecurityRbacView({
  token,
  adminToken,
  authState,
  onRequireAuth,
  onSessionChange,
}: SecurityRbacProps) {
  const [accounts, setAccounts] = useState<Array<{ email: string; role: AppRole; displayName: string; hashPreview: string }>>([]);
  const [newAcc, setNewAcc] = useState({ email: '', displayName: '', role: 'SECURITY' as AppRole, passcode: '' });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadAccounts() {
    if (!token || authState.role !== 'ADMIN') return;
    try {
      const res = await apiRequest<{ accounts: any[] }>('/api/auth/rbac-accounts', {}, token);
      setAccounts(res.accounts);
    } catch {
      // ignore if non-admin
    }
  }

  useEffect(() => {
    loadAccounts();
  }, [token, authState.role]);

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      onRequireAuth();
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const res = await apiRequest<{ accounts: any[] }>(
        '/api/auth/rbac-accounts',
        { method: 'POST', body: JSON.stringify(newAcc) },
        token
      );
      setAccounts(res.accounts);
      setNewAcc({ email: '', displayName: '', role: 'SECURITY', passcode: '' });
      setMessage('Account created with salted scrypt password hash.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    }
  }

  async function switchTestRole(role: AppRole) {
    const activeTok = adminToken || token;
    if (!activeTok) {
      onRequireAuth();
      return;
    }
    setError(null);
    try {
      const res = await apiRequest<{ token: string; auth: AuthState }>(
        '/api/auth/switch-role',
        { method: 'POST', body: JSON.stringify({ role }) },
        activeTok
      );
      onSessionChange(res.token, res.auth, false);
      setMessage(`Active session switched to ${role}. Test RBAC-protected routes across modules!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Role switch requires Admin session');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-white">Security & Role-Based Access Control (RBAC)</h1>
          <p className="text-xs text-slate-400">
            Scrypt password hashing, HMAC-SHA256 Bearer tokens, parameterized SQL prepared statements, and MySQL GRANT/REVOKE
          </p>
        </div>
        {!authState.authenticated && (
          <button type="button" onClick={onRequireAuth} className="btn-neon inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs">
            <KeyRound className="h-3.5 w-3.5" /> {authState.adminClaimed ? 'Sign In' : 'Claim First-Run Admin'}
          </button>
        )}
      </div>

      {message && <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300">{message}</div>}
      {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">{error}</div>}

      {/* Active Session & Role Simulator */}
      <div className="glass-panel rounded-xl p-5 space-y-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-semibold text-white">Active Session Context</span>
          </div>
          <span className="font-mono text-cyan-300">
            {authState.authenticated ? `${authState.displayName} · Role: ${authState.role}` : 'Unauthenticated Read-Only Preview'}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-slate-300">
            Admin sessions can test role enforcement across all API routes by switching active session scope:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {(['ADMIN', 'SECURITY', 'PARKING_OPERATOR', 'USER'] as AppRole[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => switchTestRole(role)}
                className={`rounded-lg border px-3 py-1.5 font-mono text-[11px] font-semibold transition-colors ${
                  authState.role === role
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                    : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:border-purple-400'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Role Matrix & MySQL GRANT/REVOKE */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {ROLE_MATRIX.map((r) => (
          <div key={r.role} className="glass-panel rounded-xl p-5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-cyan-300">{r.role}</span>
              <span className="text-purple-300">Least-Privilege Scope</span>
            </div>
            <p className="text-slate-300">{r.scope}</p>
            <div className="text-[11px] text-slate-400">Permitted Objects: <span className="font-mono text-slate-200">{r.tables}</span></div>
            <pre className="overflow-x-auto rounded-lg bg-[#060A12] p-3 font-mono text-[11px] text-emerald-300">{r.mysqlGrant}</pre>
          </div>
        ))}
      </div>

      {/* Create RBAC Account + SQL Injection Prevention */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="glass-panel rounded-xl p-5 space-y-4 text-xs">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <UserPlus className="h-4 w-4 text-cyan-400" /> Provision Scrypt-Hashed Operator Account
          </div>
          <form onSubmit={handleCreateAccount} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Display Name" value={newAcc.displayName} onChange={(e) => setNewAcc({ ...newAcc, displayName: e.target.value })} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" required />
              <input type="email" placeholder="Email" value={newAcc.email} onChange={(e) => setNewAcc({ ...newAcc, email: e.target.value })} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={newAcc.role} onChange={(e) => setNewAcc({ ...newAcc, role: e.target.value as AppRole })} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
                <option value="SECURITY">SECURITY</option>
                <option value="PARKING_OPERATOR">PARKING_OPERATOR</option>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <input type="password" minLength={6} placeholder="Passcode (min 6 chars)" value={newAcc.passcode} onChange={(e) => setNewAcc({ ...newAcc, passcode: e.target.value })} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" required />
            </div>
            <button type="submit" className="btn-neon rounded-lg px-4 py-2">Create Salted Scrypt Account</button>
          </form>

          {accounts.length > 0 && (
            <div className="space-y-1.5 border-t border-slate-800 pt-3">
              <div className="font-semibold text-slate-300">Active Server Credential Hashes (No Plaintext Stored)</div>
              {accounts.map((acc) => (
                <div key={acc.email} className="flex items-center justify-between rounded bg-slate-900/70 px-3 py-2 font-mono text-[11px]">
                  <span className="text-white">{acc.email} ({acc.role})</span>
                  <span className="text-emerald-400">{acc.hashPreview}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel rounded-xl p-5 space-y-3 text-xs">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Lock className="h-4 w-4 text-purple-400" /> Security Safeguards &amp; SQL Injection Defense
          </div>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span><strong>Parameterized Queries:</strong> Every MySQL statement uses <span className="font-mono text-cyan-300">pool.execute(sql, [params])</span> prepared placeholders rather than string concatenation.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span><strong>Salted Scrypt Hashing:</strong> User passcodes are derived via <span className="font-mono text-cyan-300">crypto.scryptSync(pass, salt, 64)</span> with constant-time <span className="font-mono">timingSafeEqual</span> verification.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span><strong>In-Memory Bearer Tokens:</strong> Signed HMAC-SHA256 session tokens remain exclusively in React memory (never persisted in localStorage).</span>
            </li>
          </ul>
          <pre className="overflow-x-auto rounded-lg bg-[#060A12] p-3 font-mono text-[11px] text-cyan-200">
{`// Safe Prepared Statement Example in server.ts
await pool.execute(
  'INSERT INTO VEHICLE (user_id, registration_number, vehicle_type, brand, model, color) VALUES (?, ?, ?, ?, ?, ?)',
  [Number(user_id), reg, vehicle_type, brand, model, color]
);`}
          </pre>
        </div>
      </div>
    </div>
  );
}
