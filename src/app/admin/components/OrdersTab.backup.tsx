import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, ChevronDown, Eye, Edit3, Trash2, Copy, Filter, 
  ChevronLeft, ChevronRight, CheckCircle2, Clock, DollarSign, ListOrdered
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  AdminOrder, SOURCE_CONFIG, STATUS_CONFIG, PAYMENT_CONFIG, 
  OrderSource, OrderStatus 
} from '../types';

interface OrdersTabProps {
  orders: AdminOrder[];
  loading: boolean;
  darkMode: boolean;
  onViewOrder: (order: AdminOrder) => void;
  onEditOrder: (order: AdminOrder) => void;
  onConfirmOrder: (order: AdminOrder) => void;
  onCancelOrder: (order: AdminOrder) => void;
  onDeleteOrder: (order: AdminOrder) => void;
  onNewOrder: () => void;
  onCustomerClick: (phone: string) => void;
}

const formatDate = (dateVal: any) => {
  if (!dateVal) return '-';
  try {
    let dateObj;
    if (typeof dateVal.toDate === 'function') {
      dateObj = dateVal.toDate();
    } else if (dateVal instanceof Date) {
      dateObj = dateVal;
    } else {
      dateObj = new Date(dateVal);
    }
    return dateObj.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  } catch (err) {
    return String(dateVal);
  }
};

export default function OrdersTab({
  orders,
  loading,
  darkMode,
  onViewOrder,
  onEditOrder,
  onConfirmOrder,
  onCancelOrder,
  onDeleteOrder,
  onNewOrder,
  onCustomerClick
}: OrdersTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<OrderSource | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Filter Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchSearch = 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.phone.includes(searchTerm) ||
        order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchSource = sourceFilter === 'ALL' || order.source === sourceFilter;
      const matchStatus = statusFilter === 'ALL' || order.status === statusFilter;

      return matchSearch && matchSource && matchStatus;
    });
  }, [orders, searchTerm, sourceFilter, statusFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Summary Metrics
  const summary = useMemo(() => {
    const confirmedOrders = orders.filter(o => o.status === 'CONFIRMED' || o.status === 'SHIPPED' || o.status === 'DELIVERED');
    const revenue = confirmedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'NEW');
    
    return {
      revenue,
      confirmed: confirmedOrders.length,
      pending: pendingOrders.length,
      total: orders.length
    };
  }, [orders]);

  const copyCustomerDetails = (order: AdminOrder) => {
    const text = `Name: ${order.customer.name}\nPhone: ${order.customer.phone}\nAddress: ${order.customer.address}, ${order.customer.city}, ${order.customer.state} - ${order.customer.pincode}`;
    navigator.clipboard.writeText(text);
    toast.success('Customer details copied to clipboard!');
  };

  const handleDelete = (order: AdminOrder) => {
    if (window.confirm(`Are you sure you want to delete order ${order.id}?`)) {
      onDeleteOrder(order);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const CardClass = darkMode 
    ? "bg-stone-900 border-stone-800 text-stone-100" 
    : "bg-white border-[#E6E2DB] text-[#3D2B1F]";

  const MetricCardClass = darkMode
    ? "bg-stone-900 border border-stone-800 rounded-2xl p-4 flex items-center shadow-sm"
    : "bg-white border border-[#E6E2DB] rounded-2xl p-4 flex items-center shadow-sm";

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={MetricCardClass}>
          <div className={`p-3 rounded-xl ${darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'} mr-4`}>
            <DollarSign size={24} />
          </div>
          <div>
            <p className={`text-sm font-medium ${darkMode ? 'text-stone-400' : 'text-[#8C7B6B]'}`}>Total Revenue</p>
            <p className="text-xl md:text-2xl font-bold">â‚¹{summary.revenue.toLocaleString('en-IN')}</p>
          </div>
        </div>
        
        <div className={MetricCardClass}>
          <div className={`p-3 rounded-xl ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'} mr-4`}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className={`text-sm font-medium ${darkMode ? 'text-stone-400' : 'text-[#8C7B6B]'}`}>Confirmed Orders</p>
            <p className="text-xl md:text-2xl font-bold">{summary.confirmed}</p>
          </div>
        </div>

        <div className={MetricCardClass}>
          <div className={`p-3 rounded-xl ${darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600'} mr-4`}>
            <Clock size={24} />
          </div>
          <div>
            <p className={`text-sm font-medium ${darkMode ? 'text-stone-400' : 'text-[#8C7B6B]'}`}>Pending Orders</p>
            <p className="text-xl md:text-2xl font-bold">{summary.pending}</p>
          </div>
        </div>

        <div className={MetricCardClass}>
          <div className={`p-3 rounded-xl ${darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-600'} mr-4`}>
            <ListOrdered size={24} />
          </div>
          <div>
            <p className={`text-sm font-medium ${darkMode ? 'text-stone-400' : 'text-[#8C7B6B]'}`}>Total Orders</p>
            <p className="text-xl md:text-2xl font-bold">{summary.total}</p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className={`p-4 md:p-5 rounded-2xl border ${CardClass} flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm`}>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className={darkMode ? 'text-stone-500' : 'text-[#8C7B6B]'} />
            </div>
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none transition-all ${
                darkMode 
                  ? 'bg-stone-800 border-stone-700 text-stone-200 focus:border-[#CFA18D]' 
                  : 'bg-[#F8F6F2] border-transparent text-[#3D2B1F] focus:border-[#CFA18D] focus:bg-white'
              }`}
            />
          </div>

          {/* Source Filter */}
          <div className="relative w-full md:w-40">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className={`w-full pl-10 pr-8 py-2.5 rounded-xl border outline-none appearance-none transition-all ${
                darkMode 
                  ? 'bg-stone-800 border-stone-700 text-stone-200 focus:border-[#CFA18D]' 
                  : 'bg-[#F8F6F2] border-transparent text-[#3D2B1F] focus:border-[#CFA18D] focus:bg-white'
              }`}
            >
              <option value="ALL">All Sources</option>
              {Object.keys(SOURCE_CONFIG).map((key) => (
                <option key={key} value={key}>{SOURCE_CONFIG[key as OrderSource].label}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter size={18} className={darkMode ? 'text-stone-500' : 'text-[#8C7B6B]'} />
            </div>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown size={18} className={darkMode ? 'text-stone-500' : 'text-[#8C7B6B]'} />
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative w-full md:w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={`w-full pl-10 pr-8 py-2.5 rounded-xl border outline-none appearance-none transition-all ${
                darkMode 
                  ? 'bg-stone-800 border-stone-700 text-stone-200 focus:border-[#CFA18D]' 
                  : 'bg-[#F8F6F2] border-transparent text-[#3D2B1F] focus:border-[#CFA18D] focus:bg-white'
              }`}
            >
              <option value="ALL">All Statuses</option>
              {Object.keys(STATUS_CONFIG).map((key) => (
                <option key={key} value={key}>{STATUS_CONFIG[key as OrderStatus].label}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter size={18} className={darkMode ? 'text-stone-500' : 'text-[#8C7B6B]'} />
            </div>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown size={18} className={darkMode ? 'text-stone-500' : 'text-[#8C7B6B]'} />
            </div>
          </div>
        </div>

        <button
          onClick={onNewOrder}
          className="w-full md:w-auto px-5 py-2.5 bg-[#CFA18D] hover:bg-[#B88A76] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          <span>New Order</span>
        </button>
      </div>

      {/* Orders Content */}
      <div className={`rounded-2xl border ${CardClass} shadow-sm overflow-hidden`}>
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#CFA18D] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className={darkMode ? 'text-stone-400' : 'text-[#8C7B6B]'}>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <p className={darkMode ? 'text-stone-400' : 'text-[#8C7B6B]'}>No orders found matching your filters.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b ${darkMode ? 'border-stone-800 bg-stone-900/50' : 'border-[#E6E2DB] bg-[#F8F6F2]'}`}>
                    <th className={`px-4 py-4 text-sm font-semibold ${darkMode ? 'text-stone-300' : 'text-[#3D2B1F]'}`}>Order ID</th>
                    <th className={`px-4 py-4 text-sm font-semibold ${darkMode ? 'text-stone-300' : 'text-[#3D2B1F]'}`}>Date</th>
                    <th className={`px-4 py-4 text-sm font-semibold ${darkMode ? 'text-stone-300' : 'text-[#3D2B1F]'}`}>Customer</th>
                    <th className={`px-4 py-4 text-sm font-semibold ${darkMode ? 'text-stone-300' : 'text-[#3D2B1F]'}`}>Source</th>
                    <th className={`px-4 py-4 text-sm font-semibold ${darkMode ? 'text-stone-300' : 'text-[#3D2B1F]'}`}>Amount</th>
                    <th className={`px-4 py-4 text-sm font-semibold ${darkMode ? 'text-stone-300' : 'text-[#3D2B1F]'}`}>Margin</th>
                    <th className={`px-4 py-4 text-sm font-semibold ${darkMode ? 'text-stone-300' : 'text-[#3D2B1F]'}`}>By</th>
                    <th className={`px-4 py-4 text-sm font-semibold ${darkMode ? 'text-stone-300' : 'text-[#3D2B1F]'}`}>Payment</th>
                    <th className={`px-4 py-4 text-sm font-semibold ${darkMode ? 'text-stone-300' : 'text-[#3D2B1F]'}`}>Status</th>
                    <th className={`px-4 py-4 text-sm font-semibold ${darkMode ? 'text-stone-300' : 'text-[#3D2B1F]'} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  <AnimatePresence>
                    {paginatedOrders.map((order) => (
                      <motion.tr 
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`hover:${darkMode ? 'bg-stone-800/50' : 'bg-stone-50'} transition-colors group`}
                      >
                        <td className="px-4 py-4 align-middle">
                          <span className={`text-sm font-medium ${darkMode ? 'text-stone-200' : 'text-[#3D2B1F]'}`}>
                            #{order.id.slice(-6).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <span className={`text-sm ${darkMode ? 'text-stone-400' : 'text-[#8C7B6B]'}`}>
                            {formatDate(order.placed)}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-middle max-w-[200px]">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className={`text-sm font-medium truncate ${darkMode ? 'text-stone-200' : 'text-[#3D2B1F]'}`}>
                                {order.customer.name}
                              </p>
                              <button 
                                onClick={() => onCustomerClick(order.customer.phone)}
                                className={`text-xs hover:underline ${darkMode ? 'text-stone-400 hover:text-stone-200' : 'text-[#8C7B6B] hover:text-[#3D2B1F]'}`}
                              >
                                {order.customer.phone}
                              </button>
                            </div>
                            <button 
                              onClick={() => copyCustomerDetails(order)}
                              className={`ml-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'hover:bg-stone-700 text-stone-400' : 'hover:bg-stone-200 text-[#8C7B6B]'}`}
                              title="Copy Customer Details"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <span 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: SOURCE_CONFIG[order.source]?.bg || '#eee', 
                              color: SOURCE_CONFIG[order.source]?.color || '#333'
                            }}
                          >
                            <span>{SOURCE_CONFIG[order.source]?.icon}</span>
                            {SOURCE_CONFIG[order.source]?.label || order.source}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <span className={`text-sm font-medium ${darkMode ? 'text-stone-200' : 'text-[#3D2B1F]'}`}>
                            â‚¹{order.total?.toLocaleString('en-IN') || 0}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <span className={`text-sm font-medium ${(order.margin || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            â‚¹{order.margin?.toLocaleString('en-IN') || 0}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <span className={`text-sm ${darkMode ? 'text-stone-400' : 'text-[#8C7B6B]'}`}>
                            {order.confirmedBy || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <span 
                            className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: PAYMENT_CONFIG[order.payment]?.bg || '#eee', 
                              color: PAYMENT_CONFIG[order.payment]?.color || '#333'
                            }}
                          >
                            {PAYMENT_CONFIG[order.payment]?.label || order.payment}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <span 
                            className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium border"
                            style={{ 
                              backgroundColor: STATUS_CONFIG[order.status]?.bg || '#eee', 
                              color: STATUS_CONFIG[order.status]?.color || '#333',
                              borderColor: STATUS_CONFIG[order.status]?.color || '#333'
                            }}
                          >
                            {STATUS_CONFIG[order.status]?.label || order.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-middle text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => onViewOrder(order)}
                              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-stone-700 text-stone-400 hover:text-stone-200' : 'hover:bg-[#F8F6F2] text-[#8C7B6B] hover:text-[#3D2B1F]'}`}
                              title="View Order"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => onEditOrder(order)}
                              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-stone-700 text-stone-400 hover:text-blue-400' : 'hover:bg-[#F8F6F2] text-[#8C7B6B] hover:text-blue-600'}`}
                              title="Edit Order"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(order)}
                              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-stone-700 text-stone-400 hover:text-red-400' : 'hover:bg-[#F8F6F2] text-[#8C7B6B] hover:text-red-600'}`}
                              title="Delete Order"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden divide-y divide-stone-100 dark:divide-stone-800">
              {paginatedOrders.map((order) => (
                <div key={order.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-semibold ${darkMode ? 'text-stone-200' : 'text-[#3D2B1F]'}`}>
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <span 
                          className="px-2 py-0.5 rounded text-[10px] font-medium border"
                          style={{ 
                            backgroundColor: STATUS_CONFIG[order.status]?.bg || '#eee', 
                            color: STATUS_CONFIG[order.status]?.color || '#333',
                            borderColor: STATUS_CONFIG[order.status]?.color || '#333'
                          }}
                        >
                          {STATUS_CONFIG[order.status]?.label || order.status}
                        </span>
                      </div>
                      <p className={`text-xs ${darkMode ? 'text-stone-400' : 'text-[#8C7B6B]'}`}>
                        {formatDate(order.placed)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${darkMode ? 'text-stone-200' : 'text-[#3D2B1F]'}`}>
                        â‚¹{order.total?.toLocaleString('en-IN') || 0}
                      </p>
                      <span 
                        className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium mt-1"
                        style={{ 
                          backgroundColor: PAYMENT_CONFIG[order.payment]?.bg || '#eee', 
                          color: PAYMENT_CONFIG[order.payment]?.color || '#333'
                        }}
                      >
                        {PAYMENT_CONFIG[order.payment]?.label || order.payment}
                      </span>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl flex justify-between items-center ${darkMode ? 'bg-stone-800/50' : 'bg-[#F8F6F2]'}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: SOURCE_CONFIG[order.source]?.bg || '#eee' }}
                      >
                        <span className="text-sm">{SOURCE_CONFIG[order.source]?.icon}</span>
                      </div>
                      <div className="truncate">
                        <p className={`text-sm font-medium truncate ${darkMode ? 'text-stone-200' : 'text-[#3D2B1F]'}`}>
                          {order.customer.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className={`text-xs ${darkMode ? 'text-stone-400' : 'text-[#8C7B6B]'}`}>
                            {order.customer.phone}
                          </p>
                          <button 
                            onClick={() => copyCustomerDetails(order)}
                            className={darkMode ? 'text-stone-500' : 'text-[#8C7B6B]'}
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => onViewOrder(order)}
                        className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-stone-800 text-stone-300' : 'bg-white text-[#8C7B6B]'}`}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onEditOrder(order)}
                        className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-stone-800 text-stone-300' : 'bg-white text-[#8C7B6B]'}`}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(order)}
                        className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-stone-800 text-red-400' : 'bg-white text-red-500'}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className={`px-4 py-4 md:px-6 md:py-4 border-t flex items-center justify-between ${darkMode ? 'border-stone-800' : 'border-[#E6E2DB]'}`}>
                <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-[#8C7B6B]'}`}>
                  Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)}</span> of <span className="font-medium">{filteredOrders.length}</span> results
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'border-stone-700 hover:bg-stone-800 disabled:opacity-50 text-stone-300' 
                        : 'border-[#E6E2DB] hover:bg-[#F8F6F2] disabled:opacity-50 text-[#3D2B1F]'
                    }`}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className={`text-sm font-medium px-2 ${darkMode ? 'text-stone-300' : 'text-[#3D2B1F]'}`}>
                    Page {currentPage} of {totalPages}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'border-stone-700 hover:bg-stone-800 disabled:opacity-50 text-stone-300' 
                        : 'border-[#E6E2DB] hover:bg-[#F8F6F2] disabled:opacity-50 text-[#3D2B1F]'
                    }`}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

