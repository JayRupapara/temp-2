// ── Bundled Catalog Sync Utility ──────────────────────────────────────────────
// Bundles products + combos into a single Firestore document (settings/catalog).
// This reduces storefront load reads from 32+ reads down to EXACTLY 1 READ!

import { doc, getDoc, setDoc, getDocs, collection } from "firebase/firestore";
import { db } from "../firebase";

export interface CatalogBundle {
  products: any[];
  combos: any[];
  updatedAt: number;
}

const BUNDLE_DOC = doc(db, "settings", "catalog");

/**
 * Reads bundled catalog from Firestore (ONLY 1 READ for entire catalog!)
 */
export async function getCatalogBundle(): Promise<CatalogBundle | null> {
  try {
    const snap = await getDoc(BUNDLE_DOC);
    if (snap.exists()) {
      const data = snap.data() as CatalogBundle;
      if (Array.isArray(data.products) && data.products.length > 0 && Array.isArray(data.combos)) {
        return data;
      }
    }
  } catch (err) {
    console.warn("Catalog bundle fetch error:", err);
  }
  return null;
}

/**
 * Re-bundles all products and combos into a single Firestore document.
 * Called automatically when products or combos are updated in Admin Panel.
 */
export async function syncCatalogBundle(): Promise<CatalogBundle | null> {
  try {
    const pSnap = await getDocs(collection(db, "products"));
    const cSnap = await getDocs(collection(db, "combos"));

    const products = pSnap.docs.map(d => ({ ...d.data(), id: d.data().id ?? d.id, docId: d.id }));
    products.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));

    const combos = cSnap.docs.map(d => ({ ...d.data(), id: d.id, docId: d.id }));

    const bundle: CatalogBundle = {
      products,
      combos,
      updatedAt: Date.now()
    };

    await setDoc(BUNDLE_DOC, bundle);
    return bundle;
  } catch (err) {
    console.warn("Sync catalog bundle error:", err);
    return null;
  }
}
