import React, { useState } from 'react';
import { Database, KeyRound, Lock, ShieldCheck, X } from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { AuthState, DbConnectionInfo } from '../types/dbms';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  authState: AuthState;
  onAuthenticated: (token: string, auth: AuthState) => void;
}

export function AuthModal({ open, onClose, authState, onAuthenticated }: AuthModalProps) {
  const [passcode, setPasscode] = useState('');
  const [email, setEmail] = useState('pragati.khanna@campus.edu');
  const [displayName, setDisplayName] = useState('Pragati Khanna (Admin)');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const isFirstRunClaim = !authState.adminClaimed && !authState.hasEnvPasscode;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = isFirstRunClaim ? '/api/auth/bootstrap' : '/api/auth/login';
      const data = await apiRequest<{ token: string; auth: AuthState }>(endpoint, {
        method: 'POST',
        body: JSON.stringify({ passcode, email, displayName }),
      });
      onAuthenticated(data.token, data.auth);
      setPasscode('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md rounded-xl p-6 text-slate-100">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400">
              {isFirstRunClaim ? <KeyRound className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {isFirstRunClaim ? 'Claim First-Run Admin Access' : 'RBAC Session Sign-In'}
              </h3>
              <p className="text-xs text-slate-400">
                {isFirstRunClaim
                  ? 'Set your server-hashed scrypt admin passcode for this session'
                  : 'Authenticate with your admin or operator passcode'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close authentication modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isFirstRunClaim && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Admin Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                required
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Account Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              {isFirstRunClaim ? 'Choose Admin Passcode (min 6 chars)' : 'Passcode'}
            </label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter passcode..."
              minLength={isFirstRunClaim ? 6 : 1}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              required
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-neon rounded-lg px-4 py-2 text-xs whitespace-nowrap disabled:opacity-60"
            >
              {loading ? 'Verifying...' : isFirstRunClaim ? 'Claim & Activate Session' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface SetupGuideModalProps {
  open: boolean;
  onClose: () => void;
  dbInfo: DbConnectionInfo;
}

export function SetupGuideModal({ open, onClose, dbInfo }: SetupGuideModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="glass-panel max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-xl p-6 text-slate-100">
        <div className="mb-4 flex items-center justify-between border-b border-cyan-500/15 pb-3">
          <div className="flex items-center gap-2.5">
            <Database className="h-5 w-5 text-cyan-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">MySQL 8.0+ & MongoDB Connection Guide</h3>
              <p className="text-xs text-slate-400">
                Active Mode: {dbInfo.mysqlConnected ? 'Live MySQL 8.0+ Connected' : 'Sample Preview Mode (External DB Unconfigured)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close setup guide"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 text-sm text-slate-300">
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <h4 className="mb-2 font-semibold text-cyan-300">1. Current Environment Status</h4>
            <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              <div className="rounded-md bg-slate-950/70 p-2.5">
                <span className="text-slate-400">MySQL 8.0+ Pool: </span>
                <span className={dbInfo.mysqlConnected ? 'font-semibold text-emerald-400' : 'font-semibold text-amber-400'}>
                  {dbInfo.mysqlConnected ? 'Connected' : dbInfo.mysqlConfigured ? 'Connection Error' : 'Not Configured'}
                </span>
              </div>
              <div className="rounded-md bg-slate-950/70 p-2.5">
                <span className="text-slate-400">MongoDB Atlas/Local: </span>
                <span className={dbInfo.mongoConnected ? 'font-semibold text-emerald-400' : 'font-semibold text-amber-400'}>
                  {dbInfo.mongoConnected ? 'Connected' : 'Sample Preview Mode'}
                </span>
              </div>
            </div>
            {dbInfo.mysqlError && (
              <p className="mt-2 text-xs text-red-400">MySQL Error: {dbInfo.mysqlError}</p>
            )}
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <h4 className="mb-2 font-semibold text-cyan-300">2. Initialize MySQL 8.0+ Schema</h4>
            <p className="mb-2 text-xs text-slate-400">
              Run the included SQL initialization script on your MySQL 8.0+ server to create all 10 InnoDB tables, views, functions, stored procedures, triggers, and seed data:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-[#070B12] p-3 text-xs text-cyan-200">
{`mysql -u root -p < database/init_mysql.sql`}
            </pre>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <h4 className="mb-2 font-semibold text-cyan-300">3. Configure Environment Variables</h4>
            <p className="mb-2 text-xs text-slate-400">
              Add these variables in Settings / Secrets (or `.env`) and restart the server to switch automatically from Sample Preview to live MySQL & MongoDB execution:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-[#070B12] p-3 text-xs text-purple-200">
{`MYSQL_HOST=your-mysql-host
MYSQL_PORT=3306
MYSQL_USER=parking_admin
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=smart_parking_db
MONGODB_URI=mongodb+srv://user:pass@cluster/smart_parking_events
MONGODB_DATABASE=smart_parking_events`}
            </pre>
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs text-slate-300">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
            <p>
              In Sample Preview mode, all CRUD modules, Dynamic Allocation, Analytics, and SQL Explorer previews remain interactive against the live in-memory relational dataset, while clearly labeling SQL execution & dual-session concurrency as Sample Preview / Conceptual Simulation until MySQL 8.0+ is connected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
