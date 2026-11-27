import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthModal, SetupGuideModal } from './components/AuthModal';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { apiRequest, setAuthToken } from './lib/api';
import { AdvancedDbmsView } from './modules/AdvancedDbmsView';
import { AnalyticsReports } from './modules/AnalyticsReports';
import { ConcurrencySimulator } from './modules/ConcurrencySimulator';
import { DatabaseSchema } from './modules/DatabaseSchema';
import { ErDiagram } from './modules/ErDiagram';
import { NormalizationView } from './modules/NormalizationView';
import { NosqlExtensionView } from './modules/NosqlExtensionView';
import {
  EntryExitModule,
  PaymentsModule,
  ViolationsModule,
  VisitorPassesModule,
} from './modules/OperationsModules';
import { OverviewDashboard } from './modules/OverviewDashboard';
import { RandomObjectView } from './modules/RandomObjectView';
import {
  DynamicAllocationModule,
  ReservationsModule,
} from './modules/ReservationAllocationModules';
import { SecurityRbacView } from './modules/SecurityRbacView';
import { SqlQueryExplorer } from './modules/SqlQueryExplorer';
import { TestingDocsView } from './modules/TestingDocsView';
import { UserManagement } from './modules/UserManagement';
import { VehicleManagement } from './modules/VehicleManagement';
import { ParkingSlotsModule, ParkingZonesModule } from './modules/ZoneSlotModules';
import { AuthPages, type AuthPageMode } from './pages/AuthPages';
import type {
  AuthState,
  DbConnectionInfo,
  DbUser,
  DbVehicle,
  DbViolation,
  DbVisitorPass,
  NavSectionId,
} from './types/dbms';

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSectionId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [token, setToken] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authPageMode, setAuthPageMode] = useState<AuthPageMode>('login');
  const [authState, setAuthState] = useState<AuthState>({
    authenticated: false,
    adminClaimed: false,
    hasEnvPasscode: false,
    role: null,
    userEmail: null,
    username: null,
    displayName: null,
  });

  const [dbInfo, setDbInfo] = useState<DbConnectionInfo>({
    dbMode: 'sample-preview',
    mysqlConfigured: false,
    mysqlConnected: false,
    mongoMode: 'sample-preview',
    mongoConfigured: false,
    mongoConnected: false,
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [setupGuideOpen, setSetupGuideOpen] = useState(false);

  // Global search & notification metadata synced from backend once authenticated
  const [users, setUsers] = useState<DbUser[]>([]);
  const [vehicles, setVehicles] = useState<DbVehicle[]>([]);
  const [violations, setViolations] = useState<DbViolation[]>([]);
  const [passes, setPasses] = useState<DbVisitorPass[]>([]);

  const refreshGlobalMeta = useCallback(async () => {
    try {
      const [health, auth] = await Promise.all([
        apiRequest<DbConnectionInfo>('/api/health'),
        apiRequest<AuthState>('/api/auth/status', {}, token ?? undefined),
      ]);
      setDbInfo(health);
      setAuthState(auth);

      if (auth.authenticated) {
        const [uRes, vRes, viRes, pRes] = await Promise.all([
          apiRequest<{ users: DbUser[] }>('/api/users'),
          apiRequest<{ vehicles: DbVehicle[] }>('/api/vehicles'),
          apiRequest<{ violations: DbViolation[] }>('/api/violations'),
          apiRequest<{ passes: DbVisitorPass[] }>('/api/visitor-passes'),
        ]);
        setUsers(uRes.users);
        setVehicles(vRes.vehicles);
        setViolations(viRes.violations);
        setPasses(pRes.passes);
      }
    } catch {
      // ignore transient startup polling errors
    } finally {
      setAuthChecked(true);
    }
  }, [token]);

  useEffect(() => {
    refreshGlobalMeta();
  }, [refreshGlobalMeta]);

  const notifications = useMemo(() => {
    const items: Array<{ id: string; title: string; detail: string; target: NavSectionId }> = [];
    for (const vi of violations.filter((x) => x.violation_status === 'Unpaid')) {
      items.push({
        id: `vio-${vi.violation_id}`,
        title: `Unpaid Violation · ${vi.registration_number || `#${vi.vehicle_id}`}`,
        detail: `${vi.violation_type} (₹${vi.penalty_amount})`,
        target: 'violations',
      });
    }
    for (const p of passes.filter((x) => x.pass_status === 'Pending')) {
      items.push({
        id: `pass-${p.pass_id}`,
        title: `Pending Visitor Pass · ${p.visitor_name}`,
        detail: `Plate ${p.vehicle_number} awaiting gate approval`,
        target: 'visitors',
      });
    }
    return items.slice(0, 6);
  }, [violations, passes]);

  const searchableItems = useMemo(() => {
    return [
      ...users.map((u) => ({ label: u.full_name, sub: `User · ${u.user_type}`, target: 'users' as NavSectionId })),
      ...vehicles.map((v) => ({
        label: v.registration_number,
        sub: `Vehicle · ${v.brand} ${v.model}`,
        target: 'vehicles' as NavSectionId,
      })),
    ];
  }, [users, vehicles]);

  function handleAuthenticated(newToken: string, newAuth: AuthState, isAdminSession = true) {
    setAuthToken(newToken);
    setToken(newToken);
    if (isAdminSession && newAuth.role === 'ADMIN') {
      setAdminToken(newToken);
    }
    setAuthState(newAuth);
    setActiveSection('overview');
  }

  async function handleLogout() {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // continue client cleanup even if request fails
    }
    setAuthToken(null);
    setToken(null);
    setAdminToken(null);
    setUsers([]);
    setVehicles([]);
    setViolations([]);
    setPasses([]);
    setAuthPageMode('login');
    setAuthState((prev) => ({
      ...prev,
      authenticated: false,
      role: null,
      userEmail: null,
      username: null,
      displayName: null,
    }));
  }

  if (!authChecked) {
    return (
      <div className="bg-cyber-grid flex min-h-screen items-center justify-center text-slate-200">
        <div className="glass-panel flex items-center gap-3 rounded-2xl px-6 py-4 text-sm">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
          <span>Verifying session security...</span>
        </div>
      </div>
    );
  }

  if (!authState.authenticated) {
    return (
      <AuthPages
        mode={authPageMode}
        onModeChange={setAuthPageMode}
        authState={authState}
        onAuthenticated={(newToken, newAuth) => handleAuthenticated(newToken, newAuth)}
      />
    );
  }

  return (
    <div className="bg-cyber-grid flex min-h-screen text-slate-100">
      <Sidebar
        activeSection={activeSection}
        onSelect={setActiveSection}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          dbInfo={dbInfo}
          onOpenSetupGuide={() => setSetupGuideOpen(true)}
          authState={authState}
          onOpenAuth={() => setAuthModalOpen(true)}
          onLogout={handleLogout}
          notifications={notifications}
          searchableItems={searchableItems}
        />

        {!dbInfo.mysqlConnected && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs text-amber-200 lg:px-6">
            <span>
              <strong>Sample Preview Mode:</strong> External MySQL 8.0+ credentials are not configured. All CRUD &amp; allocation operations run on the local relational dataset, and SQL Explorer / Concurrency Simulator clearly label preview outputs.
            </span>
            <button
              type="button"
              onClick={() => setSetupGuideOpen(true)}
              className="font-semibold text-cyan-300 underline hover:text-cyan-200 whitespace-nowrap"
            >
              MySQL Setup Guide
            </button>
          </div>
        )}

        <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 lg:p-6">
          {activeSection === 'overview' && <OverviewDashboard onNavigate={setActiveSection} />}
          {activeSection === 'users' && (
            <UserManagement token={token} onRequireAuth={() => setAuthModalOpen(true)} onDataChanged={refreshGlobalMeta} />
          )}
          {activeSection === 'vehicles' && (
            <VehicleManagement token={token} onRequireAuth={() => setAuthModalOpen(true)} onDataChanged={refreshGlobalMeta} />
          )}
          {activeSection === 'zones' && (
            <ParkingZonesModule token={token} onRequireAuth={() => setAuthModalOpen(true)} onDataChanged={refreshGlobalMeta} />
          )}
          {activeSection === 'slots' && (
            <ParkingSlotsModule token={token} onRequireAuth={() => setAuthModalOpen(true)} onDataChanged={refreshGlobalMeta} />
          )}
          {activeSection === 'reservations' && (
            <ReservationsModule token={token} onRequireAuth={() => setAuthModalOpen(true)} onDataChanged={refreshGlobalMeta} />
          )}
          {activeSection === 'allocation' && (
            <DynamicAllocationModule
              token={token}
              onRequireAuth={() => setAuthModalOpen(true)}
              onDataChanged={refreshGlobalMeta}
              onNavigate={setActiveSection}
            />
          )}
          {activeSection === 'entry-exit' && (
            <EntryExitModule token={token} onRequireAuth={() => setAuthModalOpen(true)} onDataChanged={refreshGlobalMeta} />
          )}
          {activeSection === 'visitors' && (
            <VisitorPassesModule token={token} onRequireAuth={() => setAuthModalOpen(true)} onDataChanged={refreshGlobalMeta} />
          )}
          {activeSection === 'violations' && (
            <ViolationsModule token={token} onRequireAuth={() => setAuthModalOpen(true)} onDataChanged={refreshGlobalMeta} />
          )}
          {activeSection === 'payments' && (
            <PaymentsModule token={token} onRequireAuth={() => setAuthModalOpen(true)} onDataChanged={refreshGlobalMeta} />
          )}
          {activeSection === 'random-object' && <RandomObjectView />}
          {activeSection === 'analytics' && <AnalyticsReports />}
          {activeSection === 'sql-explorer' && <SqlQueryExplorer dbInfo={dbInfo} />}
          {activeSection === 'schema' && <DatabaseSchema />}
          {activeSection === 'er-diagram' && <ErDiagram />}
          {activeSection === 'normalization' && <NormalizationView />}
          {activeSection === 'advanced-dbms' && <AdvancedDbmsView />}
          {activeSection === 'concurrency' && (
            <ConcurrencySimulator
              token={token}
              onRequireAuth={() => setAuthModalOpen(true)}
              dbInfo={dbInfo}
              onDataChanged={refreshGlobalMeta}
            />
          )}
          {activeSection === 'security' && (
            <SecurityRbacView
              token={token}
              adminToken={adminToken}
              authState={authState}
              onRequireAuth={() => setAuthModalOpen(true)}
              onSessionChange={handleAuthenticated}
            />
          )}
          {activeSection === 'nosql' && (
            <NosqlExtensionView token={token} onRequireAuth={() => setAuthModalOpen(true)} dbInfo={dbInfo} />
          )}
          {activeSection === 'testing' && <TestingDocsView />}
        </main>
      </div>

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        authState={authState}
        onAuthenticated={handleAuthenticated}
      />

      <SetupGuideModal
        open={setupGuideOpen}
        onClose={() => setSetupGuideOpen(false)}
        dbInfo={dbInfo}
      />
    </div>
  );
}
