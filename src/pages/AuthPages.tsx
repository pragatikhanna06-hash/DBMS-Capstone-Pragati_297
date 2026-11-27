import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
  UserPlus,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { AuthState } from '../types/dbms';

export type AuthPageMode = 'login' | 'register' | 'claim-admin';

interface AuthPagesProps {
  mode: AuthPageMode;
  onModeChange: (mode: AuthPageMode) => void;
  authState: AuthState;
  onAuthenticated: (token: string, auth: AuthState) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,30}$/;

export function AuthPages({ mode, onModeChange, authState, onAuthenticated }: AuthPagesProps) {
  const canClaimAdmin = !authState.adminClaimed && !authState.hasEnvPasscode;

  // Shared banner after registration redirect
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  // First-Run Admin Claim state
  const [claimName, setClaimName] = useState('Pragati Khanna (Admin)');
  const [claimEmail, setClaimEmail] = useState('pragati.khanna@campus.edu');
  const [claimPasscode, setClaimPasscode] = useState('');
  const [showClaimPasscode, setShowClaimPasscode] = useState(false);
  const [claimRemember, setClaimRemember] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setBannerSuccess(null);

    const trimmedId = identifier.trim();
    if (!trimmedId) {
      setLoginError('Please enter your email or username.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Please enter your password.');
      return;
    }

    setLoginLoading(true);
    try {
      const data = await apiRequest<{ token: string; auth: AuthState }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: trimmedId,
          password: loginPassword,
          rememberMe,
        }),
      });
      setLoginPassword('');
      onAuthenticated(data.token, data.auth);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRegError(null);
    setBannerSuccess(null);

    const trimmedName = fullName.trim();
    const trimmedUser = username.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 2) {
      setRegError('Full name must be at least 2 characters.');
      return;
    }
    if (!USERNAME_REGEX.test(trimmedUser)) {
      setRegError('Username must be 3–30 characters using letters, numbers, dots, underscores, or hyphens.');
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setRegError('Please enter a valid email address.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== confirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    setRegLoading(true);
    try {
      const data = await apiRequest<{ ok: boolean; message: string; user: { username: string; email: string } }>(
        '/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({
            fullName: trimmedName,
            username: trimmedUser,
            email: trimmedEmail,
            password: regPassword,
            confirmPassword,
          }),
        }
      );
      setIdentifier(data.user?.email || trimmedEmail);
      setFullName('');
      setUsername('');
      setEmail('');
      setRegPassword('');
      setConfirmPassword('');
      setLoginError(null);
      setBannerSuccess(data.message || 'Account created successfully. Please sign in.');
      onModeChange('login');
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setRegLoading(false);
    }
  }

  async function handleClaimSubmit(e: React.FormEvent) {
    e.preventDefault();
    setClaimError(null);
    if (!claimName.trim() || !EMAIL_REGEX.test(claimEmail.trim())) {
      setClaimError('Valid admin name and email are required.');
      return;
    }
    if (claimPasscode.length < 6) {
      setClaimError('Admin passcode must be at least 6 characters.');
      return;
    }
    setClaimLoading(true);
    try {
      const data = await apiRequest<{ token: string; auth: AuthState }>('/api/auth/bootstrap', {
        method: 'POST',
        body: JSON.stringify({
          displayName: claimName.trim(),
          email: claimEmail.trim(),
          passcode: claimPasscode,
          rememberMe: claimRemember,
        }),
      });
      setClaimPasscode('');
      onAuthenticated(data.token, data.auth);
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : 'Failed to claim admin session.');
    } finally {
      setClaimLoading(false);
    }
  }

  return (
    <div className="bg-cyber-grid relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10 text-slate-100">
      {/* Subtle futuristic ambient glows */}
      <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-purple-600/12 blur-[120px]" />

      <div className="relative z-10 w-full max-w-[460px]">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 shadow-[0_0_24px_rgba(0,240,255,0.2)]">
            <ShieldCheck className="h-6 w-6 text-cyan-300" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">
            SmartPark <span className="text-cyan-400">DBMS</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Smart Parking Management &amp; Allocation Control Center
          </p>
        </div>

        {/* Glass Auth Card */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8">
          {/* Mode Tabs */}
          <div className="mb-6 grid grid-cols-2 gap-1.5 rounded-xl border border-slate-800 bg-slate-950/70 p-1">
            <button
              type="button"
              onClick={() => {
                setRegError(null);
                setClaimError(null);
                onModeChange('login');
              }}
              className={`rounded-lg py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-cyan-500/25 to-purple-500/20 text-cyan-300 shadow-[inset_0_0_0_1px_rgba(0,240,255,0.35)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginError(null);
                setBannerSuccess(null);
                setClaimError(null);
                onModeChange('register');
              }}
              className={`rounded-lg py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-cyan-500/25 to-purple-500/20 text-cyan-300 shadow-[inset_0_0_0_1px_rgba(0,240,255,0.35)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {bannerSuccess && mode === 'login' && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-200">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span>{bannerSuccess}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-white">Welcome back</h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Sign in with your email address or username to access the control center.
                </p>
              </div>

              <div>
                <label htmlFor="login-identifier" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Email or Username
                </label>
                <div className="relative flex items-center">
                  <Mail className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500" />
                  <input
                    id="login-identifier"
                    type="text"
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="pragati.khanna@campus.edu or username"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500" />
                  <input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((s) => !s)}
                    className="absolute right-2.5 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-cyan-300"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-400 accent-cyan-400 focus:ring-cyan-400"
                  />
                  <span>Remember me for 7 days</span>
                </label>
              </div>

              {loginError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="btn-neon flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold whitespace-nowrap disabled:opacity-60"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="border-t border-slate-800/80 pt-4 text-center text-xs text-slate-400">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setLoginError(null);
                    onModeChange('register');
                  }}
                  className="font-semibold text-cyan-300 hover:text-cyan-200 hover:underline"
                >
                  Create an account
                </button>
              </div>

              {canClaimAdmin && (
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-center text-xs text-slate-300">
                  <span className="text-slate-400">First-time setup? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginError(null);
                      onModeChange('claim-admin');
                    }}
                    className="font-semibold text-cyan-300 hover:text-cyan-200 hover:underline"
                  >
                    Claim Initial Admin Access
                  </button>
                </div>
              )}
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} noValidate className="space-y-3.5">
              <div>
                <h2 className="font-display text-lg font-semibold text-white">Create an account</h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Register a secured user account stored with salted scrypt password hashing.
                </p>
              </div>

              <div>
                <label htmlFor="reg-fullname" className="mb-1 block text-xs font-medium text-slate-300">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500" />
                  <input
                    id="reg-fullname"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Pragati Khanna"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-username" className="mb-1 block text-xs font-medium text-slate-300">
                  Username
                </label>
                <div className="relative flex items-center">
                  <UserPlus className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500" />
                  <input
                    id="reg-username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="pragati_khanna"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-email" className="mb-1 block text-xs font-medium text-slate-300">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500" />
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pragati.khanna@campus.edu"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-password" className="mb-1 block text-xs font-medium text-slate-300">
                  Password (min 6 characters)
                </label>
                <div className="relative flex items-center">
                  <Lock className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500" />
                  <input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((s) => !s)}
                    className="absolute right-2.5 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-cyan-300"
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="reg-confirm" className="mb-1 block text-xs font-medium text-slate-300">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500" />
                  <input
                    id="reg-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="absolute right-2.5 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-cyan-300"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {regError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <span>{regError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={regLoading}
                className="btn-neon flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold whitespace-nowrap disabled:opacity-60"
              >
                {regLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="border-t border-slate-800/80 pt-3.5 text-center text-xs text-slate-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setRegError(null);
                    onModeChange('login');
                  }}
                  className="font-semibold text-cyan-300 hover:text-cyan-200 hover:underline"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* FIRST-RUN ADMIN CLAIM */}
          {mode === 'claim-admin' && canClaimAdmin && (
            <form onSubmit={handleClaimSubmit} noValidate className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-display text-base font-semibold text-white">Claim First-Run Admin Access</h2>
                  <p className="text-xs text-slate-400">Set Pragati Khanna&apos;s administrator password for this server session.</p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Admin Display Name</label>
                <input
                  type="text"
                  value={claimName}
                  onChange={(e) => setClaimName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Admin Email</label>
                <input
                  type="email"
                  value={claimEmail}
                  onChange={(e) => setClaimEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Choose Admin Password (min 6 chars)
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showClaimPasscode ? 'text' : 'password'}
                    value={claimPasscode}
                    onChange={(e) => setClaimPasscode(e.target.value)}
                    placeholder="Enter secure password..."
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-3.5 pr-10 text-sm text-white focus:border-cyan-400 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowClaimPasscode((s) => !s)}
                    className="absolute right-2.5 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-cyan-300"
                    aria-label={showClaimPasscode ? 'Hide password' : 'Show password'}
                  >
                    {showClaimPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={claimRemember}
                  onChange={(e) => setClaimRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-400 accent-cyan-400"
                />
                <span>Remember admin session</span>
              </label>

              {claimError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <span>{claimError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={claimLoading}
                className="btn-neon flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold whitespace-nowrap disabled:opacity-60"
              >
                {claimLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>{claimLoading ? 'Activating...' : 'Claim Admin & Open Dashboard'}</span>
              </button>

              <div className="border-t border-slate-800/80 pt-3 text-center text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => onModeChange('login')}
                  className="font-semibold text-cyan-300 hover:underline"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
