import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Loader2, PlusCircle, CheckCircle, Edit3, XCircle, Trash2, DollarSign, Activity } from "lucide-react";
import { AuditEntry } from "../types";

interface AuditLogTimelineProps {
  entries: AuditEntry[];
  loading: boolean;
  darkMode: boolean;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  created: <PlusCircle size={16} />,
  confirmed: <CheckCircle size={16} />,
  edited: <Edit3 size={16} />,
  cancelled: <XCircle size={16} />,
  deleted: <Trash2 size={16} />,
  margin_updated: <DollarSign size={16} />,
  status_changed: <Activity size={16} />,
};

const ACTION_COLORS: Record<string, string> = {
  created: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
  confirmed: "text-green-500 bg-green-100 dark:bg-green-900/30",
  edited: "text-orange-500 bg-orange-100 dark:bg-orange-900/30",
  cancelled: "text-red-500 bg-red-100 dark:bg-red-900/30",
  deleted: "text-red-700 bg-red-200 dark:bg-red-900/50",
  margin_updated: "text-purple-500 bg-purple-100 dark:bg-purple-900/30",
  status_changed: "text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30",
};

export default function AuditLogTimeline({ entries, loading, darkMode }: AuditLogTimelineProps) {
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const lowerSearch = search.toLowerCase();
    return entries.filter(e => 
      e.orderId.toLowerCase().includes(lowerSearch) || 
      e.details.toLowerCase().includes(lowerSearch) ||
      e.user.toLowerCase().includes(lowerSearch)
    );
  }, [entries, search]);

  const visibleEntries = filteredEntries.slice(0, visibleCount);
  const hasMore = visibleCount < filteredEntries.length;

  const bgBase = darkMode ? "bg-[#1C1C1C]" : "bg-white";
  const bgInput = darkMode ? "bg-[#2A2A2A]" : "bg-gray-50";
  const textMain = darkMode ? "text-gray-100" : "text-gray-900";
  const textMuted = darkMode ? "text-gray-400" : "text-gray-600";
  const borderCol = darkMode ? "border-gray-700" : "border-gray-200";

  return (
    <div className={`p-6 rounded-2xl ${bgBase} shadow-sm border ${borderCol} min-h-[600px]`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className={`text-xl font-semibold ${textMain}`}>System Audit Log</h2>
          <p className={`text-sm ${textMuted}`}>Track all actions and changes across the system</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} size={18} />
          <input
            type="text"
            placeholder="Search by Order ID, User..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(20);
            }}
            className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm border ${borderCol} ${bgInput} ${textMain} focus:outline-none focus:ring-2 focus:ring-[#CFA18D] transition-shadow`}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-[#CFA18D]" size={32} />
        </div>
      ) : visibleEntries.length === 0 ? (
        <div className={`text-center py-12 ${textMuted}`}>
          No audit logs found matching your criteria.
        </div>
      ) : (
        <div className="relative">
          {/* Main vertical line */}
          <div className={`absolute left-4 top-4 bottom-4 w-px ${borderCol} sm:left-6 md:left-8`} />

          <div className="space-y-6">
            {visibleEntries.map((entry, index) => {
              const date = entry.timestamp?.toDate ? entry.timestamp.toDate() : new Date(entry.timestamp);
              const actionStr = entry.action || "edited";
              const Icon = ACTION_ICONS[actionStr] || <Activity size={16} />;
              const colorClass = ACTION_COLORS[actionStr] || "text-gray-500 bg-gray-100 dark:bg-gray-800";
              const label = actionStr.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.5) }}
                  key={entry.id || index}
                  className="relative flex items-start gap-4 sm:gap-6 md:gap-8"
                >
                  <div className={`relative z-10 flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full border-4 ${bgBase} ${colorClass}`}>
                    {Icon}
                  </div>
                  <div className={`flex-1 pt-1 sm:pt-2 pb-4 border-b ${borderCol} last:border-0`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <div className={`font-medium ${textMain}`}>
                        {label} <span className="font-normal mx-1">on</span> <span className="text-[#CFA18D] cursor-pointer hover:underline">#{entry.orderId}</span>
                      </div>
                      <div className={`text-xs ${textMuted} whitespace-nowrap`}>
                        {date.toLocaleString()}
                      </div>
                    </div>
                    <div className={`text-sm ${textMain} mb-2`}>
                      {entry.details}
                    </div>
                    <div className={`text-xs font-medium px-2 py-1 inline-block rounded-md bg-opacity-10 bg-black dark:bg-white dark:bg-opacity-10 ${textMuted}`}>
                      By: {entry.user}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setVisibleCount(prev => prev + 20)}
                className={`px-6 py-2 rounded-xl text-sm font-medium border ${borderCol} ${textMain} hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors`}
              >
                Load More
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
