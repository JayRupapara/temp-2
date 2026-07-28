// ── System Logger Utility ───────────────────────────────────────────────────
// Captures 24/7 live errors, storefront user activities, and admin actions
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { AuditEntry } from "../admin/types";

let lastLoggedError = "";
let lastLoggedTime = 0;

export function getSystemEnv(): "local" | "live" {
  if (typeof window === "undefined") return "live";
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" ? "local" : "live";
}

export function getCurrentUrl(): string {
  if (typeof window === "undefined") return "";
  return window.location.href;
}

export async function logSystemEvent(entry: Omit<AuditEntry, "id" | "timestamp">) {
  try {
    const env = entry.env || getSystemEnv();
    const url = entry.url || getCurrentUrl();
    
    // Prevent duplicate error spam within 3 seconds
    if (entry.severity === "error") {
      const key = `${entry.action}:${entry.details}:${url}`;
      const now = Date.now();
      if (key === lastLoggedError && now - lastLoggedTime < 3000) {
        return;
      }
      lastLoggedError = key;
      lastLoggedTime = now;
    }

    // Build the doc, stripping any undefined values (Firestore rejects them)
    const rawDoc: Record<string, any> = {
      ...entry,
      env,
      url,
      type: entry.type || (entry.severity === "error" ? "error" : "activity"),
      severity: entry.severity || "info",
      timestamp: Timestamp.now(),
    };
    const cleanDoc: Record<string, any> = {};
    for (const [k, v] of Object.entries(rawDoc)) {
      if (v !== undefined) cleanDoc[k] = v;
    }

    await addDoc(collection(db, "audit_log"), cleanDoc);
  } catch (err) {
    console.warn("[SystemLogger] Fail to write log:", err);
  }
}

export function logSystemError(message: string, details: string = "", extra?: Partial<AuditEntry>) {
  return logSystemEvent({
    action: extra?.action || "SYSTEM_ERROR",
    user: extra?.user || "System/Guest",
    userEmail: extra?.userEmail || "",
    severity: "error",
    type: extra?.type || "error",
    details: message,
    stack: details,
    orderId: extra?.orderId,
  });
}

export function logUserActivity(action: string, details: string, extra?: Partial<AuditEntry>) {
  return logSystemEvent({
    action,
    user: extra?.user || "Customer",
    userEmail: extra?.userEmail || "",
    severity: "info",
    type: "activity",
    details,
    orderId: extra?.orderId,
  });
}

export function logAdminAction(action: string, details: string, adminName: string = "Admin", extra?: Partial<AuditEntry>) {
  return logSystemEvent({
    action,
    user: adminName,
    userEmail: extra?.userEmail || `${adminName.toLowerCase()}@shrivallabhjewels.com`,
    severity: "info",
    type: "admin",
    details,
    orderId: extra?.orderId,
  });
}

// ── Global Error Listeners Setup ─────────────────────────────────────────────
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    const errorMsg = event.message || "Unhandled Window Error";
    const stack = event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`;
    logSystemError(`Frontend Exception: ${errorMsg}`, stack, { action: "WINDOW_ERROR" });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const msg = typeof reason === "string" ? reason : reason?.message || "Unhandled Promise Rejection";
    const stack = reason?.stack || "";
    logSystemError(`Unhandled Promise Rejection: ${msg}`, stack, { action: "PROMISE_REJECTION" });
  });
}
