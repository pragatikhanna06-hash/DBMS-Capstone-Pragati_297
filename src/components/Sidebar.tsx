import React from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  BookOpenCheck,
  CalendarClock,
  Car,
  ChevronLeft,
  ChevronRight,
  Cpu,
  CreditCard,
  Database,
  FileCode2,
  GitBranch,
  Layers,
  LayoutDashboard,
  Lock,
  MapPin,
  Package,
  ParkingSquare,
  Shield,
  Ticket,
  Users,
  X,
} from 'lucide-react';
import type { NavSectionId } from '../types/dbms';

export interface NavItem {
  id: NavSectionId;
  label: string;
  group: 'Operations' | 'Analytics & SQL' | 'DBMS Architecture';
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview Dashboard', group: 'Operations', icon: LayoutDashboard },
  { id: 'users', label: 'User Management', group: 'Operations', icon: Users },
  { id: 'vehicles', label: 'Vehicle Management', group: 'Operations', icon: Car },
  { id: 'zones', label: 'Parking Zones', group: 'Operations', icon: MapPin },
  { id: 'slots', label: 'Parking Slots', group: 'Operations', icon: ParkingSquare },
  { id: 'reservations', label: 'Reservations', group: 'Operations', icon: CalendarClock },
  { id: 'allocation', label: 'Dynamic Allocation', group: 'Operations', icon: Cpu },
  { id: 'entry-exit', label: 'Entry & Exit Management', group: 'Operations', icon: ArrowLeftRight },
  { id: 'visitors', label: 'Visitor Passes', group: 'Operations', icon: Ticket },
  { id: 'violations', label: 'Violations', group: 'Operations', icon: AlertTriangle },
  { id: 'payments', label: 'Payments & Penalties', group: 'Operations', icon: CreditCard },
  { id: 'random-object', label: 'Random Object', group: 'Operations', icon: Package },
  { id: 'analytics', label: 'Analytics & Reports', group: 'Analytics & SQL', icon: BarChart3 },
  { id: 'sql-explorer', label: 'SQL Query Explorer', group: 'Analytics & SQL', icon: FileCode2 },
  { id: 'schema', label: 'Database Schema', group: 'DBMS Architecture', icon: Database },
  { id: 'er-diagram', label: 'ER Diagram', group: 'DBMS Architecture', icon: GitBranch },
  { id: 'normalization', label: 'Normalization', group: 'DBMS Architecture', icon: Layers },
  { id: 'advanced-dbms', label: 'Advanced DBMS Concepts', group: 'DBMS Architecture', icon: Activity },
  { id: 'concurrency', label: 'Concurrency & Transactions', group: 'DBMS Architecture', icon: Lock },
  { id: 'security', label: 'Security & RBAC', group: 'DBMS Architecture', icon: Shield },
  { id: 'nosql', label: 'NoSQL Extension', group: 'DBMS Architecture', icon: Database },
  { id: 'testing', label: 'Testing & Documentation', group: 'DBMS Architecture', icon: BookOpenCheck },
];

interface SidebarProps {
  activeSection: NavSectionId;
  onSelect: (id: NavSectionId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeSection,
  onSelect,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const groups: Array<NavItem['group']> = ['Operations', 'Analytics & SQL', 'DBMS Architecture'];

  const content = (
    <div className="flex h-full flex-col border-r border-cyan-500/15 bg-[#080D16]/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between border-b border-cyan-500/15 px-3.5">
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-bold tracking-wide text-white">
              SmartPark <span className="text-cyan-400">DBMS</span>
            </div>
            <div className="truncate text-[11px] text-slate-400">Project 6 · Control Center</div>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800/80 hover:text-cyan-300 lg:inline-flex"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Close navigation menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-2.5 py-4">
        {groups.map((grp) => (
          <div key={grp}>
            {!collapsed && (
              <div className="mb-1.5 px-2.5 text-[11px] font-semibold tracking-wider text-slate-500">
                {grp}
              </div>
            )}
            <div className="space-y-0.5">
              {NAV_ITEMS.filter((item) => item.group === grp).map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect(item.id);
                      onCloseMobile();
                    }}
                    title={collapsed ? item.label : undefined}
                    className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-all ${
                      active
                        ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/15 text-cyan-300 shadow-[inset_0_0_0_1px_rgba(0,240,255,0.3)]'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        active ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'
                      }`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden shrink-0 transition-all duration-200 lg:block ${
          collapsed ? 'w-[68px]' : 'w-[258px]'
        }`}
      >
        <div className="sticky top-0 h-screen">{content}</div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative z-10 h-full w-72">{content}</div>
        </div>
      )}
    </>
  );
}
