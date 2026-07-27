"use client";
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AdminOrder, ReportFilters, DashboardMetrics } from '../types';
import ChartsSection from './ChartsSection';
import ExportButton from './ExportButton';
import { 
  Calendar, User, Globe, Activity, TrendingUp, IndianRupee, 
  Package, Truck, CheckCircle, Search, Filter 
} from 'lucide-react';
import { isToday, isThisWeek, isThisMonth, isThisYear, isWithinInterval } from 'date-fns';

interface ReportsTabProps {
  orders: AdminOrder[];
  darkMode: boolean;
}

export default function ReportsTab({ orders, darkMode }: ReportsTabProps) {
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: 'month',
    partner: 'all',
    source: 'all',
    status: 'all'
  });
  
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Filter orders based on filter state
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Date filter
      let dateMatch = true;
      let orderDate: Date;
      if (order.placed?.toDate) {
        orderDate = order.placed.toDate();
      } else {
        orderDate = new Date(order.placed);
      }

      if (filters.dateRange !== 'all' && !isNaN(orderDate.getTime())) {
        switch (filters.dateRange) {
          case 'today': dateMatch = isToday(orderDate); break;
          case 'week': dateMatch = isThisWeek(orderDate); break;
          case 'month': dateMatch = isThisMonth(orderDate); break;
          case 'year': dateMatch = isThisYear(orderDate); break;
          case 'custom':
            if (filters.customStart && filters.customEnd) {
              dateMatch = isWithinInterval(orderDate, { start: filters.customStart, end: filters.customEnd });
            }
            break;
        }
      }
      if (!dateMatch) return false;

      // 2. Partner filter
      if (filters.partner !== 'all' && order.confirmedBy !== filters.partner) return false;

      // 3. Source filter
      if (filters.source !== 'all' && order.source !== filters.source) return false;

      // 4. Status filter
      if (filters.status !== 'all' && order.status !== filters.status) return false;

      return true;
    });
  }, [orders, filters]);

  // Calculations (Excluding CANCELLED orders)
  const validOrdersForCalc = useMemo(() => {
    return filteredOrders.filter(o => o.status !== 'CANCELLED');
  }, [filteredOrders]);

  const metrics: DashboardMetrics = useMemo(() => {
    return validOrdersForCalc.reduce((acc, order) => {
      acc.totalOrders += 1;
      acc.totalSales += order.total || 0;
      acc.totalProductCost += order.productCost || 0;
      acc.totalCourierCost += order.courierCost || 0;
      acc.totalOtherExpenses += order.otherExpense || 0;
      acc.totalMargin += order.margin || 0;
      return acc;
    }, {
      totalOrders: 0,
      totalSales: 0,
      totalProductCost: 0,
      totalCourierCost: 0,
      totalOtherExpenses: 0,
      totalMargin: 0
    });
  }, [validOrdersForCalc]);

  // Partner specific calculations
  const partnerMetrics = useMemo(() => {
    const kashyap = { orders: 0, sales: 0, margin: 0 };
    const jay = { orders: 0, sales: 0, margin: 0 };
    const combined = { orders: 0, sales: 0, margin: 0 };

    validOrdersForCalc.forEach(order => {
      combined.orders += 1;
      combined.sales += order.total || 0;
      combined.margin += order.margin || 0;

      if (order.confirmedBy === 'Kashyap') {
        kashyap.orders += 1;
        kashyap.sales += order.total || 0;
        kashyap.margin += order.margin || 0;
      } else if (order.confirmedBy === 'Jay') {
        jay.orders += 1;
        jay.sales += order.total || 0;
        jay.margin += order.margin || 0;
      }
    });

    return { Kashyap: kashyap, Jay: jay, Combined: combined };
  }, [validOrdersForCalc]);

  // Monthly Table Data
  const monthlyTableData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const data = months.map(m => ({ month: m, orders: 0, sales: 0, margin: 0 }));

    validOrdersForCalc.forEach(order => {
      let date: Date;
      if (order.placed?.toDate) date = order.placed.toDate();
      else date = new Date(order.placed);

      if (!isNaN(date.getTime()) && date.getFullYear() === selectedYear) {
        const mIndex = date.getMonth();
        data[mIndex].orders += 1;
        data[mIndex].sales += order.total || 0;
        data[mIndex].margin += order.margin || 0;
      }
    });

    return data;
  }, [validOrdersForCalc, selectedYear]);

  // Get available years from all orders
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    orders.forEach(o => {
      let d: Date;
      if (o.placed?.toDate) d = o.placed.toDate();
      else d = new Date(o.placed);
      if (!isNaN(d.getTime())) years.add(d.getFullYear());
    });
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort().reverse();
  }, [orders]);

  const MetricCard = ({ title, value, prefix = "", suffix = "", icon: Icon }: any) => (
    <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-100'} shadow-sm flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>{title}</span>
        <div className={`p-2 rounded-lg ${darkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-50 text-neutral-600'}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </div>
    </div>
  );

  const PartnerCard = ({ name, data }: { name: string, data: any }) => (
    <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-100'} shadow-sm`}>
      <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-neutral-900'}`}>{name}</h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className={`text-sm ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Orders</span>
          <span className={`font-semibold ${darkMode ? 'text-white' : 'text-neutral-900'}`}>{data.orders}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className={`text-sm ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Sales</span>
          <span className={`font-semibold ${darkMode ? 'text-white' : 'text-neutral-900'}`}>₹{data.sales.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-dashed border-neutral-200 dark:border-neutral-700">
          <span className={`text-sm font-medium ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>Margin</span>
          <span className="font-bold text-[#CFA18D]">₹{data.margin.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-neutral-900'}`}>Reports & Analytics</h2>
          <p className={`text-sm ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Track your business performance</p>
        </div>
        <ExportButton orders={filteredOrders} darkMode={darkMode} />
      </div>

      {/* Filters Bar */}
      <div className={`p-4 rounded-xl border flex flex-wrap gap-4 items-center ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-100'}`}>
        <div className="flex items-center gap-2 text-sm text-neutral-500 font-medium">
          <Filter size={16} /> Filters:
        </div>
        
        <select 
          value={filters.dateRange} 
          onChange={(e) => setFilters({...filters, dateRange: e.target.value as any})}
          className={`text-sm rounded-lg px-3 py-2 border outline-none ${darkMode ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'}`}
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
          <option value="all">All Time</option>
        </select>

        <select 
          value={filters.partner} 
          onChange={(e) => setFilters({...filters, partner: e.target.value as any})}
          className={`text-sm rounded-lg px-3 py-2 border outline-none ${darkMode ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'}`}
        >
          <option value="all">All Partners</option>
          <option value="Kashyap">Kashyap</option>
          <option value="Jay">Jay</option>
        </select>

        <select 
          value={filters.source} 
          onChange={(e) => setFilters({...filters, source: e.target.value as any})}
          className={`text-sm rounded-lg px-3 py-2 border outline-none ${darkMode ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'}`}
        >
          <option value="all">All Sources</option>
          <option value="website">Website</option>
          <option value="instagram">Instagram</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="call">Call</option>
          <option value="walkin">Walk-in</option>
        </select>

        <select 
          value={filters.status} 
          onChange={(e) => setFilters({...filters, status: e.target.value as any})}
          className={`text-sm rounded-lg px-3 py-2 border outline-none ${darkMode ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'}`}
        >
          <option value="all">All Statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Dashboard Metrics (6 cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard title="Total Orders" value={metrics.totalOrders} icon={Package} />
        <MetricCard title="Total Sales" value={metrics.totalSales} prefix="₹" icon={IndianRupee} />
        <MetricCard title="Total Margin" value={metrics.totalMargin} prefix="₹" icon={TrendingUp} />
        <MetricCard title="Product Cost" value={metrics.totalProductCost} prefix="₹" icon={Activity} />
        <MetricCard title="Courier Cost" value={metrics.totalCourierCost} prefix="₹" icon={Truck} />
        <MetricCard title="Other Exp." value={metrics.totalOtherExpenses} prefix="₹" icon={Globe} />
      </div>

      {/* Partner Reports (3 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PartnerCard name="Kashyap" data={partnerMetrics.Kashyap} />
        <PartnerCard name="Jay" data={partnerMetrics.Jay} />
        <PartnerCard name="Combined (All)" data={partnerMetrics.Combined} />
      </div>

      {/* Charts Section */}
      <ChartsSection orders={filteredOrders} darkMode={darkMode} />

      {/* Monthly Report Table */}
      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-100'} shadow-sm`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-neutral-900'}`}>Monthly Report</h3>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className={`text-sm rounded-lg px-3 py-2 border outline-none ${darkMode ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'}`}
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`text-xs uppercase ${darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-50 text-neutral-500'}`}>
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Month</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Sales</th>
                <th className="px-4 py-3 rounded-r-lg">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {monthlyTableData.map((row, idx) => (
                <tr key={idx} className={`${darkMode ? 'hover:bg-neutral-800/50' : 'hover:bg-neutral-50'}`}>
                  <td className={`px-4 py-3 font-medium ${darkMode ? 'text-neutral-300' : 'text-neutral-900'}`}>{row.month}</td>
                  <td className={`px-4 py-3 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>{row.orders}</td>
                  <td className={`px-4 py-3 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>₹{row.sales.toLocaleString()}</td>
                  <td className={`px-4 py-3 font-medium text-[#CFA18D]`}>₹{row.margin.toLocaleString()}</td>
                </tr>
              ))}
              {/* Total Row */}
              <tr className={`font-bold ${darkMode ? 'bg-neutral-800 text-white' : 'bg-neutral-50 text-neutral-900'}`}>
                <td className="px-4 py-3 rounded-l-lg">Total</td>
                <td className="px-4 py-3">{monthlyTableData.reduce((acc, curr) => acc + curr.orders, 0)}</td>
                <td className="px-4 py-3">₹{monthlyTableData.reduce((acc, curr) => acc + curr.sales, 0).toLocaleString()}</td>
                <td className="px-4 py-3 rounded-r-lg text-[#CFA18D]">₹{monthlyTableData.reduce((acc, curr) => acc + curr.margin, 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
