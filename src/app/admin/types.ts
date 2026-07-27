// ── Admin Types ────────────────────────────────────────────────────────────
import { Timestamp, DocumentReference } from "firebase/firestore";

export type AdminUser = "Jay" | "Kashyap";

export type OrderSource = "website" | "instagram" | "whatsapp" | "call" | "walkin";

export type OrderStatus = "NEW" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export type PaymentType = "cod" | "prepaid" | "cash";

export interface OrderCustomer {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
  image?: string;
}

export interface AdminOrder {
  id: string;
  source: OrderSource;
  placed: Timestamp | any;
  status: OrderStatus;
  confirmedBy: AdminUser | null;
  payment: PaymentType;
  total: number;
  productCost: number;
  courierCost: number;
  otherExpense: number;
  margin: number;
  notes: string;
  customer: OrderCustomer;
  items: OrderItem[];
  // Internal references
  ref?: DocumentReference;
  isManual?: boolean;
}

export interface CustomerProfile {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  totalOrders: number;
  totalAmount: number;
  lastOrderDate: Timestamp | null;
  orderIds: string[];
}

export interface AuditEntry {
  id?: string;
  orderId: string;
  action: "created" | "confirmed" | "edited" | "cancelled" | "deleted" | "margin_updated" | "status_changed";
  user: string;
  timestamp: Timestamp | any;
  details: string;
}

export interface ReportFilters {
  dateRange: "today" | "week" | "month" | "year" | "custom" | "all";
  customStart?: Date;
  customEnd?: Date;
  partner: "all" | AdminUser;
  source: "all" | OrderSource;
  status: "all" | OrderStatus;
}

export interface DashboardMetrics {
  totalOrders: number;
  totalSales: number;
  totalProductCost: number;
  totalCourierCost: number;
  totalOtherExpenses: number;
  totalMargin: number;
}

export interface PartnerMetrics {
  orders: number;
  sales: number;
  margin: number;
}

export interface MonthlyData {
  month: string;
  monthNum: number;
  year: number;
  orders: number;
  sales: number;
  margin: number;
}

export interface Notification {
  id: string;
  type: "new_order" | "manual_order" | "cancelled" | "low_stock";
  message: string;
  timestamp: Date;
  read: boolean;
  orderId?: string;
}

// Source display config
export const SOURCE_CONFIG: Record<OrderSource, { label: string; color: string; bg: string; icon: string }> = {
  website: { label: "Website", color: "#2563EB", bg: "#EFF6FF", icon: "🌐" },
  instagram: { label: "Instagram", color: "#E1306C", bg: "#FFF1F5", icon: "📸" },
  whatsapp: { label: "WhatsApp", color: "#25D366", bg: "#F0FFF4", icon: "💬" },
  call: { label: "Call", color: "#D97706", bg: "#FFFBEB", icon: "📞" },
  walkin: { label: "Walk-in", color: "#7C3AED", bg: "#F5F3FF", icon: "🚶" },
};

// Status display config
export const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  NEW: { label: "New Order", color: "#D97706", bg: "#FEF3C7" },
  CONFIRMED: { label: "Confirmed", color: "#059669", bg: "#D1FAE5" },
  SHIPPED: { label: "Shipped", color: "#2563EB", bg: "#DBEAFE" },
  DELIVERED: { label: "Delivered", color: "#047857", bg: "#A7F3D0" },
  CANCELLED: { label: "Cancelled", color: "#DC2626", bg: "#FEE2E2" },
};

export const PAYMENT_CONFIG: Record<PaymentType, { label: string; color: string; bg: string }> = {
  cod: { label: "COD", color: "#D97706", bg: "#FEF3C7" },
  prepaid: { label: "Prepaid", color: "#2563EB", bg: "#DBEAFE" },
  cash: { label: "Cash", color: "#059669", bg: "#D1FAE5" },
};
