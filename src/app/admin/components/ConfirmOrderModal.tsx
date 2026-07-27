import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, User, Package, MapPin, CreditCard } from 'lucide-react';
import { AdminOrder, AdminUser } from '../types';

interface ConfirmOrderModalProps {
  order: AdminOrder | null;
  onClose: () => void;
  onConfirm: (order: AdminOrder, confirmedBy: AdminUser) => void;
  darkMode: boolean;
}

export default function ConfirmOrderModal({ order, onClose, onConfirm, darkMode }: ConfirmOrderModalProps) {
  if (!order) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
            darkMode ? 'bg-neutral-900 text-white' : 'bg-[#F8F6F2] text-neutral-900'
          }`}
        >
          {/* Header */}
          <div className={`p-5 sm:p-6 border-b flex items-center justify-between ${darkMode ? 'border-neutral-800' : 'border-[#E8E3DA]'}`}>
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-2 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold font-serif leading-tight">Confirm Order</h2>
                <p className="text-sm opacity-60">ID: {order.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                darkMode ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-[#E8E3DA] text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[60vh]">
            
            {/* Customer */}
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-neutral-800/50 border-neutral-700' : 'bg-white border-[#E8E3DA]'}`}>
              <div className="flex items-center gap-2 mb-3 text-[#CFA18D] font-medium">
                <User className="w-4 h-4" />
                Customer Details
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-lg">{order.customer.name}</p>
                <p className="opacity-80 text-sm flex items-center gap-2">
                  <span>{order.customer.phone}</span>
                  {order.customer.email && (
                    <>
                      <span className="opacity-40">•</span>
                      <span>{order.customer.email}</span>
                    </>
                  )}
                </p>
                {order.customer.address && (
                  <p className="opacity-70 text-sm mt-2 flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      {order.customer.address}, {order.customer.city}, {order.customer.state} {order.customer.pincode}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Items */}
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-neutral-800/50 border-neutral-700' : 'bg-white border-[#E8E3DA]'}`}>
              <div className="flex items-center gap-2 mb-3 text-[#CFA18D] font-medium">
                <Package className="w-4 h-4" />
                Order Items ({order.items.length})
              </div>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className={`flex justify-between items-center pb-3 border-b last:border-0 last:pb-0 ${darkMode ? 'border-neutral-700' : 'border-neutral-100'}`}>
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs opacity-60">Qty: {item.qty} × ₹{item.price.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="font-medium text-sm">
                      ₹{(item.qty * item.price).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-neutral-800/50 border-neutral-700' : 'bg-[#3D2B1F]/5 border-[#3D2B1F]/10'}`}>
              <div className="flex items-center gap-2 font-medium">
                <CreditCard className="w-4 h-4 opacity-70" />
                <span>Total Amount ({order.payment.toUpperCase()})</span>
              </div>
              <div className="font-serif font-bold text-xl text-[#CFA18D]">
                ₹{order.total.toLocaleString('en-IN')}
              </div>
            </div>

          </div>

          {/* Footer - Actions */}
          <div className={`p-5 sm:p-6 border-t bg-black/5 space-y-3 ${darkMode ? 'border-neutral-800' : 'border-[#E8E3DA]'}`}>
            <p className="text-center text-sm font-medium opacity-70 mb-2">Who is confirming this order?</p>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onConfirm(order, 'Jay')}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-md shadow-indigo-500/20 flex flex-col items-center justify-center gap-1"
              >
                <span>Confirm as</span>
                <span className="font-serif text-lg">Jay</span>
              </button>
              
              <button
                onClick={() => onConfirm(order, 'Kashyap')}
                className="w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors shadow-md shadow-purple-500/20 flex flex-col items-center justify-center gap-1"
              >
                <span>Confirm as</span>
                <span className="font-serif text-lg">Kashyap</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className={`w-full py-3 rounded-xl font-medium transition-colors mt-2 ${
                darkMode ? 'bg-neutral-800 hover:bg-neutral-700 text-white' : 'bg-white hover:bg-neutral-50 text-neutral-700 border border-[#E8E3DA]'
              }`}
            >
              Cancel
            </button>
          </div>
          
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
