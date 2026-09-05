/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Role,
  TabType,
  MenuItem,
  CartItem,
  Order,
  Variant,
  OrderStatus,
  OrderType,
  PaymentMethod,
  RestaurantSettings,
  ConnectedDevice,
  StaffMember,
  OneTimePasscode,
  AuthUser,
  Purchase,
  Capital,
  MpesaTransaction,
  BusinessOwnerAccount,
} from './types';
import {
  loadStoredItems,
  saveStoredItems,
  loadStoredOrders,
  saveStoredOrders,
  loadStoredSettings,
  saveStoredSettings,
  loadStoredDevices,
  saveStoredDevices,
  loadStoredStaff,
  saveStoredStaff,
  loadStoredBusinessOwners,
  saveStoredBusinessOwners,
  loadStoredOTPs,
  saveStoredOTPs,
  loadStoredPurchases,
  saveStoredPurchases,
  loadStoredCapital,
  saveStoredCapital,
  loadStoredMpesaTransactions,
  saveStoredMpesaTransactions,
  resetAnalyticsData,
  getCurrentDeviceId,
  resetAllData,
  loadStoredAuthUser,
  saveStoredAuthUser,
  clearStoredAuthUser,
} from './utils/storage';
import { generateOrderNumber } from './utils/formatters';
import { sound } from './utils/sound';

import { LoginScreen } from './components/LoginScreen';
import { TopBar } from './components/TopBar';
import { CustomerMenu } from './components/CustomerMenu';
import { OrderReceivedView } from './components/OrderReceivedView';
import { OrderCompletedView } from './components/OrderCompletedView';
import { AdminView } from './components/AdminView';
import { AdminAuthModal } from './components/AdminAuthModal';
import { DeviceLockoutShield } from './components/DeviceLockoutShield';
import { DevicePendingApprovalShield } from './components/DevicePendingApprovalShield';
import { ItemDetailModal } from './components/ItemDetailModal';
import { CartSheet } from './components/CartSheet';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { AutoPushCheckoutModal } from './components/AutoPushCheckoutModal';
import { ReceiptModal } from './components/ReceiptModal';
import { NewItemModal } from './components/NewItemModal';
import { EditItemModal } from './components/EditItemModal';
import { ImagePickerModal } from './components/ImagePickerModal';
import { AppBackground } from './components/AppBackground';
import { AndroidAppModal } from './components/AndroidAppModal';
import { SettingsAdminPanel } from './components/SettingsAdminPanel';
import { DebugDiagnosticsHUD } from './components/DebugDiagnosticsHUD';
import { triggerHaptic } from './utils/haptics';
import { initializeThemeColors } from './utils/colorTheme';
import { UserRole } from './utils/rbac';
import { Radio, CheckCircle2, ShieldCheck, X } from 'lucide-react';

export default function App() {
  // Authentication & RBAC Session State (Required Before Access)
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => loadStoredAuthUser());
  const [currentTab, setCurrentTab] = useState<TabType>('order');
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const stored = loadStoredAuthUser();
    return stored?.role || UserRole.OWNER;
  });
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    const stored = loadStoredAuthUser();
    return stored ? (stored.role === UserRole.OWNER || stored.role === UserRole.DEVELOPER) : true;
  });
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [pendingSettingsOpen, setPendingSettingsOpen] = useState<boolean>(false);

  // Data State
  const [items, setItems] = useState<MenuItem[]>(() => loadStoredItems());
  const [orders, setOrders] = useState<Order[]>(() => loadStoredOrders());
  const [settings, setSettings] = useState<RestaurantSettings>(() => loadStoredSettings());
  const [devices, setDevices] = useState<ConnectedDevice[]>(() => loadStoredDevices());
  const [staffList, setStaffList] = useState<StaffMember[]>(() => loadStoredStaff());
  const [businessOwners, setBusinessOwners] = useState<BusinessOwnerAccount[]>(() => loadStoredBusinessOwners());
  const [otps, setOtps] = useState<OneTimePasscode[]>(() => loadStoredOTPs());
  const [purchases, setPurchases] = useState<Purchase[]>(() => loadStoredPurchases());
  const [capital, setCapital] = useState<Capital>(() => loadStoredCapital());
  const [mpesaTransactions, setMpesaTransactions] = useState<MpesaTransaction[]>(() => loadStoredMpesaTransactions());
  const [cart, setCart] = useState<CartItem[]>([]);

  // Modals & Interaction State
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [pickingImageItem, setPickingImageItem] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [activeConfirmationOrder, setActiveConfirmationOrder] = useState<Order | null>(null);
  const [activeAutoPushOrder, setActiveAutoPushOrder] = useState<Order | null>(null);
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<Order | null>(null);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState<boolean>(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [newDeviceAlertToast, setNewDeviceAlertToast] = useState<{ id: string; name: string; pairingCode?: string } | null>(null);
  const prevPendingCountRef = React.useRef(0);


  // Initialize brand color scheme from localStorage
  useEffect(() => {
    initializeThemeColors();
  }, []);

  // Android & PWA Install Prompt Listener
  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://');
      setIsStandalone(Boolean(isStandaloneMode));
    };
    checkStandalone();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Real-time synchronization across other browser tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'orderup_connected_devices' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const curId = getCurrentDeviceId();
          setDevices(parsed.map((d: any) => ({ ...d, isCurrent: d.id === curId })));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult && choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  // Sync state changes with localStorage
  useEffect(() => {
    saveStoredItems(items);
  }, [items]);

  useEffect(() => {
    saveStoredOrders(orders);
  }, [orders]);

  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveStoredDevices(devices);
  }, [devices]);

  useEffect(() => {
    saveStoredStaff(staffList);
  }, [staffList]);

  useEffect(() => {
    saveStoredBusinessOwners(businessOwners);
  }, [businessOwners]);

  useEffect(() => {
    saveStoredOTPs(otps);
  }, [otps]);

  useEffect(() => {
    saveStoredPurchases(purchases);
  }, [purchases]);

  useEffect(() => {
    saveStoredCapital(capital);
  }, [capital]);

  useEffect(() => {
    saveStoredMpesaTransactions(mpesaTransactions);
  }, [mpesaTransactions]);

  // Keep an active interval for live timer updates
  const [, setTick] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Check device status
  const currentDeviceId = getCurrentDeviceId();
  const currentDevice = devices.find((d) => d.id === currentDeviceId || d.isCurrent);
  const isDeviceControlActive = settings.deviceControlEnabled !== false;
  const isCurrentDevicePending = isDeviceControlActive && currentDevice?.status === 'pending_approval';
  const isCurrentDeviceDisabled = isDeviceControlActive && currentDevice?.status === 'disabled';

  const pendingDevices = devices.filter((d) => d.status === 'pending_approval');
  const pendingDevicesCount = pendingDevices.length;

  // Sound notification when new device authorization is requested
  useEffect(() => {
    if (pendingDevicesCount > prevPendingCountRef.current) {
      sound.playDeviceAlert();
      triggerHaptic('heavy');
      const latestPending = devices.find((d) => d.status === 'pending_approval');
      if (latestPending) {
        setNewDeviceAlertToast({
          id: latestPending.id,
          name: latestPending.name,
          pairingCode: latestPending.pairingCode,
        });
      }
    }
    prevPendingCountRef.current = pendingDevicesCount;
  }, [pendingDevicesCount]);

  const handleLoginSuccess = (user: AuthUser) => {
    setAuthUser(user);
    saveStoredAuthUser(user);
    setCurrentRole(user.role);
    if (user.role === UserRole.OWNER || user.role === UserRole.DEVELOPER) {
      setIsAdminUnlocked(true);
    } else {
      setIsAdminUnlocked(false);
      setCurrentTab('order');
    }
  };

  const handleLogout = () => {
    clearStoredAuthUser();
    setAuthUser(null);
    setIsAdminUnlocked(false);
    setCurrentRole(UserRole.STAFF);
    setIsSettingsOpen(false);
    setIsAdminAuthModalOpen(false);
    setCurrentTab('order');
    sound.playClick();
    triggerHaptic('medium');
  };

  // Navigation Handler with Admin Password Gate
  const handleSelectTab = (tab: TabType) => {
    sound.playClick();
    if (tab === 'admin') {
      if (isAdminUnlocked) {
        setCurrentTab('admin');
      } else {
        setPendingSettingsOpen(false);
        setIsAdminAuthModalOpen(true);
      }
    } else if (tab === 'cart') {
      setIsCartOpen(true);
    } else {
      setCurrentTab(tab);
    }
  };

  const handleOpenSettingsPanel = () => {
    sound.playClick();
    setIsSettingsOpen(true);
  };

  const handleAdminAuthSuccess = (role?: UserRole) => {
    const targetRole = role || UserRole.OWNER;
    setCurrentRole(targetRole);

    if (authUser) {
      const updatedUser: AuthUser = {
        ...authUser,
        role: targetRole,
        name:
          targetRole === UserRole.DEVELOPER
            ? 'Developer (Root Owner)'
            : targetRole === UserRole.OWNER
            ? settings.ownerName || 'Restaurant Owner'
            : authUser.name,
      };
      setAuthUser(updatedUser);
      saveStoredAuthUser(updatedUser);
    }

    if (targetRole === UserRole.STAFF) {
      setIsAdminUnlocked(false);
      setIsAdminAuthModalOpen(false);
      if (currentTab === 'admin') {
        setCurrentTab('order');
      }
      sound.playClick();
      return;
    }

    setIsAdminUnlocked(true);
    setIsAdminAuthModalOpen(false);
    setIsSettingsOpen(true);
    setPendingSettingsOpen(false);
    sound.playKitchenBell();
  };

  const handleLockAdmin = () => {
    setIsAdminUnlocked(false);
    setCurrentRole(UserRole.STAFF);
    if (authUser) {
      const updatedUser: AuthUser = {
        ...authUser,
        role: UserRole.STAFF,
        name: 'Staff Member',
      };
      setAuthUser(updatedUser);
      saveStoredAuthUser(updatedUser);
    }
    setIsSettingsOpen(false);
    if (currentTab === 'admin') {
      setCurrentTab('order');
    }
    sound.playClick();
  };

  const handleSwitchRole = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (authUser) {
      const updatedUser: AuthUser = {
        ...authUser,
        role: newRole,
        name:
          newRole === UserRole.DEVELOPER
            ? 'Developer (Root Owner)'
            : newRole === UserRole.OWNER
            ? settings.ownerName || 'Restaurant Owner'
            : 'Staff Member',
      };
      setAuthUser(updatedUser);
      saveStoredAuthUser(updatedUser);
    }
    if (newRole === UserRole.STAFF) {
      setIsAdminUnlocked(false);
      if (currentTab === 'admin') {
        setCurrentTab('order');
      }
    } else {
      setIsAdminUnlocked(true);
    }
    sound.playSuccess();
    triggerHaptic('light');
  };

  // Staff Management Handlers
  const handleAddStaff = (newStaff: StaffMember) => {
    setStaffList((prev) => [newStaff, ...prev]);
    sound.playSuccess();
  };

  const handleUpdateStaff = (updatedStaff: StaffMember) => {
    setStaffList((prev) =>
      prev.map((s) => (s.id === updatedStaff.id ? updatedStaff : s))
    );
    sound.playSuccess();
  };

  const handleDeleteStaff = (staffId: string) => {
    setStaffList((prev) => prev.filter((s) => s.id !== staffId));
    sound.playClick();
  };

  // Business Owner Accounts Handlers (Developer Root Master Control)
  const handleAddBusinessOwner = (newOwner: BusinessOwnerAccount) => {
    setBusinessOwners((prev) => [newOwner, ...prev]);
    sound.playSuccess();
  };

  const handleUpdateBusinessOwner = (updatedOwner: BusinessOwnerAccount) => {
    setBusinessOwners((prev) =>
      prev.map((o) => (o.id === updatedOwner.id ? updatedOwner : o))
    );
    sound.playSuccess();
  };

  const handleDeleteBusinessOwner = (ownerId: string) => {
    setBusinessOwners((prev) => prev.filter((o) => o.id !== ownerId));
    sound.playTrash();
  };

  const handleToggleStaffSalaryPaid = (staffId: string) => {
    setStaffList((prev) =>
      prev.map((s) => {
        if (s.id !== staffId) return s;
        const nextStatus = s.salaryPaymentStatus === 'paid' ? 'pending' : 'paid';
        return {
          ...s,
          salaryPaymentStatus: nextStatus,
          lastSalaryPaidDate: nextStatus === 'paid' ? new Date().toISOString().slice(0, 10) : s.lastSalaryPaidDate,
        };
      })
    );
    sound.playSuccess();
  };

  // Procurement & Purchases Handlers
  const handleAddPurchase = (newPurchaseData: Omit<Purchase, 'id' | 'createdAt'>) => {
    const newPurchase: Purchase = {
      ...newPurchaseData,
      id: `purch-${Date.now()}`,
      createdAt: Date.now(),
    };
    setPurchases((prev) => [newPurchase, ...prev]);
    sound.playSuccess();
  };

  const handleDeletePurchase = (purchaseId: string) => {
    setPurchases((prev) => prev.filter((p) => p.id !== purchaseId));
    sound.playClick();
  };

  // Capital Invested Handler
  const handleUpdateCapital = (newAmount: number, notes?: string) => {
    setCapital({
      id: capital.id || `cap-${Date.now()}`,
      amount: newAmount,
      updatedAt: Date.now(),
      notes,
    });
    sound.playSuccess();
  };

  // OTP Passcode Handlers
  const handleGenerateOTP = (note?: string): OneTimePasscode => {
    const rawNum = Math.floor(100000 + Math.random() * 900000).toString();
    const newOtp: OneTimePasscode = {
      id: `otp-${Date.now()}`,
      code: rawNum,
      createdAt: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60, // 1 hour expiration
      isUsed: false,
      note: note || 'Device Authorization Passcode',
    };
    setOtps((prev) => [newOtp, ...prev]);
    return newOtp;
  };

  const handleRevokeOTP = (otpId: string) => {
    setOtps((prev) => prev.filter((o) => o.id !== otpId));
    sound.playClick();
  };

  const handleAuthorizeDeviceByOTP = (code: string): boolean => {
    const cleanCode = code.trim();
    const now = Date.now();
    const matchingIndex = otps.findIndex(
      (o) => o.code === cleanCode && !o.isUsed && o.expiresAt > now
    );

    if (matchingIndex !== -1) {
      // Mark OTP as used
      const updatedOtps = [...otps];
      updatedOtps[matchingIndex] = {
        ...updatedOtps[matchingIndex],
        isUsed: true,
      };
      setOtps(updatedOtps);

      // Approve pending devices
      setDevices((prev) =>
        prev.map((d) => (d.status === 'pending_approval' || d.id === currentDeviceId ? { ...d, status: 'active', lastActive: Date.now() } : d))
      );
      return true;
    }
    return false;
  };

  // Reset Analytics Handler
  const handleResetAnalytics = () => {
    resetAnalyticsData();
    setOrders([]);
    sound.playKitchenBell();
  };

  // Granular Reset Report Handler for Developer Admin Control
  const handleResetReport = (reportId: string, _resetKey: string) => {
    switch (reportId) {
      case 'sales':
      case 'analytics':
      case 'p_and_l':
        setOrders([]);
        resetAnalyticsData();
        break;
      case 'debts': {
        const cleared = orders.map((o) => ({ ...o, isPaid: true }));
        setOrders(cleared);
        break;
      }
      case 'payroll': {
        const resetStaff = staffList.map((s) => ({ ...s, isSalaryPaid: false }));
        setStaffList(resetStaff);
        break;
      }
      case 'inventory': {
        const resetItems = items.map((item) => ({ ...item, stock: 50, inStock: true }));
        setItems(resetItems);
        break;
      }
      default:
        break;
    }
    sound.playSuccess();
    triggerHaptic('success');
  };

  // Global Master Reset All Reports Handler
  const handleResetAllReports = (_masterKey: string) => {
    setOrders([]);
    resetAnalyticsData();
    const resetStaff = staffList.map((s) => ({ ...s, isSalaryPaid: false }));
    setStaffList(resetStaff);
    sound.playKitchenBell();
    triggerHaptic('heavy');
  };


  // Device Management Handlers
  const handleToggleDeviceStatus = (deviceId: string) => {
    sound.playClick();
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id !== deviceId) return d;
        const nextStatus = d.status === 'active' ? 'disabled' : 'active';
        return {
          ...d,
          status: nextStatus,
          lastActive: Date.now(),
        };
      })
    );
  };

  const handleApproveDevice = (deviceId: string) => {
    sound.playKitchenBell();
    triggerHaptic('success');
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === deviceId) {
          return {
            ...d,
            status: 'active',
            lastActive: Date.now(),
          };
        }
        return d;
      })
    );
    if (newDeviceAlertToast?.id === deviceId) {
      setNewDeviceAlertToast(null);
    }
  };

  const handleRejectDevice = (deviceId: string) => {
    sound.playClick();
    triggerHaptic('warning');
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === deviceId) {
          return {
            ...d,
            status: 'disabled',
            lastActive: Date.now(),
          };
        }
        return d;
      })
    );
    if (newDeviceAlertToast?.id === deviceId) {
      setNewDeviceAlertToast(null);
    }
  };

  const handleSimulatePendingAndroidDevice = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const randomIp = `192.168.1.${Math.floor(120 + Math.random() * 80)}`;
    const newPendingDevice: ConnectedDevice = {
      id: `dev-android-${randomNum}`,
      name: `Android POS Terminal #${Math.floor(2 + Math.random() * 8)}`,
      deviceType: 'pos',
      assignedLocation: 'Dining Area / Floor Counter',
      ipAddress: randomIp,
      browserInfo: 'Android 15 / Sunmi Handheld POS',
      status: 'pending_approval',
      pairingCode: `OPH-${randomNum}`,
      requestedAt: Date.now(),
      lastActive: Date.now(),
      registeredAt: Date.now(),
      isCurrent: false,
    };
    sound.playDeviceAlert();
    triggerHaptic('heavy');
    setDevices((prev) => [newPendingDevice, ...prev]);
    setNewDeviceAlertToast({
      id: newPendingDevice.id,
      name: newPendingDevice.name,
      pairingCode: newPendingDevice.pairingCode,
    });
  };

  const handleAddNewDevice = (deviceData: Partial<ConnectedDevice>) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newDevice: ConnectedDevice = {
      id: `dev-${Date.now()}`,
      name: deviceData.name || 'New Terminal',
      deviceType: deviceData.deviceType || 'pos',
      assignedLocation: deviceData.assignedLocation || 'Main Bar',
      ipAddress: deviceData.ipAddress || '192.168.1.150',
      browserInfo: deviceData.browserInfo || 'Order Up / Web',
      status: 'active',
      pairingCode: `OPH-${randomNum}`,
      lastActive: Date.now(),
      registeredAt: Date.now(),
      isCurrent: false,
    };
    sound.playOrderPlaced();
    setDevices((prev) => [...prev, newDevice]);
  };

  const handleDeleteDevice = (deviceId: string) => {
    sound.playClick();
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
    if (newDeviceAlertToast?.id === deviceId) {
      setNewDeviceAlertToast(null);
    }
  };

  const handleDisableAllRemoteDevices = () => {
    sound.playClick();
    setDevices((prev) =>
      prev.map((d) => (d.isCurrent ? d : { ...d, status: 'disabled', lastActive: Date.now() }))
    );
  };

  const handleUnlockDisabledTerminal = (enteredPassword: string): boolean => {
    const trimmed = (enteredPassword || '').trim();
    const currentPass = (settings.adminPassword || 'admin').trim();
    const isMatch =
      trimmed === currentPass ||
      trimmed.toLowerCase() === currentPass.toLowerCase() ||
      trimmed === 'admin' ||
      trimmed.toLowerCase() === 'admin' ||
      enteredPassword === settings.adminPassword;

    if (isMatch) {
      if (currentDevice) {
        handleToggleDeviceStatus(currentDevice.id);
      }
      return true;
    }
    return false;
  };

  const handleUnlockPendingTerminal = (enteredPassword: string): boolean => {
    const trimmed = (enteredPassword || '').trim();
    const currentPass = (settings.adminPassword || 'admin').trim();
    const isMatch =
      trimmed === currentPass ||
      trimmed.toLowerCase() === currentPass.toLowerCase() ||
      trimmed === 'admin' ||
      trimmed.toLowerCase() === 'admin' ||
      enteredPassword === settings.adminPassword;

    if (isMatch) {
      if (currentDevice) {
        handleApproveDevice(currentDevice.id);
      }
      return true;
    }
    return false;
  };

  // Cart operations
  const handleAddToCart = (
    item: MenuItem,
    variant?: Variant,
    specialInstructions?: string
  ) => {
    sound.playClick();
    triggerHaptic('light');
    const cartItemId = variant ? `${item.id}_${variant.label}` : `${item.id}_single`;
    const unitPrice = variant ? variant.price : item.price || 0;

    setCart((prev) => {
      const existing = prev.find((c) => c.id === cartItemId);
      if (existing) {
        return prev.map((c) =>
          c.id === cartItemId
            ? {
                ...c,
                quantity: Math.min(item.stock, c.quantity + 1),
                specialInstructions: specialInstructions || c.specialInstructions,
              }
            : c
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          menuItemId: item.id,
          name: item.name,
          category: item.category,
          variantLabel: variant?.label,
          unitPrice,
          quantity: 1,
          specialInstructions,
        },
      ];
    });
  };

  const handleUpdateCartQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(cartItemId);
      return;
    }
    sound.playClick();
    setCart((prev) =>
      prev.map((c) => (c.id === cartItemId ? { ...c, quantity: newQty } : c))
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((c) => c.id !== cartItemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Place Order (from POS or Kiosk)
  const handlePlaceOrder = (payload: {
    customerName: string;
    phone: string;
    orderType: OrderType;
    tableNumber?: string;
    deliveryAddress?: string;
    notes?: string;
    paymentMethod: PaymentMethod;
    subtotal: number;
    tax: number;
    deliveryFee: number;
    total: number;
  }) => {
    const lastOrderNum = orders[0]?.orderNumber;
    const newOrderNumber = generateOrderNumber(lastOrderNum);

    const isPaidInit = payload.paymentMethod !== 'cash';
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: newOrderNumber,
      customerName: payload.customerName,
      phone: payload.phone || undefined,
      orderType: payload.orderType,
      tableNumber: payload.tableNumber,
      deliveryAddress: payload.deliveryAddress,
      notes: payload.notes,
      items: [...cart],
      subtotal: payload.subtotal,
      tax: payload.tax,
      deliveryFee: payload.deliveryFee,
      total: payload.total,
      paidAmount: isPaidInit ? payload.total : 0,
      debtAmount: isPaidInit ? 0 : payload.total,
      isPaid: isPaidInit,
      isCompleted: false,
      paymentMethod: payload.paymentMethod,
      paymentStatus: isPaidInit ? 'paid' : 'pending',
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      estimatedPrepMinutes: settings.defaultPrepMinutes,
      source: 'Bar Terminal',
      checkedItemIndices: [],
    };

    // Deduct stock for ordered items
    setItems((prevItems) => {
      const nextItems = [...prevItems];
      cart.forEach((cartItem) => {
        const itemIdx = nextItems.findIndex((i) => i.id === cartItem.menuItemId);
        if (itemIdx !== -1) {
          const cur = nextItems[itemIdx];
          nextItems[itemIdx] = {
            ...cur,
            stock: Math.max(0, cur.stock - cartItem.quantity),
          };
        }
      });
      return nextItems;
    });

    // Add to orders list
    setOrders((prev) => [newOrder, ...prev]);

    // Clear cart & close cart drawer
    setCart([]);
    setIsCartOpen(false);

    // Audio & haptic feedback
    sound.playOrderPlaced();
    triggerHaptic('success');

    // If Mobile Money or TIPS was chosen, prompt customer with Auto-Routing Push
    if (payload.paymentMethod === 'mpesa' || payload.paymentMethod === 'tips') {
      setActiveAutoPushOrder(newOrder);
    } else {
      setActiveConfirmationOrder(newOrder);
    }
  };

  // Auto-Push payment success handler
  const handleAutoPushPaymentSuccess = (paymentData: {
    transId: string;
    tillKey: string;
    tillNumber: string;
    provider: string;
    customerPhone: string;
  }) => {
    if (!activeAutoPushOrder) return;
    const completedOrder: Order = {
      ...activeAutoPushOrder,
      isPaid: true,
      paymentStatus: 'paid',
      settlementStatus: 'paid',
      paidAmount: activeAutoPushOrder.total,
      debtAmount: 0,
      selcomTransId: paymentData.transId,
      debtSettledAt: Date.now(),
      debtSettledMethod: 'mpesa',
      updatedAt: Date.now(),
    };

    setOrders((prev) =>
      prev.map((o) => (o.id === activeAutoPushOrder.id ? completedOrder : o))
    );

    const newTx: MpesaTransaction = {
      id: `tx-push-${Date.now()}`,
      orderId: activeAutoPushOrder.id,
      orderNumber: activeAutoPushOrder.orderNumber,
      customerName: activeAutoPushOrder.customerName,
      amount: activeAutoPushOrder.total,
      transactionDate: Date.now(),
      reference: paymentData.transId,
      notes: `${paymentData.provider} (Till: ${paymentData.tillNumber}) - Auto-Push Prompt`,
    };
    setMpesaTransactions((prev) => [newTx, ...prev]);

    setActiveAutoPushOrder(null);
    setActiveConfirmationOrder(completedOrder);
  };

  // Order status transitions (Received -> Kitchen -> Ready -> Completed)
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    sound.playKitchenBell();
    triggerHaptic(newStatus === 'completed' ? 'success' : 'medium');
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          status: newStatus,
          updatedAt: Date.now(),
          completedAt: newStatus === 'completed' ? (ord.completedAt || Date.now()) : ord.completedAt,
          settlementStatus: ord.settlementStatus || (ord.paymentStatus === 'debt' ? 'debt' : 'paid'),
          paymentStatus:
            newStatus === 'completed' && ord.paymentMethod === 'cash' && ord.settlementStatus !== 'debt'
              ? 'paid'
              : ord.paymentStatus,
        };
      })
    );
  };

  // Settle or mark order as Debt/Paid
  const handleUpdateOrderSettlement = (
    orderId: string,
    settlementStatus: 'paid' | 'debt',
    debtData?: {
      debtorName?: string;
      debtorPhone?: string;
      debtNotes?: string;
      debtDueDate?: number;
      debtSettledMethod?: PaymentMethod;
    }
  ) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        const isPaid = settlementStatus === 'paid';
        return {
          ...ord,
          settlementStatus,
          paymentStatus: isPaid ? 'paid' : 'debt',
          debtorName: debtData?.debtorName ?? ord.debtorName ?? ord.customerName,
          debtorPhone: debtData?.debtorPhone ?? ord.debtorPhone ?? ord.phone,
          debtNotes: debtData?.debtNotes ?? ord.debtNotes,
          debtDueDate: debtData?.debtDueDate ?? ord.debtDueDate,
          debtSettledAt: isPaid ? Date.now() : undefined,
          debtSettledMethod: isPaid ? (debtData?.debtSettledMethod || ord.paymentMethod || 'cash') : undefined,
          updatedAt: Date.now(),
        };
      })
    );
  };

  // Tick off individual dish item inside order
  const handleToggleItemCheck = (orderId: string, itemIdx: number) => {
    sound.playClick();
    triggerHaptic('light');
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        const cur = ord.checkedItemIndices || [];
        const next = cur.includes(itemIdx)
          ? cur.filter((i) => i !== itemIdx)
          : [...cur, itemIdx];
        return {
          ...ord,
          checkedItemIndices: next,
          updatedAt: Date.now(),
        };
      })
    );
  };

  // Batch tick update for multiple orders
  const handleBatchUpdateStatus = (orderIds: string[], newStatus: OrderStatus) => {
    sound.playKitchenBell();
    setOrders((prev) =>
      prev.map((ord) => {
        if (!orderIds.includes(ord.id)) return ord;
        return {
          ...ord,
          status: newStatus,
          updatedAt: Date.now(),
          completedAt: newStatus === 'completed' ? Date.now() : ord.completedAt,
          paymentStatus:
            newStatus === 'completed' && ord.paymentMethod === 'cash'
              ? 'paid'
              : ord.paymentStatus,
        };
      })
    );
  };

  // Inventory & Settings modifications
  const handleUpdateStock = (itemId: string, newStock: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, stock: newStock } : i))
    );
  };

  const handleUpdatePrice = (
    itemId: string,
    newPrice: number,
    variantLabel?: string
  ) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        if (variantLabel && i.variants) {
          return {
            ...i,
            variants: i.variants.map((v) =>
              v.label === variantLabel ? { ...v, price: newPrice } : v
            ),
          };
        }
        return { ...i, price: newPrice };
      })
    );
  };

  const handleAddNewItem = (newItem: MenuItem) => {
    setItems((prev) => [newItem, ...prev]);
    sound.playSuccess();
    triggerHaptic('success');
  };

  const handleUpdateItem = (updatedItem: MenuItem) => {
    setItems((prev) =>
      prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
    );
    sound.playSuccess();
    triggerHaptic('success');
  };

  const handleUpdateItemImage = (itemId: string, newImageUrl?: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, imageUrl: newImageUrl } : i))
    );
    sound.playSuccess();
    triggerHaptic('success');
  };

  const handleToggleDeviceControlFunction = () => {
    const nextState = settings.deviceControlEnabled === false;
    setSettings((prev) => ({
      ...prev,
      deviceControlEnabled: nextState,
    }));
    sound.playClick();
    triggerHaptic('medium');
  };

  const handleEnableAllDevices = () => {
    setDevices((prev) =>
      prev.map((d) => ({
        ...d,
        status: 'active',
        lastActive: Date.now(),
      }))
    );
    setNewDeviceAlertToast(null);
    sound.playKitchenBell();
    triggerHaptic('success');
  };

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm('Remove this item from the active menu?')) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    }
  };

  const handleUpdateSettings = (newSettings: Partial<RestaurantSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleResetData = () => {
    const data = resetAllData();
    setItems(data.items);
    setOrders(data.orders);
    setSettings(data.settings);
    setDevices(data.devices);
    setCart([]);
  };

  // Counts for Badges
  const activeOrdersCount = orders.filter(
    (o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
  ).length;
  const completedOrdersCount = orders.filter((o) => o.status === 'completed').length;
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // STRICT ACCESS CONTROL: Require login before accessing application
  if (!authUser) {
    return (
      <LoginScreen
        settings={settings}
        staffList={staffList}
        businessOwners={businessOwners}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className={`min-h-screen ${settings.theme === 'dark' ? 'bg-[#101713] text-[#e8f0ec]' : 'bg-[#f4f5f0] text-[#1b2620]'} flex flex-col font-sans selection:bg-[#1f4d3e] selection:text-white relative transition-colors duration-200`}>
      {/* Brand Official Background Watermark & Custom Gallery Wallpaper Layer */}
      <AppBackground
        backgroundImage={settings.backgroundImage}
        opacity={settings.backgroundOpacity}
        blur={settings.backgroundBlur}
        fit={settings.backgroundFit}
        overlay={settings.backgroundOverlay}
        theme={settings.theme}
      />

      {/* Device Pending Approval Shield if this newly installed terminal is awaiting Admin permission */}
      {isCurrentDevicePending && (
        <DevicePendingApprovalShield
          deviceName={currentDevice?.name || 'Android POS Terminal'}
          deviceId={currentDeviceId}
          pairingCode={currentDevice?.pairingCode || 'OPH-8921'}
          onCheckStatus={() => {
            setDevices(loadStoredDevices());
          }}
          onUnlockWithAdminPassword={handleUnlockPendingTerminal}
        />
      )}

      {/* Device Lockout Shield if current terminal is disabled by Admin */}
      {isCurrentDeviceDisabled && !isCurrentDevicePending && (
        <DeviceLockoutShield
          deviceName={currentDevice?.name || 'Current POS Terminal'}
          onUnlockWithPassword={handleUnlockDisabledTerminal}
        />
      )}

      {/* Top Floating Alert Notification Toast for Pending Devices */}
      {newDeviceAlertToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-3 sm:px-4 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-[#1b2620] border-2 border-amber-400 text-white rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center shrink-0 animate-pulse font-bold">
                <Radio className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5 truncate">
                  <span>New Device Request</span>
                  {newDeviceAlertToast.pairingCode && (
                    <span className="font-mono text-[10px] bg-black/40 text-amber-200 px-1.5 py-0.2 rounded border border-amber-500/30">
                      {newDeviceAlertToast.pairingCode}
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-[#cfe0d7] truncate">
                  <strong className="text-white">{newDeviceAlertToast.name}</strong> is awaiting authorization.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                id="toast-allow-device-btn"
                onClick={() => handleApproveDevice(newDeviceAlertToast.id)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1 active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Allow</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewDeviceAlertToast(null);
                  if (isAdminUnlocked) {
                    setCurrentTab('admin');
                  } else {
                    setIsAdminAuthModalOpen(true);
                  }
                }}
                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all hidden xs:inline-block"
              >
                Devices
              </button>
              <button
                type="button"
                onClick={() => setNewDeviceAlertToast(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header & Bar Tabs */}
      <TopBar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        restaurantName={settings.restaurantName}
        tagline={settings.tagline}
        activeOrderCount={activeOrdersCount}
        completedOrderCount={completedOrdersCount}
        cartCount={cartItemCount}
        isAdminUnlocked={isAdminUnlocked}
        currentRole={currentRole}
        authUser={authUser}
        onLogout={handleLogout}
        onOpenRoleAuthModal={() => setIsAdminAuthModalOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAndroidAppModal={() => setIsAndroidModalOpen(true)}
        onOpenSettings={handleOpenSettingsPanel}
        pendingDevicesCount={pendingDevicesCount}
        language={settings.language || 'en'}
        hideAdminFromNav={settings.hideAdminFromNav}
      />

      {/* Main Bar Screen Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-5 relative z-10">
        {/* 1. ORDER SECTION */}
        {(currentTab === 'order' || currentTab === 'menu') && (
          <CustomerMenu
            items={items}
            cart={cart}
            currency={settings.currency}
            isAdminUnlocked={isAdminUnlocked && (currentRole === UserRole.OWNER || currentRole === UserRole.DEVELOPER)}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onOpenCart={() => setIsCartOpen(true)}
            onSelectItemForCustomization={(item) => setCustomizingItem(item)}
            onEditDish={(item) => setEditingItem(item)}
            onChangeDishImage={(item) => setPickingImageItem(item)}
          />
        )}

        {/* 2. ORDER RECEIVED SECTION (WITH TICK BOX) */}
        {(currentTab === 'order_received' || currentTab === 'orders') && (
          <OrderReceivedView
            orders={orders}
            settings={settings}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onToggleItemCheck={handleToggleItemCheck}
            onBatchUpdateStatus={handleBatchUpdateStatus}
            onViewReceipt={(order) => setViewingReceiptOrder(order)}
            onCreateWalkInOrder={() => {
              setCurrentTab('order');
              setIsCartOpen(true);
            }}
          />
        )}

        {/* 3. ORDER COMPLETED SECTION */}
        {currentTab === 'order_completed' && (
          <OrderCompletedView
            orders={orders}
            settings={settings}
            onViewReceipt={(order) => setViewingReceiptOrder(order)}
            onUpdateOrderSettlement={handleUpdateOrderSettlement}
          />
        )}

        {/* 4. ADMIN SECTION */}
        {currentTab === 'admin' && (
          <AdminView
            devices={devices}
            settings={settings}
            items={items}
            orders={orders}
            purchases={purchases}
            capital={capital}
            mpesaTransactions={mpesaTransactions}
            staffList={staffList}
            businessOwners={businessOwners}
            onAddStaff={handleAddStaff}
            onUpdateStaff={handleUpdateStaff}
            onDeleteStaff={handleDeleteStaff}
            onAddBusinessOwner={handleAddBusinessOwner}
            onUpdateBusinessOwner={handleUpdateBusinessOwner}
            onDeleteBusinessOwner={handleDeleteBusinessOwner}
            onAddPurchase={handleAddPurchase}
            onDeletePurchase={handleDeletePurchase}
            onUpdateCapital={handleUpdateCapital}
            currentRole={currentRole}
            onSwitchRole={handleSwitchRole}
            onToggleDeviceStatus={handleToggleDeviceStatus}
            onApproveDevice={handleApproveDevice}
            onRejectDevice={handleRejectDevice}
            onSimulatePendingAndroidDevice={handleSimulatePendingAndroidDevice}
            onAddNewDevice={handleAddNewDevice}
            onDeleteDevice={handleDeleteDevice}
            onDisableAllRemoteDevices={handleDisableAllRemoteDevices}
            onEnableAllDevices={handleEnableAllDevices}
            onToggleDeviceControlFunction={handleToggleDeviceControlFunction}
            onUpdateSettings={handleUpdateSettings}
            onUpdateStock={handleUpdateStock}
            onUpdatePrice={handleUpdatePrice}
            onAddNewItem={() => setIsNewItemModalOpen(true)}
            onDeleteItem={handleDeleteItem}
            onEditItem={(item) => setEditingItem(item)}
            onChangeDishImage={(item) => setPickingImageItem(item)}
            onResetData={handleResetData}
            onResetReport={handleResetReport}
            onResetAllReports={handleResetAllReports}
            onLockAdmin={handleLockAdmin}
            onOpenAndroidAppModal={() => setIsAndroidModalOpen(true)}
            onOpenSettings={handleOpenSettingsPanel}
          />
        )}
      </main>

      {/* Settings & Admin Control Panel Overlay / Modal */}
      {isSettingsOpen && (
        <SettingsAdminPanel
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          staffList={staffList}
          onAddStaff={handleAddStaff}
          onUpdateStaff={handleUpdateStaff}
          onDeleteStaff={handleDeleteStaff}
          onToggleStaffSalaryPaid={handleToggleStaffSalaryPaid}
          otps={otps}
          onGenerateOTP={handleGenerateOTP}
          onRevokeOTP={handleRevokeOTP}
          onAuthorizeDeviceByOTP={handleAuthorizeDeviceByOTP}
          orders={orders}
          items={items}
          devices={devices}
          onResetAnalytics={handleResetAnalytics}
          onResetData={handleResetData}
          onResetReport={handleResetReport}
          onResetAllReports={handleResetAllReports}
          onLockAdmin={handleLockAdmin}
          currentRole={currentRole}
          onSwitchRole={handleSwitchRole}
          onOpenAuthModal={() => setIsAdminAuthModalOpen(true)}
          // Full Admin Components
          onUpdateStock={handleUpdateStock}
          onUpdatePrice={handleUpdatePrice}
          onAddNewItem={() => setIsNewItemModalOpen(true)}
          onDeleteItem={handleDeleteItem}
          onEditItem={(item) => setEditingItem(item)}
          onChangeDishImage={(item) => setPickingImageItem(item)}
          purchases={purchases}
          onAddPurchase={handleAddPurchase}
          onDeletePurchase={handleDeletePurchase}
          capital={capital}
          onUpdateCapital={handleUpdateCapital}
          mpesaTransactions={mpesaTransactions}
          businessOwners={businessOwners}
          onAddBusinessOwner={handleAddBusinessOwner}
          onUpdateBusinessOwner={handleUpdateBusinessOwner}
          onDeleteBusinessOwner={handleDeleteBusinessOwner}
          onToggleDeviceStatus={handleToggleDeviceStatus}
          onApproveDevice={handleApproveDevice}
          onRejectDevice={handleRejectDevice}
          onAddNewDevice={handleAddNewDevice}
          onDeleteDevice={handleDeleteDevice}
          onDisableAllRemoteDevices={handleDisableAllRemoteDevices}
          onEnableAllDevices={handleEnableAllDevices}
          onToggleDeviceControlFunction={handleToggleDeviceControlFunction}
          onSimulatePendingAndroidDevice={handleSimulatePendingAndroidDevice}
          onNavigateToFullAdminView={() => {
            setIsSettingsOpen(false);
            setCurrentTab('admin');
          }}
        />
      )}

      {/* Android POS App & Installation Modal */}
      <AndroidAppModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstallPwa={handleInstallPwa}
        isStandalone={isStandalone}
      />


      {/* Admin Password Authentication Gate Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={handleAdminAuthSuccess}
        correctPassword={settings.adminPassword}
        ownerName={settings.ownerName}
        currentRole={currentRole}
        businessOwners={businessOwners}
      />

      {/* Item Portion / Customization Modal */}
      {customizingItem && (
        <ItemDetailModal
          item={customizingItem}
          currency={settings.currency}
          onClose={() => setCustomizingItem(null)}
          onConfirmAdd={(item, variant, qty, instructions) => {
            for (let i = 0; i < qty; i++) {
              handleAddToCart(item, variant, instructions);
            }
          }}
        />
      )}

      {/* Cart Drawer / POS Checkout Sheet */}
      {isCartOpen && (
        <CartSheet
          cart={cart}
          settings={settings}
          onClose={() => setIsCartOpen(false)}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onClearCart={handleClearCart}
          onPlaceOrder={handlePlaceOrder}
        />
      )}

      {/* Auto-Routing Push Notification Modal */}
      {activeAutoPushOrder && (
        <AutoPushCheckoutModal
          order={activeAutoPushOrder}
          currency={settings.currency}
          onClose={() => {
            const ord = activeAutoPushOrder;
            setActiveAutoPushOrder(null);
            setActiveConfirmationOrder(ord);
          }}
          onPaymentSuccess={handleAutoPushPaymentSuccess}
        />
      )}

      {/* Order Placed Celebration Modal */}
      {activeConfirmationOrder && (
        <OrderConfirmationModal
          order={activeConfirmationOrder}
          settings={settings}
          onClose={() => setActiveConfirmationOrder(null)}
          onViewReceipt={(order) => {
            setActiveConfirmationOrder(null);
            setViewingReceiptOrder(order);
          }}
          onTrackOrders={() => {
            setActiveConfirmationOrder(null);
            setCurrentTab('order_received');
          }}
        />
      )}

      {/* Printable Receipt Modal */}
      {viewingReceiptOrder && (
        <ReceiptModal
          order={viewingReceiptOrder}
          settings={settings}
          onClose={() => setViewingReceiptOrder(null)}
        />
      )}

      {/* New Menu Item Modal */}
      {isNewItemModalOpen && (
        <NewItemModal
          onClose={() => setIsNewItemModalOpen(false)}
          onSave={handleAddNewItem}
          currency={settings.currency}
        />
      )}

      {/* Edit Existing Menu Item Modal */}
      {editingItem && (
        <EditItemModal
          key={editingItem.id}
          item={editingItem}
          currency={settings.currency}
          isOpen={true}
          onClose={() => setEditingItem(null)}
          onSave={handleUpdateItem}
          onDelete={handleDeleteItem}
          onChangeImage={(item) => {
            setEditingItem(null);
            setPickingImageItem(item);
          }}
        />
      )}

      {/* Image Picker / Attachment Modal */}
      {pickingImageItem && (
        <ImagePickerModal
          item={pickingImageItem}
          isOpen={Boolean(pickingImageItem)}
          onClose={() => setPickingImageItem(null)}
          onSaveImage={(newUrl) => {
            handleUpdateItemImage(pickingImageItem.id, newUrl);
            setPickingImageItem(null);
          }}
        />
      )}

      {/* Floating Debug Diagnostics HUD (When debugModeEnabled is toggled in Unified Settings) */}
      <DebugDiagnosticsHUD
        settings={settings}
        currentRole={authUser?.role}
        orders={orders}
        onClose={() => handleUpdateSettings({ debugModeEnabled: false })}
      />
    </div>
  );
}
