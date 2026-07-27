import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, MapPin, Phone, Mail, ShoppingBag, CreditCard, Calendar } from "lucide-react";
import { AdminOrder, STATUS_CONFIG } from "../types";

interface CustomerProfileModalProps {
  phone: string | null;
  orders: AdminOrder[];
  onClose: () => void;
  darkMode: boolean;
}

export default function CustomerProfileModal({
  phone,
  orders,
  onClose,
  darkMode,
}: CustomerProfileModalProps) {
  
  const customerData = useMemo(() => {
    if (!phone) return null;
    
    const customerOrders = orders.filter(o => o.customer.phone === phone);
    if (customerOrders.length === 0) return null;
    
    // Sort by most recent
    customerOrders.sort((a, b) => {
      const dateA = a.placed?.toDate ? a.placed.toDate().getTime() : new Date(a.placed).getTime();
      const dateB = b.placed?.toDate ? b.placed.toDate().getTime() : new Date(b.placed).getTime();
      return dateB - dateA;
    });
    
    const latestOrder = customerOrders[0];
    
    let totalAmount = 0;
    let codCount = 0;
    let prepaidCount = 0;
    
    customerOrders.forEach(o => {
      if (o.status !== 'CANCELLED') {
        totalAmount += o.total;
        if (o.payment === 'cod') codCount++;
        else prepaidCount++;
      }
    });

    const lastOrderDate = latestOrder.placed?.toDate 
      ? latestOrder.placed.toDate() 
      : new Date(latestOrder.placed);
      
    return {
      profile: latestOrder.customer,
      totalOrders: customerOrders.length,
      totalAmount,
      codCount,
      prepaidCount,
      lastOrderDate,
      history: customerOrders
    };
  }, [phone, orders]);

  if (!phone || !customerData) return null;

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
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl shadow-xl flex flex-col ${bgBase}`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${borderCol}`}>
            <h2 className={`text-xl font-semibold flex items-center gap-2 ${textMain}`}>
              <User className="text-[#CFA18D]" /> Customer Profile
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${textMuted}`}
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top Details & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-5 rounded-xl border ${borderCol} ${bgCard}`}>
                <h3 className={`font-medium mb-4 ${textMain}`}>Contact Info</h3>
                <div className="space-y-3">
                  <div className={`flex items-center gap-2 text-sm ${textMain}`}>
                    <User size={16} className={textMuted} /> {customerData.profile.name}
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${textMain}`}>
                    <Phone size={16} className={textMuted} /> {customerData.profile.phone}
                  </div>
                  {customerData.profile.email && (
                    <div className={`flex items-center gap-2 text-sm ${textMain}`}>
                      <Mail size={16} className={textMuted} /> {customerData.profile.email}
                    </div>
                  )}
                  <div className={`flex items-start gap-2 text-sm ${textMain}`}>
                    <MapPin size={16} className={`mt-0.5 ${textMuted}`} /> 
                    <span>{customerData.profile.address}, {customerData.profile.city}, {customerData.profile.state} {customerData.profile.pincode}</span>
                  </div>
                </div>
              </div>

              <div className={`p-5 rounded-xl border ${borderCol} ${bgCard}`}>
                <h3 className={`font-medium mb-4 ${textMain}`}>Customer Value</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className={`text-xs ${textMuted} flex items-center gap-1 mb-1`}><ShoppingBag size={12}/> Total Orders</div>
                    <div className={`text-xl font-semibold ${textMain}`}>{customerData.totalOrders}</div>
                  </div>
                  <div>
                    <div className={`text-xs ${textMuted} flex items-center gap-1 mb-1`}><CreditCard size={12}/> Total Spent</div>
                    <div className={`text-xl font-semibold text-[#059669]`}>₹{customerData.totalAmount}</div>
                  </div>
                  <div>
                    <div className={`text-xs ${textMuted} flex items-center gap-1 mb-1`}>COD / Prepaid</div>
                    <div className={`text-sm font-medium ${textMain}`}>{customerData.codCount} / {customerData.prepaidCount}</div>
                  </div>
                  <div>
                    <div className={`text-xs ${textMuted} flex items-center gap-1 mb-1`}><Calendar size={12}/> Last Order</div>
                    <div className={`text-sm font-medium ${textMain}`}>{customerData.lastOrderDate.toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order History */}
            <div>
              <h3 className={`font-medium mb-4 px-1 ${textMain}`}>Order History</h3>
              <div className={`overflow-x-auto border rounded-xl ${borderCol}`}>
                <table className="w-full text-sm text-left">
                  <thead className={`text-xs uppercase bg-gray-50 dark:bg-[#2A2A2A] ${textMuted}`}>
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Order ID</th>
                      <th className="px-4 py-3">Items</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${borderCol}`}>
                    {customerData.history.map((order) => {
                      const date = order.placed?.toDate ? order.placed.toDate() : new Date(order.placed);
                      return (
                        <tr key={order.id} className={`hover:bg-gray-50 dark:hover:bg-[#2A2A2A] ${textMain}`}>
                          <td className="px-4 py-3 whitespace-nowrap">{date.toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-medium">#{order.id}</td>
                          <td className="px-4 py-3">
                            {order.items.length} items ({order.items.reduce((acc, item) => acc + item.qty, 0)} qty)
                          </td>
                          <td className="px-4 py-3 font-medium">₹{order.total}</td>
                          <td className="px-4 py-3">
                            <span
                              className="px-2 py-1 text-xs font-medium rounded-full"
                              style={{ backgroundColor: STATUS_CONFIG[order.status].bg, color: STATUS_CONFIG[order.status].color }}
                            >
                              {STATUS_CONFIG[order.status].label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
