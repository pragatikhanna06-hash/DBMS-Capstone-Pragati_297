import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Database, LogOut, Menu, Search, ShieldCheck, UserCircle2 } from 'lucide-react';
import { NAV_ITEMS } from './Sidebar';
import type { AuthState, DbConnectionInfo, NavSectionId } from '../types/dbms';

interface TopBarProps {
  activeSection: NavSectionId;
  onSelectSection: (id: NavSectionId) => void;
  onOpenMobileMenu: () => void;
  dbInfo: DbConnectionInfo;
  onOpenSetupGuide: () => void;
  authState: AuthState;
  onOpenAuth: () => void;
  onLogout: () => void;
  notifications: Array<{ id: string; title: string; detail: string; target: NavSectionId }>;
  searchableItems: Array<{ label: string; sub: string; target: NavSectionId }>;
}

export function TopBar({
  activeSection,
  onSelectSection,
  onOpenMobileMenu,
  dbInfo,
  onOpenSetupGuide,
  authState,
  onOpenAuth,
  onLogout,
  notifications,
  searchableItems,
}: TopBarProps) {
  const [clock, setClock] = useState(() => new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const currentTitle = NAV_ITEMS.find((n) => n.id === activeSection)?.label || 'Overview Dashboard';

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const navHits = NAV_ITEMS.filter((n) => n.label.toLowerCase().includes(q)).map((n) => ({
      label: n.label,
      sub: `Module · ${n.group}`,
      target: n.id,
    }));
    const dataHits = searchableItems.filter(
      (item) => item.label.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q)
    );
    return [...navHits, ...dataHits].slice(0, 8);
  }, [searchQuery, searchableItems]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-cyan-500/15 bg-[#0A0F18]/90 px-4 backdrop-blur-md lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <div className="truncate font-display text-sm font-semibold text-white sm:text-base">
            {currentTitle}
          </div>
          <div className="hidden truncate text-xs text-slate-400 sm:block">
            Smart Parking Management & Allocation System
          </div>
        </div>
      </div>

      {/* Global Search */}
      <div className="relative hidden max-w-sm flex-1 md:block">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search modules, plates, users, slots..."
            className="w-full rounded-lg border border-cyan-500/20 bg-slate-900/80 py-1.5 pl-8 pr-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>
        {searchResults.length > 0 && (
          <div className="glass-panel absolute left-0 right-0 top-10 z-40 rounded-xl p-1.5 shadow-2xl">
            {searchResults.map((hit, idx) => (
              <button
                key={`${hit.target}-${idx}`}
                type="button"
                onClick={() => {
                  onSelectSection(hit.target);
                  setSearchQuery('');
                }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs hover:bg-cyan-500/10"
              >
                <span className="truncate font-medium text-white">{hit.label}</span>
                <span className="ml-2 shrink-0 text-[11px] text-cyan-400">{hit.sub}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden text-right font-mono text-[11px] tabular-nums text-slate-400 xl:block">
          <div>{clock.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          <div className="text-cyan-300">{clock.toLocaleTimeString('en-IN', { hour12: false })}</div>
        </div>

        <button
          type="button"
          onClick={onOpenSetupGuide}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
            dbInfo.mysqlConnected
              ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
              : 'border-amber-500/35 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
          }`}
          title="View MySQL & MongoDB Connection Status and Setup Guide"
        >
          <Database className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">
            {dbInfo.mysqlConnected ? 'MySQL 8.0+ Live' : 'Sample Preview'}
          </span>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-lg border border-slate-700/80 bg-slate-900/80 p-2 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {notifications.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-purple-500 px-1 font-mono text-[10px] font-bold text-white">
                {notifications.length}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="glass-panel absolute right-0 top-11 z-40 w-80 rounded-xl p-3 shadow-2xl">
              <div className="mb-2 flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-semibold text-white">Active Alerts ({notifications.length})</span>
                <button
                  type="button"
                  onClick={() => setNotifOpen(false)}
                  className="text-[11px] text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>
              <div className="max-h-64 space-y-1.5 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">No active alerts.</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        onSelectSection(n.target);
                        setNotifOpen(false);
                      }}
                      className="block w-full rounded-lg border border-slate-800/80 bg-slate-900/60 p-2.5 text-left hover:border-cyan-500/30"
                    >
                      <div className="text-xs font-medium text-cyan-300">{n.title}</div>
                      <div className="mt-0.5 text-[11px] text-slate-400">{n.detail}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {authState.authenticated ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelectSection('security')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-medium text-cyan-200 hover:bg-cyan-500/20 whitespace-nowrap"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden md:inline">{authState.role}</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              title="Sign out"
              className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="btn-neon inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs whitespace-nowrap"
          >
            <UserCircle2 className="h-3.5 w-3.5" />
            <span>{authState.adminClaimed ? 'Sign In' : 'Claim Admin'}</span>
          </button>
        )}
      </div>
    </header>
  );
}
