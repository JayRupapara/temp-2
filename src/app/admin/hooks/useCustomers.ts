// ── useCustomers Hook ──────────────────────────────────────────────────────
import { useState, useCallback } from "react";
import { doc, getDoc, setDoc, Timestamp, arrayUnion, increment } from "firebase/firestore";
import { db } from "../../firebase";
import { CustomerProfile, OrderCustomer } from "../admin/types";

export function useCustomers() {
  const [lookupResult, setLookupResult] = useState<CustomerProfile | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const lookupByPhone = useCallback(async (phone: string) => {
    if (!phone || phone.length < 10) {
      setLookupResult(null);
      return null;
    }

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length < 10) {
      setLookupResult(null);
      return null;
    }

    setLookupLoading(true);
    try {
      const docRef = doc(db, "customers", cleanPhone);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as CustomerProfile;
        setLookupResult(data);
        return data;
      } else {
        setLookupResult(null);
        return null;
      }
    } catch (err) {
      console.warn("Customer lookup error:", err);
      setLookupResult(null);
      return null;
    } finally {
      setLookupLoading(false);
    }
  }, []);

  const saveCustomer = useCallback(async (customer: OrderCustomer, orderId: string, total: number) => {
    if (!customer.phone) return;
    const cleanPhone = customer.phone.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length < 10) return;

    try {
      const docRef = doc(db, "customers", cleanPhone);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        // Update existing customer
        await setDoc(docRef, {
          name: customer.name || snap.data().name,
          email: customer.email || snap.data().email,
          address: customer.address || snap.data().address,
          city: customer.city || snap.data().city,
          state: customer.state || snap.data().state,
          pincode: customer.pincode || snap.data().pincode,
          totalOrders: increment(1),
          totalAmount: increment(total),
          lastOrderDate: Timestamp.now(),
          orderIds: arrayUnion(orderId),
        }, { merge: true });
      } else {
        // Create new customer
        await setDoc(docRef, {
          name: customer.name,
          phone: cleanPhone,
          email: customer.email,
          address: customer.address,
          city: customer.city,
          state: customer.state,
          pincode: customer.pincode,
          totalOrders: 1,
          totalAmount: total,
          lastOrderDate: Timestamp.now(),
          orderIds: [orderId],
        });
      }
    } catch (err) {
      console.warn("Error saving customer:", err);
    }
  }, []);

  const clearLookup = useCallback(() => {
    setLookupResult(null);
  }, []);

  return { lookupResult, lookupLoading, lookupByPhone, saveCustomer, clearLookup };
}
