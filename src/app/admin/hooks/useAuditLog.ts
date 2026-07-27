// ── useAuditLog Hook ───────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, where, limit } from "firebase/firestore";
import { db } from "../../firebase";
import { AuditEntry } from "../admin/types";

export function useAuditLog(authed: boolean) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authed) return;

    const q = query(collection(db, "audit_log"), orderBy("timestamp", "desc"), limit(500));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AuditEntry));
      setEntries(fetched);
      setLoading(false);
    }, (err) => {
      console.warn("Audit log listener error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [authed]);

  const logAction = useCallback(async (entry: Omit<AuditEntry, "id" | "timestamp">) => {
    try {
      await addDoc(collection(db, "audit_log"), {
        ...entry,
        timestamp: Timestamp.now(),
      });
    } catch (err) {
      console.warn("Failed to write audit log:", err);
    }
  }, []);

  const getEntriesForOrder = useCallback((orderId: string) => {
    return entries.filter(e => e.orderId === orderId);
  }, [entries]);

  return { entries, loading, logAction, getEntriesForOrder };
}
