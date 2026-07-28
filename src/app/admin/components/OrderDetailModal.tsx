import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit2, Save, User, MapPin, Package, CreditCard, Clock, Activity, Briefcase } from "lucide-react";
import { AdminOrder, AuditEntry, SOURCE_CONFIG, STATUS_CONFIG, PAYMENT_CONFIG, OrderStatus, AdminUser, OrderItem } from "../types";
import { toast } from "sonner";

interface OrderDetailModalProps {
  order: AdminOrder | null;
  mode: "view" | "edit";
  onClose: () => void;
  onSave: (order: AdminOrder, updates: Partial<AdminOrder>) => void;
  auditEntries: AuditEntry[];
  darkMode: boolean;
}

export default function OrderDetailModal({
  order,
  mode: initialMode,
  onClose,
  onSave,
  auditEntries,
  darkMode,
}: OrderDetailModalProps) {
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [formData, setFormData] = useState<Partial<AdminOrder>>({});

  useEffect(() => {
    setMode(initialMode);
    if (order) {
      setFormData(order);
    }
  }, [initialMode, order]);

  if (!order) return null;

  const handleSave = () => {
    const total = formData.total !== undefined ? formData.total : (order.total || 0);
    const productCost = formData.productCost !== undefined ? formData.productCost : (order.productCost || 0);
    const courierCost = formData.courierCost !== undefined ? formData.courierCost : (order.courierCost || 0);
    const otherExpense = formData.otherExpense !== undefined ? formData.otherExpense : (order.otherExpense || 0);
    
    let margin = 0;
    if (formData.margin !== undefined) {
      margin = formData.margin;
    } else if (productCost > 0 || courierCost > 0 || otherExpense > 0) {
      margin = total - productCost - courierCost - otherExpense;
    } else {
      margin = order.margin || 0;
    }

    const updates = {
      ...formData,
      total,
      productCost,
      courierCost,
      otherExpense,
      margin,
    };
    
    onSave(order, updates);
    setMode("view");
    toast.success("Order updated successfully");
  };

  const handleCustomerChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      customer: { ...(prev.customer || order.customer), [field]: value },
    }));
  };
  
  const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...(formData.items || order.items)];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleInputChange = (field: keyof AdminOrder, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (["productCost", "courierCost", "otherExpense", "total"].includes(field)) {
        const t = next.total !== undefined ? Number(next.total) : (order.total || 0);
        const pc = next.productCost !== undefined ? Number(next.productCost) : (order.productCost || 0);
        const cc = next.courierCost !== undefined ? Number(next.courierCost) : (order.courierCost || 0);
        const oe = next.otherExpense !== undefined ? Number(next.otherExpense) : (order.otherExpense || 0);
        if (pc > 0 || cc > 0 || oe > 0) {
          next.margin = t - pc - cc - oe;
        }
      }
      return next;
    });
  };

  const hasCostsEntered = (formData.productCost || 0) > 0 || (formData.courierCost || 0) > 0 || (formData.otherExpense || 0) > 0 || (order.productCost || 0) > 0 || (order.courierCost || 0) > 0 || (order.otherExpense || 0) > 0;
  const calculatedMargin = hasCostsEntered ? ((formData.total ?? order.total ?? 0) - (formData.productCost ?? order.productCost ?? 0) - (formData.courierCost ?? order.courierCost ?? 0) - (formData.otherExpense ?? order.otherExpense ?? 0)) : (order.margin || 0);
  const displayMargin = formData.margin !== undefined ? formData.margin : calculatedMargin;

  const bgBase = darkMode ? "bg-[#1C1C1C]" : "bg-white";
  const bgCard = darkMode ? "bg-[#2A2A2A]" : "bg-[#F8F6F2]";
  const textMain = darkMode ? "text-gray-100" : "text-gray-900";
  const textMuted = darkMode ? "text-gray-400" : "text-gray-600";
  const borderCol = darkMode ? "border-gray-700" : "border-gray-200";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-xl flex flex-col ${bgBase}`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${borderCol}`}>
            <div>
              <h2 className={`text-2xl font-semibold ${textMain}`}>Order #{order.id}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1"
                  style={{ backgroundColor: SOURCE_CONFIG[order.source].bg, color: SOURCE_CONFIG[order.source].color }}
                >
                  {SOURCE_CONFIG[order.source].icon} {SOURCE_CONFIG[order.source].label}
                </span>
                <span
                  className="px-2.5 py-1 text-xs font-medium rounded-full"
                  style={{ backgroundColor: STATUS_CONFIG[order.status].bg, color: STATUS_CONFIG[order.status].color }}
                >
                  {STATUS_CONFIG[order.status].label}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {mode === "view" ? (
                <button
                  onClick={() => setMode("edit")}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#CFA18D] rounded-lg hover:bg-[#b88c78] transition-colors"
                >
                  <Edit2 size={16} /> Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setMode("view");
                      setFormData(order);
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border ${borderCol} ${textMuted} hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#059669] rounded-lg hover:bg-[#047857] transition-colors"
                  >
                    <Save size={16} /> Save
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${textMuted}`}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Details */}
              <div className={`p-5 rounded-xl border ${borderCol} ${bgCard}`}>
                <div className={`flex items-center gap-2 mb-4 font-medium ${textMain}`}>
                  <User size={18} className="text-[#CFA18D]" /> Customer Details
                </div>
                <div className="space-y-3">
                  {mode === "view" ? (
                    <>
                      <div className={`text-sm ${textMain}`}><span className={textMuted}>Name:</span> {order.customer.name}</div>
                      <div className={`text-sm ${textMain}`}><span className={textMuted}>Phone:</span> {order.customer.phone}</div>
                      <div className={`text-sm ${textMain}`}><span className={textMuted}>Email:</span> {order.customer.email || 'N/A'}</div>
                      <div className={`text-sm ${textMain} flex items-start gap-1`}>
                        <MapPin size={14} className={`mt-0.5 ${textMuted}`} />
                        <span>{order.customer.address}, {order.customer.city}, {order.customer.state} {order.customer.pincode}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={formData.customer?.name || ""}
                        onChange={(e) => handleCustomerChange("name", e.target.value)}
                        placeholder="Name"
                        className={`w-full p-2 text-sm rounded-lg border ${borderCol} bg-transparent ${textMain}`}
                      />
                      <input
                        type="text"
                        value={formData.customer?.phone || ""}
                        onChange={(e) => handleCustomerChange("phone", e.target.value)}
                        placeholder="Phone"
                        className={`w-full p-2 text-sm rounded-lg border ${borderCol} bg-transparent ${textMain}`}
                      />
                      <input
                        type="email"
                        value={formData.customer?.email || ""}
                        onChange={(e) => handleCustomerChange("email", e.target.value)}
                        placeholder="Email"
                        className={`w-full p-2 text-sm rounded-lg border ${borderCol} bg-transparent ${textMain}`}
                      />
                      <textarea
                        value={formData.customer?.address || ""}
                        onChange={(e) => handleCustomerChange("address", e.target.value)}
                        placeholder="Address"
                        className={`w-full p-2 text-sm rounded-lg border ${borderCol} bg-transparent ${textMain}`}
                        rows={2}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Admin Business Details */}
              <div className={`p-5 rounded-xl border ${borderCol} ${bgCard}`}>
                <div className={`flex items-center gap-2 mb-4 font-medium ${textMain}`}>
                  <Briefcase size={18} className="text-[#CFA18D]" /> Business Details
                </div>
                <div className="space-y-3">
                  {mode === "view" ? (
                    <>
                      <div className={`text-sm flex justify-between ${textMain}`}><span className={textMuted}>Product Cost:</span> ₹{order.productCost}</div>
                      <div className={`text-sm flex justify-between ${textMain}`}><span className={textMuted}>Courier Cost:</span> ₹{order.courierCost}</div>
                      <div className={`text-sm flex justify-between ${textMain}`}><span className={textMuted}>Other Exp:</span> ₹{order.otherExpense}</div>
                      <div className={`text-sm flex justify-between font-medium ${textMain}`}><span className={textMuted}>Calculated Margin:</span> <span className="text-[#059669]">₹{order.margin}</span></div>
                      <div className={`text-sm mt-2 ${textMain}`}><span className={textMuted}>Confirmed By:</span> {order.confirmedBy || 'Unconfirmed'}</div>
                      {order.notes && <div className={`text-sm mt-2 p-2 rounded bg-opacity-10 bg-[#3D2B1F] ${textMain}`}><span className={textMuted}>Notes:</span> {order.notes}</div>}
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={`text-xs ${textMuted}`}>Product Cost</label>
                          <input
                            type="number"
                            value={formData.productCost || 0}
                            onChange={(e) => handleInputChange("productCost", Number(e.target.value))}
                            className={`w-full p-2 text-sm rounded-lg border ${borderCol} bg-transparent ${textMain}`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${textMuted}`}>Courier Cost</label>
                          <input
                            type="number"
                            value={formData.courierCost || 0}
                            onChange={(e) => handleInputChange("courierCost", Number(e.target.value))}
                            className={`w-full p-2 text-sm rounded-lg border ${borderCol} bg-transparent ${textMain}`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${textMuted}`}>Other Exp</label>
                          <input
                            type="number"
                            value={formData.otherExpense ?? 0}
                            onChange={(e) => handleInputChange("otherExpense", Number(e.target.value))}
                            className={`w-full p-2 text-sm rounded-lg border ${borderCol} bg-transparent ${textMain}`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs font-semibold ${textMuted}`}>Net Margin (₹)</label>
                          <input
                            type="number"
                            value={displayMargin}
                            onChange={(e) => handleInputChange("margin", Number(e.target.value))}
                            className={`w-full p-2 text-sm font-bold rounded-lg border outline-none transition-all ${
                              displayMargin >= 0 
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300 focus:ring-2 focus:ring-emerald-400" 
                                : "bg-rose-50 text-rose-800 border-rose-300 focus:ring-2 focus:ring-rose-400"
                            }`}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <label className={`text-xs ${textMuted}`}>Status</label>
                          <select
                            value={formData.status}
                            onChange={(e) => handleInputChange("status", e.target.value as OrderStatus)}
                            className={`w-full p-2 text-sm rounded-lg border ${borderCol} bg-transparent ${textMain}`}
                          >
                            <option value="NEW">New Order</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </div>
                        <div>
                          <label className={`text-xs ${textMuted}`}>Confirmed By</label>
                          <select
                            value={formData.confirmedBy || ""}
                            onChange={(e) => handleInputChange("confirmedBy", e.target.value || null)}
                            className={`w-full p-2 text-sm rounded-lg border ${borderCol} bg-transparent ${textMain}`}
                          >
                            <option value="">None</option>
                            <option value="Jay">Jay</option>
                            <option value="Kashyap">Kashyap</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className={`text-xs ${textMuted}`}>Notes</label>
                        <textarea
                          value={formData.notes || ""}
                          onChange={(e) => handleInputChange("notes", e.target.value)}
                          className={`w-full p-2 text-sm rounded-lg border ${borderCol} bg-transparent ${textMain}`}
                          rows={2}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Products & Payment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`col-span-2 p-5 rounded-xl border ${borderCol} ${bgCard}`}>
                <div className={`flex items-center gap-2 mb-4 font-medium ${textMain}`}>
                  <Package size={18} className="text-[#CFA18D]" /> Order Items
                </div>
                <div className="space-y-3">
                  {(mode === 'edit' ? formData.items : order.items)?.map((item, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${borderCol} bg-opacity-50`}>
                      {mode === "view" ? (
                        <>
                          <div className="flex items-center gap-3">
                            {item.image && (
                              <img src={item.image} alt={item.name} className="w-10 h-10 rounded object-cover" />
                            )}
                            <div>
                              <div className={`text-sm font-medium ${textMain}`}>{item.name}</div>
                              <div className={`text-xs ${textMuted}`}>Qty: {item.qty}</div>
                            </div>
                          </div>
                          <div className={`text-sm font-medium ${textMain}`}>₹{item.price * item.qty}</div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                            className={`flex-1 p-1.5 text-sm rounded-md border ${borderCol} bg-transparent ${textMain}`}
                          />
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => handleItemChange(idx, "qty", Number(e.target.value))}
                            className={`w-16 p-1.5 text-sm rounded-md border ${borderCol} bg-transparent ${textMain}`}
                          />
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleItemChange(idx, "price", Number(e.target.value))}
                            className={`w-24 p-1.5 text-sm rounded-md border ${borderCol} bg-transparent ${textMain}`}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-5 rounded-xl border ${borderCol} ${bgCard}`}>
                <div className={`flex items-center gap-2 mb-4 font-medium ${textMain}`}>
                  <CreditCard size={18} className="text-[#CFA18D]" /> Payment
                </div>
                <div className="space-y-4">
                  <div>
                    <div className={`text-xs ${textMuted} mb-1`}>Payment Type</div>
                    {mode === "view" ? (
                       <span
                       className="px-2.5 py-1 text-xs font-medium rounded-full inline-block"
                       style={{ backgroundColor: PAYMENT_CONFIG[order.payment].bg, color: PAYMENT_CONFIG[order.payment].color }}
                     >
                       {PAYMENT_CONFIG[order.payment].label}
                     </span>
                    ) : (
                      <select
                        value={formData.payment}
                        onChange={(e) => handleInputChange("payment", e.target.value as any)}
                        className={`w-full p-2 text-sm rounded-lg border ${borderCol} bg-transparent ${textMain}`}
                      >
                        <option value="cod">COD</option>
                        <option value="prepaid">Prepaid</option>
                        <option value="cash">Cash</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <div className={`text-xs ${textMuted} mb-1`}>Total Amount</div>
                    {mode === "view" ? (
                      <div className={`text-2xl font-bold ${textMain}`}>₹{order.total}</div>
                    ) : (
                      <input
                        type="number"
                        value={formData.total || 0}
                        onChange={(e) => handleInputChange("total", Number(e.target.value))}
                        className={`w-full p-2 text-lg font-bold rounded-lg border ${borderCol} bg-transparent ${textMain}`}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline / Audit Log Snippet */}
            <div className={`p-5 rounded-xl border ${borderCol} ${bgCard}`}>
              <div className={`flex items-center gap-2 mb-4 font-medium ${textMain}`}>
                <Activity size={18} className="text-[#CFA18D]" /> Order Timeline
              </div>
              <div className="space-y-4">
                {auditEntries.length === 0 ? (
                  <p className={`text-sm ${textMuted}`}>No timeline events found.</p>
                ) : (
                  auditEntries.slice(0, 5).map((entry, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-[#CFA18D] mt-1.5" />
                        {i !== auditEntries.length - 1 && i !== 4 && (
                          <div className="w-0.5 h-full bg-[#CFA18D] bg-opacity-30 mt-1" />
                        )}
                      </div>
                      <div className="pb-4">
                        <div className={`text-sm font-medium ${textMain}`}>
                          {entry.action.replace('_', ' ').toUpperCase()} by {entry.user}
                        </div>
                        <div className={`text-xs ${textMuted}`}>
                          {entry.timestamp?.toDate ? entry.timestamp.toDate().toLocaleString() : new Date(entry.timestamp).toLocaleString()}
                        </div>
                        <div className={`text-sm mt-1 ${textMain}`}>{entry.details}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
