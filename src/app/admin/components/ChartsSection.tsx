"use client";
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { AdminOrder } from '../types';

interface ChartsSectionProps {
  orders: AdminOrder[]; // already filtered
  darkMode: boolean;
}

const COLORS = ['#CFA18D', '#3D2B1F', '#8C7B6B', '#E5D5C5', '#A68A78'];
const STATUS_COLORS = {
  NEW: '#D97706',
  CONFIRMED: '#059669',
  SHIPPED: '#2563EB',
  DELIVERED: '#047857'
};

export default function ChartsSection({ orders, darkMode }: ChartsSectionProps) {
  
  const chartData = useMemo(() => {
    // Exclude cancelled just in case, though parent should have filtered
    const validOrders = orders.filter(o => o.status !== 'CANCELLED');

    // 1 & 2. Monthly Data
    const monthlyMap = new Map<string, { month: string, sales: number, margin: number }>();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    validOrders.forEach(order => {
      let date: Date;
      if (order.placed?.toDate) {
        date = order.placed.toDate();
      } else {
        date = new Date(order.placed);
      }
      
      if (isNaN(date.getTime())) return;
      
      const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { month: monthKey, sales: 0, margin: 0 });
      }
      const m = monthlyMap.get(monthKey)!;
      m.sales += (order.total || 0);
      m.margin += (order.margin || 0);
    });
    
    const monthlyData = Array.from(monthlyMap.values());

    // 3. Partner Comparison
    const partnerMap = {
      Kashyap: { name: 'Kashyap', orders: 0, sales: 0, margin: 0 },
      Jay: { name: 'Jay', orders: 0, sales: 0, margin: 0 }
    };
    
    validOrders.forEach(order => {
      if (order.confirmedBy === 'Kashyap' || order.confirmedBy === 'Jay') {
        partnerMap[order.confirmedBy].orders += 1;
        partnerMap[order.confirmedBy].sales += (order.total || 0);
        partnerMap[order.confirmedBy].margin += (order.margin || 0);
      }
    });
    const partnerData = [partnerMap.Kashyap, partnerMap.Jay];

    // 4. Source Distribution
    const sourceMap = new Map<string, number>();
    validOrders.forEach(order => {
      const source = order.source ? order.source.charAt(0).toUpperCase() + order.source.slice(1) : 'Unknown';
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
    });
    const sourceData = Array.from(sourceMap.entries()).map(([name, value]) => ({ name, value }));

    // 5. Status Distribution
    const statusMap = new Map<string, number>();
    validOrders.forEach(order => {
      statusMap.set(order.status, (statusMap.get(order.status) || 0) + 1);
    });
    const statusData = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));

    return {
      monthlyData,
      partnerData,
      sourceData,
      statusData
    };
  }, [orders]);

  const textColor = darkMode ? '#e5e5e5' : '#333333';
  const gridColor = darkMode ? '#404040' : '#e5e5e5';
  const tooltipStyle = {
    backgroundColor: darkMode ? '#262626' : '#ffffff',
    borderColor: darkMode ? '#404040' : '#e5e5e5',
    color: darkMode ? '#ffffff' : '#000000'
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly Sales - Bar Chart */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-100'} shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-neutral-800'}`}>Monthly Sales</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="month" stroke={textColor} tick={{fill: textColor}} tickMargin={10} />
                <YAxis stroke={textColor} tick={{fill: textColor}} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => `₹${val.toLocaleString()}`} />
                <Bar dataKey="sales" name="Sales" fill="#CFA18D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Margin - Line Chart */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-100'} shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-neutral-800'}`}>Monthly Margin</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="month" stroke={textColor} tick={{fill: textColor}} tickMargin={10} />
                <YAxis stroke={textColor} tick={{fill: textColor}} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => `₹${val.toLocaleString()}`} />
                <Line type="monotone" dataKey="margin" name="Margin" stroke="#3D2B1F" strokeWidth={3} dot={{r: 4, fill: '#3D2B1F'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Partner Comparison - Bar Chart */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-100'} shadow-sm lg:col-span-2`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-neutral-800'}`}>Partner Performance Comparison</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.partnerData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" stroke={textColor} tick={{fill: textColor}} />
                <YAxis yAxisId="left" stroke={textColor} tick={{fill: textColor}} tickFormatter={(val) => `₹${val/1000}k`} />
                <YAxis yAxisId="right" orientation="right" stroke={textColor} tick={{fill: textColor}} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar yAxisId="left" dataKey="sales" name="Sales (₹)" fill="#CFA18D" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="margin" name="Margin (₹)" fill="#3D2B1F" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="orders" name="Orders Count" fill="#8C7B6B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Source - Pie Chart */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-100'} shadow-sm flex flex-col items-center`}>
          <h3 className={`text-lg font-semibold mb-4 w-full text-left ${darkMode ? 'text-white' : 'text-neutral-800'}`}>Orders by Source</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.sourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution - Donut Chart */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-100'} shadow-sm flex flex-col items-center`}>
          <h3 className={`text-lg font-semibold mb-4 w-full text-left ${darkMode ? 'text-white' : 'text-neutral-800'}`}>Orders by Status</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {chartData.statusData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
