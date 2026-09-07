import React, { useState, useEffect } from 'react';
import {
  Shield,
  Building2,
  KeyRound,
  ArrowRight,
  Sparkles,
  Lock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Store,
  Terminal,
  RotateCcw,
  Wrench,
  ChevronRight,
  Eye,
  EyeOff,
  LogIn,
} from 'lucide-react';
import { TenantRestaurant, AuthUser, RestaurantSettings, StaffMember, BusinessOwnerAccount } from '../types';
import { UserRole, isDeveloperPasswordValid, DEVELOPER_PASSWORD } from '../utils/rbac';
import { sound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { loadStoredTenants, saveStoredTenants } from '../utils/storage';
import { BrandLogo } from './BrandLogo';
import { EnhLogo } from './EnhLogo';

interface TenantEntryPortalProps {
  currentTenant: TenantRestaurant;
  onSelectTenant: (tenant: TenantRestaurant) => void;
  onLoginSuccess: (user: AuthUser, tenant: TenantRestaurant) => void;
  settings: RestaurantSettings;
  staffList: StaffMember[];
  businessOwners?: BusinessOwnerAccount[];
  tenants: TenantRestaurant[];
  onOpenOnboardingWizard?: () => void;
}

export const TenantEntryPortal: React.FC<TenantEntryPortalProps> = ({
  currentTenant,
  onSelectTenant,
  onLoginSuccess,
  settings,
  staffList,
  businessOwners = [],
  tenants,
  onOpenOnboardingWizard,
}) => {
  // Step 1: 'code_prompt' (Unique Code validation) vs Step 2: 'portal_unlocked' (Dual Login) vs Step 3: 'enh_system_admin'
  const [entryStage, setEntryStage] = useState<'code_prompt' | 'portal_unlocked' | 'enh_system_admin'>('code_prompt');
  
  // Code validation input
  const [tenantCodeInput, setTenantCodeInput] = useState(currentTenant?.uniqueCode || 'REST-9021');
  const [validatedTenant, setValidatedTenant] = useState<TenantRestaurant>(currentTenant);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Dual Login section toggle: 'staff' | 'owner'
  const [activeLoginSection, setActiveLoginSection] = useState<'staff' | 'owner'>('staff');

  // Staff credentials
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffList[0]?.id || '');
  const [staffPin, setStaffPin] = useState('');
  
  // Owner credentials
  const [ownerUsername, setOwnerUsername] = useState(validatedTenant?.ownerEmail || 'owner');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Super Admin / Developer master credentials
  const [masterUsername, setMasterUsername] = useState('developer');
  const [masterPassword, setMasterPassword] = useState('');
  const [masterError, setMasterError] = useState<string | null>(null);

  // General state
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Check URL query parameters for direct /enh-system-admin/login access
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (
      urlParams.get('route') === 'enh-system-admin' ||
      urlParams.get('admin') === 'true' ||
      window.location.pathname.includes('enh-system-admin')
    ) {
      setEntryStage('enh_system_admin');
    }
  }, []);

  // Update fields when validated tenant changes
  useEffect(() => {
    if (validatedTenant) {
      setOwnerUsername(validatedTenant.ownerEmail || 'owner');
    }
  }, [validatedTenant]);

  // Handle Unique Tenant Code Validation
  const handleValidateCode = (overrideCode?: string) => {
    const codeToTest = (overrideCode || tenantCodeInput).trim().toUpperCase();
    setValidationError(null);

    if (!codeToTest) {
      setValidationError('Please enter your assigned Unique Tenant Code.');
      sound.playError();
      return;
    }

    setIsValidating(true);

    setTimeout(() => {
      setIsValidating(false);
      const allTenants = loadStoredTenants();
      const matched = allTenants.find(
        (t) =>
          t.uniqueCode?.toUpperCase() === codeToTest ||
          t.id.toUpperCase() === codeToTest ||
          t.slug.toUpperCase() === codeToTest
      );

      if (!matched) {
        setValidationError(
          `Tenant Code "${codeToTest}" was not found. Please check your assigned code with ENH RESTAURANT MANAGEMENT AIDE LTD.`
        );
        sound.playError();
        triggerHaptic('heavy');
        return;
      }

      // Valid tenant found!
      setValidatedTenant(matched);
      onSelectTenant(matched);
      setEntryStage('portal_unlocked');
      sound.playSuccess();
      triggerHaptic('medium');
    }, 350);
  };

  // Handle Staff Login
  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    setTimeout(() => {
      setIsLoggingIn(false);
      const staff = staffList.find((s) => s.id === selectedStaffId) || staffList[0];

      // Staff PIN check: default 1234 or empty
      if (staffPin && staffPin !== '1234' && staffPin !== '0000') {
        setLoginError('Incorrect Staff PIN. Default is 1234.');
        sound.playError();
        return;
      }

      const user: AuthUser = {
        id: staff?.id || `staff_${Date.now()}`,
        username: staff?.username || (staff?.name || 'Staff Member').toLowerCase().replace(/\s+/g, '_'),
        name: staff?.name || 'Staff Member',
        role: UserRole.STAFF,
        businessId: validatedTenant.id,
        restaurant_id: validatedTenant.id,
        lastLoginAt: Date.now(),
      };

      sound.playSuccess();
      triggerHaptic('medium');
      onLoginSuccess(user, validatedTenant);
    }, 400);
  };

  // Handle Owner Login
  const handleOwnerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanUser = ownerUsername.trim().toLowerCase();
    const cleanPass = ownerPassword.trim();

    if (!cleanPass) {
      setLoginError('Please enter owner password.');
      sound.playError();
      return;
    }

    setIsLoggingIn(true);

    setTimeout(() => {
      setIsLoggingIn(false);
      // Master Developer override via Owner section
      if (
        (cleanUser === 'dev' || cleanUser === 'developer' || cleanUser === 'admin') &&
        isDeveloperPasswordValid(cleanPass, settings.adminPassword)
      ) {
        const user: AuthUser = {
          id: 'usr_dev_001',
          username: 'developer',
          name: 'Developer (Root Owner)',
          role: UserRole.DEVELOPER,
          businessId: null,
          restaurant_id: validatedTenant.id,
          lastLoginAt: Date.now(),
        };
        sound.playSuccess();
        triggerHaptic('medium');
        onLoginSuccess(user, validatedTenant);
        return;
      }

      // Owner verification: accepts adminPassword, 'admin123', 'owner123', or settings.adminPassword
      const isValidPassword =
        cleanPass === (settings.adminPassword || 'admin123') ||
        cleanPass === 'admin123' ||
        cleanPass === 'owner123' ||
        cleanPass === 'password123';

      if (!isValidPassword) {
        setLoginError('Invalid Owner credentials. (Demo password: admin123)');
        sound.playError();
        triggerHaptic('heavy');
        return;
      }

      const user: AuthUser = {
        id: validatedTenant.ownerId || `owner_${Date.now()}`,
        username: cleanUser || validatedTenant.ownerEmail,
        name: validatedTenant.ownerName || 'Restaurant Owner',
        role: UserRole.OWNER,
        businessId: validatedTenant.id,
        restaurant_id: validatedTenant.id,
        lastLoginAt: Date.now(),
      };

      sound.playSuccess();
      triggerHaptic('medium');
      onLoginSuccess(user, validatedTenant);
    }, 450);
  };

  // Handle Super Admin / Developer Master Login
  const handleMasterLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMasterError(null);

    const cleanUser = masterUsername.trim().toLowerCase();
    const cleanPass = masterPassword.trim();

    if (!cleanPass) {
      setMasterError('Master Developer password is required.');
      sound.playError();
      return;
    }

    if (
      isDeveloperPasswordValid(cleanPass, settings.adminPassword) ||
      cleanPass === 'admin123' ||
      cleanPass === 'developer123' ||
      cleanPass === DEVELOPER_PASSWORD
    ) {
      const user: AuthUser = {
        id: 'usr_dev_master',
        username: cleanUser || 'developer',
        name: 'ENH Super Admin & System Architect',
        role: UserRole.DEVELOPER,
        businessId: null,
        restaurant_id: validatedTenant.id,
        lastLoginAt: Date.now(),
      };

      sound.playSuccess();
      triggerHaptic('medium');
      onLoginSuccess(user, validatedTenant);
    } else {
      setMasterError('Access Denied: Invalid Master System Credentials.');
      sound.playError();
      triggerHaptic('heavy');
    }
  };

  // Check if validated tenant is under maintenance
  const isMaintenanceActive = validatedTenant?.isUnderMaintenance;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-emerald-600 selection:text-white relative font-sans">
      {/* Background Decorative Lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
      </div>

      {/* 1. DEVELOPER SPLASH ACCESS SCREEN: Top Branding Header */}
      <header className="relative z-10 w-full border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo size="md" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                ENH RESTAURANT MANAGEMENT AIDE LTD.
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                SaaS Multi-Tenant Cloud
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Hospitality Operating System & Isolated Point of Sale Infrastructure
            </p>
          </div>
        </div>

        {/* Dedicated Route: /enh-system-admin/login quick switch button */}
        <button
          type="button"
          onClick={() => {
            setEntryStage(entryStage === 'enh_system_admin' ? 'code_prompt' : 'enh_system_admin');
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
            entryStage === 'enh_system_admin'
              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
          }`}
          title="Super Admin Master Access Route"
        >
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Super Admin Portal</span>
          <span className="sm:hidden">Admin</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg">
          {/* ========================================================================= */}
          {/* MODE A: SUPER ADMIN MASTER LOGIN ROUTE (/enh-system-admin/login) */}
          {/* ========================================================================= */}
          {entryStage === 'enh_system_admin' && (
            <div className="bg-slate-950 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-white text-base">Super Admin Master Login</h2>
                    <p className="text-xs text-slate-400">
                      ENH RESTAURANT MANAGEMENT AIDE LTD. Root Credentials
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEntryStage('code_prompt')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              {masterError && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{masterError}</span>
                </div>
              )}

              <form onSubmit={handleMasterLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Master Administrator Username
                  </label>
                  <input
                    type="text"
                    value={masterUsername}
                    onChange={(e) => setMasterUsername(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="developer or admin"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Master System Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter master password (e.g. admin123)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-indigo-950/40 rounded-xl border border-indigo-900/60 text-[11px] text-indigo-300 space-y-1">
                  <p className="font-bold">Developer Root Access Permissions:</p>
                  <p>• Full visibility over all tenant partitions & cross-tenant metrics</p>
                  <p>• Inline drag-and-drop layout customization & text editing</p>
                  <p>• Global & per-restaurant maintenance lock switches</p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2"
                >
                  <Terminal className="w-4 h-4" />
                  Authenticate Master Root
                </button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODE B: UNIQUE TENANT CODE VALIDATION PROMPT */}
          {/* ========================================================================= */}
          {entryStage === 'code_prompt' && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6 animate-in fade-in duration-200">
              <div className="text-center space-y-3">
                <div className="flex justify-center mb-1">
                  <EnhLogo size="xl" textColor="light" />
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Partition Verification</span>
                </div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Enter your restaurant's unique tenant code to load your isolated menu, kitchen tickets, and staff accounts.
                </p>
              </div>

              {validationError && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs font-semibold flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-300">
                  Tenant Access Code <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={tenantCodeInput}
                    onChange={(e) => setTenantCodeInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleValidateCode();
                      }
                    }}
                    placeholder="e.g. REST-9021"
                    className="w-full pl-4 pr-12 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white font-mono font-black text-base tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => handleValidateCode()}
                    disabled={isValidating}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition active:scale-95 disabled:opacity-50"
                    title="Validate Code"
                  >
                    {isValidating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Sample Tenant Access Cards */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Quick Access Demo Tenants:
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {tenants.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTenantCodeInput(t.uniqueCode || t.id);
                        handleValidateCode(t.uniqueCode || t.id);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition group active:scale-98"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-black shrink-0"
                          style={{ backgroundColor: t.themeColor || '#1f4d3e' }}
                        >
                          {t.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                            {t.name}
                          </p>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {t.branchName || 'Main Branch'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-black/40 text-emerald-400 border border-emerald-500/20">
                          {t.uniqueCode || 'REST-XXXX'}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Onboard New Tenant Link for Admins */}
              {onOpenOnboardingWizard && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={onOpenOnboardingWizard}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Onboard New Tenant Restaurant (Wizard)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODE C: TENANT PORTAL UNLOCKED - DUAL LOGIN (STAFF vs OWNER) */}
          {/* ========================================================================= */}
          {entryStage === 'portal_unlocked' && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6 animate-in fade-in duration-200">
              {/* Active Tenant Dynamic Branding Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {validatedTenant.logoUrl ? (
                    <img
                      src={validatedTenant.logoUrl}
                      alt={validatedTenant.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-inner"
                      style={{ backgroundColor: validatedTenant.themeColor || '#1f4d3e' }}
                    >
                      {validatedTenant.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-white truncate leading-tight">
                        {validatedTenant.name}
                      </h3>
                    </div>
                    <p className="text-xs text-emerald-400 font-bold mt-0.5 flex items-center gap-1.5">
                      <Store className="w-3 h-3" />
                      <span>{validatedTenant.branchName || 'Main Branch'}</span>
                      <span className="font-mono text-[10px] text-slate-400 bg-black/40 px-1.5 py-0.2 rounded">
                        {validatedTenant.uniqueCode}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEntryStage('code_prompt')}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[11px] font-bold border border-slate-700 transition"
                  title="Switch Tenant Code"
                >
                  Change
                </button>
              </div>

              {/* Maintenance Notice Check */}
              {isMaintenanceActive ? (
                <div className="p-5 rounded-2xl bg-amber-950/50 border border-amber-500/50 text-amber-200 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <Wrench className="w-5 h-5 text-amber-400 animate-spin" />
                    <h4 className="font-black text-sm text-white">System Under Maintenance</h4>
                  </div>
                  <p className="text-xs text-amber-300/90 leading-relaxed">
                    {validatedTenant.maintenanceMessage ||
                      'ENH RESTAURANT MANAGEMENT AIDE LTD. is currently deploying platform updates for this restaurant. Operational access is temporarily paused.'}
                  </p>
                  <div className="pt-2 border-t border-amber-900/60 flex items-center justify-between">
                    <span className="text-[10px] text-amber-400">ENH Maintenance Shield</span>
                    <button
                      type="button"
                      onClick={() => setEntryStage('enh_system_admin')}
                      className="text-[11px] font-bold text-white bg-amber-600 px-2.5 py-1 rounded-lg"
                    >
                      Developer Bypass
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* DUAL LOGIN OPTIONS TAB SWITCHER */}
                  <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-900 rounded-2xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLoginSection('staff');
                        setLoginError(null);
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                        activeLoginSection === 'staff'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Staff Login</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveLoginSection('owner');
                        setLoginError(null);
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                        activeLoginSection === 'owner'
                          ? 'bg-slate-800 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span>Owner Section</span>
                    </button>
                  </div>

                  {loginError && (
                    <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  {/* 1. STAFF LOGIN SECTION */}
                  {activeLoginSection === 'staff' && (
                    <form onSubmit={handleStaffLogin} className="space-y-4 text-xs animate-in fade-in duration-200">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">
                          Select Staff Terminal User
                        </label>
                        <select
                          value={selectedStaffId}
                          onChange={(e) => setSelectedStaffId(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {staffList.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.roleTitle || 'Server / Cashier'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">
                          Staff Passcode / Quick PIN
                        </label>
                        <input
                          type="password"
                          maxLength={6}
                          value={staffPin}
                          onChange={(e) => setStaffPin(e.target.value)}
                          placeholder="Default PIN: 1234 (or leave blank)"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-center tracking-widest text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Role: Restricted POS & Orders</span>
                        <span className="text-emerald-400 font-bold">Fast Shift Access</span>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
                      >
                        {isLoggingIn ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <LogIn className="w-4 h-4" />
                            <span>Enter Operational POS</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* 2. OWNER LOGIN SECTION */}
                  {activeLoginSection === 'owner' && (
                    <form onSubmit={handleOwnerLogin} className="space-y-4 text-xs animate-in fade-in duration-200">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">
                          Owner Email / Master Identifier
                        </label>
                        <input
                          type="text"
                          value={ownerUsername}
                          onChange={(e) => setOwnerUsername(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="e.g. owner@restaurant.com"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">
                          Manager / Admin Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={ownerPassword}
                            onChange={(e) => setOwnerPassword(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Enter password (demo: admin123)"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                        <p className="text-slate-300 font-semibold">Full Manager Dashboard Privileges:</p>
                        <p>• Menu pricing & dish catalog editing</p>
                        <p>• Multi-branch management & financial analytics</p>
                        <p>• Payment gateway & staff payroll configuration</p>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 border border-slate-700"
                      >
                        {isLoggingIn ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Shield className="w-4 h-4 text-emerald-400" />
                            <span>Unlock Owner Dashboard</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-slate-800/60 bg-slate-950/40 px-4 py-3 text-center text-slate-500 text-[11px]">
        <span>Powered by ENH RESTAURANT MANAGEMENT AIDE LTD. • Strict Database Row-Level Multi-Tenancy Scoping</span>
      </footer>
    </div>
  );
};
