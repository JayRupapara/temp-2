/// <reference path="../vite-env.d.ts" />
import { useState, useEffect, useRef, createContext, useContext } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import { Toaster, toast } from "sonner";
import {
  Menu, X, ShoppingBag, Heart, Star, ArrowRight,
  Phone, Mail, MapPin, ChevronDown, Package, Truck, CreditCard,
  Shield, CheckCircle, Plus, Minus, Trash2, Clock, Instagram,
  Send, Zap, RefreshCw, Check, ChevronLeft, User as UserIcon, MessageCircle
} from "lucide-react";
import { User, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider, db } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, Timestamp, onSnapshot, setDoc, doc, deleteDoc, collectionGroup, updateDoc } from "firebase/firestore";

import logoImg from "../imports/IMG_5778.PNG";
import pearlImg from "../imports/ChatGPT_Image_Jun_10__2026__02_58_08_PM.png";
import heartImg from "../imports/ChatGPT_Image_Jun_10__2026__03_25_26_PM.png";
import butterflyImg from "../imports/ChatGPT_Image_Jun_8__2026__06_13_30_PM.png";
import ringImg from "../imports/ChatGPT_Image_Jun_10__2026__03_55_57_PM.png";
import storyImg from "../imports/new pn.png.png";

// ── Types ──────────────────────────────────────────────────────────────────
type Page = "home" | "shop" | "product" | "checkout" | "confirmation" | "account" | "admin";
type Product = {
  id: number; name: string; subtitle: string; description: string;
  price: number; originalPrice: number; category: string; image: string;
  badge: string; badgeColor: string; stock: number; rating: number; reviews: number; care: string;
  isFeatured?: boolean; isBestseller?: boolean; isNewArrival?: boolean;
};
type Combo = {
  id: string; name: string; desc: string; price: number; original: number; saving: number; imgs: string[];
};
type CartItem = { product: Product; qty: number };
type DeliveryForm = { name: string; phone: string; email: string; address: string; city: string; state: string; pincode: string };
type OrderData = { id: string; items: CartItem[]; delivery: DeliveryForm; payment: "prepaid" | "cod"; total: number; placed: Date; confirmed?: boolean };
type AppCtx = {
  page: Page; setPage: (p: Page) => void;
  cart: CartItem[]; addToCart: (p: Product, qty?: number) => void;
  removeFromCart: (id: number) => void; updateQty: (id: number, q: number) => void;
  cartTotal: number; cartCount: number; clearCart: () => void;
  cartOpen: boolean; setCartOpen: (v: boolean) => void;
  selectedProduct: Product | null; setSelectedProduct: (p: Product | null) => void;
  order: OrderData | null; setOrder: (o: OrderData) => void;
  wishlist: number[]; toggleWishlist: (id: number) => void;
  user: any; login: () => void; logout: () => void;
  products: Product[];
  combos: Combo[];
};

// ── Data ───────────────────────────────────────────────────────────────────
const PRODUCTS: Product[] = [
  { id: 1, name: "Pearl Seashell Necklace", subtitle: "Rose gold oceanic pendant", description: "A delicate rose gold chain holding a shimmering seashell pendant with a lustrous freshwater pearl nestled inside. Crafted with premium rose gold plating and precision-set CZ accents. Perfect for the romantic soul who loves ocean-inspired elegance.", price: 349, originalPrice: 499, category: "Necklace", image: pearlImg, badge: "Bestseller", badgeColor: "#CFA18D", stock: 3, rating: 4.9, reviews: 128, care: "Avoid water and perfume. Wipe with a soft dry cloth after use. Store in the included gift box when not wearing." },
  { id: 2, name: "Petite Heart Necklace", subtitle: "Minimalist rose gold charm", description: "A beautifully simple rose gold heart pendant on a dainty delicate chain. Timeless, minimal, and deeply meaningful — the perfect everyday piece or a heartfelt gift for someone you cherish.", price: 299, originalPrice: 399, category: "Necklace", image: heartImg, badge: "New Arrival", badgeColor: "#059669", stock: 8, rating: 4.8, reviews: 94, care: "Keep away from water, sweat, and perfume. Polish gently with a soft cloth. Store separately to avoid scratches." },
  { id: 3, name: "Butterfly Bloom Necklace", subtitle: "Gold butterfly, crystal wings", description: "A graceful gold butterfly with sparkling crystal wings, paired with a tiny floral accent. This piece celebrates freedom and feminine beauty in every movement. Rose gold plated with anti-tarnish coating.", price: 309, originalPrice: 449, category: "Necklace", image: butterflyImg, badge: "Trending", badgeColor: "#7C3AED", stock: 5, rating: 4.9, reviews: 112, care: "Avoid contact with water, chemicals, and perfumes. Wipe clean with a dry cloth. Store in gift box provided." },
  { id: 4, name: "Infinity Spark Ring", subtitle: "Sterling silver with CZ stones", description: "An elegant infinity-shaped band set with brilliant cubic zirconia stones that catch the light beautifully. Symbolising endless love and infinite possibilities — a meaningful everyday ring that complements every look.", price: 160, originalPrice: 250, category: "Ring", image: ringImg, badge: "Staff Pick", badgeColor: "#0891B2", stock: 12, rating: 4.7, reviews: 76, care: "Remove before washing hands, swimming, or exercising. Clean with a soft cloth. Avoid harsh chemicals." },
];

const TESTIMONIALS = [
  { id: 1, name: "Priya Sharma", city: "Mumbai", rating: 5, text: "Absolutely stunning! The Pearl Seashell Necklace arrived beautifully packaged and exceeded all my expectations. The quality feels genuinely luxurious for the price.", order: "Pearl Seashell Necklace", verified: true },
  { id: 2, name: "Anjali Mehta", city: "Delhi", rating: 5, text: "I ordered the Butterfly Bloom Necklace for my anniversary — it was perfect. Fast delivery, beautiful packaging, and it looked even better in person!", order: "Butterfly Bloom Necklace", verified: true },
  { id: 3, name: "Sneha Patel", city: "Ahmedabad", rating: 5, text: "My go-to for jewellery gifting. The Heart Necklace was delicate and premium. My sister absolutely loved it. Will definitely order again!", order: "Petite Heart Necklace", verified: true },
  { id: 4, name: "Riya Desai", city: "Jaipur", rating: 5, text: "The Infinity Ring fits beautifully and catches so much light. I receive compliments every time I wear it. Shri Vallabh Jewels never disappoints!", order: "Infinity Spark Ring", verified: true },
];

const FAQS = [
  { q: "How long does delivery take?", a: "Orders are typically delivered within 5–8 business days across India. Express delivery is available at checkout for select pin codes." },
  { q: "Why is COD ₹49 more expensive?", a: "Cash on Delivery orders incur a ₹49 handling fee to cover packaging and secure verification costs. Choose any prepaid method (UPI, Cards, Net Banking) to get FREE delivery!" },
  { q: "What is the return policy?", a: "We offer a 1-day easy return policy. Contact us within 1 day of delivery with photos, and we will arrange a free replacement or full refund — no questions asked." },
  { q: "Are the pieces nickel-free and skin-safe?", a: "Yes! All our jewellery is nickel-free, lead-free, and cadmium-free. Made with premium anti-tarnish coating. Safe for sensitive skin and daily wear." },
  { q: "How do I track my order?", a: "To track your order, please contact us directly on WhatsApp." }
];

const RECENT_ORDERS = [
  { name: "Priya S.", city: "Mumbai", product: "Pearl Seashell Necklace" },
  { name: "Anjali M.", city: "Delhi", product: "Butterfly Bloom Necklace" },
  { name: "Sneha P.", city: "Ahmedabad", product: "Petite Heart Necklace" },
  { name: "Kavya R.", city: "Bangalore", product: "Infinity Spark Ring" },
  { name: "Divya K.", city: "Pune", product: "Pearl Seashell Necklace" },
  { name: "Pooja S.", city: "Chennai", product: "Butterfly Bloom Necklace" },
];

// ── Context ────────────────────────────────────────────────────────────────
const Ctx = createContext<AppCtx>(null!);
const useApp = () => useContext(Ctx);

// ── Hooks ──────────────────────────────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }, { threshold });
    io.observe(el); return () => io.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function useCountdown() {
  const end = useRef(Date.now() + (5 * 3600 + 47 * 60 + 23) * 1000);
  const [t, setT] = useState({ h: 5, m: 47, s: 23 });
  useEffect(() => {
    const iv = setInterval(() => {
      const d = Math.max(0, end.current - Date.now());
      setT({ h: Math.floor(d / 3.6e6), m: Math.floor((d % 3.6e6) / 6e4), s: Math.floor((d % 6e4) / 1e3) });
    }, 1000);
    return () => clearInterval(iv);
  }, []);
  return t;
}

// ── Utility Components ─────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={className}>
      <motion.div initial={{ opacity: 0, y: 32 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}>
        {children}
      </motion.div>
    </div>
  );
}

function STitle({ eyebrow, title, subtitle, center = true }: { eyebrow?: string; title: string; subtitle?: string; center?: boolean }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={`mb-12 ${center ? "text-center" : ""}`}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
        {eyebrow && <p className="text-[11px] uppercase tracking-[0.3em] mb-3 font-bold" style={{ color: "#CFA18D" }}>{eyebrow}</p>}
        <h2 className="text-4xl md:text-5xl leading-tight mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>{title}</h2>
        {subtitle && <p className="text-[15px] leading-relaxed max-w-lg" style={{ color: "#8C7B6B", ...(center ? { margin: "0 auto" } : {}) }}>{subtitle}</p>}
        <div className={`mt-4 h-px w-14 ${center ? "mx-auto" : ""}`} style={{ background: "linear-gradient(90deg, transparent, #CFA18D, #E8DCC8)" }} />
      </motion.div>
    </div>
  );
}

function StockIndicator({ stock }: { stock: number }) {
  if (stock <= 3) return <p className="text-[11px] font-bold animate-pulse" style={{ color: "#DC2626" }}>🔴 Only {stock} left — Order now!</p>;
  if (stock <= 7) return <p className="text-[11px] font-semibold" style={{ color: "#D97706" }}>⚠️ Low stock — {stock} remaining</p>;
  return <p className="text-[11px]" style={{ color: "#059669" }}>✅ In Stock</p>;
}

function OTPInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const handle = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return;
    const next = [...value]; next[i] = v.slice(-1); onChange(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };
  const keydown = (i: number, e: React.KeyboardEvent) => { if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus(); };
  const paste = (e: React.ClipboardEvent) => {
    const d = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (d.length === 6) { onChange(d.split("")); e.preventDefault(); }
  };
  return (
    <div className="flex gap-2.5 justify-center">
      {value.map((digit, i) => (
        <input key={i} ref={el => { refs.current[i] = el; }} type="text" maxLength={1} value={digit}
          onChange={e => handle(i, e.target.value)} onKeyDown={e => keydown(i, e)} onPaste={i === 0 ? paste : undefined}
          className="w-11 h-12 text-center text-lg font-bold rounded-xl outline-none transition-all"
          style={{ border: digit ? "2px solid #CFA18D" : "2px solid rgba(203,184,169,0.5)", background: "#FCFBF8", color: "#3D2B1F" }} />
      ))}
    </div>
  );
}

// ── ProductCard ────────────────────────────────────────────────────────────
function ProductCard({ product, delay = 0 }: { product: Product; delay?: number }) {
  const { addToCart, setSelectedProduct, setPage, wishlist, toggleWishlist } = useApp();
  const { ref: revealRef, visible } = useReveal();
  const cardRef = useRef<HTMLDivElement>(null);
  const wished = wishlist.includes(product.id);

  const tilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.transform = `perspective(1200px) rotateX(${((e.clientY - r.top) / r.height - 0.5) * -8}deg) rotateY(${((e.clientX - r.left) / r.width - 0.5) * 8}deg) translateZ(10px)`;
    el.style.boxShadow = "0 24px 60px rgba(207,161,141,0.28), 0 4px 16px rgba(61,43,31,0.08)";
  };
  const reset = () => {
    const el = cardRef.current; if (!el) return;
    el.style.transform = "perspective(1200px) rotateX(0) rotateY(0) translateZ(0)";
    el.style.boxShadow = "0 4px 20px rgba(207,161,141,0.1), 0 1px 4px rgba(61,43,31,0.04)";
  };

  return (
    <div ref={revealRef} className="group h-full">
      <motion.div initial={{ opacity: 0, y: 48 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }} className="h-full">
        <div ref={cardRef} onMouseMove={tilt} onMouseLeave={reset} className="relative bg-card rounded-2xl overflow-hidden h-full flex flex-col"
          style={{ boxShadow: "0 4px 20px rgba(207,161,141,0.1), 0 1px 4px rgba(61,43,31,0.04)", border: "1px solid rgba(203,184,169,0.22)", transition: "box-shadow 0.3s ease, transform 0.14s ease" }}>
          <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold"
            style={{ background: product.badgeColor, color: "#fff", backdropFilter: "blur(8px)" }}>
            {product.badge}
          </div>
          <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); toast(wished ? "Removed from wishlist" : "Saved to wishlist ♡"); }}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{ background: "rgba(252,251,248,0.92)", border: "1px solid rgba(203,184,169,0.2)" }}>
            <Heart size={13} className={wished ? "fill-rose-400 text-rose-400" : "text-[#8C7B6B]"} />
          </button>
          <button onClick={() => { setSelectedProduct(product); setPage("product"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="relative overflow-hidden cursor-pointer" style={{ paddingTop: "100%", background: "#EFE7DD" }}>
            <div className="absolute inset-0">
              <ImageWithFallback src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]" />
            </div>
          </button>
          <div className="p-5 flex flex-col flex-1">
            <p className="text-[10px] uppercase tracking-[0.22em] font-bold mb-1" style={{ color: "#CFA18D" }}>{product.category}</p>
            <button onClick={() => { setSelectedProduct(product); setPage("product"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="text-left text-[15px] leading-snug mb-1.5 hover:underline" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontWeight: 500 }}>
              {product.name}
            </button>
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} size={10} className={i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"} />)}</div>
              <span className="text-[10px]" style={{ color: "#8C7B6B" }}>({product.reviews})</span>
            </div>
            <div className="mb-3"><StockIndicator stock={product.stock} /></div>
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold" style={{ color: "#CFA18D" }}>₹{product.price}</span>
                <span className="text-xs line-through" style={{ color: "#CBB8A9" }}>₹{product.originalPrice}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(207,161,141,0.12)", color: "#CFA18D" }}>
                  {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                </span>
              </div>
            </div>
            <button onClick={() => { addToCart(product); toast.success("Added to bag ✦", { description: product.name }); }}
              className="mt-3 w-full py-2.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-95"
              style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 2px 10px rgba(207,161,141,0.4)" }}>
              Add to Bag
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Loading Screen ─────────────────────────────────────────────────────────
function LoadingScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2400); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div className="fixed inset-0 z-[100] flex flex-col items-center justify-center" style={{ background: "#F8F6F2" }}
      exit={{ opacity: 0 }} transition={{ duration: 0.9 }}>
      <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 rounded-full opacity-25" style={{ background: "radial-gradient(circle, #CFA18D, transparent)", transform: "scale(2)", filter: "blur(20px)" }} />
          <ImageWithFallback src={logoImg} alt="Shri Vallabh Jewels" className="w-36 h-auto object-contain relative" />
        </div>
        <motion.div initial={{ width: 0 }} animate={{ width: "160px" }} transition={{ duration: 1.6, delay: 0.3 }} className="h-px rounded-full"
          style={{ background: "linear-gradient(90deg, transparent, #CFA18D, #E8DCC8)" }} />
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-[11px] uppercase tracking-[0.35em]" style={{ color: "#8C7B6B" }}>
          Timeless Elegance
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

// ── Cart Drawer ────────────────────────────────────────────────────────────
function CartDrawer() {
  const { cart, cartOpen, setCartOpen, removeFromCart, updateQty, cartTotal, setPage } = useApp();
  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60]" style={{ background: "rgba(61,43,31,0.35)", backdropFilter: "blur(4px)" }}
            onClick={() => setCartOpen(false)} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 z-[70] w-full max-w-sm flex flex-col"
            style={{ background: "#FCFBF8", boxShadow: "-8px 0 48px rgba(61,43,31,0.14)" }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(203,184,169,0.3)" }}>
              <div className="flex items-center gap-2">
                <ShoppingBag size={17} style={{ color: "#CFA18D" }} />
                <span className="font-bold text-[15px]" style={{ color: "#3D2B1F" }}>My Bag</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "#CFA18D", color: "#fff" }}>
                  {cart.reduce((s, i) => s + i.qty, 0)}
                </span>
              </div>
              <button onClick={() => setCartOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary transition-colors" style={{ color: "#5A4035" }}>
                <X size={16} />
              </button>
            </div>

            <div className="mx-4 mt-3 px-3 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold"
              style={{ background: "linear-gradient(135deg, rgba(207,161,141,0.15), rgba(232,220,200,0.2))", color: "#CFA18D", border: "1px solid rgba(207,161,141,0.2)" }}>
              <Zap size={12} /> Save ₹49 — choose Prepaid at checkout for FREE delivery!
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(207,161,141,0.1)" }}>
                    <ShoppingBag size={28} style={{ color: "rgba(203,184,169,0.6)" }} />
                  </div>
                  <div>
                    <p className="font-semibold mb-1" style={{ color: "#5A4035" }}>Your bag is empty</p>
                    <p className="text-xs" style={{ color: "#8C7B6B" }}>Add some beautiful pieces!</p>
                  </div>
                  <button onClick={() => setCartOpen(false)} className="px-6 py-2.5 rounded-full text-sm font-bold"
                    style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 4px 16px rgba(207,161,141,0.4)" }}>
                    Shop Now
                  </button>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="flex gap-3 p-3 rounded-xl" style={{ background: "#F8F6F2", border: "1px solid rgba(203,184,169,0.2)" }}>
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "#EFE7DD" }}>
                      <ImageWithFallback src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold leading-snug truncate" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif" }}>{item.product.name}</p>
                      <p className="text-xs font-bold mt-0.5" style={{ color: "#CFA18D" }}>₹{item.product.price}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center rounded-full overflow-hidden" style={{ border: "1px solid rgba(203,184,169,0.4)" }}>
                          <button onClick={() => updateQty(item.product.id, item.qty - 1)} className="w-7 h-7 flex items-center justify-center hover:bg-secondary" style={{ color: "#5A4035" }}><Minus size={10} /></button>
                          <span className="w-7 text-center text-xs font-bold" style={{ color: "#3D2B1F" }}>{item.qty}</span>
                          <button onClick={() => updateQty(item.product.id, item.qty + 1)} className="w-7 h-7 flex items-center justify-center hover:bg-secondary" style={{ color: "#5A4035" }}><Plus size={10} /></button>
                        </div>
                        <button onClick={() => removeFromCart(item.product.id)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors" style={{ color: "#DC2626" }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 space-y-3" style={{ borderTop: "1px solid rgba(203,184,169,0.3)" }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: "#8C7B6B" }}>Subtotal</span>
                  <span className="text-base font-bold" style={{ color: "#3D2B1F" }}>₹{cartTotal}</span>
                </div>
                <div className="text-[11px] py-1.5 px-3 rounded-lg text-center" style={{ background: "rgba(207,161,141,0.08)", color: "#8C7B6B" }}>
                  Prepaid: <strong style={{ color: "#059669" }}>FREE delivery</strong> · COD: +₹49
                </div>
                <button onClick={() => { setCartOpen(false); setPage("checkout"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="w-full py-3.5 rounded-full font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95"
                  style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 4px 20px rgba(207,161,141,0.45)" }}>
                  Proceed to Checkout →
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Navbar ─────────────────────────────────────────────────────────────────
function Navbar() {
  const { cartCount, setCartOpen, setPage, wishlist, user, login } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const scroll = (id: string) => { setPage("home"); setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 120); setMobileOpen(false); };
  const links = [
    { label: "Home", action: () => { setPage("home"); window.scrollTo({ top: 0, behavior: "smooth" }); setMobileOpen(false); } },
    { label: "Shop", action: () => { setPage("shop"); window.scrollTo({ top: 0, behavior: "smooth" }); setMobileOpen(false); } },
    { label: "New Arrivals", action: () => scroll("new-arrivals") },
    { label: "Best Sellers", action: () => scroll("bestsellers") },
    { label: "Contact Us", action: () => scroll("contact") },
  ];
  const marqueeItems = [
    "Free Shipping on Prepaid Orders",
    "COD Currently Unavailable",
    "Combo Offers Available",
    "Fast Delivery in 5–8 Days",
    "Save ₹49 — Choose Prepaid at Checkout",
    "100% Quality Guaranteed",
    "Easy 1-Day Returns",
  ];
  return (
    <>
      {/* Marquee Announcement Bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] overflow-hidden"
        style={{ background: "linear-gradient(90deg, #3D2B1F, #5A4035, #3D2B1F)", height: "32px" }}>
        <div className="marquee-track flex items-center h-full whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="inline-flex items-center text-[11px] font-semibold tracking-wide mx-6"
              style={{ color: "#E8DCC8" }}>
              {item}
              <span className="mx-6" style={{ color: "rgba(207,161,141,0.5)" }}>✦</span>
            </span>
          ))}
        </div>
      </div>
      <motion.header initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.85 }}
        className="fixed top-[32px] left-0 right-0 z-50 transition-all duration-500"
        style={{ background: scrolled ? "rgba(248,246,242,0.96)" : "rgba(248,246,242,0.6)", backdropFilter: "blur(24px)", borderBottom: scrolled ? "1px solid rgba(203,184,169,0.3)" : "1px solid transparent", boxShadow: scrolled ? "0 4px 32px rgba(207,161,141,0.1)" : "none" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-20 flex items-center justify-between">
          <button onClick={() => { setPage("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex-shrink-0">
            <ImageWithFallback src={logoImg} alt="Shri Vallabh Jewels" className="h-16 w-auto object-contain" />
          </button>
          <nav className="hidden lg:flex items-center gap-5">
            {links.map(({ label, action }) => (
              <button key={label} onClick={action} className="text-[13px] font-medium relative group whitespace-nowrap" style={{ color: "#3D2B1F" }}>
                {label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-[1.5px] transition-all duration-300 group-hover:w-full rounded-full" style={{ background: "#CFA18D" }} />
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <button onClick={() => user ? setPage("account") : login()} className="relative flex w-9 h-9 items-center justify-center rounded-full transition-colors hover:bg-secondary" style={{ color: "#5A4035" }} title={user ? "My Account" : "Login"}>
              <UserIcon size={16} />
              {user && <span className="absolute top-0 right-0 w-2 h-2 rounded-full" style={{ background: "#059669" }} />}
            </button>
            <button className="hidden md:flex relative w-9 h-9 items-center justify-center rounded-full transition-colors hover:bg-secondary" style={{ color: "#5A4035" }}>
              <Heart size={16} />
              {wishlist.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold text-white" style={{ background: "#CFA18D" }}>{wishlist.length}</span>}
            </button>
            <button onClick={() => setCartOpen(true)} className="relative flex w-9 h-9 items-center justify-center rounded-full transition-colors hover:bg-secondary" style={{ color: "#5A4035" }}>
              <ShoppingBag size={16} />
              {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold text-white" style={{ background: "#CFA18D" }}>{cartCount}</span>}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-secondary" style={{ color: "#5A4035" }}>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </motion.header>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}
            className="fixed top-16 left-0 right-0 z-40 lg:hidden px-5 py-5"
            style={{ background: "rgba(248,246,242,0.97)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(203,184,169,0.3)" }}>
            <div className="flex flex-col gap-4">
              {links.map(({ label, action }) => (
                <button key={label} onClick={action} className="text-left text-base font-semibold" style={{ color: "#3D2B1F" }}>{label}</button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Floating WhatsApp ──────────────────────────────────────────────────────
function FloatingWhatsApp() {
  return (
    <a href="https://wa.me/917801949426?text=Hi!%20I'm%20interested%20in%20your%20jewellery." target="_blank" rel="noopener noreferrer"
      className="fixed bottom-24 md:bottom-8 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1"
      style={{ background: "#25D366", boxShadow: "0 4px 20px rgba(37,211,102,0.5)" }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  );
}

// ── Sticky Mobile CTA ──────────────────────────────────────────────────────
function StickyMobileCTA({ page }: { page: Page }) {
  const { setCartOpen, setPage, cart } = useApp();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const fn = () => setShow(window.scrollY > 500);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  if (!show || page !== "home") return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex gap-3 p-3"
      style={{ background: "rgba(248,246,242,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(203,184,169,0.3)" }}>
      <button onClick={() => setCartOpen(true)} className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
        style={{ border: "1.5px solid #CFA18D", color: "#CFA18D" }}>
        <ShoppingBag size={14} /> Bag {cart.length > 0 ? `(${cart.reduce((s, i) => s + i.qty, 0)})` : ""}
      </button>
      <button onClick={() => { setPage("checkout"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        className="flex-1 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
        style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 4px 16px rgba(207,161,141,0.5)" }}>
        Buy Now
      </button>
    </div>
  );
}

// ── Hero Section ───────────────────────────────────────────────────────────
function HeroSection() {
  const countdown = useCountdown();
  const { scrollY } = useScroll();
  const imgY = useTransform(scrollY, [0, 600], [0, 80]);
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-24"
      style={{ background: "linear-gradient(135deg, #F8F6F2 0%, #EFE7DD 50%, #E8DCC8 100%)" }}>
      <div className="absolute top-1/3 right-0 w-96 h-96 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #CFA18D, transparent)", filter: "blur(80px)", transform: "translate(30%)" }} />
      <div className="absolute bottom-1/4 left-0 w-72 h-72 rounded-full opacity-15 pointer-events-none" style={{ background: "radial-gradient(circle, #E8DCC8, transparent)", filter: "blur(60px)", transform: "translate(-20%)" }} />
      <div className="max-w-7xl mx-auto px-5 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center py-20">
        <div>

          <motion.h1 initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl lg:text-[68px] leading-[1.08] mb-6" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
            <em>Jewels</em> That<br />Tell Your<br /><span className="font-semibold not-italic">Story</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="text-[15px] md:text-[17px] max-w-md leading-relaxed mb-6" style={{ color: "#6B5A4E" }}>
            Beautifully crafted jewellery designed to make you shine with confidence — for everyday wear and every precious occasion.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.72 }}
            className="flex items-center gap-3 mb-8 p-3 rounded-2xl w-fit" style={{ background: "rgba(207,161,141,0.1)", border: "1px solid rgba(207,161,141,0.25)" }}>
            <Clock size={14} style={{ color: "#CFA18D" }} />
            <span className="text-xs font-bold" style={{ color: "#6B5A4E" }}>Sale ends in:</span>
            {[{ v: countdown.h, l: "HRS" }, { v: countdown.m, l: "MIN" }, { v: countdown.s, l: "SEC" }].map(({ v, l }, i) => (
              <div key={l} className="flex items-center gap-1">
                {i > 0 && <span className="font-bold text-sm" style={{ color: "#CFA18D" }}>:</span>}
                <div className="text-center">
                  <div className="text-base font-bold w-8 text-center tabular-nums" style={{ color: "#3D2B1F" }}>{String(v).padStart(2, "0")}</div>
                  <div className="text-[8px] uppercase tracking-widest" style={{ color: "#8C7B6B" }}>{l}</div>
                </div>
              </div>
            ))}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.82 }} className="flex flex-wrap gap-4">
            <button onClick={() => document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 py-3.5 rounded-full text-sm font-bold transition-all duration-300 hover:scale-105"
              style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 6px 24px rgba(207,161,141,0.5)" }}>
              Shop Now
            </button>
            <button onClick={() => document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 py-3.5 rounded-full text-sm font-bold transition-all hover:bg-secondary flex items-center gap-2"
              style={{ border: "1.5px solid rgba(207,161,141,0.7)", color: "#CFA18D" }}>
              View Collection <ArrowRight size={14} />
            </button>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="flex flex-wrap gap-5 mt-8">
            {[{ e: "🚚", t: "Free Prepaid Delivery" }, { e: "💳", t: "COD Available" }, { e: "↩️", t: "Easy 1-Day Returns" }, { e: "🛡️", t: "Quality Guaranteed" }].map(x => (
              <div key={x.t} className="flex items-center gap-1.5 text-[11px]" style={{ color: "#8C7B6B" }}>
                {x.e} {x.t}
              </div>
            ))}
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, x: 48, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: 0.5, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ y: imgY }} className="relative flex justify-center items-center">
          <div className="absolute w-[320px] h-[320px] lg:w-[400px] lg:h-[400px] rounded-full border border-dashed opacity-20 animate-[spin_22s_linear_infinite]" style={{ borderColor: "#CFA18D" }} />
          <div className="relative w-[270px] h-[270px] sm:w-[310px] sm:h-[310px] lg:w-[370px] lg:h-[370px] rounded-[2rem] overflow-hidden animate-[float_7s_ease-in-out_infinite]"
            style={{ boxShadow: "0 40px 100px rgba(207,161,141,0.4), 0 8px 32px rgba(61,43,31,0.1)", border: "2px solid rgba(207,161,141,0.35)" }}>
            <ImageWithFallback src={pearlImg} alt="Pearl Seashell Necklace — featured piece" className="w-full h-full object-cover" />
          </div>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
            className="absolute -bottom-4 -left-4 lg:-left-10 px-4 py-3 rounded-2xl animate-[float_7s_ease-in-out_infinite_1.5s]"
            style={{ background: "rgba(252,251,248,0.94)", backdropFilter: "blur(16px)", border: "1px solid rgba(203,184,169,0.35)", boxShadow: "0 10px 32px rgba(207,161,141,0.22)" }}>
            <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "#CFA18D" }}>Bestseller · 128 reviews</p>
            <p className="text-[13px] font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Pearl Seashell Necklace</p>
            <div className="flex items-center justify-between mt-1 gap-3">
              <p className="text-xs font-bold" style={{ color: "#CFA18D" }}>₹349 <span className="line-through text-[10px] font-normal" style={{ color: "#CBB8A9" }}>₹499</span></p>
              <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} size={9} className="fill-amber-400 text-amber-400" />)}</div>
            </div>
          </motion.div>
          <div className="absolute top-4 right-4 text-xl pointer-events-none animate-[sparkle_3s_ease-in-out_infinite]" style={{ color: "#CFA18D" }}>✦</div>
          <div className="absolute top-1/3 -right-4 text-sm pointer-events-none animate-[sparkle_3s_ease-in-out_infinite_1s]" style={{ color: "#CBB8A9" }}>◆</div>
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <p className="text-[9px] uppercase tracking-[0.25em]" style={{ color: "#8C7B6B" }}>Scroll</p>
        <div className="w-px h-8 overflow-hidden" style={{ background: "rgba(207,161,141,0.2)" }}>
          <div className="w-full animate-[scrollPulse_2s_ease-in-out_infinite]" style={{ height: "40%", background: "#CFA18D" }} />
        </div>
      </motion.div>
    </section>
  );
}

// ── Trust Bar ──────────────────────────────────────────────────────────────
function TrustBar() {
  const { ref, visible } = useReveal();
  const items = [
    { Icon: Shield, label: "Secure Checkout", sub: "100% safe & encrypted" },
    { Icon: Truck, label: "Free Prepaid Delivery", sub: "Save ₹49 with prepaid" },
    { Icon: RefreshCw, label: "1-Day Easy Returns", sub: "Hassle-free returns" },
    { Icon: Package, label: "Quality Guaranteed", sub: "Each piece inspected" },
  ];
  return (
    <div ref={ref} style={{ background: "rgba(232,220,200,0.4)", borderTop: "1px solid rgba(203,184,169,0.2)", borderBottom: "1px solid rgba(203,184,169,0.2)" }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4">
          {items.map(({ Icon, label, sub }, i) => (
            <div key={i} className="flex items-center gap-3 py-3.5 px-4" style={{ borderRight: i < 3 ? "1px solid rgba(203,184,169,0.2)" : "none" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(207,161,141,0.12)" }}>
                <Icon size={14} style={{ color: "#CFA18D" }} />
              </div>
              <div>
                <p className="text-xs font-bold leading-tight" style={{ color: "#3D2B1F" }}>{label}</p>
                <p className="text-[10px]" style={{ color: "#8C7B6B" }}>{sub}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

// ── Prepaid Banner (replaced by marquee in Navbar) ────────────────────────

// ── Testimonial Card ───────────────────────────────────────────────────────
function TestiCard({ t, delay }: { t: typeof TESTIMONIALS[0]; delay: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl p-6 h-full flex flex-col"
        style={{ background: "#FCFBF8", boxShadow: "0 4px 24px rgba(207,161,141,0.1)", border: "1px solid rgba(203,184,169,0.2)" }}>
        <div className="flex mb-3">{[...Array(t.rating)].map((_, i) => <Star key={i} size={13} className="fill-amber-400 text-amber-400" />)}</div>
        <p className="text-[13px] leading-relaxed mb-4 flex-1" style={{ color: "#6B5A4E", fontStyle: "italic" }}>"{t.text}"</p>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #CFA18D, #E8DCC8)", color: "#FCFBF8" }}>
            {t.name.split(" ").map(w => w[0]).join("")}
          </div>
          <div>
            <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: "#3D2B1F" }}>
              {t.name} {t.verified && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "rgba(5,150,105,0.1)", color: "#059669" }}>✓ Verified</span>}
            </p>
            <p className="text-[10px]" style={{ color: "#8C7B6B" }}>{t.city} · Ordered: {t.order}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── FAQ Item ───────────────────────────────────────────────────────────────
function FAQItem({ faq }: { faq: typeof FAQS[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid rgba(203,184,169,0.25)" }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left gap-4">
        <span className="text-[14px] font-semibold" style={{ color: "#3D2B1F" }}>{faq.q}</span>
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
          style={{ background: open ? "#CFA18D" : "rgba(207,161,141,0.12)", color: open ? "#FCFBF8" : "#CFA18D" }}>
          <ChevronDown size={14} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <p className="pb-4 text-[13px] leading-relaxed" style={{ color: "#6B5A4E" }}>{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Brand Story ────────────────────────────────────────────────────────────
function BrandStory() {
  const { ref, visible } = useReveal();
  return (
    <section className="py-24 lg:py-32 overflow-hidden" style={{ background: "#EFE7DD" }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div ref={ref}>
            <motion.div initial={{ opacity: 0, x: -48 }} animate={visible ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}>
              <p className="text-[11px] uppercase tracking-[0.28em] mb-4 font-bold" style={{ color: "#CFA18D" }}>Our Promise</p>
              <h2 className="text-4xl md:text-5xl mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
                Timeless Elegance,<br /><em>Everyday Luxury</em>
              </h2>
              <p className="text-[15px] leading-relaxed mb-5" style={{ color: "#6B5A4E" }}>
                At Shri Vallabh Jewels, we craft beautiful jewellery that blends elegance, quality, and affordability — designed for the modern Indian woman who shines every day.
              </p>
              <p className="text-[15px] leading-relaxed mb-8" style={{ color: "#6B5A4E" }}>
                Every piece is thoughtfully designed with premium anti-tarnish coating, hypoallergenic materials, and attention to detail that makes you feel special.
              </p>

            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, x: 48 }} animate={visible ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.85, delay: 0.2 }} className="relative">
            <div className="rounded-[2rem] overflow-hidden aspect-[4/5] sm:aspect-square lg:aspect-[4/5]" style={{ boxShadow: "0 20px 60px rgba(207,161,141,0.25)", border: "1px solid rgba(207,161,141,0.3)" }}>
              <ImageWithFallback src={storyImg} alt="Shri Vallabh Jewels - Timeless Elegance" className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── Combo Section ──────────────────────────────────────────────────────────
function ComboSection() {
  const { addToCart, combos, setCartOpen } = useApp();
  
  if (combos.length === 0) return null;

  return (
    <section className="py-24 lg:py-28" style={{ background: "linear-gradient(135deg, #EFE7DD, #F8F6F2, #E8DCC8)" }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <STitle eyebrow="Bundle & Save" title="Combo Collections" subtitle="Two pieces, one perfect story — curated gift sets at special prices." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {combos.slice(0, 4).map((c, i) => (
            <Reveal key={c.id} delay={i * 0.15}>
              <div className="rounded-3xl overflow-hidden group cursor-pointer" style={{ background: "#FCFBF8", boxShadow: "0 8px 40px rgba(207,161,141,0.15)", border: "1px solid rgba(203,184,169,0.2)" }}>
                <div className={`grid ${c.imgs.length === 1 ? 'grid-cols-1' : (c.imgs.length % 3 === 0 || c.imgs.length === 5) ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {c.imgs.map((img, j) => (
                    <div key={j} className="overflow-hidden relative" style={{ paddingTop: "80%" }}>
                      <div className="absolute inset-0">
                        <ImageWithFallback src={img} alt={c.name} className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(207,161,141,0.15)", color: "#CFA18D" }}>Combo Set</span>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(5,150,105,0.1)", color: "#059669" }}>Save ₹{c.saving}</span>
                  </div>
                  <h3 className="text-xl mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>{c.name}</h3>
                  <p className="text-xs mb-4 leading-relaxed" style={{ color: "#6B5A4E" }}>{c.desc}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold" style={{ color: "#CFA18D" }}>₹{c.price}</span>
                      <span className="text-sm line-through" style={{ color: "#CBB8A9" }}>₹{c.original}</span>
                    </div>
                    <button onClick={() => { addToCart({ ...c, originalPrice: c.original, image: c.imgs[0], description: c.desc } as unknown as Product); setCartOpen(true); toast.success("Combo set added to bag! ✦"); }}
                      className="px-5 py-2.5 rounded-full text-xs font-bold transition-all hover:scale-105"
                      style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 2px 10px rgba(207,161,141,0.4)" }}>
                      Add Combo
                    </button>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Instagram Gallery ──────────────────────────────────────────────────────
function InstagramGallery() {
  const imgs = [pearlImg, heartImg, butterflyImg, ringImg, pearlImg, heartImg];
  return (
    <section className="py-20" style={{ background: "#F8F6F2" }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <STitle eyebrow="@shrivallabh_jewels" title="Follow Our World" subtitle="Daily drops, styling inspiration & new arrivals on Instagram." />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {imgs.map((img, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <div className="rounded-xl overflow-hidden aspect-square group cursor-pointer relative"
                style={{ boxShadow: "0 4px 16px rgba(207,161,141,0.12)" }}>
                <ImageWithFallback src={img} alt="Instagram" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "rgba(207,161,141,0.5)", backdropFilter: "blur(2px)" }}>
                  <Instagram size={20} className="text-white" />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="text-center mt-8">
          <a href="https://www.instagram.com/shrivallabh_jewels" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-105"
            style={{ border: "1.5px solid rgba(207,161,141,0.6)", color: "#CFA18D" }}>
            <Instagram size={15} /> Follow @shrivallabh_jewels
          </a>
        </div>
      </div>
    </section>
  );
}

// ── Posters Section ────────────────────────────────────────────────────────
import poster1 from "../imports/poster1.png";
import poster2 from "../imports/poster2.png";
import poster3 from "../imports/poster3.png";

function PostersSection() {
  const posters = [poster1, poster3, poster2];

  return (
    <section className="bg-[#F8F6F2]">
      <div className="grid grid-cols-1 md:grid-cols-3 w-full">
        {posters.map((src, idx) => (
          <div key={idx} className="relative aspect-[4/5] overflow-hidden">
            <img src={src} alt={`Poster ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.03]" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Shop Page ───────────────────────────────────────────────────────────────
function ShopPage() {
  const { products, combos, setPage, setSelectedProduct, addToCart, setCartOpen } = useApp();
  const [category, setCategory] = useState("All");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Ensure Combos is an option, and extract dynamic categories
  const categories = ["All", "Combos", ...Array.from(new Set(products.map(p => p.category)))];

  return (
    <div className="pt-32 pb-24 min-h-screen" style={{ background: "#F8F6F2" }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <STitle eyebrow="Discover" title="Our Complete Collection" subtitle="Explore our finely crafted pieces designed just for you." />
        
        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-colors ${category === cat ? 'bg-[#CFA18D] text-white' : 'bg-white text-[#5A4035] border border-gray-200 hover:border-[#CFA18D]'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Unified Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 lg:gap-x-8 lg:gap-y-12 mb-16">
          
          {/* Render Combos if "All" or "Combos" is selected */}
          {(category === "All" || category === "Combos") && (
            combos.map((c, i) => (
              <div key={`combo-${c.id}`} className="col-span-2 md:col-span-4 mb-4">
                <Reveal delay={0.1}>
                  <div className="rounded-3xl overflow-hidden group cursor-pointer bg-[#FCFBF8] border shadow-sm flex flex-col md:flex-row border-gray-200">
                    <div className={`grid ${c.imgs.length === 1 ? 'grid-cols-1' : (c.imgs.length % 3 === 0 || c.imgs.length === 5) ? 'grid-cols-3' : 'grid-cols-2'} md:w-2/5`}>
                      {c.imgs.map((img, j) => (
                        <div key={j} className="overflow-hidden relative" style={{ paddingTop: "80%" }}>
                          <img src={img} alt={c.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700" />
                        </div>
                      ))}
                    </div>
                    <div className="p-6 md:p-8 flex flex-col justify-center md:w-3/5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(207,161,141,0.15)", color: "#CFA18D" }}>Combo Set</span>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(5,150,105,0.1)", color: "#059669" }}>Save ₹{c.saving}</span>
                      </div>
                      <h3 className="text-2xl font-serif text-[#3D2B1F] mb-3">{c.name}</h3>
                      <p className="text-sm text-gray-600 mb-6">{c.desc}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-[#CFA18D]">₹{c.price}</span>
                          <span className="text-sm line-through text-[#CBB8A9]">₹{c.original}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); addToCart({ ...c, originalPrice: c.original, image: c.imgs[0], description: c.desc } as unknown as Product); setCartOpen(true); toast.success("Combo set added to bag! ✦"); }}
                          className="px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-105"
                          style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 2px 10px rgba(207,161,141,0.4)" }}>
                          Add Combo
                        </button>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>
            ))
          )}

          {/* Render Products */}
          {products.filter(p => category === "All" || p.category === category).map((p, i) => (
            <ProductCard key={`prod-${p.id}`} product={p} delay={0.1} />
          ))}

        </div>
        
        {category !== "All" && category !== "Combos" && products.filter(p => p.category === category).length === 0 && (
          <div className="text-center py-20 text-gray-500">
            No products found in this category.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Product Detail Page ────────────────────────────────────────────────────
function ProductDetailPage() {
  const { setPage, addToCart, selectedProduct: p, wishlist, toggleWishlist, products, setCartOpen } = useApp();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  if (!p) return null;
  const wished = wishlist.includes(p.id);
  const allImgs = [pearlImg, heartImg, butterflyImg, ringImg];
  return (
    <div className="min-h-screen pt-24" style={{ background: "#F8F6F2" }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
        <button onClick={() => setPage("home")} className="flex items-center gap-2 text-sm mb-8 transition-colors hover:text-primary" style={{ color: "#8C7B6B" }}>
          <ChevronLeft size={16} /> Back to Shop
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Images */}
          <div>
            <div className="rounded-2xl overflow-hidden aspect-square mb-4" style={{ background: "#EFE7DD", boxShadow: "0 12px 40px rgba(207,161,141,0.2)" }}>
              <ImageWithFallback src={allImgs[activeImg]} alt={p.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-3">
              {allImgs.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-200"
                  style={{ border: activeImg === i ? "2px solid #CFA18D" : "2px solid rgba(203,184,169,0.3)", opacity: activeImg === i ? 1 : 0.7 }}>
                  <ImageWithFallback src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
          {/* Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: p.badgeColor, color: "#fff" }}>{p.badge}</span>
              <span className="text-[10px] px-2.5 py-1 rounded-full font-bold" style={{ background: "rgba(5,150,105,0.1)", color: "#059669" }}>✓ Quality Checked</span>
            </div>
            <p className="text-[11px] uppercase tracking-[0.25em] font-bold mb-2" style={{ color: "#CFA18D" }}>{p.category}</p>
            <h1 className="text-3xl md:text-4xl mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>{p.name}</h1>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < Math.floor(p.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"} />)}</div>
              <span className="text-sm font-semibold" style={{ color: "#3D2B1F" }}>{p.rating}</span>
              <span className="text-sm" style={{ color: "#8C7B6B" }}>({p.reviews} reviews)</span>
            </div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-bold" style={{ color: "#CFA18D" }}>₹{p.price}</span>
              <span className="text-lg line-through" style={{ color: "#CBB8A9" }}>₹{p.originalPrice}</span>
              <span className="text-sm font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(207,161,141,0.12)", color: "#CFA18D" }}>
                {Math.round((1 - p.price / p.originalPrice) * 100)}% OFF
              </span>
            </div>
            <div className="mb-5"><StockIndicator stock={p.stock} /></div>
            <div className="p-4 rounded-2xl mb-6" style={{ background: "rgba(207,161,141,0.08)", border: "1px solid rgba(207,161,141,0.2)" }}>
              <div className="flex items-center gap-2 mb-2 text-sm font-bold" style={{ color: "#059669" }}>
                <Zap size={14} /> Save ₹49 — Choose Prepaid for FREE Delivery
              </div>
              <p className="text-xs" style={{ color: "#6B5A4E" }}>Prepaid: FREE delivery · COD: ₹49 extra · All India delivery in 5–8 days</p>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center rounded-full overflow-hidden" style={{ border: "1.5px solid rgba(203,184,169,0.5)" }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-secondary" style={{ color: "#5A4035" }}><Minus size={14} /></button>
                <span className="w-10 text-center font-bold" style={{ color: "#3D2B1F" }}>{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-secondary" style={{ color: "#5A4035" }}><Plus size={14} /></button>
              </div>
              <button onClick={() => { toggleWishlist(p.id); toast(wished ? "Removed from wishlist" : "Saved to wishlist ♡"); }}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ border: "1.5px solid rgba(203,184,169,0.4)", color: wished ? "#F43F5E" : "#8C7B6B" }}>
                <Heart size={16} className={wished ? "fill-rose-400" : ""} />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <button onClick={() => { addToCart(p, qty); setCartOpen(true); }}
                className="flex-1 py-3.5 rounded-full font-bold text-sm transition-all hover:scale-[1.02]"
                style={{ border: "1.5px solid #CFA18D", color: "#CFA18D" }}>
                Add to Bag
              </button>
              <button onClick={() => { addToCart(p, qty); setPage("checkout"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="flex-1 py-3.5 rounded-full font-bold text-sm transition-all hover:scale-[1.02]"
                style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 4px 20px rgba(207,161,141,0.5)" }}>
                Buy Now
              </button>
            </div>
            <div className="border-t pt-5 space-y-4" style={{ borderColor: "rgba(203,184,169,0.3)" }}>
              <div>
                <p className="text-[11px] uppercase tracking-widest font-bold mb-2" style={{ color: "#CFA18D" }}>Description</p>
                <p className="text-[13px] leading-relaxed" style={{ color: "#6B5A4E" }}>{p.description}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest font-bold mb-2" style={{ color: "#CFA18D" }}>Care Instructions</p>
                <p className="text-[13px] leading-relaxed" style={{ color: "#6B5A4E" }}>{p.care}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16">
          <STitle eyebrow="More to Love" title="You May Also Like" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {products.filter(pr => pr.id !== p.id).map((pr, i) => <ProductCard key={pr.id} product={pr} delay={i * 0.1} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Checkout Page ──────────────────────────────────────────────────────────
function CheckoutPage() {
  const { cart, cartTotal, setPage, setOrder, clearCart, user, login } = useApp();
  const [step, setStep] = useState<"delivery" | "payment">("delivery");
  const [form, setForm] = useState<DeliveryForm>({ name: user?.displayName || "", phone: "", email: user?.email || "", address: "", city: "", state: "", pincode: "" });
  const [payment, setPayment] = useState<"prepaid" | "cod">("prepaid");

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: prev.name || user.displayName || "",
        email: prev.email || user.email || ""
      }));
    }
  }, [user]);
  const [paying, setPaying] = useState(false);
  const delivery = 49;
  const total = cartTotal + (payment === "cod" ? delivery : 0);

  const placeOrder = async () => {
    if (!user) return;
    setPaying(true);
    try {
      const orderId = "SVJ-" + Math.floor(100000 + Math.random() * 900000);
      const ord: OrderData = { id: orderId, items: [...cart], delivery: { ...form }, payment, total, placed: new Date(), confirmed: false };
      
      await addDoc(collection(db, "users", user.uid, "orders"), {
        ...ord,
        placed: Timestamp.fromDate(ord.placed)
      });
      
      setOrder(ord);
      clearCart();
      setPage("confirmation");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Order error:", err);
      toast.error("Failed to place order", { description: "Please try again." });
    } finally {
      setPaying(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center" style={{ background: "#F8F6F2" }}>
        <div className="text-center bg-white p-10 rounded-2xl shadow-sm border border-[rgba(203,184,169,0.2)] max-w-md w-full mx-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(207,161,141,0.12)" }}>
            <UserIcon size={28} style={{ color: "#CFA18D" }} />
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Login Required</h2>
          <p className="text-sm mb-6" style={{ color: "#8C7B6B" }}>Please log in to your account to securely complete your purchase and track your orders.</p>
          <button onClick={login} className="w-full py-3.5 rounded-full font-bold text-sm transition-all hover:scale-[1.02]"
            style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 4px 16px rgba(207,161,141,0.4)" }}>
            Login with Google
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center" style={{ background: "#F8F6F2" }}>
        <div className="text-center">
          <p className="text-lg font-semibold mb-4" style={{ color: "#5A4035" }}>Your bag is empty</p>
          <button onClick={() => setPage("home")} className="px-6 py-3 rounded-full font-bold" style={{ background: "#CFA18D", color: "#FCFBF8" }}>Continue Shopping</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24" style={{ background: "#F8F6F2" }}>
      <div className="max-w-5xl mx-auto px-5 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => step === "delivery" ? setPage("home") : setStep("delivery")}
            className="flex items-center gap-1.5 text-sm" style={{ color: "#8C7B6B" }}>
            <ChevronLeft size={16} /> Back
          </button>
          <div className="flex-1 flex items-center gap-2">
            {[{ id: "delivery", label: "Delivery" }, { id: "payment", label: "Payment" }].map((s, i, arr) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: step === s.id || (arr.findIndex(x => x.id === step) > i) ? "#CFA18D" : "rgba(203,184,169,0.3)", color: step === s.id || (arr.findIndex(x => x.id === step) > i) ? "#fff" : "#8C7B6B" }}>
                    {arr.findIndex(x => x.id === step) > i ? <Check size={12} /> : i + 1}
                  </div>
                  <span className="text-xs font-semibold hidden sm:block" style={{ color: step === s.id ? "#3D2B1F" : "#8C7B6B" }}>{s.label}</span>
                </div>
                {i < arr.length - 1 && <div className="flex-1 h-px w-6" style={{ background: "rgba(203,184,169,0.4)" }} />}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#059669" }}>
            <Shield size={13} /> Secure Checkout
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            {step === "delivery" && (
              <div className="rounded-2xl p-6" style={{ background: "#FCFBF8", boxShadow: "0 4px 24px rgba(207,161,141,0.1)", border: "1px solid rgba(203,184,169,0.2)" }}>
                <h2 className="text-xl font-bold mb-5" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Delivery Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {([["name", "Full Name", "Priya Sharma"], ["phone", "Mobile Number", "10-digit number"], ["email", "Email Address", "optional"], ["address", "Full Address", "House, Street, Locality"], ["city", "City", "Mumbai"], ["state", "State", "Maharashtra"], ["pincode", "PIN Code", "400001"]] as [keyof DeliveryForm, string, string][]).map(([field, label, ph]) => (
                    <div key={field} className={field === "address" ? "sm:col-span-2" : ""}>
                      <label className="block text-[10px] uppercase tracking-[0.2em] font-bold mb-1.5" style={{ color: "#8C7B6B" }}>{label}</label>
                      {field === "address" ? (
                        <textarea value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} rows={2} placeholder={ph}
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none transition-all focus:ring-2 ring-[#CFA18D]"
                          style={{ border: "1px solid rgba(203,184,169,0.4)", background: "#F8F6F2", color: "#3D2B1F" }} />
                      ) : (
                        <input type={field === "phone" ? "tel" : field === "email" ? "email" : "text"} value={form[field]} placeholder={ph}
                          onChange={e => setForm({ ...form, [field]: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2 ring-[#CFA18D]"
                          style={{ border: "1px solid rgba(203,184,169,0.4)", background: "#F8F6F2", color: "#3D2B1F" }} />
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={() => { if (!form.name || !form.phone || !form.address || !form.city || !form.pincode) { toast.error("Please fill all required fields"); return; } if (form.phone.length < 10) { toast.error("Enter a valid 10-digit mobile number"); return; } setStep("payment"); }}
                  className="mt-6 w-full py-3.5 rounded-full font-bold text-sm transition-all hover:scale-[1.02]"
                  style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 4px 16px rgba(207,161,141,0.4)" }}>
                  Continue to Payment →
                </button>
              </div>
            )}

            {step === "payment" && (
              <div className="rounded-2xl p-6" style={{ background: "#FCFBF8", boxShadow: "0 4px 24px rgba(207,161,141,0.1)", border: "1px solid rgba(203,184,169,0.2)" }}>
                <h2 className="text-xl font-bold mb-5" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Payment Method</h2>
                <div className="space-y-3 mb-5">
                  <button onClick={() => setPayment("prepaid")} className="w-full p-4 rounded-xl flex items-center gap-3 text-left transition-all"
                    style={{ border: payment === "prepaid" ? "2px solid #CFA18D" : "2px solid rgba(203,184,169,0.3)", background: payment === "prepaid" ? "rgba(207,161,141,0.06)" : "#fff" }}>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: "#CFA18D" }}>
                      {payment === "prepaid" && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#CFA18D" }} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: "#3D2B1F" }}>Prepaid (UPI / Card / Net Banking)</p>
                      <p className="text-xs font-bold" style={{ color: "#059669" }}>🎉 FREE Delivery — Save ₹49!</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs line-through" style={{ color: "#CBB8A9" }}>₹49</p>
                      <p className="text-xs font-bold" style={{ color: "#059669" }}>FREE</p>
                    </div>
                  </button>
                  <div className="w-full p-4 rounded-xl flex items-center gap-3 text-left opacity-50 cursor-not-allowed"
                    style={{ border: "2px solid rgba(203,184,169,0.2)", background: "rgba(203,184,169,0.05)" }}>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: "rgba(203,184,169,0.4)" }}>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: "#8C7B6B" }}>Cash on Delivery</p>
                      <p className="text-xs font-semibold" style={{ color: "#DC2626" }}>Currently Unavailable</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold" style={{ color: "#8C7B6B" }}>+₹49</p>
                    </div>
                  </div>
                </div>


                <button onClick={placeOrder}
                  disabled={paying}
                  className="w-full py-3.5 rounded-full font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-70 mt-6"
                  style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 4px 16px rgba(207,161,141,0.4)" }}>
                  {paying ? "Processing…" : `Pay ₹${total} Now →`}
                </button>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <div className="rounded-2xl p-5 sticky top-20" style={{ background: "#FCFBF8", boxShadow: "0 4px 24px rgba(207,161,141,0.1)", border: "1px solid rgba(203,184,169,0.2)" }}>
              <h3 className="font-bold text-base mb-4" style={{ color: "#3D2B1F" }}>Order Summary</h3>
              <div className="space-y-3 mb-4">
                {cart.map(item => (
                  <div key={item.product.id} className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "#EFE7DD" }}>
                      <ImageWithFallback src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold leading-snug truncate" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif" }}>{item.product.name}</p>
                      <p className="text-[10px]" style={{ color: "#8C7B6B" }}>Qty: {item.qty}</p>
                    </div>
                    <p className="text-xs font-bold" style={{ color: "#CFA18D" }}>₹{item.product.price * item.qty}</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-2" style={{ borderColor: "rgba(203,184,169,0.3)" }}>
                <div className="flex justify-between text-xs"><span style={{ color: "#8C7B6B" }}>Subtotal</span><span style={{ color: "#3D2B1F" }}>₹{cartTotal}</span></div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#8C7B6B" }}>Delivery</span>
                  <span className="font-bold" style={{ color: payment === "prepaid" ? "#059669" : "#DC2626" }}>
                    {payment === "prepaid" ? "FREE" : `₹${delivery}`}
                  </span>
                </div>
                {payment === "prepaid" && <div className="text-[10px] text-center py-1 rounded" style={{ background: "rgba(5,150,105,0.08)", color: "#059669" }}>🎉 You saved ₹49 with prepaid!</div>}
                <div className="flex justify-between text-sm font-bold pt-1 border-t" style={{ borderColor: "rgba(203,184,169,0.3)", color: "#3D2B1F" }}>
                  <span>Total</span><span style={{ color: "#CFA18D" }}>₹{total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Order Confirmation ─────────────────────────────────────────────────────
function OrderConfirmation() {
  const { order, setPage } = useApp();
  if (!order) return null;
  const delivery = new Date(order.placed);
  delivery.setDate(delivery.getDate() + 7);
  return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-5" style={{ background: "#F8F6F2" }}>
      <div className="max-w-md w-full text-center py-16">
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 15, stiffness: 200 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "linear-gradient(135deg, #CFA18D, #E8DCC8)", boxShadow: "0 8px 32px rgba(207,161,141,0.4)" }}>
          <Check size={36} className="text-white" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <p className="text-[11px] uppercase tracking-[0.3em] font-bold mb-2" style={{ color: "#CFA18D" }}>Order Placed & Confirmed!</p>
          <h1 className="text-3xl mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Thank You, {order.delivery.name.split(" ")[0]}! 🎉</h1>
          <p className="text-sm font-semibold mb-2" style={{ color: "#5A4035" }}>Your order will be packed and shipped soon.</p>
          <p className="text-sm mb-6" style={{ color: "#6B5A4E" }}>Delivery will be done in <strong style={{ color: "#CFA18D" }}>5-8 days</strong> and you will receive your parcel. For more details, contact us on WhatsApp.</p>
          <div className="rounded-2xl p-5 mb-6 text-left" style={{ background: "#FCFBF8", border: "1px solid rgba(203,184,169,0.3)", boxShadow: "0 4px 20px rgba(207,161,141,0.1)" }}>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "#8C7B6B" }}>Order ID</p><p className="font-bold" style={{ color: "#3D2B1F" }}>{order.id}</p></div>
              <div><p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "#8C7B6B" }}>Payment</p><p className="font-bold capitalize" style={{ color: "#3D2B1F" }}>{order.payment === "cod" ? "Cash on Delivery" : "Prepaid"}</p></div>
              <div><p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "#8C7B6B" }}>Total Paid</p><p className="font-bold" style={{ color: "#CFA18D" }}>₹{order.total}</p></div>
              <div><p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "#8C7B6B" }}>Est. Delivery</p><p className="font-bold" style={{ color: "#3D2B1F" }}>{delivery.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p></div>
            </div>
            <div className="mt-3 pt-3 border-t" style={{ borderColor: "rgba(203,184,169,0.3)" }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#8C7B6B" }}>Delivering to</p>
              <p className="text-sm" style={{ color: "#3D2B1F" }}>{order.delivery.address}, {order.delivery.city}, {order.delivery.state} — {order.delivery.pincode}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => setPage("account")} className="w-full py-3 rounded-full font-bold text-sm"
              style={{ border: "1.5px solid #CFA18D", color: "#CFA18D" }}>
              View Order History
            </button>
            <button onClick={() => setPage("home")} className="w-full py-3 rounded-full font-bold text-sm"
              style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 4px 16px rgba(207,161,141,0.4)" }}>
              Continue Shopping
            </button>
            <a href="https://wa.me/917801949426" className="text-sm font-semibold flex items-center justify-center gap-2" style={{ color: "#25D366" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Need help? Chat on WhatsApp
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}



// ── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  const { setPage } = useApp();
  const scroll = (id: string) => { setPage("home"); setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 120); };
  return (
    <footer style={{ background: "#3D2B1F" }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="mb-4 p-3 rounded-xl inline-block" style={{ background: "rgba(255,255,255,0.07)" }}>
              <ImageWithFallback src={logoImg} alt="Shri Vallabh Jewels" className="h-14 w-auto object-contain" style={{ filter: "brightness(0) invert(1)" }} />
            </div>
            <p className="text-[13px] leading-relaxed mb-5" style={{ color: "rgba(239,231,221,0.65)" }}>
              Beautifully crafted jewellery designed to make you shine with confidence — for everyday wear and every precious occasion.
            </p>
            <div className="space-y-2">
              {[{ Icon: Phone, t: "+91 7801949426" }, { Icon: Mail, t: "shrivallabhjewels@gmail.com" }, { Icon: Instagram, t: "@shrivallabh_jewels", link: "https://instagram.com/shrivallabh_jewels" }].map(({ Icon, t, link }) => (
                <div key={t} className="flex items-center gap-2.5 text-[13px]" style={{ color: "rgba(239,231,221,0.65)" }}>
                  <Icon size={13} style={{ color: "#CFA18D" }} />
                  {link ? (
                    <a href={link} target="_blank" rel="noopener noreferrer" className="hover:text-[#CFA18D] transition-colors">
                      {t}
                    </a>
                  ) : (
                    <span>{t}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          {[
            { title: "Shop", links: [["shop", "All Jewellery"], ["featured", "Necklaces"], ["featured", "Rings"], ["featured", "Combo Sets"], ["new-arrivals", "New Arrivals"]] },
            { title: "Quick Links", links: [["bestsellers", "Best Sellers"], ["contact", "About Us"], ["contact", "Contact Us"]] },
            { title: "Policies", links: [["contact", "Shipping Policy"], ["contact", "Return Policy"], ["contact", "Privacy Policy"], ["contact", "Terms of Service"]] },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-[11px] uppercase tracking-[0.25em] font-bold mb-5" style={{ color: "#CFA18D" }}>{title}</h4>
              <ul className="space-y-2.5">
                {links.map(([id, label]) => (
                  <li key={label}><button onClick={() => id === "shop" ? setPage("shop") : scroll(id)} className="text-[13px] hover:text-[#CFA18D] transition-colors text-left" style={{ color: "rgba(239,231,221,0.6)" }}>{label}</button></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-5 mb-10" style={{ background: "rgba(207,161,141,0.1)", border: "1px solid rgba(207,161,141,0.2)" }}>
          <div className="flex flex-col md:flex-row items-center gap-5">
            <div className="flex-1">
              <p className="text-base font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#EFE7DD" }}>Join the Inner Circle</p>
              <p className="text-xs" style={{ color: "rgba(239,231,221,0.6)" }}>Early access, exclusive drops & styling tips straight to your inbox.</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <input type="email" placeholder="your@email.com" className="flex-1 md:w-56 px-4 py-2.5 rounded-full text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(207,161,141,0.3)", color: "#EFE7DD" }} />
              <button onClick={() => toast.success("Welcome! ✦")} className="px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all hover:scale-105"
                style={{ background: "#CFA18D", color: "#FCFBF8" }}>
                Subscribe
              </button>
            </div>
          </div>
        </div>
        <div className="border-t pt-6 flex flex-col items-center justify-center gap-3" style={{ borderColor: "rgba(203,184,169,0.15)" }}>
          <p className="text-[11px]" style={{ color: "rgba(239,231,221,0.35)" }}>© 2026 Shri Vallabh Jewels. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// ── Home Page ──────────────────────────────────────────────────────────────
function HomePage() {
  const { products, setPage } = useApp();
  return (
    <>
      {/* Marquee banner is now fixed above the navbar */}
      <HeroSection />
      <TrustBar />
      <PostersSection />
      <section id="featured" className="py-24 lg:py-32" style={{ background: "#F8F6F2" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <STitle eyebrow="Handpicked for You" title="Featured Collections" subtitle="Our most-loved pieces, curated for timeless elegance." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {products.filter(p => p.isFeatured).map((p, i) => <ProductCard key={p.id} product={p} delay={i * 0.12} />)}
            {products.filter(p => p.isFeatured).length === 0 && <p className="text-gray-400 text-sm col-span-3 text-center">No featured products selected.</p>}
          </div>
          <div className="text-center"><Reveal><button onClick={() => { window.scrollTo(0, 0); setPage("shop"); }} className="px-8 py-3.5 rounded-full text-sm font-bold transition-all hover:scale-105" style={{ border: "1.5px solid #CFA18D", color: "#CFA18D" }}>Our Complete Collection</button></Reveal></div>
        </div>
      </section>
      <BrandStory />
      <section id="bestsellers" className="py-24 lg:py-32" style={{ background: "#EFE7DD" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <STitle eyebrow="Most Loved" title="Best Sellers" subtitle="The pieces our customers keep coming back for." />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {products.filter(p => p.isBestseller).map((p, i) => <ProductCard key={p.id} product={p} delay={i * 0.1} />)}
            {products.filter(p => p.isBestseller).length === 0 && <p className="text-gray-400 text-sm col-span-4 text-center">No bestsellers selected.</p>}
          </div>
        </div>
      </section>
      <section id="new-arrivals" className="py-24 lg:py-32" style={{ background: "#F8F6F2" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <STitle eyebrow="Fresh In" title="New Arrivals" subtitle="Just landed — discover what's new in our latest drop." />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {products.filter(p => p.isNewArrival).map((p, i) => <ProductCard key={p.id} product={{ ...p, badge: p.badge || "New In" }} delay={i * 0.1} />)}
            {products.filter(p => p.isNewArrival).length === 0 && <p className="text-gray-400 text-sm col-span-4 text-center">No new arrivals selected.</p>}
          </div>
        </div>
      </section>
      <ComboSection />
      <section className="py-24 lg:py-32" style={{ background: "#EFE7DD" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <STitle eyebrow="Customer Love" title="What Our Customers Say" subtitle="4.9★ average across 400+ genuine reviews." />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {TESTIMONIALS.map((t, i) => <TestiCard key={t.id} t={t} delay={i * 0.1} />)}
          </div>
        </div>
      </section>
      <InstagramGallery />
      <section className="py-24 lg:py-28" style={{ background: "#EFE7DD" }}>
        <div className="max-w-3xl mx-auto px-5 lg:px-8">
          <STitle eyebrow="Questions Answered" title="FAQs" subtitle="Everything you need to know before shopping with us." />
          <div>{FAQS.map((faq, i) => <FAQItem key={i} faq={faq} />)}</div>
        </div>
      </section>
      <section id="contact" className="py-24 lg:py-32" style={{ background: "#F8F6F2" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <Reveal>
              <p className="text-[11px] uppercase tracking-[0.28em] mb-4 font-bold" style={{ color: "#CFA18D" }}>Get in Touch</p>
              <h2 className="text-4xl md:text-5xl mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>We'd Love to<br /><em>Hear From You</em></h2>
              <p className="text-[15px] leading-relaxed mb-10" style={{ color: "#6B5A4E" }}>Questions, custom orders, or just want to say hello — we're always here.</p>
              {[{ Icon: Phone, label: "WhatsApp", val: "+91 7801949426" }, { Icon: Mail, label: "Email", val: "shrivallabhjewels@gmail.com" }, { Icon: Instagram, label: "Instagram", val: "@shrivallabh_jewels" }].map(({ Icon, label, val }) => (
                <div key={label} className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(207,161,141,0.12)" }}>
                    <Icon size={15} style={{ color: "#CFA18D" }} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest" style={{ color: "#8C7B6B" }}>{label}</p>
                    <p className="text-sm font-semibold" style={{ color: "#3D2B1F" }}>{val}</p>
                  </div>
                </div>
              ))}
            </Reveal>
            <Reveal delay={0.15}>
              <ContactForm />
            </Reveal>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", message: "" });
  return (
    <form onSubmit={e => { e.preventDefault(); toast.success("Message sent! We'll reply within 24 hours."); setF({ name: "", email: "", message: "" }); }} className="flex flex-col gap-4">
      {[["name", "Your Name", "text", "Priya Sharma"], ["email", "Email Address", "email", "priya@email.com"]].map(([k, l, t, p]) => (
        <div key={k}>
          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold mb-1.5" style={{ color: "#8C7B6B" }}>{l}</label>
          <input type={t} required value={f[k as "name" | "email"]} onChange={e => setF({ ...f, [k]: e.target.value })} placeholder={p}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 ring-[#CFA18D]"
            style={{ border: "1px solid rgba(203,184,169,0.4)", background: "#FCFBF8", color: "#3D2B1F" }} />
        </div>
      ))}
      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold mb-1.5" style={{ color: "#8C7B6B" }}>Message</label>
        <textarea required rows={4} value={f.message} onChange={e => setF({ ...f, message: e.target.value })} placeholder="Tell us how we can help..."
          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none focus:ring-2 ring-[#CFA18D]"
          style={{ border: "1px solid rgba(203,184,169,0.4)", background: "#FCFBF8", color: "#3D2B1F" }} />
      </div>
      <button type="submit" className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
        style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 4px 16px rgba(207,161,141,0.4)" }}>
        Send Message <Send size={14} />
      </button>
    </form>
  );
}

// ── Account / Order History Page ───────────────────────────────────────────
function AccountPage() {
  const { user, logout, setPage } = useApp();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPage("home");
      return;
    }
    const fetchOrders = async () => {
      try {
        const q = query(collection(db, "users", user.uid, "orders"), orderBy("placed", "desc"));
        const snapshot = await getDocs(q);
        const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrders(fetchedOrders);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user, setPage]);

  if (!user) return null;

  return (
    <div className="min-h-screen pt-28 px-5 lg:px-8 pb-20" style={{ background: "#F8F6F2" }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between mb-8 pb-8 border-b" style={{ borderColor: "rgba(203,184,169,0.3)" }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold uppercase" style={{ background: "rgba(207,161,141,0.15)", color: "#CFA18D" }}>
              {user.displayName?.charAt(0) || user.email?.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>{user.displayName || "My Account"}</h1>
              <p className="text-sm" style={{ color: "#8C7B6B" }}>{user.email}</p>
            </div>
          </div>
          <button onClick={logout} className="px-6 py-2.5 rounded-full text-sm font-bold border transition-all hover:bg-[rgba(207,161,141,0.1)] w-fit"
            style={{ borderColor: "#CFA18D", color: "#CFA18D" }}>
            Sign Out
          </button>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Order History</h2>
          
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#CFA18D", borderTopColor: "transparent" }} />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: "#FCFBF8", border: "1px dashed rgba(203,184,169,0.4)" }}>
              <Package size={40} className="mx-auto mb-4" style={{ color: "rgba(207,161,141,0.5)" }} />
              <p className="text-lg font-semibold mb-2" style={{ color: "#3D2B1F" }}>No orders yet</p>
              <p className="text-sm mb-6" style={{ color: "#8C7B6B" }}>When you place orders, they will appear here.</p>
              <button onClick={() => setPage("home")} className="px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
                style={{ background: "#CFA18D", color: "#FCFBF8" }}>
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {orders.map((ord, idx) => (
                <div key={idx} className="rounded-2xl p-5" style={{ background: "#FCFBF8", border: "1px solid rgba(203,184,169,0.3)", boxShadow: "0 4px 20px rgba(207,161,141,0.05)" }}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b" style={{ borderColor: "rgba(203,184,169,0.2)" }}>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#8C7B6B" }}>Order ID</p>
                      <p className="font-bold" style={{ color: "#3D2B1F" }}>{ord.id || ord.orderId || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#8C7B6B" }}>Date</p>
                      <p className="font-semibold" style={{ color: "#5A4035" }}>
                        {ord.placed ? new Date(ord.placed.seconds * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#8C7B6B" }}>Total</p>
                      <p className="font-bold text-lg" style={{ color: "#CFA18D" }}>₹{ord.total}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {ord.items?.map((item: CartItem, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <img src={item.product.image} alt="" className="w-12 h-12 rounded-lg object-cover bg-[#F8F6F2]" />
                        <div className="flex-1">
                          <p className="text-sm font-bold leading-tight line-clamp-1" style={{ color: "#3D2B1F" }}>{item.product.name}</p>
                          <p className="text-xs" style={{ color: "#8C7B6B" }}>Qty: {item.qty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ borderColor: "rgba(203,184,169,0.2)" }}>
                    <p className="text-xs font-semibold flex items-center gap-2" style={{ color: "#8C7B6B" }}>
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: "rgba(37,211,102,0.15)", color: "#25D366" }}>
                        <MessageCircle size={12} />
                      </span>
                      For more details or tracking orders, reach out to us on WhatsApp
                    </p>
                    <a href="https://wa.me/917801949426" target="_blank" rel="noopener noreferrer" 
                      className="text-xs font-bold px-5 py-2.5 rounded-full inline-block text-center transition-all hover:scale-105" 
                      style={{ background: "#25D366", color: "#FFF", boxShadow: "0 2px 10px rgba(37,211,102,0.25)" }}>
                      Contact on WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ── Admin Page ─────────────────────────────────────────────────────────────
function AdminPage() {
  const { products, combos } = useApp();
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [tab, setTab] = useState<"products"|"combos"|"orders">("products");

  const [editing, setEditing] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({});
  
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [comboData, setComboData] = useState<Partial<Combo>>({});
  
  const [loading, setLoading] = useState(false);
  const [ordersList, setOrdersList] = useState<any[]>([]);

  useEffect(() => {
    if (tab === "orders" && authed) {
      const q = query(collectionGroup(db, "orders"));
      const unsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const fetched = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, ref: doc.ref }));
          // Sort by placed date desc
          fetched.sort((a: any, b: any) => {
            const dateA = a.placed?.toMillis ? a.placed.toMillis() : 0;
            const dateB = b.placed?.toMillis ? b.placed.toMillis() : 0;
            return dateB - dateA;
          });
          setOrdersList(fetched);
        } else {
          setOrdersList([]);
        }
      }, (error) => {
        toast.error("Permissions error fetching orders", { description: "Please update your Firestore rules to allow reading the 'orders' collectionGroup." });
      });
      return () => unsub();
    }
  }, [tab, authed]);

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F2]">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-sm w-full">
          <h2 className="text-xl font-bold mb-4" style={{ color: "#3D2B1F" }}>Admin Access</h2>
          <input type="password" placeholder="Enter Password" value={pwd} onChange={e => setPwd(e.target.value)} 
            className="border p-3 rounded w-full mb-4 text-center" onKeyDown={e => e.key === 'Enter' && (pwd === '1212' ? setAuthed(true) : toast.error("Incorrect Password"))} />
          <button onClick={() => pwd === '1212' ? setAuthed(true) : toast.error("Incorrect Password")} className="w-full py-3 bg-black text-white font-bold rounded">Login</button>
        </div>
      </div>
    );
  }

  const handleEdit = (p: Product) => { setEditing(p); setFormData(p); };
  const handleAddNew = () => { 
    setEditing({ id: Date.now(), name: "", subtitle: "", description: "", price: 0, originalPrice: 0, category: "Necklace", image: "", badge: "", badgeColor: "#CFA18D", stock: 10, rating: 5, reviews: 0, care: "", isFeatured: false, isBestseller: false, isNewArrival: false }); 
    setFormData({ id: Date.now(), name: "", subtitle: "", description: "", price: 0, originalPrice: 0, category: "Necklace", image: "", badge: "", badgeColor: "#CFA18D", stock: 10, rating: 5, reviews: 0, care: "", isFeatured: false, isBestseller: false, isNewArrival: false });
  };
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try { await deleteDoc(doc(db, "products", id.toString())); toast.success("Product deleted"); } 
    catch (e: any) { toast.error("Error", { description: e.message }); }
  };
  const toggleOrderConfirmed = async (o: any) => {
    try { await updateDoc(o.ref, { confirmed: !o.confirmed }); toast.success(o.confirmed ? "Order marked as unconfirmed" : "Order confirmed"); } 
    catch (e: any) { toast.error("Error", { description: e.message }); }
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const MAX_WIDTH = 800;
        let width = img.width; let height = img.height;
        if (width > MAX_WIDTH) { height = height * (MAX_WIDTH / width); width = MAX_WIDTH; }
        canvas.width = width; canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        setFormData(prev => ({ ...prev, image: canvas.toDataURL("image/jpeg", 0.7) }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
  const saveProduct = async () => {
    if (!formData.name || !formData.image) return toast.error("Name and Image are required");
    setLoading(true);
    try { await setDoc(doc(db, "products", formData.id!.toString()), formData); toast.success("Product saved!"); setEditing(null); } 
    catch (e: any) { toast.error("Save failed", { description: e.message }); }
    setLoading(false);
  };

  const handleEditCombo = (c: Combo) => { setEditingCombo(c); setComboData(c); };
  const handleAddCombo = () => {
    setEditingCombo({ id: Date.now().toString(), name: "", desc: "", price: 0, original: 0, saving: 0, imgs: [] });
    setComboData({ id: Date.now().toString(), name: "", desc: "", price: 0, original: 0, saving: 0, imgs: [] });
  };
  const handleDeleteCombo = async (id: string) => {
    if (!confirm("Delete combo?")) return;
    await deleteDoc(doc(db, "combos", id));
  };
  const saveCombo = async () => {
    if (!comboData.name || !comboData.imgs?.length) return toast.error("Name and Images required");
    setLoading(true);
    try { await setDoc(doc(db, "combos", comboData.id!), comboData); toast.success("Combo saved!"); setEditingCombo(null); } 
    catch(e: any) { toast.error(e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen pt-28 px-5 lg:px-8 bg-[#F8F6F2]">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Admin Panel</h1>
          <div className="flex gap-2 bg-white rounded-lg p-1 border">
            <button onClick={() => setTab("products")} className={`px-4 py-1.5 rounded-md text-sm font-bold ${tab === "products" ? "bg-black text-white" : "text-gray-500"}`}>Products</button>
            <button onClick={() => setTab("combos")} className={`px-4 py-1.5 rounded-md text-sm font-bold ${tab === "combos" ? "bg-black text-white" : "text-gray-500"}`}>Combos</button>
            <button onClick={() => setTab("orders")} className={`px-4 py-1.5 rounded-md text-sm font-bold ${tab === "orders" ? "bg-black text-white" : "text-gray-500"}`}>Orders</button>
          </div>
        </div>

        {tab === "products" && (
          <>
            <div className="flex justify-end mb-4">
              <button onClick={handleAddNew} className="px-5 py-2.5 bg-[#CFA18D] text-white rounded-xl font-bold text-sm">+ Add Product</button>
            </div>
            {editing ? (
              <div className="bg-white p-6 rounded-2xl shadow-sm border mb-8">
                <h2 className="text-xl font-bold mb-4">Edit Product</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input placeholder="Product Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="border p-2 rounded" />
                  <input placeholder="Subtitle" value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} className="border p-2 rounded" />
                  <input type="number" placeholder="Discounted Price" value={formData.price || ''} onChange={e => { const p = Number(e.target.value); setFormData({ ...formData, price: p, originalPrice: p * 2 }); }} className="border p-2 rounded" />
                  <select value={formData.category || ""} onChange={e => setFormData({ ...formData, category: e.target.value })} className="border p-2 rounded bg-white">
                    <option value="" disabled>Select Category</option>
                    <option value="Necklace">Necklace</option>
                    <option value="Ring">Ring</option>
                    <option value="Bracelet">Bracelet</option>
                    <option value="Combo">Combo</option>
                    <option value="Others">Others</option>
                  </select>
                  <input placeholder="Badge (e.g. Bestseller)" value={formData.badge} onChange={e => setFormData({ ...formData, badge: e.target.value })} className="border p-2 rounded" />
                  
                  <div className="col-span-1 md:col-span-2 flex flex-wrap gap-4 py-2 border-y my-2">
                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                      <input type="checkbox" checked={formData.isFeatured || false} onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })} /> Show in Featured
                    </label>
                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                      <input type="checkbox" checked={formData.isBestseller || false} onChange={e => setFormData({ ...formData, isBestseller: e.target.checked })} /> Show in Best Sellers
                    </label>
                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                      <input type="checkbox" checked={formData.isNewArrival || false} onChange={e => setFormData({ ...formData, isNewArrival: e.target.checked })} /> Show in New Arrivals
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <input placeholder="Badge Color (e.g. #CFA18D)" value={formData.badgeColor} onChange={e => setFormData({ ...formData, badgeColor: e.target.value })} className="border p-2 rounded flex-1" />
                    <div className="w-10 h-10 rounded border" style={{ backgroundColor: formData.badgeColor }} />
                  </div>
                  <input type="number" placeholder="Stock" value={formData.stock || ''} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} className="border p-2 rounded" />
                  <input type="number" placeholder="Rating (e.g. 4.8)" step="0.1" value={formData.rating || ''} onChange={e => setFormData({ ...formData, rating: Number(e.target.value) })} className="border p-2 rounded" />
                  <input type="number" placeholder="Total Reviews" value={formData.reviews || ''} onChange={e => setFormData({ ...formData, reviews: Number(e.target.value) })} className="border p-2 rounded" />
                  <div className="col-span-1 md:col-span-2">
                    <textarea placeholder="Description" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="border p-2 rounded w-full" />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <textarea placeholder="Care Instructions" rows={2} value={formData.care} onChange={e => setFormData({ ...formData, care: e.target.value })} className="border p-2 rounded w-full" />
                  </div>
                  <div className="col-span-1 md:col-span-2 border p-4 rounded bg-gray-50 flex gap-4 items-center">
                    {formData.image && <img src={formData.image} className="w-20 h-20 object-cover rounded" />}
                    <div>
                      <label className="block text-sm font-bold mb-1">Upload Image (Will be compressed to fit Firestore limits)</label>
                      <input type="file" accept="image/*" onChange={handleImageUpload} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={saveProduct} disabled={loading} className="px-6 py-2 bg-black text-white rounded font-bold">{loading ? "Saving..." : "Save Product"}</button>
                  <button onClick={() => setEditing(null)} className="px-6 py-2 bg-gray-200 text-black rounded font-bold">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[700px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-4 font-bold">Image</th>
                      <th className="p-4 font-bold">Name</th>
                      <th className="p-4 font-bold">Price</th>
                      <th className="p-4 font-bold">Placements</th>
                      <th className="p-4 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...products].sort((a,b) => b.id - a.id).map(p => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="p-4"><img src={p.image} className="w-12 h-12 rounded object-cover" /></td>
                        <td className="p-4 font-semibold">{p.name}</td>
                        <td className="p-4">₹{p.price}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {p.isFeatured && <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Featured</span>}
                            {p.isBestseller && <span className="text-[9px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded">Bestseller</span>}
                            {p.isNewArrival && <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded">New Arrival</span>}
                          </div>
                        </td>
                        <td className="p-4 flex gap-3">
                          <button onClick={() => handleEdit(p)} className="text-blue-600 font-bold hover:underline">Edit</button>
                          <button onClick={() => handleDelete(p.id)} className="text-red-600 font-bold hover:underline">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === "combos" && (
          <>
            <div className="flex justify-end mb-4">
              <button onClick={handleAddCombo} className="px-5 py-2.5 bg-[#CFA18D] text-white rounded-xl font-bold text-sm">+ Add Combo</button>
            </div>
            {editingCombo ? (
              <div className="bg-white p-6 rounded-2xl shadow-sm border mb-8">
                <h2 className="text-xl font-bold mb-4">Edit Combo</h2>
                <div className="grid grid-cols-1 gap-4">
                  <input placeholder="Combo Name" value={comboData.name} onChange={e => setComboData({ ...comboData, name: e.target.value })} className="border p-2 rounded" />
                  <textarea placeholder="Description" value={comboData.desc} onChange={e => setComboData({ ...comboData, desc: e.target.value })} className="border p-2 rounded" />
                  
                  <div className="border p-4 rounded bg-gray-50">
                    <p className="font-bold mb-2">Select Products for Combo</p>
                    <div className="flex flex-wrap gap-2">
                      {products.map(p => {
                        const isSel = comboData.imgs?.includes(p.image);
                        return (
                          <div key={p.id} onClick={() => {
                            let imgs = comboData.imgs || [];
                            let original = comboData.original || 0;
                            if (isSel) { imgs = imgs.filter(img => img !== p.image); original -= p.price; } 
                            else { imgs = [...imgs, p.image]; original += p.price; }
                            setComboData({ ...comboData, imgs, original });
                          }} className={`flex items-center gap-2 p-2 border rounded cursor-pointer ${isSel ? 'border-black bg-black text-white' : 'bg-white'}`}>
                            <img src={p.image} className="w-8 h-8 rounded object-cover" />
                            <span className="text-xs font-bold">{p.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold block mb-1">Total Original (Auto)</label>
                      <input type="number" readOnly value={comboData.original} className="border p-2 rounded w-full bg-gray-100" />
                    </div>
                    <div>
                      <label className="text-xs font-bold block mb-1">Combo Price</label>
                      <input type="number" value={comboData.price} onChange={e => setComboData({ ...comboData, price: Number(e.target.value), saving: (comboData.original || 0) - Number(e.target.value) })} className="border p-2 rounded w-full" />
                    </div>
                    <div>
                      <label className="text-xs font-bold block mb-1">Savings (Auto)</label>
                      <input type="number" readOnly value={comboData.saving} className="border p-2 rounded w-full bg-gray-100" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={saveCombo} disabled={loading} className="px-6 py-2 bg-black text-white rounded font-bold">{loading ? "Saving..." : "Save Combo"}</button>
                  <button onClick={() => setEditingCombo(null)} className="px-6 py-2 bg-gray-200 text-black rounded font-bold">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[700px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-4 font-bold">Images</th>
                      <th className="p-4 font-bold">Name</th>
                      <th className="p-4 font-bold">Price</th>
                      <th className="p-4 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...combos].sort((a,b) => Number(b.id) - Number(a.id)).map(c => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="p-4 flex gap-1">
                          {c.imgs.map((img, idx) => <img key={idx} src={img} className="w-8 h-8 rounded-full object-cover border" />)}
                        </td>
                        <td className="p-4 font-semibold">{c.name}</td>
                        <td className="p-4">₹{c.price} (Saved ₹{c.saving})</td>
                        <td className="p-4 flex gap-3">
                          <button onClick={() => handleEditCombo(c)} className="text-blue-600 font-bold hover:underline">Edit</button>
                          <button onClick={() => handleDeleteCombo(c.id)} className="text-red-600 font-bold hover:underline">Delete</button>
                        </td>
                      </tr>
                    ))}
                    {combos.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">No combos created yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === "orders" && (
          <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 font-bold">Order ID</th>
                  <th className="p-4 font-bold">Date</th>
                  <th className="p-4 font-bold">Customer Details</th>
                  <th className="p-4 font-bold">Items</th>
                  <th className="p-4 font-bold">Total Amount</th>
                  <th className="p-4 font-bold text-center">Confirmed</th>
                </tr>
              </thead>
              <tbody>
                {ordersList.map(o => (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-4 font-mono text-xs text-gray-500">{o.id.slice(0,8)}</td>
                    <td className="p-4">{o.placed?.toDate ? o.placed.toDate().toLocaleString() : "Just now"}</td>
                    <td className="p-4">
                      <div className="font-bold">{o.delivery?.name || o.customer?.name}</div>
                      <div className="text-xs text-gray-500">{o.delivery?.email || o.customer?.email}</div>
                      <div className="text-xs text-gray-500">{o.delivery?.phone || o.customer?.phone}</div>
                      <div className="text-xs text-gray-500 mt-1">{o.delivery?.address || o.shipping?.address}, {o.delivery?.city || o.shipping?.city} {o.delivery?.pincode || o.shipping?.pincode}</div>
                    </td>
                    <td className="p-4">
                      <ul className="list-disc pl-4 text-xs">
                        {o.items?.map((item: any, idx: number) => (
                          <li key={idx}>{item.qty}x {item.product?.name || "Combo"}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="p-4 font-bold">₹{o.total}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => toggleOrderConfirmed(o)} 
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${o.confirmed ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-50 text-red-600 hover:bg-green-50 hover:text-green-600"}`}>
                        {o.confirmed ? "Yes" : "No"}
                      </button>
                    </td>
                  </tr>
                ))}
                {ordersList.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-500">No orders found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [loading, setLoading] = useState(true);
  const [page, setPageState] = useState<Page>("home");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>(PRODUCTS); // fallback to hardcoded initially
  const [combos, setCombos] = useState<Combo[]>([]);

  useEffect(() => {
    const handleLocation = () => {
      const path = window.location.pathname;
      if (path === "/admin") setPageState("admin");
      else if (path === "/") setPageState("home");
    };
    window.addEventListener("popstate", handleLocation);
    handleLocation();
    return () => window.removeEventListener("popstate", handleLocation);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("id", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const fetched = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.data().id }) as Product);
        setProducts(fetched);
      }
    });
    const comboQ = query(collection(db, "combos"));
    const unsubCombo = onSnapshot(comboQ, (snapshot) => {
      if (!snapshot.empty) {
        setCombos(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Combo));
      }
    });
    return () => { unsub(); unsubCombo(); };
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Logged in successfully");
    } catch (err: any) {
      toast.error("Login failed", { description: err.message });
    }
  };

  const logout = async () => {
    await signOut(auth);
    setPageState("home");
    toast.success("Logged out");
  };

  const setPage = (p: Page) => { 
    setPageState(p); 
    if (p === "admin" && window.location.pathname !== "/admin") window.history.pushState({}, "", "/admin");
    if (p === "home" && window.location.pathname === "/admin") window.history.pushState({}, "", "/");
  };
  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = (p: Product, qty = 1) => setCart(prev => {
    const ex = prev.find(i => i.product.id === p.id);
    return ex ? prev.map(i => i.product.id === p.id ? { ...i, qty: i.qty + qty } : i) : [...prev, { product: p, qty }];
  });
  const removeFromCart = (id: number) => setCart(prev => prev.filter(i => i.product.id !== id));
  const updateQty = (id: number, qty: number) => qty <= 0 ? removeFromCart(id) : setCart(prev => prev.map(i => i.product.id === id ? { ...i, qty } : i));
  const clearCart = () => setCart([]);
  const toggleWishlist = (id: number) => setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // Recent order notifications
  useEffect(() => {
    if (loading || page === "admin") return;
    let idx = Math.floor(Math.random() * RECENT_ORDERS.length);
    const show = () => {
      const o = RECENT_ORDERS[idx % RECENT_ORDERS.length]; idx++;
      toast(`🛍️ ${o.name} from ${o.city} just ordered`, { description: o.product, duration: 4000 });
    };
    const t1 = setTimeout(show, 8000);
    const t2 = setInterval(show, 55000);
    return () => { clearTimeout(t1); clearInterval(t2); };
  }, [loading, page]);

  const ctx: AppCtx = { page, setPage, cart, addToCart, removeFromCart, updateQty, cartTotal, cartCount, clearCart, cartOpen, setCartOpen, selectedProduct, setSelectedProduct, order, setOrder, wishlist, toggleWishlist, user, login, logout, products, combos };

  return (
    <Ctx.Provider value={ctx}>
      <style>{`
        @keyframes marquee-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }
        .marquee-track { animation: marquee-scroll 15s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-18px); } }
        @keyframes sparkle { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.3); } }
        @keyframes scrollPulse { 0% { transform: translateY(-100%); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(250%); opacity: 0; } }
        * { font-family: 'DM Sans', sans-serif; }
        input::placeholder, textarea::placeholder { color: rgba(139,123,107,0.6); }
      `}</style>

      <AnimatePresence>
        {loading && <LoadingScreen key="loader" onDone={() => setLoading(false)} />}
      </AnimatePresence>

      {!loading && (
        <>
          <Toaster position="bottom-left" toastOptions={{ style: { background: "#FCFBF8", border: "1px solid rgba(203,184,169,0.35)", color: "#3D2B1F", borderRadius: "1rem", fontFamily: "'DM Sans', sans-serif", fontSize: "13px" } }} />
          <Navbar />
          <CartDrawer />
          <FloatingWhatsApp />
          <StickyMobileCTA page={page} />

          {page === "home" && <HomePage />}
          {page === "shop" && <ShopPage />}
          {page === "product" && <ProductDetailPage />}
          {page === "checkout" && <CheckoutPage />}
          {page === "confirmation" && <OrderConfirmation />}
          {page === "account" && <AccountPage />}
          {page === "admin" && <AdminPage />}
        </>
      )}
    </Ctx.Provider>
  );
}
