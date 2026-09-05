import {
  MenuItem,
  Order,
  RestaurantSettings,
  ConnectedDevice,
  StaffMember,
  BusinessOwnerAccount,
  OneTimePasscode,
  Purchase,
  Capital,
  ShoppingItem,
  MpesaTransaction,
  NotificationItem,
  AuthUser,
} from '../types';
import {
  DEFAULT_SETTINGS,
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  INITIAL_CONNECTED_DEVICES,
  INITIAL_STAFF_MEMBERS,
  INITIAL_BUSINESS_OWNERS,
  INITIAL_OTP_CODES,
  INITIAL_CAPITAL,
  INITIAL_PURCHASES,
  INITIAL_SHOPPING_ITEMS,
  INITIAL_MPESA_TRANSACTIONS,
  INITIAL_NOTIFICATIONS,
} from '../data/initialData';

const STORAGE_KEYS = {
  ITEMS: 'orderup_items_v1',
  ORDERS: 'orderup_orders_v1',
  SETTINGS: 'orderup_settings_v1',
  DEVICES: 'orderup_devices_v1',
  STAFF: 'orderup_staff_v1',
  BUSINESS_OWNERS: 'orderup_business_owners_v1',
  OTP: 'orderup_otp_v1',
  CAPITAL: 'orderup_capital_v1',
  PURCHASES: 'orderup_purchases_v1',
  SHOPPING: 'orderup_shopping_v1',
  MPESA: 'orderup_mpesa_v1',
  NOTIFICATIONS: 'orderup_notifications_v1',
  CURRENT_DEVICE_ID: 'orderup_current_device_id_v1',
  ADMIN_SESSION: 'orderup_admin_session_v1',
  AUTH_USER: 'orderup_auth_user_v1',
};

export function getCurrentDeviceId(): string {
  try {
    let devId = localStorage.getItem(STORAGE_KEYS.CURRENT_DEVICE_ID);
    if (!devId) {
      devId = 'dev-current';
      localStorage.setItem(STORAGE_KEYS.CURRENT_DEVICE_ID, devId);
    }
    return devId;
  } catch {
    return 'dev-current';
  }
}

export function loadStoredDevices(): ConnectedDevice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DEVICES);
    if (!raw) {
      saveStoredDevices(INITIAL_CONNECTED_DEVICES);
      return INITIAL_CONNECTED_DEVICES;
    }
    const parsed: ConnectedDevice[] = JSON.parse(raw);
    const curId = getCurrentDeviceId();
    return parsed.map((d) => ({
      ...d,
      isCurrent: d.id === curId,
    }));
  } catch {
    return INITIAL_CONNECTED_DEVICES;
  }
}

export function saveStoredDevices(devices: ConnectedDevice[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
  } catch (e) {
    console.error('Failed to save devices', e);
  }
}

export function setDeviceStatus(deviceId: string, status: 'active' | 'disabled' | 'pending_approval'): ConnectedDevice[] {
  const currentDevices = loadStoredDevices();
  const updated = currentDevices.map((d) => {
    if (d.id === deviceId) {
      return {
        ...d,
        status,
        lastActive: Date.now(),
      };
    }
    return d;
  });
  saveStoredDevices(updated);
  return updated;
}

export function loadStoredItems(): MenuItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ITEMS);
    if (!raw) {
      saveStoredItems(INITIAL_MENU_ITEMS);
      return INITIAL_MENU_ITEMS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MENU_ITEMS;
  }
}

export function saveStoredItems(items: MenuItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save items', e);
  }
}

export function loadStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) {
      saveStoredOrders(INITIAL_ORDERS);
      return INITIAL_ORDERS;
    }
    const parsed: Order[] = JSON.parse(raw);
    return parsed.map((o) => {
      const total = o.total || 0;
      const paid = o.paidAmount !== undefined ? o.paidAmount : (o.isPaid ? total : (o.paymentStatus === 'paid' ? total : 0));
      const debt = o.debtAmount !== undefined ? o.debtAmount : (o.isPaid ? 0 : Math.max(0, total - paid));
      return {
        ...o,
        paidAmount: paid,
        debtAmount: debt,
        isPaid: o.isPaid !== undefined ? o.isPaid : debt === 0,
        isCompleted: o.isCompleted !== undefined ? o.isCompleted : o.status === 'completed',
        settlementStatus: o.settlementStatus || (debt > 0 ? 'debt' : 'paid'),
      };
    });
  } catch {
    return INITIAL_ORDERS;
  }
}

export function saveStoredOrders(orders: Order[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed to save orders', e);
  }
}

export function loadStoredStaff(): StaffMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STAFF);
    if (!raw) {
      saveStoredStaff(INITIAL_STAFF_MEMBERS);
      return INITIAL_STAFF_MEMBERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_STAFF_MEMBERS;
  }
}

export function saveStoredStaff(staff: StaffMember[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
  } catch (e) {
    console.error('Failed to save staff', e);
  }
}

export function loadStoredBusinessOwners(): BusinessOwnerAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BUSINESS_OWNERS);
    if (!raw) {
      saveStoredBusinessOwners(INITIAL_BUSINESS_OWNERS);
      return INITIAL_BUSINESS_OWNERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_BUSINESS_OWNERS;
  }
}

export function saveStoredBusinessOwners(owners: BusinessOwnerAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BUSINESS_OWNERS, JSON.stringify(owners));
  } catch (e) {
    console.error('Failed to save business owners', e);
  }
}

export function loadStoredOTPs(): OneTimePasscode[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OTP);
    if (!raw) {
      saveStoredOTPs(INITIAL_OTP_CODES);
      return INITIAL_OTP_CODES;
    }
    const parsed: OneTimePasscode[] = JSON.parse(raw);
    const now = Date.now();
    return parsed.filter((p) => now - p.expiresAt < 86400000);
  } catch {
    return INITIAL_OTP_CODES;
  }
}

export function saveStoredOTPs(otps: OneTimePasscode[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.OTP, JSON.stringify(otps));
  } catch (e) {
    console.error('Failed to save OTP codes', e);
  }
}

export function loadStoredCapital(): Capital {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CAPITAL);
    if (!raw) {
      saveStoredCapital(INITIAL_CAPITAL);
      return INITIAL_CAPITAL;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CAPITAL;
  }
}

export function saveStoredCapital(capital: Capital): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CAPITAL, JSON.stringify(capital));
  } catch (e) {
    console.error('Failed to save capital', e);
  }
}

export function loadStoredPurchases(): Purchase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    if (!raw) {
      saveStoredPurchases(INITIAL_PURCHASES);
      return INITIAL_PURCHASES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PURCHASES;
  }
}

export function saveStoredPurchases(purchases: Purchase[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  } catch (e) {
    console.error('Failed to save purchases', e);
  }
}

export function loadStoredShoppingItems(): ShoppingItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHOPPING);
    if (!raw) {
      saveStoredShoppingItems(INITIAL_SHOPPING_ITEMS);
      return INITIAL_SHOPPING_ITEMS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SHOPPING_ITEMS;
  }
}

export function saveStoredShoppingItems(items: ShoppingItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SHOPPING, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save shopping items', e);
  }
}

export function loadStoredMpesaTransactions(): MpesaTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MPESA);
    if (!raw) {
      saveStoredMpesaTransactions(INITIAL_MPESA_TRANSACTIONS);
      return INITIAL_MPESA_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MPESA_TRANSACTIONS;
  }
}

export function saveStoredMpesaTransactions(txs: MpesaTransaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MPESA, JSON.stringify(txs));
  } catch (e) {
    console.error('Failed to save mpesa transactions', e);
  }
}

export function loadStoredNotifications(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) {
      saveStoredNotifications(INITIAL_NOTIFICATIONS);
      return INITIAL_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

export function saveStoredNotifications(notifs: NotificationItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  } catch (e) {
    console.error('Failed to save notifications', e);
  }
}

export function loadStoredSettings(): RestaurantSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      saveStoredSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    const resolvedPassword =
      !parsed.adminPassword || parsed.adminPassword === 'admin'
        ? DEFAULT_SETTINGS.adminPassword
        : String(parsed.adminPassword).trim();

    const resolvedPhone =
      !parsed.phone || parsed.phone === '0713057325' || parsed.phone.includes('754')
        ? '+255713057325'
        : parsed.phone;

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      phone: resolvedPhone,
      adminPassword: resolvedPassword,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: RestaurantSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function resetAnalyticsData(): Order[] {
  saveStoredOrders([]);
  return [];
}

export function resetAllData(): {
  items: MenuItem[];
  orders: Order[];
  settings: RestaurantSettings;
  devices: ConnectedDevice[];
  staff: StaffMember[];
  businessOwners: BusinessOwnerAccount[];
  otps: OneTimePasscode[];
  capital: Capital;
  purchases: Purchase[];
  shopping: ShoppingItem[];
  mpesa: MpesaTransaction[];
  notifications: NotificationItem[];
} {
  saveStoredItems(INITIAL_MENU_ITEMS);
  saveStoredOrders(INITIAL_ORDERS);
  saveStoredSettings(DEFAULT_SETTINGS);
  saveStoredDevices(INITIAL_CONNECTED_DEVICES);
  saveStoredStaff(INITIAL_STAFF_MEMBERS);
  saveStoredBusinessOwners(INITIAL_BUSINESS_OWNERS);
  saveStoredOTPs(INITIAL_OTP_CODES);
  saveStoredCapital(INITIAL_CAPITAL);
  saveStoredPurchases(INITIAL_PURCHASES);
  saveStoredShoppingItems(INITIAL_SHOPPING_ITEMS);
  saveStoredMpesaTransactions(INITIAL_MPESA_TRANSACTIONS);
  saveStoredNotifications(INITIAL_NOTIFICATIONS);

  return {
    items: INITIAL_MENU_ITEMS,
    orders: INITIAL_ORDERS,
    settings: DEFAULT_SETTINGS,
    devices: INITIAL_CONNECTED_DEVICES,
    staff: INITIAL_STAFF_MEMBERS,
    businessOwners: INITIAL_BUSINESS_OWNERS,
    otps: INITIAL_OTP_CODES,
    capital: INITIAL_CAPITAL,
    purchases: INITIAL_PURCHASES,
    shopping: INITIAL_SHOPPING_ITEMS,
    mpesa: INITIAL_MPESA_TRANSACTIONS,
    notifications: INITIAL_NOTIFICATIONS,
  };
}

export function resetMenuCatalogOnly(): MenuItem[] {
  saveStoredItems(INITIAL_MENU_ITEMS);
  return INITIAL_MENU_ITEMS;
}

export function purgeOrdersAndTransactions(): { orders: Order[]; mpesa: MpesaTransaction[] } {
  saveStoredOrders([]);
  saveStoredMpesaTransactions([]);
  return { orders: [], mpesa: [] };
}

export function exportFullDatabaseBackup(): string {
  const backup = {
    version: '1.2.1',
    exportedAt: new Date().toISOString(),
    database: 'OrderUp Production Core Database',
    tables: {
      items: loadStoredItems(),
      orders: loadStoredOrders(),
      settings: loadStoredSettings(),
      devices: loadStoredDevices(),
      staff: loadStoredStaff(),
      businessOwners: loadStoredBusinessOwners(),
      otps: loadStoredOTPs(),
      capital: loadStoredCapital(),
      purchases: loadStoredPurchases(),
      shopping: loadStoredShoppingItems(),
      mpesa: loadStoredMpesaTransactions(),
      notifications: loadStoredNotifications(),
    },
  };
  return JSON.stringify(backup, null, 2);
}

export function restoreFullDatabaseBackup(jsonString: string): { success: boolean; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !parsed.tables) {
      return { success: false, error: 'Invalid backup format: missing tables root property' };
    }
    const t = parsed.tables;
    if (Array.isArray(t.items)) saveStoredItems(t.items);
    if (Array.isArray(t.orders)) saveStoredOrders(t.orders);
    if (t.settings && typeof t.settings === 'object') saveStoredSettings(t.settings);
    if (Array.isArray(t.devices)) saveStoredDevices(t.devices);
    if (Array.isArray(t.staff)) saveStoredStaff(t.staff);
    if (Array.isArray(t.businessOwners)) saveStoredBusinessOwners(t.businessOwners);
    if (Array.isArray(t.otps)) saveStoredOTPs(t.otps);
    if (t.capital && typeof t.capital === 'object') saveStoredCapital(t.capital);
    if (Array.isArray(t.purchases)) saveStoredPurchases(t.purchases);
    if (Array.isArray(t.shopping)) saveStoredShoppingItems(t.shopping);
    if (Array.isArray(t.mpesa)) saveStoredMpesaTransactions(t.mpesa);
    if (Array.isArray(t.notifications)) saveStoredNotifications(t.notifications);
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err?.message || 'JSON parse error during restore' };
  }
}

export function getDatabaseMetrics(): {
  totalRows: number;
  storageBytes: number;
  tableCounts: Record<string, number>;
} {
  try {
    const tableCounts = {
      orders: loadStoredOrders().length,
      menu_items: loadStoredItems().length,
      connected_devices: loadStoredDevices().length,
      staff_members: loadStoredStaff().length,
      business_owners: loadStoredBusinessOwners().length,
      purchases: loadStoredPurchases().length,
      shopping_items: loadStoredShoppingItems().length,
      mpesa_transactions: loadStoredMpesaTransactions().length,
      notifications: loadStoredNotifications().length,
    };
    const totalRows = Object.values(tableCounts).reduce((a, b) => a + b, 0);

    let storageBytes = 0;
    for (const key of Object.values(STORAGE_KEYS)) {
      const item = localStorage.getItem(key);
      if (item) {
        storageBytes += (key.length + item.length) * 2;
      }
    }

    return { totalRows, storageBytes, tableCounts };
  } catch {
    return {
      totalRows: 0,
      storageBytes: 0,
      tableCounts: {},
    };
  }
}

export function loadStoredAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredAuthUser(user: AuthUser | null): void {
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    }
  } catch (e) {
    console.error('Failed to save auth user', e);
  }
}

export function clearStoredAuthUser(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  } catch (e) {
    console.error('Failed to clear auth user', e);
  }
}




