import { UserRole } from './utils/rbac';

export type Role = 'customer' | 'staff' | 'manager';

export {
  UserRole,
  Module,
  type PermissionAction,
  PERMISSIONS,
  hasPermission,
  authorize,
  type ModuleInfo,
  MODULE_REGISTRY,
} from './utils/rbac';


export type TabType =
  | 'order'
  | 'order_received'
  | 'order_completed'
  | 'admin'
  | 'menu'
  | 'orders'
  | 'cart'
  | 'inventory'
  | 'analytics'
  | 'debts'
  | 'finances'
  | 'purchases'
  | 'shopping'
  | 'customers'
  | 'mpesa'
  | 'notifications';

export type Category =
  | 'All'
  | 'Main'
  | 'Snacks'
  | 'Beverages'
  | 'Saturday Special'
  | 'Pizza'
  | 'Burgers & Sandwiches'
  | 'Chicken'
  | 'Meals & Plates'
  | 'Sides & Extras'
  | 'Drinks';

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type OrderType = 'dine_in' | 'takeaway' | 'delivery';

export type PaymentMethod = 'cash' | 'mpesa' | 'card' | 'selcom' | 'tips';

export type SettlementStatus = 'paid' | 'debt';

export type Language = 'en' | 'sw';

export type AppTheme = 'light' | 'dark';

export interface Variant {
  label: string; // e.g. "Small", "Medium", "Large"
  price: number; // in TZS / Tsh
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  icon: string; // lucide icon identifier or emoji
  price?: number; // base price if no variants
  variants?: Variant[];
  description?: string;
  isPopular?: boolean;
  isSpicy?: boolean;
  isChefSpecial?: boolean;
  isSaturdaySpecial?: boolean;
  imageUrl?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface CartItem {
  id: string; // unique item id + variant label
  menuItemId: string;
  name: string;
  category: string;
  variantLabel?: string;
  unitPrice: number;
  quantity: number;
  specialInstructions?: string;
  icon?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "2026-08-31-001" or "#1042"
  orderDate?: string; // YYYY-MM-DD
  orderSequence?: number;
  customerName: string;
  phone?: string;
  arrivalTime?: string; // YYYY-MM-DDTHH:MM for scheduled arrival
  orderType: OrderType;
  tableNumber?: string;
  deliveryAddress?: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  paidAmount: number;
  debtAmount: number;
  isPaid: boolean;
  isCompleted: boolean;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'pending' | 'debt';
  settlementStatus?: SettlementStatus; // 'paid' (OK Paid) or 'debt' (Unpaid Debt)
  debtorName?: string;
  debtorPhone?: string;
  debtNotes?: string;
  debtDueDate?: number;
  debtSettledAt?: number;
  debtSettledMethod?: PaymentMethod;
  debtCleared?: boolean;
  debtClearedDate?: number;
  selcomTransId?: string;
  selcomReference?: string;
  selcomGatewayType?: 'MOBILE' | 'CARD' | 'BANK_QR' | 'TIPS';
  selcomStatus?: string;
  selcomPhone?: string;
  notificationSent?: boolean;
  status: OrderStatus;
  createdAt: number; // timestamp ms
  updatedAt: number;
  orderTimeReceived?: number;
  orderTimeComplete?: number;
  completedAt?: number;
  estimatedPrepMinutes: number;
  notes?: string;
  source: 'Online Kiosk' | 'POS Counter' | 'Mobile Web' | 'Bar Terminal';
  cashierName?: string;
  changeDue?: number;
  isAcknowledged?: boolean;
  checkedItemIndices?: number[]; // indices of items marked as prepared in kitchen
}

export interface Purchase {
  id: string;
  itemName: string;
  quantity: number;
  pricePerUnit: number;
  totalCost: number;
  purchaseDate: string; // YYYY-MM-DD
  notes?: string;
  createdAt: number;
}

export interface Capital {
  id: string;
  amount: number;
  notes?: string;
  updatedAt: number;
}

export interface MpesaTransaction {
  id: string;
  orderId?: string;
  orderNumber?: string;
  customerName?: string;
  amount: number;
  transactionDate: number;
  reference: string;
  notes?: string;
}

export interface ShoppingItem {
  id: string;
  itemName: string;
  quantity?: string;
  estimatedPrice?: number;
  isBought: boolean;
  createdAt: number;
  updatedAt?: number;
}

export interface NotificationItem {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName?: string;
  phone?: string;
  arrivalTime?: string;
  message: string;
  sentAt: number;
  isRead: boolean;
  type?: 'arrival' | 'ready' | 'debt' | 'payment' | 'system';
}

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  arrivalTime?: string;
  createdAt: number;
  lastVisit?: number;
  totalOrders: number;
  totalSpent: number;
  totalDebt: number;
}

export interface ConnectedDevice {
  id: string;
  name: string;
  deviceType: 'pos' | 'kitchen_display' | 'kiosk' | 'waiter_phone' | 'manager_laptop';
  assignedLocation: string;
  ipAddress: string;
  browserInfo: string;
  status: 'active' | 'disabled' | 'pending_approval';
  lastActive: number;
  registeredAt: number;
  isCurrent?: boolean;
  pairingCode?: string;
  requestedAt?: number;
}

export interface StaffMember {
  id: string;
  name: string;
  username?: string; // staff username to login to the app
  password?: string; // staff login password / access passcode
  pin?: string; // 4-digit quick access PIN
  roleTitle: string; // e.g. Head Chef, Cashier, Waiter, Manager
  assignedRole?: UserRole; // system role: STAFF, CASHIER, KITCHEN, WAITER, MANAGER, etc.
  accessEnabled?: boolean; // toggle: true (active access) or false (suspended/disabled)
  email?: string;
  phone?: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  fromLocation: string;
  emergencyPhone1: string;
  emergencyPhone2: string;
  guardianName: string;
  agreedSalary: number; // monthly salary in TZS
  employmentDate: string; // YYYY-MM-DD
  salaryPaymentStatus?: 'paid' | 'pending' | 'due_soon';
  lastSalaryPaidDate?: string; // YYYY-MM-DD
  notes?: string;
  createdAt?: number;
}

export interface StaffPayrollRecord {
  staffId: string;
  staffName: string;
  roleTitle?: string;
  monthlyGrossSalary: number;
  daysAbsent: number;
  month: number;
  year: number;
  totalDaysInMonth: number;
  calculatedDailyRate: number;
  totalDeduction: number;
  netPayableSalary: number;
  calculatedByAi?: boolean;
  status?: 'pending' | 'paid';
  paidAt?: number;
}

export interface OneTimePasscode {
  id: string;
  code: string; // 6-digit numeric string
  createdAt: number;
  expiresAt: number;
  isUsed: boolean;
  usedByDevice?: string;
  note?: string;
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  businessId: string | null;
  avatar?: string;
  token?: string;
  lastLoginAt: number;
}

export interface BusinessOwnerAccount {
  id: string;
  name: string;
  username: string; // Business owner login username (e.g. ernest_owner)
  password: string; // Business owner login password
  pin?: string; // 4-digit quick PIN
  email?: string;
  phone?: string;
  businessName?: string;
  ownerType?: 'primary' | 'co_owner' | 'franchisee' | 'director';
  accessEnabled: boolean; // toggle: true (active) or false (locked/disabled)
  createdAt: number;
  lastLoginAt?: number;
  notes?: string;
}

export interface RestaurantSettings {
  restaurantName: string;
  tagline: string;
  currency: string;
  phone: string;
  address: string;
  taxRate: number; // e.g. 0.0 for included or 0.18
  defaultDeliveryFee: number;
  defaultPrepMinutes: number;
  overdueThresholdMinutes: number;
  enableSoundAlerts: boolean;
  adminPassword: string;
  ownerName: string;
  ownerEmail: string;
  ownershipLicense: string;
  // Appearance & Control additions
  language?: Language;
  theme?: AppTheme;
  headerBgImage?: string;
  backgroundImage?: string; // custom background image data URL or URL from gallery
  backgroundOpacity?: number; // 0.05 to 1.0 (opacity of background wallpaper)
  backgroundBlur?: number; // blur in px (0 to 20)
  backgroundFit?: 'cover' | 'contain' | 'tile';
  backgroundOverlay?: 'none' | 'light' | 'dark' | 'emerald' | 'warm';
  admissionPolicy?: string;
  hideAdminFromNav?: boolean;
  reportEmails?: string[];
  reportWhatsAppNumber?: string;
  reportDayOfMonth?: number;
  supportPhoneNumber?: string;
  isSaturdayPreview?: boolean; // toggle for testing Saturday specials anytime
  deviceControlEnabled?: boolean; // master toggle: enable/disable device authorization and lockout security
  requireDeviceApproval?: boolean; // require admin approval before new terminal can place orders
  notificationsEnabled?: boolean; // receive app alerts, order dings & updates
  autoBackupEnabled?: boolean; // run daily background system snapshots
  systemLoggingEnabled?: boolean; // send crash reports and network telemetry
  debugModeEnabled?: boolean; // overlay real-time performance and API flags
  lastAutoBackupTime?: number;
}



