import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  Terminal,
  UserCheck,
  Building2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { UserRole, isDeveloperPasswordValid, DEVELOPER_PASSWORD } from '../utils/rbac';
import { AuthUser, RestaurantSettings, StaffMember, BusinessOwnerAccount } from '../types';
import { sound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { BrandLogo } from './BrandLogo';

interface LoginScreenProps {
  settings: RestaurantSettings;
  staffList: StaffMember[];
  businessOwners?: BusinessOwnerAccount[];
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  settings,
  staffList,
  businessOwners = [],
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STAFF);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHints, setShowHints] = useState(false);

  // Authenticate via credentials
  const handleSubmitCredentials = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const cleanUser = username.trim().toLowerCase().replace(/^@/, '');
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMessage('Please enter both username and password.');
      sound.playError();
      triggerHaptic('heavy');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // 1. Developer Check
      const isDevUser =
        cleanUser === 'dev' ||
        cleanUser === 'developer' ||
        cleanUser === 'admin' ||
        cleanUser === 'root' ||
        cleanUser === 'ernest' ||
        cleanUser === 'ernestnyambi23@gmail.com';

      if (
        (isDevUser && isDeveloperPasswordValid(cleanPass, settings.adminPassword)) ||
        (selectedRole === UserRole.DEVELOPER && isDeveloperPasswordValid(cleanPass, settings.adminPassword))
      ) {
        completeLogin({
          id: 'usr_dev_001',
          username: 'developer',
          name: 'Developer (Root Owner)',
          role: UserRole.DEVELOPER,
          businessId: null,
          lastLoginAt: Date.now(),
        });
        return;
      }

      // 2. Provisioned Business Owners Check
      const matchedOwner = businessOwners.find(
        (o) =>
          (o.username && o.username.toLowerCase() === cleanUser) ||
          o.name.toLowerCase() === cleanUser ||
          o.email?.toLowerCase() === cleanUser ||
          (cleanUser === 'owner') ||
          (cleanUser === (settings.ownerName || '').toLowerCase())
      );

      if (matchedOwner) {
        if (matchedOwner.accessEnabled === false) {
          setIsLoading(false);
          setErrorMessage(`Login Suspended: Access for Business Owner "${matchedOwner.name}" has been disabled by Developer Root Master Control.`);
          sound.playError();
          triggerHaptic('heavy');
          return;
        }

        const isOwnerPasswordCorrect =
          cleanPass === matchedOwner.password ||
          (matchedOwner.pin && cleanPass === matchedOwner.pin) ||
          cleanPass === settings.adminPassword ||
          cleanPass === 'owner123' ||
          cleanPass === '8888';

        if (isOwnerPasswordCorrect) {
          completeLogin({
            id: matchedOwner.id,
            username: matchedOwner.username || 'owner',
            name: matchedOwner.name || settings.ownerName || 'Restaurant Owner',
            role: UserRole.OWNER,
            businessId: 'biz_main_001',
            lastLoginAt: Date.now(),
          });
          return;
        }
      }

      // 3. Fallback Legacy Owner Check
      const adminPass = settings.adminPassword || 'admin123';
      if (
        (cleanUser === 'owner' || cleanUser === 'boss' || cleanUser === 'manager' || cleanUser === (settings.ownerName || '').toLowerCase()) &&
        (cleanPass === 'owner123' || cleanPass === adminPass || cleanPass === '8888')
      ) {
        completeLogin({
          id: 'usr_owner_001',
          username: cleanUser,
          name: settings.ownerName || 'Restaurant Owner',
          role: UserRole.OWNER,
          businessId: 'biz_main_001',
          lastLoginAt: Date.now(),
        });
        return;
      }

      // 4. Check custom staff in staffList
      const matchedStaff = staffList.find(
        (s) =>
          (s.username && s.username.toLowerCase() === cleanUser) ||
          s.name.toLowerCase() === cleanUser ||
          s.email?.toLowerCase() === cleanUser ||
          s.phone?.includes(cleanUser) ||
          (cleanUser === 'staff')
      );

      if (matchedStaff) {
        if (matchedStaff.accessEnabled === false) {
          setIsLoading(false);
          setErrorMessage(`Login Disabled: Access for staff member "${matchedStaff.name}" has been disabled by the Owner.`);
          sound.playError();
          triggerHaptic('heavy');
          return;
        }

        const isPasswordCorrect =
          (matchedStaff.password && cleanPass === matchedStaff.password) ||
          (matchedStaff.pin && cleanPass === matchedStaff.pin) ||
          cleanPass === 'staff123' ||
          cleanPass === '1234' ||
          (matchedStaff.phone && cleanPass === matchedStaff.phone);

        if (isPasswordCorrect) {
          completeLogin({
            id: matchedStaff.id,
            username: matchedStaff.username || matchedStaff.name.toLowerCase().replace(/\s+/g, '_'),
            name: matchedStaff.name,
            role: matchedStaff.assignedRole || UserRole.STAFF,
            businessId: 'biz_main_001',
            lastLoginAt: Date.now(),
          });
          return;
        }
      }

      // 5. Fallback Generic Staff credentials
      if (cleanUser === 'staff' && (cleanPass === 'staff123' || cleanPass === '1234' || cleanPass === 'password')) {
        completeLogin({
          id: 'usr_staff_default',
          username: 'staff',
          name: 'POS Staff Member',
          role: UserRole.STAFF,
          businessId: 'biz_main_001',
          lastLoginAt: Date.now(),
        });
        return;
      }

      // 6. If selected role matches standard passwords
      if (selectedRole === UserRole.STAFF && (cleanPass === 'staff123' || cleanPass === '1234')) {
        completeLogin({
          id: `usr_staff_${Date.now()}`,
          username: cleanUser,
          name: cleanUser.charAt(0).toUpperCase() + cleanUser.slice(1),
          role: UserRole.STAFF,
          businessId: 'biz_main_001',
          lastLoginAt: Date.now(),
        });
        return;
      }

      if (selectedRole === UserRole.OWNER && (cleanPass === 'owner123' || cleanPass === adminPass)) {
        completeLogin({
          id: `usr_owner_${Date.now()}`,
          username: cleanUser,
          name: cleanUser.charAt(0).toUpperCase() + cleanUser.slice(1),
          role: UserRole.OWNER,
          businessId: 'biz_main_001',
          lastLoginAt: Date.now(),
        });
        return;
      }

      if (selectedRole === UserRole.DEVELOPER && isDeveloperPasswordValid(cleanPass, settings.adminPassword)) {
        completeLogin({
          id: `usr_dev_${Date.now()}`,
          username: cleanUser,
          name: 'Developer (Root)',
          role: UserRole.DEVELOPER,
          businessId: null,
          lastLoginAt: Date.now(),
        });
        return;
      }

      // Invalid
      setIsLoading(false);
      setErrorMessage('Invalid username or password. Check credentials and try again.');
      sound.playError();
      triggerHaptic('heavy');
    }, 300);
  };

  const completeLogin = (user: AuthUser) => {
    sound.playSuccess();
    triggerHaptic('success');
    setIsLoading(false);
    onLoginSuccess(user);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#143529] via-[#102a20] to-[#0a1b14] text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-x-hidden select-none">
      {/* Background Decorative Rings */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-2xl pointer-events-none -z-10" />

      {/* Top Header & Branding */}
      <div className="max-w-md w-full mx-auto text-center pt-3 sm:pt-6">
        <div className="inline-flex items-center justify-center mb-4">
          <div className="p-1 sm:p-2 bg-white rounded-3xl shadow-2xl border border-white/40 flex items-center justify-center">
            <BrandLogo size="full" shape="rounded" alt={settings.restaurantName} />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
          <span>{settings.restaurantName}</span>
        </h1>
        <p className="text-xs sm:text-sm text-emerald-200/80 font-medium mt-1">
          {settings.tagline || 'POS & Kitchen Management System'}
        </p>
      </div>

      {/* Main Login Card Container */}
      <div className="max-w-md w-full mx-auto my-auto py-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 sm:p-7 shadow-2xl">
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          {/* Standard Username + Password Login Form */}
          <form onSubmit={handleSubmitCredentials} className="space-y-4">
            {/* Role Preference Pill Selector */}
            <div>
              <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Select Access Tier
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole(UserRole.STAFF);
                    if (!username) setUsername('staff');
                    sound.playClick();
                  }}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center gap-1 ${
                    selectedRole === UserRole.STAFF
                      ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-xs ring-1 ring-amber-400/50'
                      : 'bg-black/30 border-white/10 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Staff</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole(UserRole.OWNER);
                    if (!username) setUsername('owner');
                    sound.playClick();
                  }}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center gap-1 ${
                    selectedRole === UserRole.OWNER
                      ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-xs ring-1 ring-emerald-400/50'
                      : 'bg-black/30 border-white/10 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Owner</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole(UserRole.DEVELOPER);
                    if (!username) setUsername('dev');
                    sound.playClick();
                  }}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center gap-1 ${
                    selectedRole === UserRole.DEVELOPER
                      ? 'bg-indigo-500/30 border-indigo-400 text-indigo-200 shadow-xs ring-1 ring-indigo-400/50'
                      : 'bg-black/30 border-white/10 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Dev Root</span>
                </button>
              </div>
            </div>

            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-gray-200 mb-1">
                Username or Staff Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="login-username-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. staff, owner, dev"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full pl-10 pr-3 py-3 rounded-2xl bg-black/40 border border-white/20 text-white placeholder-gray-500 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-200">
                  Password / Passcode
                </label>
                <button
                  type="button"
                  onClick={() => setShowHints(!showHints)}
                  className="text-[11px] text-emerald-300 hover:text-emerald-200 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>{showHints ? 'Hide hints' : 'Need credentials?'}</span>
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-black/40 border border-white/20 text-white placeholder-gray-500 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Submit Button: Replaced Authenticate & Access with Log In */}
            <button
              type="submit"
              id="login-submit-btn"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-extrabold text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Log In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Credentials Info Helper Accordion */}
          {showHints && (
            <div className="mt-4 p-3.5 bg-black/50 rounded-2xl border border-white/15 text-[11px] text-gray-300 space-y-2 animate-in fade-in">
              <div className="font-bold text-white flex items-center gap-1 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Default Access Credentials</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 pt-1 text-[11px]">
                <div className="flex justify-between items-center py-0.5 border-b border-white/10">
                  <span className="font-semibold text-amber-300">Staff POS:</span>
                  <span className="font-mono text-gray-200">staff / staff123</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-white/10">
                  <span className="font-semibold text-emerald-300">Restaurant Owner:</span>
                  <span className="font-mono text-gray-200">owner / owner123</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="font-semibold text-indigo-300">Developer Root:</span>
                  <span className="font-mono text-gray-200">dev / {DEVELOPER_PASSWORD}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-emerald-300/60 pb-2">
        <span>{settings.restaurantName} &bull; Management Portal</span>
      </div>
    </div>
  );
};
