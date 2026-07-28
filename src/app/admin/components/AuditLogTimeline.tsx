import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Download, Trash2, AlertTriangle, ShieldAlert, ShoppingBag, ShieldCheck, ExternalLink, ChevronDown, ChevronUp, Server, RefreshCw } from "lucide-react";
import { AuditEntry } from "../types";
import { toast } from "sonner";

interface AuditLogTimelineProps {
  entries: AuditEntry[];
  loading: boolean;
  darkMode: boolean;
  onExportCSV?: () => void;
  onPurgeOld?: () => void;
}

export default function AuditLogTimeline({ entries, loading, darkMode, onExportCSV, onPurgeOld }: AuditLogTimelineProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "error" | "activity" | "admin">("all");
  const [envFilter, setEnvFilter] = useState<"all" | "local" | "live">("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | "error" | "warning" | "info">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(30);

  // Categorized counts
  const errorCount = useMemo(() => entries.filter(e => e.severity === "error" || e.type === "error" || e.type === "checkout_failure").length, [entries]);
  const activityCount = useMemo(() => entries.filter(e => e.type === "activity" || (!e.type && e.user !== "Admin" && e.user !== "Jay" && e.user !== "Kashyap")).length, [entries]);
  const adminCount = useMemo(() => entries.filter(e => e.type === "admin" || e.user === "Admin" || e.user === "Jay" || e.user === "Kashyap").length, [entries]);
  const localCount = useMemo(() => entries.filter(e => e.env === "local").length, [entries]);
  const liveCount = useMemo(() => entries.filter(e => e.env === "live").length, [entries]);

  // Filtering
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      // Category filter
      if (categoryFilter === "error" && !(e.severity === "error" || e.type === "error" || e.type === "checkout_failure")) return false;
      if (categoryFilter === "activity" && (e.severity === "error" || e.type === "admin" || e.user === "Admin" || e.user === "Jay" || e.user === "Kashyap")) return false;
      if (categoryFilter === "admin" && (e.type !== "admin" && e.user !== "Admin" && e.user !== "Jay" && e.user !== "Kashyap")) return false;

      // Env filter
      if (envFilter !== "all" && (e.env || "local") !== envFilter) return false;

      // Severity filter
      if (severityFilter !== "all" && (e.severity || "info") !== severityFilter) return false;

      // Search
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (e.orderId && e.orderId.toLowerCase().includes(q)) ||
        (e.details && e.details.toLowerCase().includes(q)) ||
        (e.action && e.action.toLowerCase().includes(q)) ||
        (e.user && e.user.toLowerCase().includes(q)) ||
        (e.userEmail && e.userEmail.toLowerCase().includes(q)) ||
        (e.url && e.url.toLowerCase().includes(q)) ||
        (e.stack && e.stack.toLowerCase().includes(q))
      );
    });
  }, [entries, categoryFilter, envFilter, severityFilter, search]);

  const visibleEntries = filteredEntries.slice(0, visibleCount);
  const hasMore = visibleCount < filteredEntries.length;

  const bgBase = darkMode ? "bg-[#1C1C1C]" : "bg-white";
  const bgCard = darkMode ? "bg-[#2A2A2A]" : "bg-stone-50";
  const bgInput = darkMode ? "bg-[#2A2A2A]" : "bg-white";
  const textMain = darkMode ? "text-stone-100" : "text-stone-900";
  const textMuted = darkMode ? "text-stone-400" : "text-stone-600";
  const borderCol = darkMode ? "border-stone-800" : "border-stone-200";

  return (
    <div className="space-y-6">
      {/* Top Header & Export Controls */}
      <div className={`p-6 rounded-2xl ${bgBase} shadow-sm border ${borderCol}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Server className="w-6 h-6 text-[#CFA18D]" />
              <h2 className={`text-xl font-bold font-serif ${textMain}`}>24/7 Live System Logger & Audit Center</h2>
            </div>
            <p className={`text-sm mt-1 ${textMuted}`}>
              Capturing live site errors, storefront user actions & admin activities (Last 48 Hours)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onPurgeOld && (
              <button
                onClick={() => {
                  onPurgeOld();
                  toast.success("Cleanup completed!");
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  darkMode ? "border-stone-700 bg-stone-800 text-stone-300 hover:bg-stone-700" : "border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
                }`}
              >
                <RefreshCw size={14} /> Purge &gt;48h Logs
              </button>
            )}

            {onExportCSV && (
              <button
                onClick={onExportCSV}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#3D2B1F] text-[#F8F6F2] hover:bg-[#5a3e2b] transition-all shadow-md shadow-[#3D2B1F]/20"
              >
                <Download size={14} /> Download 48h Logs (CSV)
              </button>
            )}
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className={`p-4 rounded-xl border ${darkMode ? "bg-stone-800/40 border-stone-800" : "bg-white border-stone-200"}`}>
            <p className={`text-xs ${textMuted}`}>Total Logs (48h)</p>
            <p className={`text-2xl font-bold mt-1 ${textMain}`}>{entries.length}</p>
            <div className="flex items-center gap-2 text-[11px] mt-1 text-stone-400">
              <span className="text-amber-500 font-medium">Local: {localCount}</span>
              <span>•</span>
              <span className="text-emerald-500 font-medium">Live: {liveCount}</span>
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${darkMode ? "bg-rose-950/20 border-rose-900/30" : "bg-rose-50/60 border-rose-200"}`}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">Errors & Failures</p>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">{errorCount}</p>
            <p className="text-[11px] text-rose-500/80 mt-1">Runtime JS & API errors</p>
          </div>

          <div className={`p-4 rounded-xl border ${darkMode ? "bg-sky-950/20 border-sky-900/30" : "bg-sky-50/60 border-sky-200"}`}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">User Activity</p>
              <ShoppingBag className="w-4 h-4 text-sky-500" />
            </div>
            <p className="text-2xl font-bold mt-1 text-sky-600 dark:text-sky-400">{activityCount}</p>
            <p className="text-[11px] text-sky-500/80 mt-1">Storefront user actions</p>
          </div>

          <div className={`p-4 rounded-xl border ${darkMode ? "bg-purple-950/20 border-purple-900/30" : "bg-purple-50/60 border-purple-200"}`}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Admin Actions</p>
              <ShieldCheck className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold mt-1 text-purple-600 dark:text-purple-400">{adminCount}</p>
            <p className="text-[11px] text-purple-500/80 mt-1">Jay & Kashyap updates</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className={`p-4 rounded-2xl ${bgBase} shadow-sm border ${borderCol} space-y-4`}>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                categoryFilter === "all" ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm" : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
            >
              All Logs ({entries.length})
            </button>

            <button
              onClick={() => setCategoryFilter("error")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                categoryFilter === "error" ? "bg-rose-500 text-white shadow-sm" : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              }`}
            >
              <AlertTriangle size={13} /> Errors & Failures ({errorCount})
            </button>

            <button
              onClick={() => setCategoryFilter("activity")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                categoryFilter === "activity" ? "bg-sky-600 text-white shadow-sm" : "text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40"
              }`}
            >
              <ShoppingBag size={13} /> Storefront Activity ({activityCount})
            </button>

            <button
              onClick={() => setCategoryFilter("admin")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                categoryFilter === "admin" ? "bg-purple-600 text-white shadow-sm" : "text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
              }`}
            >
              <ShieldCheck size={13} /> Admin Actions ({adminCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} size={16} />
            <input
              type="text"
              placeholder="Search error, name, email, URL, order ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisibleCount(30);
              }}
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border ${borderCol} ${bgInput} ${textMain} focus:outline-none focus:ring-2 focus:ring-[#CFA18D] transition-shadow`}
            />
          </div>
        </div>

        {/* Secondary Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-100 dark:border-stone-800/80">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${textMuted}`}>Env:</span>
            <select
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value as any)}
              className={`px-2.5 py-1 text-xs rounded-lg border ${borderCol} ${bgInput} ${textMain} outline-none`}
            >
              <option value="all">All (Local & Live)</option>
              <option value="local">💻 Local (localhost)</option>
              <option value="live">🌐 Live (Production)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${textMuted}`}>Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className={`px-2.5 py-1 text-xs rounded-lg border ${borderCol} ${bgInput} ${textMain} outline-none`}
            >
              <option value="all">All Severities</option>
              <option value="error">🔴 Errors Only</option>
              <option value="warning">🟡 Warnings</option>
              <option value="info">🔵 Info</option>
            </select>
          </div>

          <div className="ml-auto text-xs font-medium text-stone-400">
            Showing {filteredEntries.length} matching logs
          </div>
        </div>
      </div>

      {/* Log Feed */}
      <div className={`p-6 rounded-2xl ${bgBase} shadow-sm border ${borderCol} min-h-[400px]`}>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-[#CFA18D]" size={32} />
          </div>
        ) : visibleEntries.length === 0 ? (
          <div className={`text-center py-16 ${textMuted}`}>
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40 text-stone-400" />
            <p className="font-semibold text-base">No logs found</p>
            <p className="text-xs mt-1 opacity-75">Try clearing filters or search terms.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleEntries.map((entry, index) => {
              const date = entry.timestamp?.toDate ? entry.timestamp.toDate() : new Date(entry.timestamp || 0);
              const isError = entry.severity === "error" || entry.type === "error" || entry.type === "checkout_failure";
              const isLocal = (entry.env || "local") === "local";
              const isExpanded = expandedId === (entry.id || index.toString());

              return (
                <div
                  key={entry.id || index}
                  className={`p-4 rounded-xl border transition-all ${
                    isError 
                      ? (darkMode ? "bg-rose-950/20 border-rose-900/40" : "bg-rose-50/70 border-rose-200")
                      : (darkMode ? "bg-stone-800/40 border-stone-800" : "bg-stone-50 border-stone-200/80")
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Environment Badge */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                        isLocal ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      }`}>
                        {isLocal ? "💻 Local" : "🌐 Live"}
                      </span>

                      {/* Severity Badge */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                        isError ? "bg-rose-500 text-white" : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300"
                      }`}>
                        {entry.severity || (isError ? "ERROR" : "INFO")}
                      </span>

                      {/* User & Email */}
                      <div className={`text-xs font-semibold flex items-center gap-1.5 ${textMain}`}>
                        <span>👤 {entry.user || "Customer"}</span>
                        {entry.userEmail && (
                          <span className="text-stone-400 font-normal">({entry.userEmail})</span>
                        )}
                      </div>

                      {/* Order ID Badge if linked */}
                      {entry.orderId && (
                        <span className="text-xs font-semibold text-[#CFA18D] bg-[#CFA18D]/10 px-2 py-0.5 rounded border border-[#CFA18D]/30">
                          #{entry.orderId}
                        </span>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className={`text-xs ${textMuted} font-mono whitespace-nowrap`}>
                      {date.toLocaleString("en-IN", { dateStyle: "short", timeStyle: "medium" })}
                    </div>
                  </div>

                  {/* Log Message / Action */}
                  <div className="mt-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-[#CFA18D] mr-2">
                          [{entry.action || "LOG"}]
                        </span>
                        <span className={`text-sm font-medium ${isError ? "text-rose-600 dark:text-rose-400 font-semibold" : textMain}`}>
                          {entry.details}
                        </span>
                      </div>

                      {entry.stack && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : (entry.id || index.toString()))}
                          className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:underline shrink-0"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          <span>{isExpanded ? "Hide Stack" : "View Stack"}</span>
                        </button>
                      )}
                    </div>

                    {/* URL Link */}
                    {entry.url && (
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                        <ExternalLink size={12} />
                        <span className="truncate max-w-xl font-mono text-[11px]">{entry.url}</span>
                      </div>
                    )}
                  </div>

                  {/* Expandable Stack Trace Drawer */}
                  <AnimatePresence>
                    {isExpanded && entry.stack && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 p-3 rounded-lg bg-black text-rose-300 font-mono text-xs overflow-x-auto border border-rose-950"
                      >
                        <p className="font-bold text-rose-400 mb-1">Stack Trace / Details:</p>
                        <pre className="whitespace-pre-wrap leading-relaxed">{entry.stack}</pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        {hasMore && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setVisibleCount(prev => prev + 30)}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold border ${borderCol} ${textMain} hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shadow-sm`}
            >
              Load More Logs ({filteredEntries.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
