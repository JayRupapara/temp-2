// ── Firestore Read Request Tracker (Disabled / No-Op) ───────────────────────
// Read tracker widget disabled as requested.

export function trackReads(source: string, docCount: number) {
  // No-op: Read tracker UI removed from site
}

export function getReadCount() {
  return 0;
}

export function getReadLog() {
  return [];
}

export function resetReadCount() {
  // No-op
}

if (typeof document !== "undefined") {
  const existingWidget = document.getElementById("__firestore-read-tracker");
  if (existingWidget) {
    existingWidget.remove();
  }
}
