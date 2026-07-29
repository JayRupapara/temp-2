// ── Admin Page (Main Shell) ────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag, Package, Layers, BarChart3, ClipboardList,
  Bell, Moon, Sun, LogOut, Menu, X, CreditCard
} from "lucide-react";

// Hooks
import { useOrders } from "./hooks/useOrders";
import { useCustomers } from "./hooks/useCustomers";
import { useAuditLog } from "./hooks/useAuditLog";

// Types
import { AdminOrder, AdminUser, Notification } from "./types";

// Components
import ProductsTab from "./components/ProductsTab";
import CombosTab from "./components/CombosTab";
import OrdersTab from "./components/OrdersTab";
import NewOrderModal from "./components/NewOrderModal";

import CustomerProfileModal from "./components/CustomerProfileModal";
import ReportsTab from "./components/ReportsTab";
import AuditLogTimeline from "./components/AuditLogTimeline";
import PaymentSettingsTab from "./components/PaymentSettingsTab";

type AdminTab = "orders" | "products" | "combos" | "reports" | "audit" | "payment";

// Get useApp from parent context
import { useApp } from "./adminExports";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Key, Lock, ShieldCheck } from "lucide-react";

export default function AdminPage() {
  const appCtx = useApp();
  const products = appCtx?.products ?? [];
  const combos = appCtx?.combos ?? [];

  // Auth & Backend Password State
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [backendPass, setBackendPass] = useState<string | null>(null);
  const [isCheckingPass, setIsCheckingPass] = useState(true);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);

  // Setup & Change Password Modals
  const [setupPass, setSetupPass] = useState("");
  const [confirmSetupPass, setConfirmSetupPass] = useState("");
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [currentPassInput, setCurrentPassInput] = useState("");
  const [newPassInput, setNewPassInput] = useState("");
  const [confirmNewPassInput, setConfirmNewPassInput] = useState("");

  // UI State
  const [tab, setTab] = useState<AdminTab>("orders");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("admin_dark_mode") === "true");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Order modals
  const [newOrderOpen, setNewOrderOpen] = useState(false);

  const [customerPhone, setCustomerPhone] = useState<string | null>(null);

  // Hooks
  const { orders, loading: ordersLoading, createManualOrder, updateOrder, confirmOrder, cancelOrder, deleteOrder } = useOrders(authed);
  const customerLookup = useCustomers();
  const { entries: auditEntries, loading: auditLoading, logAction, getEntriesForOrder, purgeOldLogs, exportLogsToCSV } = useAuditLog(authed && tab === "audit");

  // Fetch backend admin password on mount
  useEffect(() => {
    const fetchBackendPassword = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "security"));
        if (snap.exists() && snap.data().adminPassword) {
          setBackendPass(snap.data().adminPassword);
          setIsFirstTimeSetup(false);
        } else {
          setIsFirstTimeSetup(true);
        }
      } catch (err) {
        console.warn("Security fetch error:", err);
        setIsFirstTimeSetup(true);
      } finally {
        setIsCheckingPass(false);
      }
    };
    fetchBackendPassword();
  }, []);

  // Dark mode persistence
  useEffect(() => {
    localStorage.setItem("admin_dark_mode", darkMode.toString());
  }, [darkMode]);

  // Track new orders for notifications
  const prevOrderCount = useState<number>(0);
  useEffect(() => {
    if (orders.length > prevOrderCount[0] && prevOrderCount[0] > 0) {
      const newOrd = orders[0];
      const notif: Notification = {
        id: Date.now().toString(),
        type: newOrd.isManual ? "manual_order" : "new_order",
        message: `New ${newOrd.isManual ? "manual" : "website"} order ${newOrd.id} from ${newOrd.customer?.name || "Unknown"}`,
        timestamp: new Date(),
        read: false,
        orderId: newOrd.id,
      };
      setNotifications(prev => [notif, ...prev].slice(0, 50));
    }
    prevOrderCount[0] = orders.length;
  }, [orders.length]);

  const newOrdersCount = orders.filter(o => o.status === "NEW").length;
  const unreadNotifs = notifications.filter(n => !n.read).length;

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleLoginSubmit = () => {
    if (!backendPass) { toast.error("No password configured. Please set up first."); return; }
    if (pwd === backendPass) {
      setAuthed(true);

      toast.success("Welcome back to Admin Panel!");
    } else {
      toast.error("Incorrect Password");
    }
  };

  const handleInitialSetup = async () => {
    if (!setupPass || setupPass.length < 4) {
      return toast.error("Password must be at least 4 characters long.");
    }
    if (setupPass !== confirmSetupPass) {
      return toast.error("Passwords do not match!");
    }
    try {
      await setDoc(doc(db, "settings", "security"), {
        adminPassword: setupPass,
        updatedAt: Date.now(),
        updatedBy: "Initial Setup"
      });
      setBackendPass(setupPass);
      setIsFirstTimeSetup(false);
      setAuthed(true);

      toast.success("Admin password configured in backend successfully!");
    } catch (err: any) {
      toast.error("Failed to save password", { description: err.message });
    }
  };

  const handleChangePassword = async () => {
    if (!backendPass) { toast.error("No password configured."); return; }
    if (currentPassInput !== backendPass) {
      return toast.error("Current password is incorrect!");
    }
    if (!newPassInput || newPassInput.length < 4) {
      return toast.error("New password must be at least 4 characters long.");
    }
    if (newPassInput !== confirmNewPassInput) {
      return toast.error("New passwords do not match!");
    }
    try {
      await setDoc(doc(db, "settings", "security"), {
        adminPassword: newPassInput,
        updatedAt: Date.now(),
        updatedBy: "Admin Panel"
      });
      setBackendPass(newPassInput);
      setChangePassOpen(false);
      setCurrentPassInput("");
      setNewPassInput("");
      setConfirmNewPassInput("");
      toast.success("Admin Password updated in backend!");
    } catch (err: any) {
      toast.error("Failed to update password", { description: err.message });
    }
  };

  const handleLogout = () => {
    setAuthed(false);

    setPwd("");
    toast.info("Logged out of Admin Panel");
  };

  const handleConfirmOrder = async (order: AdminOrder, confirmedBy: AdminUser) => {
    await confirmOrder(order, confirmedBy);
    const orderTag = `#${order.id.slice(-6).toUpperCase()}`;
    const custName = order.customer?.name ? ` (${order.customer.name})` : "";
    await logAction({ orderId: order.id, action: "confirmed", user: confirmedBy, details: `Order ${orderTag}${custName} confirmed by ${confirmedBy}` });
  };

  const handleCancelOrder = async (order: AdminOrder) => {
    await cancelOrder(order);
    const orderTag = `#${order.id.slice(-6).toUpperCase()}`;
    const custName = order.customer?.name ? ` (${order.customer.name})` : "";
    await logAction({ orderId: order.id, action: "cancelled", user: "Admin", details: `Order ${orderTag}${custName} cancelled` });
  };

  const handleDeleteOrder = async (order: AdminOrder) => {
    if (!confirm("Are you sure you want to permanently delete this order?")) return;
    const orderTag = `#${order.id.slice(-6).toUpperCase()}`;
    const custName = order.customer?.name ? ` (${order.customer.name})` : "";
    await deleteOrder(order);
    await logAction({ orderId: order.id, action: "deleted", user: "Admin", details: `Order ${orderTag}${custName} permanently deleted` });
  };

  const handleSaveOrder = async (order: AdminOrder, updates: Partial<AdminOrder>) => {
    await updateOrder(order, updates);

    // Build smart human-readable log of what actually changed
    const changes: string[] = [];
    const orderTag = `#${order.id.slice(-6).toUpperCase()}`;
    const custName = order.customer?.name ? ` (${order.customer.name})` : "";

    if (updates.status && updates.status !== order.status) {
      changes.push(`Status: ${order.status || "NEW"} → ${updates.status}`);
    }
    if (updates.confirmedBy && updates.confirmedBy !== order.confirmedBy) {
      changes.push(`Confirmed by: ${updates.confirmedBy}`);
    }
    if (updates.payment && updates.payment !== order.payment) {
      changes.push(`Payment: ${order.payment || "—"} → ${updates.payment}`);
    }
    if (updates.total !== undefined && updates.total !== order.total) {
      changes.push(`Total: ₹${order.total || 0} → ₹${updates.total}`);
    }
    if (updates.productCost !== undefined && updates.productCost !== (order as any).productCost) {
      changes.push(`Product Cost: ₹${(order as any).productCost || 0} → ₹${updates.productCost}`);
    }
    if (updates.courierCost !== undefined && updates.courierCost !== (order as any).courierCost) {
      changes.push(`Courier Cost: ₹${(order as any).courierCost || 0} → ₹${updates.courierCost}`);
    }
    if (updates.margin !== undefined && updates.margin !== (order as any).margin) {
      changes.push(`Margin: ₹${(order as any).margin || 0} → ₹${updates.margin}`);
    }
    if (updates.notes !== undefined && updates.notes !== (order as any).notes) {
      changes.push(`Notes updated`);
    }
    if ((updates as any).customer && JSON.stringify((updates as any).customer) !== JSON.stringify((order as any).customer)) {
      changes.push(`Customer info updated`);
    }
    if (updates.source && updates.source !== order.source) {
      changes.push(`Source: ${order.source || "—"} → ${updates.source}`);
    }

    const changeSummary = changes.length > 0 ? changes.join(" | ") : `Fields modified: ${Object.keys(updates).join(", ")}`;
    const summary = `Order ${orderTag}${custName} updated: ${changeSummary}`;

    await logAction({ orderId: order.id, action: "edited", user: updates.confirmedBy || "Admin", details: summary });
  };

  const handleCreateManualOrder = async (data: any) => {
    const orderId = await createManualOrder(data);
    await logAction({ orderId: orderId || "unknown", action: "created", user: data.confirmedBy || "Admin", details: `Manual order created from ${data.source}` });
    if (data.customer?.phone) {
      await customerLookup.saveCustomer(data.customer, orderId || "", data.total);
    }
    setNewOrderOpen(false);
  };

  // ── Login / Setup Screen ──────────────────────────────────────────────
  if (!authed) {
    if (isCheckingPass) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F6F2]">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-[#CFA18D] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-semibold text-gray-600">Verifying Admin Security...</p>
          </div>
        </div>
      );
    }

    // First Time Backend Setup Screen
    if (isFirstTimeSetup) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F8F6F2 0%, #EDE8E1 100%)" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm w-full mx-4"
            style={{ border: "1px solid rgba(203,184,169,0.3)" }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#CFA18D] to-[#A67B66] flex items-center justify-center mx-auto mb-4 shadow-lg">
              <ShieldCheck size={30} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Initial Admin Setup</h2>
            <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mb-5 font-medium">
              No password found in backend. Set your master admin password to secure your panel.
            </p>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Set New Password"
                value={setupPass}
                onChange={e => setSetupPass(e.target.value)}
                className="w-full px-5 py-3 rounded-xl border text-center font-medium outline-none focus:ring-2 focus:ring-[#CFA18D]/50 transition-all text-sm"
                style={{ background: "#FCFBF8", border: "1px solid rgba(203,184,169,0.3)", color: "#3D2B1F" }}
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmSetupPass}
                onChange={e => setConfirmSetupPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInitialSetup()}
                className="w-full px-5 py-3 rounded-xl border text-center font-medium outline-none focus:ring-2 focus:ring-[#CFA18D]/50 transition-all text-sm"
                style={{ background: "#FCFBF8", border: "1px solid rgba(203,184,169,0.3)", color: "#3D2B1F" }}
              />
              <button
                onClick={handleInitialSetup}
                className="w-full mt-2 py-3.5 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
                style={{ background: "linear-gradient(135deg, #CFA18D, #A67B66)" }}
              >
                Save & Continue to Admin
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    // Normal Login Screen
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F8F6F2 0%, #EDE8E1 100%)" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm w-full mx-4"
          style={{ border: "1px solid rgba(203,184,169,0.3)" }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#CFA18D] to-[#A67B66] flex items-center justify-center mx-auto mb-5 shadow-lg">
            <ShoppingBag size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Admin Panel</h2>
          <p className="text-sm text-gray-500 mb-6">Shri Vallabh Jewels</p>
          <input
            type="password"
            placeholder="Enter Password"
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLoginSubmit()}
            className="w-full px-5 py-3.5 rounded-xl border text-center font-medium outline-none focus:ring-2 focus:ring-[#CFA18D]/50 transition-all"
            style={{ background: "#FCFBF8", border: "1px solid rgba(203,184,169,0.3)", color: "#3D2B1F" }}
          />
          <button
            onClick={handleLoginSubmit}
            className="w-full mt-4 py-3.5 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
            style={{ background: "linear-gradient(135deg, #CFA18D, #A67B66)" }}
          >
            Login
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Tab Config ────────────────────────────────────────────────────────
  const tabs: { id: AdminTab; label: string; icon: any; badge?: number }[] = [
    { id: "orders", label: "Orders", icon: ShoppingBag, badge: newOrdersCount || undefined },
    { id: "products", label: "Products", icon: Package },
    { id: "combos", label: "Combos", icon: Layers },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "audit", label: "Audit Log", icon: ClipboardList },
    { id: "payment", label: "Payment", icon: CreditCard },
  ];

  const dm = darkMode;
  const bgMain = dm ? "bg-gray-950" : "bg-[#F8F6F2]";
  const bgCard = dm ? "bg-gray-900" : "bg-white";
  const textMain = dm ? "text-gray-100" : "text-[#3D2B1F]";
  const borderColor = dm ? "border-gray-800" : "border-[rgba(203,184,169,0.2)]";

  return (
    <div className={`min-h-screen pt-28 pb-20 ${bgMain} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className={`text-2xl lg:text-3xl font-bold ${textMain}`} style={{ fontFamily: "'Playfair Display', serif" }}>
              Admin Panel
            </h1>
            <p className={`text-sm mt-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
              Manage orders, products, and reports
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(!showNotifications); setNotifications(prev => prev.map(n => ({ ...n, read: true }))); }}
                className={`p-2.5 rounded-xl transition-all ${dm ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-white hover:bg-gray-50 text-gray-600'} border ${borderColor}`}
              >
                <Bell size={18} />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotifs}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`absolute right-0 top-12 w-80 ${bgCard} rounded-2xl shadow-2xl border ${borderColor} z-50 overflow-hidden`}
                  >
                    <div className={`p-4 border-b ${borderColor}`}>
                      <h3 className={`font-bold ${textMain}`}>Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className={`p-4 text-center text-sm ${dm ? 'text-gray-500' : 'text-gray-400'}`}>No notifications</p>
                      ) : (
                        notifications.slice(0, 10).map(n => (
                          <div key={n.id} className={`p-3 border-b last:border-0 ${borderColor} ${dm ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
                            <p className={`text-xs ${textMain}`}>{n.message}</p>
                            <p className={`text-[10px] mt-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                              {n.timestamp.toLocaleString("en-IN")}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-xl transition-all ${dm ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' : 'bg-white hover:bg-gray-50 text-gray-600'} border ${borderColor}`}
              title={dm ? "Light Mode" : "Dark Mode"}
            >
              {dm ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Change Password */}
            <button
              onClick={() => setChangePassOpen(true)}
              className={`p-2.5 rounded-xl transition-all ${dm ? 'bg-gray-800 hover:bg-gray-700 text-amber-400' : 'bg-white hover:bg-gray-50 text-amber-600'} border ${borderColor}`}
              title="Change Admin Password"
            >
              <Key size={18} />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className={`p-2.5 rounded-xl transition-all ${dm ? 'bg-gray-800 hover:bg-red-900/50 text-gray-300 hover:text-red-400' : 'bg-white hover:bg-red-50 text-gray-600 hover:text-red-500'} border ${borderColor}`}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        {/* Desktop Tabs */}
        <div className={`hidden md:flex gap-1 ${bgCard} rounded-xl p-1.5 border ${borderColor} mb-6 shadow-sm`}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                tab === t.id
                  ? (dm ? 'bg-white text-gray-900 shadow-sm' : 'bg-[#3D2B1F] text-white shadow-sm')
                  : (dm ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50')
              }`}
            >
              <t.icon size={16} />
              {t.label}
              {t.badge && t.badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-pulse">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Mobile Tabs (scrollable) */}
        <div className="md:hidden flex gap-1.5 overflow-x-auto pb-4 mb-4 no-scrollbar hide-scrollbar">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                tab === t.id
                  ? (dm ? 'bg-white text-gray-900 shadow-sm' : 'bg-[#3D2B1F] text-white shadow-sm')
                  : (dm ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500 border border-gray-200')
              }`}
            >
              <t.icon size={14} />
              {t.label}
              {t.badge && t.badge > 0 && (
                <span className="bg-red-500 text-white text-[9px] px-1 py-0.5 rounded-full min-w-[16px] text-center">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab Content ──────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab === "orders" && (
              <OrdersTab
                orders={orders}
                loading={ordersLoading}
                darkMode={darkMode}
                onSaveOrder={handleSaveOrder}
                onConfirmOrder={handleConfirmOrder}
                onCancelOrder={handleCancelOrder}
                onDeleteOrder={handleDeleteOrder}
                onNewOrder={() => setNewOrderOpen(true)}
                onCustomerClick={(phone) => setCustomerPhone(phone)}
              />
            )}

            {tab === "products" && (
              <ProductsTab products={products} darkMode={darkMode} />
            )}

            {tab === "combos" && (
              <CombosTab combos={combos} darkMode={darkMode} />
            )}

            {tab === "reports" && (
              <ReportsTab orders={orders} darkMode={darkMode} />
            )}

            { tab === "audit" && (
              <AuditLogTimeline entries={auditEntries} loading={auditLoading} darkMode={darkMode} onExportCSV={exportLogsToCSV} onPurgeOld={purgeOldLogs} />
            )}

            {tab === "payment" && (
              <PaymentSettingsTab darkMode={darkMode} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────── */}
      <NewOrderModal
        open={newOrderOpen}
        onClose={() => setNewOrderOpen(false)}
        onSave={handleCreateManualOrder}
        darkMode={darkMode}
        customerLookup={customerLookup}
      />



      <CustomerProfileModal
        phone={customerPhone}
        orders={orders}
        onClose={() => setCustomerPhone(null)}
        darkMode={darkMode}
      />

      {/* Change Password Modal */}
      {changePassOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`w-full max-w-md p-6 rounded-2xl ${bgCard} border ${borderColor} shadow-2xl`}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Lock size={20} />
                </div>
                <h3 className={`text-lg font-bold ${textMain}`}>Change Admin Password</h3>
              </div>
              <button onClick={() => setChangePassOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Current Password</label>
                <input
                  type="password"
                  value={currentPassInput}
                  onChange={e => setCurrentPassInput(e.target.value)}
                  placeholder="Enter current password"
                  className={`w-full px-4 py-2.5 rounded-xl text-sm border outline-none ${dm ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>New Password</label>
                <input
                  type="password"
                  value={newPassInput}
                  onChange={e => setNewPassInput(e.target.value)}
                  placeholder="Enter new password"
                  className={`w-full px-4 py-2.5 rounded-xl text-sm border outline-none ${dm ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmNewPassInput}
                  onChange={e => setConfirmNewPassInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
                  placeholder="Confirm new password"
                  className={`w-full px-4 py-2.5 rounded-xl text-sm border outline-none ${dm ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setChangePassOpen(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border ${dm ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#CFA18D] to-[#A67B66] hover:opacity-90 transition-opacity shadow-md"
                >
                  Update Password
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
