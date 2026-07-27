"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { AdminOrder } from '../types';
import { toast } from 'sonner';

interface ExportButtonProps {
  orders: AdminOrder[];
  darkMode: boolean;
}

export default function ExportButton({ orders, darkMode }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const prepareData = () => {
    return orders.map(order => {
      const date = order.placed?.toDate ? order.placed.toDate() : new Date(order.placed);
      return {
        "Order ID": order.id,
        "Date": date instanceof Date && !isNaN(date.getTime()) ? date.toLocaleDateString() : '',
        "Customer": order.customer?.name || '',
        "Phone": order.customer?.phone || '',
        "Source": order.source?.toUpperCase() || '',
        "Amount": order.total || 0,
        "Margin": order.margin || 0,
        "Order By": order.confirmedBy || '',
        "Payment": order.payment?.toUpperCase() || '',
        "Status": order.status || ''
      };
    });
  };

  const handleExportExcel = async () => {
    setIsOpen(false);
    try {
      const xlsx = await import('xlsx');
      const data = prepareData();
      const worksheet = xlsx.utils.json_to_sheet(data);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Orders");
      xlsx.writeFile(workbook, "ShriVallabh_Orders.xlsx");
      toast.success("Excel exported successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export Excel. Make sure xlsx is installed.");
    }
  };

  const handleExportCSV = async () => {
    setIsOpen(false);
    try {
      const xlsx = await import('xlsx');
      const data = prepareData();
      const worksheet = xlsx.utils.json_to_sheet(data);
      const csv = xlsx.utils.sheet_to_csv(worksheet);
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'ShriVallabh_Orders.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV exported successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export CSV. Make sure xlsx is installed.");
    }
  };

  const handleExportPDF = async () => {
    setIsOpen(false);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF('landscape');
      
      doc.setFontSize(16);
      doc.text("Shri Vallabh Jewels - Orders Report", 14, 15);
      
      const data = prepareData();
      const columns = ["Order ID", "Date", "Customer", "Phone", "Source", "Amount", "Margin", "Order By", "Payment", "Status"];
      const rows = data.map(row => columns.map(col => String(row[col as keyof typeof row])));
      
      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 20,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [61, 43, 31] } // #3D2B1F
      });
      
      doc.save("ShriVallabh_Orders.pdf");
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export PDF. Make sure jspdf and jspdf-autotable are installed.");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          darkMode 
            ? 'bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700' 
            : 'bg-white text-neutral-800 hover:bg-neutral-50 border border-neutral-200'
        }`}
      >
        <Download size={16} />
        Export
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg border overflow-hidden z-50 ${
          darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-100'
        }`}>
          <div className="p-1">
            <button
              onClick={handleExportExcel}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                darkMode ? 'hover:bg-neutral-700 text-neutral-200' : 'hover:bg-neutral-100 text-neutral-700'
              }`}
            >
              <FileSpreadsheet size={16} className="text-green-600" />
              Excel (.xlsx)
            </button>
            <button
              onClick={handleExportCSV}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                darkMode ? 'hover:bg-neutral-700 text-neutral-200' : 'hover:bg-neutral-100 text-neutral-700'
              }`}
            >
              <FileText size={16} className="text-blue-600" />
              CSV (.csv)
            </button>
            <button
              onClick={handleExportPDF}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                darkMode ? 'hover:bg-neutral-700 text-neutral-200' : 'hover:bg-neutral-100 text-neutral-700'
              }`}
            >
              <FileText size={16} className="text-red-500" />
              PDF (.pdf)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
