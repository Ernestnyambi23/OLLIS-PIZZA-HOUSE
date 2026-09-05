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
} from 'lucide-react';
import { TabType, Language, AuthUser } from '../types';
import { BrandLogo } from './BrandLogo';
import { useAppTranslation } from '../utils/translations';
import { UserRole } from '../utils/rbac';

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
  unreadNotificationsCount?: number;
  pendingDevicesCount?: number;
  language?: Language;
  hideAdminFromNav?: boolean;
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
  unreadNotificationsCount = 0,
  pendingDevicesCount = 0,
  language = 'en',
  hideAdminFromNav = false,
}) => {
  const { t } = useAppTranslation(language);

  return (
    <header className="sticky top-0 z-30 bg-[#1f4d3e] text-white shadow-md">
      {/* Brand & Action Header */}
      <div className="max-w-2xl mx-auto px-3.5 pt-3 pb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
        {/* All settings in one place named Settings at left top corner with three dots icon */}
          <button
            type="button"
            id="top-left-settings-icon"
            onClick={onOpenSettings}
            title={
              currentRole === UserRole.DEVELOPER
                ? 'Settings & Dev Infra'
                : isAdminUnlocked
                ? 'Settings & Admin Controls'
                : 'Settings (Tap to Open)'
            }
            aria-label="Settings"
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
              <h1 className="text-[16px] sm:text-[17px] font-bold tracking-tight truncate leading-tight">
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
            </div>
            <p className="text-[11px] sm:text-[11.5px] text-[#cfe0d7] truncate leading-none mt-0.5">
              {tagline}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
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
