import React from 'react';
import {
  UtensilsCrossed,
  ShoppingBag,
  CheckSquare,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Shield,
  Bell,
  Terminal,
  UserCheck,
  LogOut,
  MoreVertical,
  Bot,
  Store,
  Building2,
} from 'lucide-react';
import { TabType, Language, AuthUser } from '../types';
import { BrandLogo } from './BrandLogo';
import { useAppTranslation } from '../utils/translations';
import { UserRole } from '../utils/rbac';
import { useFirebase } from '../firebase/FirebaseContext';

interface TopBarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  restaurantName: string;
  tagline: string;
  activeOrderCount: number;
  completedOrderCount: number;
  cartCount: number;
  isAdminUnlocked: boolean;
  currentRole?: UserRole;
  authUser?: AuthUser | null;
  onLogout?: () => void;
  onOpenRoleAuthModal?: () => void;
  onOpenCart: () => void;
  onOpenAndroidAppModal?: () => void;
  onOpenSettings: () => void;
  onOpenNotifications?: () => void;
  onOpenAiAssistant?: () => void;
  onOpenTenantSwitcher?: () => void;
  onOpenSuperAdmin?: () => void;
  unreadNotificationsCount?: number;
  pendingDevicesCount?: number;
  language?: Language;
  hideAdminFromNav?: boolean;
  developerMode?: boolean;
  onToggleDeveloperMode?: () => void;
  onInlineUpdateTenant?: (updates: { name?: string; tagline?: string }) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  restaurantName,
  tagline,
  activeOrderCount,
  completedOrderCount,
  cartCount,
  isAdminUnlocked,
  currentRole = UserRole.STAFF,
  authUser,
  onLogout,
  onOpenRoleAuthModal,
  onOpenCart,
  onOpenAndroidAppModal,
  onOpenSettings,
  onOpenNotifications,
  onOpenAiAssistant,
  onOpenTenantSwitcher,
  onOpenSuperAdmin,
  unreadNotificationsCount = 0,
  pendingDevicesCount = 0,
  language = 'en',
  hideAdminFromNav = false,
  developerMode = false,
  onToggleDeveloperMode,
  onInlineUpdateTenant,
}) => {
  const { t } = useAppTranslation(language);
  const { user: firebaseUser, signInWithGoogle, signOutUser } = useFirebase();

  return (
    <header className="sticky top-0 z-30 bg-[#1f4d3e] text-white shadow-md">
      {/* Brand & Action Header: [⋮] [Logo] TENANT BUSINESS NAME [Owner/Staff] */}
      <div className="max-w-2xl mx-auto px-3.5 pt-3 pb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Top-left corner 3-Dot Menu Button (⋮) containing all configuration and setting options */}
          <button
            type="button"
            id="top-left-settings-icon"
            onClick={onOpenSettings}
            title={
              currentRole === UserRole.DEVELOPER
                ? 'Settings, Tenant Switcher & Dev Controls (⋮)'
                : isAdminUnlocked
                ? 'Settings & Branch Management (⋮)'
                : 'Settings & Config Menu (⋮)'
            }
            aria-label="Settings Menu"
            className="h-9 px-2.5 shrink-0 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 border border-white/30 flex items-center gap-1.5 text-white shadow-sm transition-all group relative cursor-pointer"
          >
            <MoreVertical className="w-4 h-4 text-emerald-200 group-hover:text-white shrink-0" />
            <span className="text-xs font-bold tracking-tight">Settings</span>
            {isAdminUnlocked ? (
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  currentRole === UserRole.DEVELOPER ? 'bg-indigo-400' : 'bg-emerald-400'
                }`}
              />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            )}
            {pendingDevicesCount > 0 && !isAdminUnlocked && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 border border-white text-[9px] font-black flex items-center justify-center text-black animate-pulse">
                {pendingDevicesCount}
              </span>
            )}
          </button>

          <BrandLogo size="md" />

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Inline Content Editable Restaurant Name if Super Admin and Developer Mode is active */}
              <h1
                contentEditable={currentRole === UserRole.DEVELOPER && developerMode}
                suppressContentEditableWarning={true}
                onBlur={(e) => {
                  const val = e.currentTarget.textContent?.trim();
                  if (val && val !== restaurantName) {
                    onInlineUpdateTenant?.({ name: val });
                  }
                }}
                className={`text-[16px] sm:text-[17px] font-bold tracking-tight truncate leading-tight transition-all ${
                  currentRole === UserRole.DEVELOPER && developerMode
                    ? 'border border-dashed border-amber-300/80 bg-black/25 px-1.5 py-0.5 rounded cursor-text'
                    : ''
                }`}
                title={
                  currentRole === UserRole.DEVELOPER && developerMode
                    ? 'Click to edit business name inline'
                    : undefined
                }
              >
                {restaurantName}
              </h1>

              {/* RBAC Role Indicator Pill */}
              <button
                type="button"
                onClick={onOpenRoleAuthModal || onOpenSettings}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border cursor-pointer active:scale-95 transition-all shrink-0 ${
                  currentRole === UserRole.DEVELOPER
                    ? 'bg-indigo-500/30 text-indigo-200 border-indigo-400/50 hover:bg-indigo-500/50'
                    : currentRole === UserRole.OWNER
                    ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/50 hover:bg-emerald-500/50'
                    : 'bg-amber-500/25 text-amber-200 border-amber-400/40 hover:bg-amber-500/40'
                }`}
                title="Click to switch or verify RBAC Role"
              >
                {currentRole === UserRole.DEVELOPER ? (
                  <>
                    <Terminal className="w-2.5 h-2.5 text-indigo-300" />
                    <span>DEV ROOT</span>
                  </>
                ) : currentRole === UserRole.OWNER ? (
                  <>
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-300" />
                    <span>OWNER</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-2.5 h-2.5 text-amber-300" />
                    <span>STAFF</span>
                  </>
                )}
              </button>

              {/* Multi-Tenant Restaurant Switcher Badge */}
              {onOpenTenantSwitcher && (
                <button
                  type="button"
                  onClick={onOpenTenantSwitcher}
                  id="header-tenant-switcher-btn"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/15 hover:bg-white/25 border border-white/25 text-white cursor-pointer active:scale-95 transition-all shrink-0"
                  title="Switch restaurant or branch location (Multi-Tenant)"
                >
                  <Store className="w-2.5 h-2.5 text-emerald-300" />
                  <span>Branch</span>
                  <span className="text-[8px] text-emerald-300">▼</span>
                </button>
              )}
            </div>

            {/* Inline Content Editable Tagline if Super Admin and Developer Mode is active */}
            <p
              contentEditable={currentRole === UserRole.DEVELOPER && developerMode}
              suppressContentEditableWarning={true}
              onBlur={(e) => {
                const val = e.currentTarget.textContent?.trim();
                if (val && val !== tagline) {
                  onInlineUpdateTenant?.({ tagline: val });
                }
              }}
              className={`text-[11px] sm:text-[11.5px] text-[#cfe0d7] truncate leading-none mt-0.5 transition-all ${
                currentRole === UserRole.DEVELOPER && developerMode
                  ? 'border border-dashed border-amber-300/80 bg-black/25 px-1 py-0.5 rounded cursor-text'
                  : ''
              }`}
              title={
                currentRole === UserRole.DEVELOPER && developerMode
                  ? 'Click to edit tagline inline'
                  : undefined
              }
            >
              {tagline}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Developer Mode Overlay Toggle for Super Admin */}
          {currentRole === UserRole.DEVELOPER && onToggleDeveloperMode && (
            <button
              type="button"
              id="header-devmode-toggle-btn"
              onClick={onToggleDeveloperMode}
              title="Toggle Admin Layout Overlay Mode & Inline Content Editing"
              className={`px-2 py-1.5 rounded-xl text-[11px] font-black border transition-all flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer ${
                developerMode
                  ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-md ring-2 ring-amber-300/40 animate-pulse'
                  : 'bg-white/10 hover:bg-white/20 text-indigo-200 border-indigo-400/40'
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span className="hidden xs:inline">
                {developerMode ? 'Dev Mode ON' : 'Dev Mode'}
              </span>
            </button>
          )}

          {/* Centralized Developer Super-Admin SaaS Portal Button */}
          {currentRole === UserRole.DEVELOPER && onOpenSuperAdmin && (
            <button
              type="button"
              id="header-superadmin-btn"
              onClick={onOpenSuperAdmin}
              title="Super-Admin SaaS Portal (Multi-Restaurant Management & Global Metrics)"
              className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/60 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-indigo-200" />
              <span className="hidden md:inline">SaaS Portal</span>
            </button>
          )}

          {/* Notification Bell */}
          {onOpenNotifications && (
            <button
              type="button"
              id="header-notification-btn"
              onClick={onOpenNotifications}
              title="Arrival & System Notifications"
              className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all"
            >
              <Bell className="w-4 h-4 text-emerald-200" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-white animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {onOpenAndroidAppModal && (
            <button
              type="button"
              id="header-android-btn"
              onClick={onOpenAndroidAppModal}
              title="Install Android App / APK"
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Smartphone className="w-4 h-4 text-emerald-300" />
              <span className="hidden sm:inline">{t('nav.android_app', 'Android App')}</span>
            </button>
          )}

          {/* Google Auth / Cloud User */}
          {firebaseUser ? (
            <button
              type="button"
              id="google-user-profile-btn"
              onClick={() => {
                if (confirm(`Signed in with Google as ${firebaseUser.email}. Sign out?`)) {
                  signOutUser();
                }
              }}
              title={`Google Account: ${firebaseUser.displayName || firebaseUser.email} (Synced to Cloud SQL). Tap to sign out.`}
              className="flex items-center gap-1.5 p-1 px-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-semibold cursor-pointer active:scale-95 transition-all"
            >
              {firebaseUser.photoURL ? (
                <img
                  src={firebaseUser.photoURL}
                  alt={firebaseUser.displayName || 'User'}
                  className="w-5 h-5 rounded-full object-cover border border-white/40"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-[10px] font-bold flex items-center justify-center border border-white/30">
                  {firebaseUser.email?.charAt(0).toUpperCase() || 'G'}
                </span>
              )}
              <span className="hidden lg:inline text-[11px] truncate max-w-[80px]">
                {firebaseUser.displayName?.split(' ')[0] || firebaseUser.email?.split('@')[0]}
              </span>
            </button>
          ) : (
            <button
              type="button"
              id="google-sign-in-btn"
              onClick={() => signInWithGoogle()}
              title="Sign in with Google"
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white text-[#1f4d3e] hover:bg-emerald-50 text-xs font-bold shadow-sm active:scale-95 cursor-pointer transition-all"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="hidden sm:inline">Google Sign In</span>
            </button>
          )}

          {/* Quick AI Order Assistant Trigger */}
          {onOpenAiAssistant && (
            <button
              type="button"
              id="header-ai-assistant-btn"
              onClick={onOpenAiAssistant}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-100 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
              title="Olli's AI Order Assistant"
            >
              <Bot className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span className="hidden sm:inline">AI Order</span>
            </button>
          )}

          {/* Quick Cart Trigger */}
          <button
            type="button"
            id="header-cart-btn"
            onClick={onOpenCart}
            className="relative px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">{t('nav.cart', 'Cart')}</span>
            {cartCount > 0 && (
              <span className="bg-[#c8791f] text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[16px] text-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* Explicit Logout Button */}
          {onLogout && (
            <button
              type="button"
              id="header-logout-btn"
              onClick={onLogout}
              title={`Logged in as ${authUser?.name || authUser?.username || 'User'} (${currentRole}). Click to Log Out.`}
              className="px-2.5 py-1.5 rounded-xl bg-red-950/50 hover:bg-red-900/70 border border-red-500/30 text-red-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Log Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sections Bar (Operational Tabs: Order, Order Received, Completed) */}
      <div className="max-w-2xl mx-auto px-3 pb-2.5">
        <div className="grid grid-cols-3 gap-1.5 bg-black/25 p-1 rounded-2xl border border-white/15 text-center">
          {/* 1. Order */}
          <button
            type="button"
            id="bar-tab-order"
            onClick={() => onSelectTab('order')}
            className={`py-2 px-1 rounded-xl text-[11.5px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              currentTab === 'order' || currentTab === 'menu'
                ? 'bg-white text-[#143529] shadow-sm'
                : 'text-[#dcebe3] hover:text-white'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span className="truncate">{t('nav.order', 'Order')}</span>
          </button>

          {/* 2. Order Received (with tick box) */}
          <button
            type="button"
            id="bar-tab-order-received"
            onClick={() => onSelectTab('order_received')}
            className={`relative py-2 px-1 rounded-xl text-[11.5px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              currentTab === 'order_received' || currentTab === 'orders'
                ? 'bg-white text-[#143529] shadow-sm'
                : 'text-[#dcebe3] hover:text-white'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-[#c8791f]" />
            <span className="truncate">{t('nav.order_received', 'Order Received')}</span>
            {activeOrderCount > 0 && (
              <span className="bg-[#b3402f] text-white text-[9px] font-extrabold px-1.5 rounded-full min-w-[14px]">
                {activeOrderCount}
              </span>
            )}
          </button>

          {/* 3. Order Completed */}
          <button
            type="button"
            id="bar-tab-order-completed"
            onClick={() => onSelectTab('order_completed')}
            className={`relative py-2 px-1 rounded-xl text-[11.5px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              currentTab === 'order_completed'
                ? 'bg-white text-[#143529] shadow-sm'
                : 'text-[#dcebe3] hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate">{t('nav.completed', 'Completed')}</span>
            {completedOrderCount > 0 && (
              <span className="bg-white/20 text-emerald-100 text-[9px] font-bold px-1 rounded-full hidden sm:inline">
                {completedOrderCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
