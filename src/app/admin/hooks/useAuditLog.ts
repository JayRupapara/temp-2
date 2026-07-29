// ── useAuditLog Hook ───────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { collection, query, orderBy, onSnapshot, Timestamp, getDocs, where, deleteDoc, doc, limit } from "firebase/firestore";
import { db } from "../../firebase";
import { AuditEntry } from "../types";
import { logSystemEvent, getSystemEnv, getCurrentUrl } from "../../utils/systemLogger";
import { trackReads } from "../../utils/readTracker";
import { toast } from "sonner";

export function useAuditLog(authed: boolean) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto purge logs older than 48 hours on mount
  const purgeOldLogs = useCallback(async () => {
    try {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const q = query(collection(db, "audit_log"), where("timestamp", "<", Timestamp.fromDate(fortyEightHoursAgo)));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "audit_log", d.id)));
        await Promise.all(deletePromises);
        console.log(`[AuditLog] Auto-purged ${snapshot.size} logs older than 48 hours.`);
      }
    } catch (err) {
      console.warn("Audit log purge warning:", err);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;

    // Run purge silently on load
    purgeOldLogs();

    // Listen to top 100 most recent logs ordered by timestamp descending
    const q = query(collection(db, "audit_log"), orderBy("timestamp", "desc"), limit(100));
    const unsub = onSnapshot(q, (snapshot) => {
      trackReads("audit_log", snapshot.docs.length);
      const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AuditEntry));
      
      // Keep in state logs within last 48 hours (or fallback if empty)
      const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;
      const recent = fetched.filter(e => {
        const t = e.timestamp?.toMillis ? e.timestamp.toMillis() : new Date(e.timestamp || 0).getTime();
        return t >= fortyEightHoursAgo;
      });

      setEntries(recent);
      setLoading(false);
    }, (err) => {
      console.warn("Audit log listener error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [authed, purgeOldLogs]);

  const logAction = useCallback(async (entry: Omit<AuditEntry, "id" | "timestamp">) => {
    await logSystemEvent({
      ...entry,
      env: entry.env || getSystemEnv(),
      url: entry.url || getCurrentUrl(),
    });
  }, []);

  const getEntriesForOrder = useCallback((orderId: string) => {
    return entries.filter(e => e.orderId === orderId);
  }, [entries]);

  const exportLogsToCSV = useCallback(() => {
    if (entries.length === 0) {
      toast.info("No logs available to export.");
      return;
    }

    const headers = ["Timestamp", "Environment", "Severity", "Action", "User", "Email", "URL", "Order ID", "Details"];
    const rows = entries.map(e => {
      const date = e.timestamp?.toDate ? e.timestamp.toDate().toISOString() : new Date(e.timestamp || 0).toISOString();
      const env = e.env || "local";
      const severity = e.severity || "info";
      const action = `"${(e.action || "").replace(/"/g, '""')}"`;
      const user = `"${(e.user || "").replace(/"/g, '""')}"`;
      const email = `"${(e.userEmail || "").replace(/"/g, '""')}"`;
      const url = `"${(e.url || "").replace(/"/g, '""')}"`;
      const orderId = `"${(e.orderId || "").replace(/"/g, '""')}"`;
      const details = `"${(e.details || "").replace(/"/g, '""')}"`;
      return [date, env, severity, action, user, email, url, orderId, details].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SVJ_System_Logs_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${entries.length} logs to CSV!`);
  }, [entries]);

  return { entries, loading, logAction, getEntriesForOrder, purgeOldLogs, exportLogsToCSV };
}
