import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Plus, Trash2, Instagram, Phone, MapPin, Search, 
  MessageCircle, Smartphone, User, Save, Globe, CalendarIcon 
} from 'lucide-react';
import { OrderSource, OrderCustomer, OrderItem, PaymentType, AdminUser, CustomerProfile } from '../types';
import { toast } from 'sonner';

interface NewOrderModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    source: OrderSource;
    customer: OrderCustomer;
    items: OrderItem[];
    total: number;
    payment: PaymentType;
    confirmedBy: AdminUser | null;
    notes: string;
    orderDate?: Date;
  }) => Promise<void>;
  darkMode: boolean;
  customerLookup: {
    lookupResult: CustomerProfile | null;
    lookupLoading: boolean;
    lookupByPhone: (phone: string) => Promise<CustomerProfile | null>;
    clearLookup: () => void;
  };
}

export default function NewOrderModal({ open, onClose, onSave, darkMode, customerLookup }: NewOrderModalProps) {
  const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [source, setSource] = useState<OrderSource>('whatsapp');
  const [payment, setPayment] = useState<PaymentType>('prepaid');
  const [confirmedBy, setConfirmedBy] = useState<AdminUser | null>('Kashyap');
  const [notes, setNotes] = useState('');
  
  const [customer, setCustomer] = useState<OrderCustomer>({
    name: '', phone: '', email: '', address: '', city: '', state: '', pincode: ''
  });
  
  const [items, setItems] = useState<OrderItem[]>([
    { name: '', qty: 1, price: 0 }
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // Reset form on open
      setOrderDate(new Date().toISOString().split('T')[0]);
      setSource('whatsapp');
      setPayment('prepaid');
      setConfirmedBy('Kashyap');
      setNotes('');
      setCustomer({ name: '', phone: '', email: '', address: '', city: '', state: '', pincode: '' });
      setItems([{ name: '', qty: 1, price: 0 }]);
      customerLookup.clearLookup();
    }
  }, [open]);

  useEffect(() => {
    if (customer.phone.length >= 10) {
      customerLookup.lookupByPhone(customer.phone);
    } else if (customer.phone.length < 10 && customerLookup.lookupResult) {
      customerLookup.clearLookup();
    }
  }, [customer.phone]);

  useEffect(() => {
    if (customerLookup.lookupResult) {
      setCustomer(prev => ({
        ...prev,
        name: customerLookup.lookupResult?.name || prev.name,
        email: customerLookup.lookupResult?.email || prev.email,
        address: customerLookup.lookupResult?.address || prev.address,
        city: customerLookup.lookupResult?.city || prev.city,
        state: customerLookup.lookupResult?.state || prev.state,
        pincode: customerLookup.lookupResult?.pincode || prev.pincode,
      }));
    }
  }, [customerLookup.lookupResult]);

  const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { name: '', qty: 1, price: 0 }]);
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const total = items.reduce((acc, item) => acc + (Number(item.qty) * Number(item.price)), 0);

  const handleSubmit = async () => {
    if (!customer.name.trim()) return toast.error('Customer name is required');
    if (!customer.phone.trim()) return toast.error('Customer phone is required');
    if (items.some(item => !item.name.trim())) return toast.error('All items must have a name');
    
    setIsSubmitting(true);
    try {
      await onSave({
        source,
        customer,
        items,
        total,
        payment,
        confirmedBy,
        notes,
        orderDate: new Date(orderDate)
      });
      onClose();
      toast.success('Order created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

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
          className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl shadow-2xl ${
            darkMode ? 'bg-neutral-900 text-white' : 'bg-[#F8F6F2] text-neutral-900'
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-4 sm:p-6 border-b ${darkMode ? 'border-neutral-800' : 'border-[#E8E3DA]'}`}>
            <h2 className="text-xl font-semibold font-serif">Create New Order</h2>
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
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">
            
            {/* Order Basics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1.5 opacity-80">Order Date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-[#CFA18D]/50 focus:border-[#CFA18D] transition-all outline-none ${
                      darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-[#E8E3DA]'
                    }`}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5 opacity-80">Source</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'instagram', icon: Instagram, label: 'IG' },
                    { id: 'whatsapp', icon: MessageCircle, label: 'WA' },
                    { id: 'call', icon: Phone, label: 'Call' },
                    { id: 'walkin', icon: MapPin, label: 'Walk-in' },
                    { id: 'website', icon: Globe, label: 'Web' }
                  ].map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSource(id as OrderSource)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                        source === id 
                          ? 'border-[#CFA18D] bg-[#CFA18D] text-white shadow-md' 
                          : darkMode ? 'border-neutral-700 hover:border-neutral-600 bg-neutral-800' : 'border-[#E8E3DA] hover:border-[#CFA18D]/50 bg-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium font-serif flex items-center gap-2">
                <User className="w-5 h-5 text-[#CFA18D]" />
                Customer Details
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 opacity-80">Phone Number *</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                    <input
                      type="tel"
                      value={customer.phone}
                      onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                      placeholder="10-digit mobile"
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl border focus:ring-2 focus:ring-[#CFA18D]/50 focus:border-[#CFA18D] transition-all outline-none ${
                        darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-[#E8E3DA]'
                      }`}
                    />
                    {customerLookup.lookupLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#CFA18D] border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 opacity-80">Full Name *</label>
                  <input
                    type="text"
                    value={customer.name}
                    onChange={(e) => setCustomer({...customer, name: e.target.value})}
                    placeholder="Customer Name"
                    className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-[#CFA18D]/50 focus:border-[#CFA18D] transition-all outline-none ${
                      darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-[#E8E3DA]'
                    }`}
                  />
                </div>
              </div>

              {customerLookup.lookupResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3"
                >
                  <div className="bg-emerald-500/20 p-1.5 rounded-full">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">🔄 Repeat Customer</p>
                    <p className="text-xs opacity-80">{customerLookup.lookupResult.totalOrders} previous orders • Total: ₹{customerLookup.lookupResult.totalAmount.toLocaleString('en-IN')}</p>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1.5 opacity-80">Address</label>
                  <input
                    type="text"
                    value={customer.address}
                    onChange={(e) => setCustomer({...customer, address: e.target.value})}
                    placeholder="Full street address"
                    className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-[#CFA18D]/50 focus:border-[#CFA18D] transition-all outline-none ${
                      darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-[#E8E3DA]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 opacity-80">City</label>
                  <input
                    type="text"
                    value={customer.city}
                    onChange={(e) => setCustomer({...customer, city: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-[#CFA18D]/50 focus:border-[#CFA18D] transition-all outline-none ${
                      darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-[#E8E3DA]'
                    }`}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1.5 opacity-80">State</label>
                    <input
                      type="text"
                      value={customer.state}
                      onChange={(e) => setCustomer({...customer, state: e.target.value})}
                      className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-[#CFA18D]/50 focus:border-[#CFA18D] transition-all outline-none ${
                        darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-[#E8E3DA]'
                      }`}
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-sm font-medium mb-1.5 opacity-80">Pincode</label>
                    <input
                      type="text"
                      value={customer.pincode}
                      onChange={(e) => setCustomer({...customer, pincode: e.target.value})}
                      className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-[#CFA18D]/50 focus:border-[#CFA18D] transition-all outline-none ${
                        darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-[#E8E3DA]'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium font-serif flex items-center gap-2">
                  <Search className="w-5 h-5 text-[#CFA18D]" />
                  Products
                </h3>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className={`flex flex-col sm:flex-row gap-3 p-3 rounded-xl border ${darkMode ? 'bg-neutral-800/50 border-neutral-700' : 'bg-white border-[#E8E3DA]'}`}>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        placeholder="Product Name"
                        className={`w-full px-3 py-2 rounded-lg bg-transparent border-0 ring-1 focus:ring-2 focus:ring-[#CFA18D]/50 outline-none transition-all ${
                          darkMode ? 'ring-neutral-700' : 'ring-[#E8E3DA]'
                        }`}
                      />
                    </div>
                    <div className="flex gap-3">
                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleItemChange(index, 'qty', parseInt(e.target.value) || 0)}
                          placeholder="Qty"
                          className={`w-full px-3 py-2 rounded-lg bg-transparent border-0 ring-1 focus:ring-2 focus:ring-[#CFA18D]/50 outline-none transition-all ${
                            darkMode ? 'ring-neutral-700' : 'ring-[#E8E3DA]'
                          }`}
                        />
                      </div>
                      <div className="w-32 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', parseInt(e.target.value) || 0)}
                          placeholder="Price"
                          className={`w-full pl-7 pr-3 py-2 rounded-lg bg-transparent border-0 ring-1 focus:ring-2 focus:ring-[#CFA18D]/50 outline-none transition-all ${
                            darkMode ? 'ring-neutral-700' : 'ring-[#E8E3DA]'
                          }`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        className={`p-2 rounded-lg transition-colors ${
                          items.length === 1 
                            ? 'opacity-30 cursor-not-allowed' 
                            : 'text-red-500 hover:bg-red-500/10'
                        }`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addItem}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border border-dashed ${
                  darkMode ? 'border-neutral-700 hover:border-[#CFA18D] text-neutral-300 hover:text-[#CFA18D]' : 'border-[#CFA18D]/40 hover:border-[#CFA18D] text-[#8C7B6B] hover:text-[#CFA18D]'
                }`}
              >
                <Plus className="w-4 h-4" />
                Add Another Item
              </button>
            </div>

            {/* Payment & Misc */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-opacity-50">
              <div>
                <label className="block text-sm font-medium mb-1.5 opacity-80">Payment Method</label>
                <div className="flex gap-2">
                  {(['prepaid', 'cod', 'cash'] as PaymentType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPayment(type)}
                      className={`flex-1 py-2 rounded-xl border text-sm font-medium uppercase tracking-wider transition-all ${
                        payment === type 
                          ? 'border-[#CFA18D] bg-[#CFA18D] text-white shadow-md' 
                          : darkMode ? 'border-neutral-700 hover:border-neutral-600 bg-neutral-800' : 'border-[#E8E3DA] hover:border-[#CFA18D]/50 bg-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 opacity-80">Order Placed By</label>
                <div className="flex gap-2">
                  {(['Jay', 'Kashyap'] as AdminUser[]).map((user) => (
                    <button
                      key={user}
                      type="button"
                      onClick={() => setConfirmedBy(user)}
                      className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                        confirmedBy === user 
                          ? user === 'Jay' ? 'border-indigo-500 bg-indigo-500 text-white shadow-md' : 'border-purple-500 bg-purple-500 text-white shadow-md'
                          : darkMode ? 'border-neutral-700 hover:border-neutral-600 bg-neutral-800' : 'border-[#E8E3DA] bg-white'
                      }`}
                    >
                      {user}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1.5 opacity-80">Order Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Any special instructions or notes..."
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#CFA18D]/50 focus:border-[#CFA18D] transition-all outline-none resize-none ${
                    darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-[#E8E3DA]'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`p-4 sm:p-6 border-t flex items-center justify-between bg-black/5 ${darkMode ? 'border-neutral-800' : 'border-[#E8E3DA]'}`}>
            <div className="text-lg">
              <span className="opacity-60 text-sm">Total Amount:</span>
              <div className="font-serif font-bold text-2xl text-[#CFA18D]">
                ₹{total.toLocaleString('en-IN')}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  darkMode ? 'hover:bg-neutral-800' : 'hover:bg-[#E8E3DA]'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#3D2B1F] hover:bg-[#2A1D15] text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-black/10"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Order
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
