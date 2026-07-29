// ── useOrders Hook ─────────────────────────────────────────────────────────
// Merges website orders (collectionGroup) + manual orders (admin_orders)
import { useState, useEffect, useCallback } from "react";
import { collection, collectionGroup, query, onSnapshot, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, limit } from "firebase/firestore";
import { db } from "../../firebase";
import { AdminOrder, OrderSource, OrderStatus, PaymentType, OrderCustomer, OrderItem, AdminUser } from "../admin/types";
import { toast } from "sonner";
import { trackReads } from "../../utils/readTracker";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz1hEKEZboMD0Z49sOwnPNPMH02WqLlCyYSqCmAeCnPf9dgIQkQsLXoAsbr-cN5Nqqm/exec";
const ORDERS_CACHE_KEY = "svj_admin_orders_cache_v2";

function normalizeWebsiteOrder(data: any, ref: any): AdminOrder {
  const status: OrderStatus = data.status === "CONFIRMED" ? "CONFIRMED"
    : data.status === "CANCELLED" ? "CANCELLED"
    : data.status === "SHIPPED" ? "SHIPPED"
    : data.status === "DELIVERED" ? "DELIVERED"
    : data.confirmed ? "CONFIRMED" : "NEW";

  return {
    id: data.id || ref.id,
    source: data.source || "website",
    placed: data.placed,
    status,
    confirmedBy: data.confirmedBy || null,
    payment: data.payment || "cod",
    total: Number(data.total) || 0,
    productCost: Number(data.productCost) || 0,
    courierCost: Number(data.courierCost) || 0,
    otherExpense: Number(data.otherExpense) || 0,
    margin: Number(data.margin) || 0,
    notes: data.notes || "",
    customer: {
      name: data.delivery?.name || data.customer?.name || "",
      phone: data.delivery?.phone || data.customer?.phone || "",
      email: data.delivery?.email || data.customer?.email || "",
      address: data.delivery?.address || "",
      city: data.delivery?.city || "",
      state: data.delivery?.state || "",
      pincode: data.delivery?.pincode || "",
    },
    items: (data.items || []).map((i: any) => ({
      name: i.product?.name || i.name || "Item",
      qty: Number(i.qty) || 1,
      price: Number(i.product?.price || i.price) || 0,
      image: i.product?.image || i.image || "",
    })),
    ref,
    isManual: false,
  };
}

function normalizeManualOrder(data: any, ref: any): AdminOrder {
  return {
    id: data.id || ref.id,
    source: data.source || "instagram",
    placed: data.placed,
    status: data.status || "NEW",
    confirmedBy: data.confirmedBy || null,
    payment: data.payment || "cod",
    total: Number(data.total) || 0,
    productCost: Number(data.productCost) || 0,
    courierCost: Number(data.courierCost) || 0,
    otherExpense: Number(data.otherExpense) || 0,
    margin: Number(data.margin) || 0,
    notes: data.notes || "",
    customer: data.customer || { name: "", phone: "", email: "", address: "", city: "", state: "", pincode: "" },
    items: data.items || [],
    ref,
    isManual: true,
  };
}

async function sendOrderStatusEmail(order: AdminOrder, status: string) {
  const customerEmail = order.customer?.email;
  if (!customerEmail) {
    toast.info(`No customer email provided for Order #${order.id} — email skipped.`);
    return;
  }

  try {
    const payload = {
      type: status,
      id: order.id,
      payment: order.payment,
      total: order.total,
      delivery: order.customer,
      items: (order.items || []).map(i => ({ qty: i.qty, product: { name: i.name, price: i.price } })),
    };

    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
    });
    toast.success(`Confirmation email triggered for ${customerEmail}`);
  } catch (err) {
    console.warn("Status email failed:", err);
  }
}

export function useOrders(authed: boolean) {
  const [orders, setOrders] = useState<AdminOrder[]>(() => {
    try {
      const cached = sessionStorage.getItem(ORDERS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.orders) && Date.now() - parsed.ts < 3 * 60 * 1000) {
          return parsed.orders;
        }
      }
    } catch (e) {
      // ignore
    }
    return [];
  });
  const [loading, setLoading] = useState(() => orders.length === 0);

  useEffect(() => {
    if (!authed) return;

    const unsubscribers: (() => void)[] = [];
    let websiteOrders: AdminOrder[] = [];
    let manualOrders: AdminOrder[] = [];

    const merge = () => {
      const all = [...websiteOrders, ...manualOrders];
      all.sort((a, b) => {
        const dateA = a.placed?.toMillis ? a.placed.toMillis() : a.placed?.seconds ? a.placed.seconds * 1000 : 0;
        const dateB = b.placed?.toMillis ? b.placed.toMillis() : b.placed?.seconds ? b.placed.seconds * 1000 : 0;
        return dateB - dateA;
      });
      setOrders(all);
      setLoading(false);

      // Save serializable snapshot to sessionStorage cache
      try {
        const serializable = all.map(o => {
          const { ref, ...rest } = o;
          return rest;
        });
        sessionStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify({ ts: Date.now(), orders: serializable }));
      } catch (e) {
        // ignore storage quota errors
      }
    };

    // Website orders (real-time limited to 200)
    const q1 = query(collectionGroup(db, "orders"), limit(200));
    const unsub1 = onSnapshot(q1, (snapshot) => {
      trackReads("admin/orders(web)", snapshot.docs.length);
      websiteOrders = snapshot.docs.map(d => normalizeWebsiteOrder(d.data(), d.ref));
      merge();
    }, (err) => {
      console.warn("Website orders listener error:", err);
      setLoading(false);
    });
    unsubscribers.push(unsub1);

    // Manual orders (real-time limited to 200)
    const q2 = query(collection(db, "admin_orders"), limit(200));
    const unsub2 = onSnapshot(q2, (snapshot) => {
      trackReads("admin/orders(manual)", snapshot.docs.length);
      manualOrders = snapshot.docs.map(d => normalizeManualOrder(d.data(), d.ref));
      merge();
    }, (err) => {
      console.warn("Manual orders listener error:", err);
    });
    unsubscribers.push(unsub2);

    return () => unsubscribers.forEach(u => u());
  }, [authed]);

  const createManualOrder = useCallback(async (orderData: {
    source: OrderSource;
    customer: OrderCustomer;
    items: OrderItem[];
    total: number;
    payment: PaymentType;
    confirmedBy: AdminUser | null;
    notes: string;
    orderDate?: Date;
  }) => {
    const count = orders.filter(o => o.isManual).length;
    const orderId = `SVJ-M${(100001 + count).toString()}`;

    const newOrder = {
      id: orderId,
      source: orderData.source,
      placed: orderData.orderDate ? Timestamp.fromDate(orderData.orderDate) : Timestamp.now(),
      status: orderData.confirmedBy ? "CONFIRMED" : "NEW",
      confirmedBy: orderData.confirmedBy,
      payment: orderData.payment,
      total: orderData.total,
      productCost: 0,
      courierCost: 0,
      otherExpense: 0,
      margin: 0,
      notes: orderData.notes,
      customer: orderData.customer,
      items: orderData.items,
    };

    await addDoc(collection(db, "admin_orders"), newOrder);
    toast.success(`Manual order ${orderId} created!`);
    return orderId;
  }, [orders]);

  const updateOrder = useCallback(async (order: AdminOrder, updates: Partial<AdminOrder>) => {
    if (!order.ref) return;
    try {
      const cleanUpdates: any = { ...updates };
      delete cleanUpdates.ref;
      delete cleanUpdates.isManual;
      await updateDoc(order.ref, cleanUpdates);
      toast.success("Order updated");

      const finalStatus = updates.status || order.status;
      const finalConfirmedBy = updates.confirmedBy !== undefined ? updates.confirmedBy : order.confirmedBy;
      
      // Only send email if the status is ACTUALLY changing to CONFIRMED or CANCELLED
      if (updates.status && updates.status !== order.status && (updates.status === "CONFIRMED" || updates.status === "CANCELLED")) {
        const updatedOrder = { ...order, ...updates, status: updates.status, confirmedBy: finalConfirmedBy };
        await sendOrderStatusEmail(updatedOrder, updates.status);
      }
    } catch (e: any) {
      toast.error("Failed to update order", { description: e.message });
    }
  }, []);

  const confirmOrder = useCallback(async (order: AdminOrder, confirmedBy: AdminUser) => {
    if (!order.ref) return;
    try {
      await updateDoc(order.ref, { status: "CONFIRMED", confirmed: true, confirmedBy });
      toast.success(`Order marked CONFIRMED by ${confirmedBy}`);
      const updatedOrder = { ...order, status: "CONFIRMED" as OrderStatus, confirmedBy };
      await sendOrderStatusEmail(updatedOrder, "CONFIRMED");
    } catch (e: any) {
      toast.error("Failed to confirm order", { description: e.message });
    }
  }, []);

  const cancelOrder = useCallback(async (order: AdminOrder) => {
    if (!order.ref) return;
    try {
      await updateDoc(order.ref, { status: "CANCELLED", confirmed: false });
      toast.success("Order cancelled");
      const updatedOrder = { ...order, status: "CANCELLED" as OrderStatus };
      await sendOrderStatusEmail(updatedOrder, "CANCELLED");
    } catch (e: any) {
      toast.error("Failed to cancel", { description: e.message });
    }
  }, []);

  const deleteOrder = useCallback(async (order: AdminOrder) => {
    if (!order.ref) return;
    try {
      await deleteDoc(order.ref);
      toast.success("Order deleted");
    } catch (e: any) {
      toast.error("Failed to delete", { description: e.message });
    }
  }, []);

  return { orders, loading, createManualOrder, updateOrder, confirmOrder, cancelOrder, deleteOrder };
}
