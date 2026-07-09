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
import { auth, googleProvider, db, storage } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, Timestamp, onSnapshot, setDoc, doc, deleteDoc, collectionGroup, updateDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL, uploadBytes } from "firebase/storage";

import logoImg from "../imports/IMG_5778.PNG";
import pearlImg from "../imports/ChatGPT_Image_Jun_10__2026__02_58_08_PM.png";
import heartImg from "../imports/ChatGPT_Image_Jun_10__2026__03_25_26_PM.png";
import butterflyImg from "../imports/ChatGPT_Image_Jun_8__2026__06_13_30_PM.png";
import ringImg from "../imports/ChatGPT_Image_Jun_10__2026__03_55_57_PM.png";
import storyImg from "../imports/new pn.png.png";
import heroBannerImg1 from "../imports/hero-banner 1.jpg.png";
import heroBannerImg2 from "../imports/hero-banner 2.png";
import heroBannerImg3 from "../imports/hero-banner 3 (2).png";
import heroBannerImg4 from "../imports/hero-banner 4 (2).png";
import heroBannerImg5 from "../imports/hero-banner 5 (2).png";
import promiseImg4 from "../imports/Untitled design (5).png";
import mobileEleganceImg from "../imports/mobile elegance.png";
import mobileHeroBanner1 from "../imports/mobile hero banner 1.png";
import mobileHeroBanner2 from "../imports/mobile hero banner 2.png";
import mobileHeroBanner3 from "../imports/mobile hero banner 3.png";
import mobileHeroBanner4 from "../imports/mobile hero banner 4.png";
import mobileHeroBanner5 from "../imports/mobile hero banner 5.png";
import insta1 from "../imports/insta 1.png";
import insta2 from "../imports/insta 2.png";
import insta3 from "../imports/insta 3.png";
import insta4 from "../imports/insta 4.png";
import insta5 from "../imports/insta 5.png";
import insta6 from "../imports/insta 6.png";

// ── Types ──────────────────────────────────────────────────────────────────
type Page = "home" | "shop" | "product" | "checkout" | "confirmation" | "account" | "admin" | "shipping" | "return" | "privacy" | "terms" | "wishlist" | "contact";
type Product = {
  id: number | string; name: string; subtitle: string; description: string;
  price: number; originalPrice: number; category: string; image: string; images?: string[];
  badge: string; badgeColor: string; stock: number; rating: number; reviews: number; care: string;
  isFeatured?: boolean; isBestseller?: boolean; isNewArrival?: boolean;
};
type Combo = {
  id: string; name: string; subtitle: string; description: string;
  price: number; originalPrice: number; category: string; image: string; images?: string[];
  badge: string; badgeColor: string; stock: number; rating: number; reviews: number; care: string;
  isFeatured?: boolean; isBestseller?: boolean; isNewArrival?: boolean; saving?: number;
};
type CartItem = { product: Product; qty: number };
type DeliveryForm = { name: string; phone: string; email: string; address: string; city: string; state: string; pincode: string };
type OrderData = { id: string; items: CartItem[]; delivery: DeliveryForm; payment: "prepaid" | "cod"; total: number; placed: Date; confirmed?: boolean };
type AppCtx = {
  page: Page; setPage: (p: Page) => void;
  cart: CartItem[]; addToCart: (p: Product, qty?: number) => void;
  removeFromCart: (id: number | string) => void; updateQty: (id: number | string, q: number) => void;
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
  { id: 1, name: "Pearl Seashell Necklace", subtitle: "Rose gold oceanic pendant", description: "A delicate rose gold chain holding a shimmering seashell pendant with a lustrous freshwater pearl nestled inside. Crafted with premium rose gold plating and precision-set CZ accents. Perfect for the romantic soul who loves ocean-inspired elegance.", price: 349, originalPrice: 499, category: "Necklace", image: pearlImg, badge: "Bestseller", badgeColor: "#CFA18D", stock: 3, rating: 4.9, reviews: 128, care: "Avoid water and perfume. Wipe with a soft dry cloth after use. Store in the included gift box when not wearing.", isFeatured: true },
  { id: 2, name: "Petite Heart Necklace", subtitle: "Minimalist rose gold charm", description: "A beautifully simple rose gold heart pendant on a dainty delicate chain. Timeless, minimal, and deeply meaningful — the perfect everyday piece or a heartfelt gift for someone you cherish.", price: 299, originalPrice: 399, category: "Necklace", image: heartImg, badge: "New Arrival", badgeColor: "#059669", stock: 8, rating: 4.8, reviews: 94, care: "Keep away from water, sweat, and perfume. Polish gently with a soft cloth. Store separately to avoid scratches.", isFeatured: true },
  { id: 3, name: "Butterfly Bloom Necklace", subtitle: "Gold butterfly, crystal wings", description: "A graceful gold butterfly with sparkling crystal wings, paired with a tiny floral accent. This piece celebrates freedom and feminine beauty in every movement. Rose gold plated with anti-tarnish coating.", price: 309, originalPrice: 449, category: "Necklace", image: butterflyImg, badge: "Trending", badgeColor: "#7C3AED", stock: 5, rating: 4.9, reviews: 112, care: "Avoid contact with water, chemicals, and perfumes. Wipe clean with a dry cloth. Store in gift box provided.", isFeatured: true },
  { id: 4, name: "Infinity Spark Ring", subtitle: "Sterling silver with CZ stones", description: "An elegant infinity-shaped band set with brilliant cubic zirconia stones that catch the light beautifully. Symbolising endless love and infinite possibilities — a meaningful everyday ring that complements every look.", price: 160, originalPrice: 250, category: "Ring", image: ringImg, badge: "Staff Pick", badgeColor: "#0891B2", stock: 12, rating: 4.7, reviews: 76, care: "Remove before washing hands, swimming, or exercising. Clean with a soft cloth. Avoid harsh chemicals." },
];

const TESTIMONIALS = [
  { id: 1, name: "jiya patel", city: "Mumbai", rating: 5, text: "Absolutely stunning! The necklace looked even better in person and felt very premium.", order: "Pearl Seashell Necklace", verified: true },
  { id: 2, name: "janvi jethwani", city: "Delhi", rating: 5, text: "Beautiful packaging and fast delivery. Perfect for gifting.", order: "Butterfly Bloom Necklace", verified: true },
  { id: 3, name: "Riya jani", city: "Ahmedabad", rating: 4, text: "The design is very elegant. Quality is good for the price.", order: "Petite Heart Necklace", verified: true },
  { id: 4, name: "Neha harpal", city: "Jaipur", rating: 5, text: "Loved the finishing and shine. It matched perfectly with my outfit.", order: "Infinity Spark Ring", verified: true },
  { id: 5, name: "krish R.", city: "Pune", rating: 5, text: "Very classy jewellery. I received many compliments.", order: "Pearl Seashell Necklace", verified: true },
  { id: 6, name: "Mansi Joshi", city: "Surat", rating: 4, text: "Nice product and good quality. Delivery could be a little faster.", order: "Butterfly Bloom Necklace", verified: true },
  { id: 7, name: "aarya Desai", city: "Bangalore", rating: 3, text: "Design is pretty, but the chain felt slightly delicate.", order: "Petite Heart Necklace", verified: true },
  { id: 8, name: "manav desai.", city: "Vadodara", rating: 5, text: "Amazing value and looks very premium.", order: "Infinity Spark Ring", verified: true },
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
  const [imgIndex, setImgIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const isSwiping = useRef(false);
  
  const allImages = product.images?.length ? product.images : [product.image];
  const hasMultiple = allImages.length > 1;

  useEffect(() => {
    if (!isHovered || !hasMultiple || userInteracted) return;
    const t = setInterval(() => {
      setImgIndex(prev => (prev + 1) % allImages.length);
    }, 2500);
    return () => clearInterval(t);
  }, [isHovered, hasMultiple, allImages.length, userInteracted]);

  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => { 
    touchStartX.current = e.touches[0].clientX; 
    isSwiping.current = false;
    setUserInteracted(true);
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40 && hasMultiple) {
      isSwiping.current = true;
      if (diff > 0) nextImage(e as any);
      else prevImage(e as any);
    }
    touchStartX.current = null;
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUserInteracted(true);
    setImgIndex((prev) => (prev + 1) % allImages.length);
  };
  
  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUserInteracted(true);
    setImgIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const tilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.transform = `perspective(1200px) rotateX(${((e.clientY - r.top) / r.height - 0.5) * -4}deg) rotateY(${((e.clientX - r.left) / r.width - 0.5) * 4}deg) translateZ(5px)`;
  };
  const reset = () => {
    const el = cardRef.current; if (!el) return;
    el.style.transform = "perspective(1200px) rotateX(0) rotateY(0) translateZ(0)";
  };

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (isSwiping.current) {
      e.preventDefault();
      e.stopPropagation();
      isSwiping.current = false;
      return;
    }
    if (window.matchMedia("(hover: hover)").matches || isHovered) {
      setSelectedProduct(product); setPage("product"); window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      e.preventDefault();
      setIsHovered(true);
      setUserInteracted(true); // Disable auto-animation if they tapped to reveal
    }
  };

  useEffect(() => {
    const handler = (e: TouchEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) setIsHovered(false);
    };
    document.addEventListener("touchstart", handler);
    return () => document.removeEventListener("touchstart", handler);
  }, []);

  return (
    <div ref={revealRef} className="group h-full">
      <motion.div initial={{ opacity: 0, y: 48 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }} className="h-full">
        <div ref={cardRef} onMouseMove={tilt} onMouseLeave={() => { reset(); setIsHovered(false); }} onMouseEnter={() => { if(window.matchMedia("(hover: hover)").matches) setIsHovered(true); }} className="relative bg-card rounded-2xl overflow-hidden h-full flex flex-col"
          style={{ boxShadow: isHovered ? "0 16px 40px rgba(207,161,141,0.18)" : "0 4px 20px rgba(207,161,141,0.1), 0 1px 4px rgba(61,43,31,0.04)", border: "1px solid rgba(203,184,169,0.22)", transition: "box-shadow 0.5s ease, transform 0.14s ease" }}>
          
          {product.badge && (
            <div className="absolute top-3 left-3 z-30 px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ background: product.badgeColor, color: "#fff", backdropFilter: "blur(8px)" }}>
              {product.badge}
            </div>
          )}
          <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); toast(wished ? "Removed from wishlist" : "Saved to wishlist ♡"); }}
            className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
            style={{ background: "rgba(252,251,248,0.92)", border: "1px solid rgba(203,184,169,0.2)" }}>
            <Heart size={13} className={wished ? "fill-rose-400 text-rose-400" : "text-[#8C7B6B]"} />
          </button>

          <div className="relative overflow-hidden cursor-pointer touch-pan-y" style={{ paddingTop: "115%", background: "#EFE7DD" }}
            onClick={handleInteraction} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
          >
            {allImages.map((img, i) => (
              <ImageWithFallback key={i} src={img} alt={product.name} 
                className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]" 
                style={{ opacity: i === imgIndex ? 1 : 0, transform: (i === imgIndex && isHovered) ? 'scale(1.05)' : 'scale(1)', pointerEvents: i === imgIndex ? 'auto' : 'none' }} 
              />
            ))}
            
            {hasMultiple && isHovered && (
              <>
                <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 backdrop-blur flex items-center justify-center border border-[#CFA18D]/30 transition-all hover:bg-white z-20 shadow-sm opacity-0 group-hover:opacity-100 duration-300">
                  <ChevronLeft size={14} style={{ color: "#3D2B1F" }} />
                </button>
                <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 backdrop-blur flex items-center justify-center border border-[#CFA18D]/30 transition-all hover:bg-white z-20 shadow-sm opacity-0 group-hover:opacity-100 duration-300">
                  <ChevronLeft size={14} style={{ color: "#3D2B1F", transform: "rotate(180deg)" }} />
                </button>
              </>
            )}

            <div className={`absolute bottom-0 left-0 right-0 p-4 pb-5 flex flex-col gap-2.5 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] z-20 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}
              style={{ background: "linear-gradient(to top, rgba(252,251,248,0.98) 0%, transparent 100%)" }}>
              <button onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); setPage("product"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="w-full py-3 rounded-full text-[11px] uppercase tracking-[0.2em] font-bold transition-all duration-300 hover:scale-[1.02] shadow-sm backdrop-blur-sm"
                style={{ background: "rgba(252,251,248,0.9)", border: "1px solid rgba(203,184,169,0.5)", color: "#3D2B1F" }}>
                Quick View
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex flex-col flex-1 cursor-pointer" onClick={handleInteraction}>
            <button className="text-left text-[14px] sm:text-[15px] leading-snug mb-1.5 hover:underline" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontWeight: 500 }}>
              {product.name}
            </button>
            <div className="flex items-center gap-1 mb-2">
              <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} size={10} className={i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"} />)}</div>
            </div>
            <div className="mb-2"><StockIndicator stock={product.stock} /></div>
            <div className="flex items-center justify-between mt-auto mb-3.5">
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-base font-bold" style={{ color: "#3D2B1F" }}>₹{product.price}</span>
                <span className="text-[10px] sm:text-xs line-through" style={{ color: "#CBB8A9" }}>₹{product.originalPrice}</span>
              </div>
            </div>
            
            <button onClick={(e) => { e.stopPropagation(); addToCart(product); toast.success("Added to bag ✦", { description: product.name }); }}
              className="mt-auto w-full py-2.5 sm:py-3 rounded-full text-[11px] sm:text-xs font-bold tracking-wide transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
              style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 4px 12px rgba(207,161,141,0.25)" }}>
              <ShoppingBag size={14} /> Add to Cart
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
    <motion.div className="fixed inset-0 z-[100] flex flex-col items-center justify-center w-full h-full" style={{ background: "#F8F6F2" }}
      exit={{ opacity: 0 }} transition={{ duration: 0.9 }}>
      <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="flex flex-col items-center justify-center gap-3.5 w-full text-center">
        <div className="relative flex justify-center">
          <div className="absolute inset-0 rounded-full opacity-25" style={{ background: "radial-gradient(circle, #CFA18D, transparent)", transform: "scale(2)", filter: "blur(20px)" }} />
          <ImageWithFallback src={logoImg} alt="Shri Vallabh Jewels" className="w-40 h-auto object-contain relative mx-auto" />
        </div>
        <motion.div initial={{ width: 0 }} animate={{ width: "160px" }} transition={{ duration: 1.6, delay: 0.3 }} className="h-px rounded-full mx-auto"
          style={{ background: "linear-gradient(90deg, transparent, #CFA18D, transparent)" }} />
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-[11px] uppercase tracking-[0.35em] ml-[0.35em] text-center" style={{ color: "#8C7B6B" }}>
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
              <div className="p-5 space-y-4 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]" style={{ borderTop: "1px solid rgba(203,184,169,0.3)", background: "#FCFBF8" }}>
                <div className="flex justify-between items-end mb-1">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold uppercase tracking-widest" style={{ color: "#8C7B6B" }}>Subtotal</span>
                    <span className="text-[10px] mt-0.5" style={{ color: "#A6988C" }}>Shipping & taxes calculated at checkout</span>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: "#3D2B1F" }}>₹{cartTotal}</span>
                </div>
                
                <button onClick={() => { setCartOpen(false); setPage("checkout"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="w-full py-4 rounded-full font-bold text-[13px] uppercase tracking-[0.15em] transition-all duration-200 hover:scale-[1.02] active:scale-95 flex justify-center items-center gap-2"
                  style={{ background: "#3D2B1F", color: "#FCFBF8", boxShadow: "0 8px 24px rgba(61,43,31,0.25)" }}>
                  Checkout Now <ArrowRight size={15} />
                </button>

                <div className="flex justify-center gap-5 pt-3 pb-1">
                   <div className="flex flex-col items-center gap-1.5 text-[9px] uppercase tracking-wider text-center" style={{ color: "#8C7B6B" }}><Shield size={16} strokeWidth={1.5} style={{ color: "#CFA18D" }}/> Secure<br/>Checkout</div>
                   <div className="flex flex-col items-center gap-1.5 text-[9px] uppercase tracking-wider text-center" style={{ color: "#8C7B6B" }}><Truck size={16} strokeWidth={1.5} style={{ color: "#CFA18D" }}/> Fast<br/>Delivery</div>
                   <div className="flex flex-col items-center gap-1.5 text-[9px] uppercase tracking-wider text-center" style={{ color: "#8C7B6B" }}><CreditCard size={16} strokeWidth={1.5} style={{ color: "#CFA18D" }}/> COD<br/>Available</div>
                </div>
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
    { label: "About Us", action: () => scroll("about") },
    { label: "Contact Us", action: () => { setPage("contact"); window.scrollTo({ top: 0, behavior: "smooth" }); setMobileOpen(false); } },
  ];
  const marqueeItems = [
    "Free Delivery on Prepaid Orders",
    "Secure Checkout",
    "Premium Quality Jewellery",
    "Trusted by 1000+ Customers",
  ];
  return (
    <>
      {/* Marquee Announcement Bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] overflow-hidden flex items-center"
        style={{ background: "#2C1E16", height: "28px" }}>
        <div className="marquee-track flex items-center h-full whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="inline-flex items-center text-[10px] sm:text-[11px] font-medium mx-6 sm:mx-10"
              style={{ color: "#F8F6F2" }}>
              {item}
              <span className="mx-6 sm:mx-10 text-[8px]" style={{ color: "rgba(207,161,141,0.6)" }}>◆</span>
            </span>
          ))}
        </div>
      </div>
      <motion.header initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.85 }}
        className="fixed top-[28px] left-0 right-0 z-50 transition-all duration-500"
        style={{ background: scrolled ? "rgba(248,246,242,0.96)" : "rgba(248,246,242,0.6)", backdropFilter: "blur(24px)", borderBottom: scrolled ? "1px solid rgba(203,184,169,0.3)" : "1px solid transparent", boxShadow: scrolled ? "0 4px 32px rgba(207,161,141,0.1)" : "none" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
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
            <button onClick={() => { setPage("wishlist"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="relative flex w-9 h-9 items-center justify-center rounded-full transition-colors hover:bg-secondary" style={{ color: "#5A4035" }}>
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
            <div className="flex flex-col gap-8">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-4" style={{ color: "#8C7B6B" }}>Shop</p>
                <div className="flex flex-col gap-3.5">
                  <button onClick={() => { setPage("shop"); window.scrollTo({ top: 0, behavior: "smooth" }); setMobileOpen(false); }} className="text-left text-[15px] font-semibold" style={{ color: "#3D2B1F" }}>All Jewellery</button>
                  <button onClick={() => scroll("featured")} className="text-left text-[15px] font-semibold" style={{ color: "#3D2B1F" }}>Necklaces</button>
                  <button onClick={() => scroll("featured")} className="text-left text-[15px] font-semibold" style={{ color: "#3D2B1F" }}>Rings</button>
                  <button onClick={() => scroll("featured")} className="text-left text-[15px] font-semibold" style={{ color: "#3D2B1F" }}>Combo Sets</button>
                  <button onClick={() => scroll("new-arrivals")} className="text-left text-[15px] font-semibold" style={{ color: "#3D2B1F" }}>New Arrivals</button>
                  <button onClick={() => scroll("bestsellers")} className="text-left text-[15px] font-semibold" style={{ color: "#3D2B1F" }}>Best Sellers</button>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-4" style={{ color: "#8C7B6B" }}>Quick Links</p>
                <div className="flex flex-col gap-3.5">
                  <button onClick={() => scroll("about")} className="text-left text-[15px] font-semibold" style={{ color: "#3D2B1F" }}>About Us</button>
                  <button onClick={() => { setPage("contact"); window.scrollTo({ top: 0, behavior: "smooth" }); setMobileOpen(false); }} className="text-left text-[15px] font-semibold" style={{ color: "#3D2B1F" }}>Contact Us</button>
                </div>
              </div>
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
      className="fixed bottom-24 md:bottom-8 right-4 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1"
      style={{ background: "#25D366", boxShadow: "0 4px 20px rgba(37,211,102,0.5)" }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
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
    <AnimatePresence>
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed bottom-7 left-5 z-[45] md:hidden flex pointer-events-none" style={{ right: "80px" }}>
        <button onClick={() => { document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" }); }}
          className="w-full py-4 rounded-full text-[13px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all active:scale-95 pointer-events-auto"
          style={{ background: "#3D2B1F", color: "#FCFBF8", boxShadow: "0 8px 32px rgba(61,43,31,0.35)" }}>
          🛍 Shop Collection
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Hero Section ───────────────────────────────────────────────────────────
function HeroSection() {
  const countdown = useCountdown();
  const { setPage } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = [
    { src: heroBannerImg1, mobileSrc: mobileHeroBanner1, title: "Diamond Bow Necklace", price: "299", pos: "top-[25%] right-0", imgOpacity: 0.7 },
    { src: heroBannerImg2, mobileSrc: mobileHeroBanner2, title: "Golden Flutter Necklace", price: "399", pos: "top-[25%] right-0", imgOpacity: 1 },
    { src: heroBannerImg3, mobileSrc: mobileHeroBanner3, title: "Amora Pearl Heart Bracelet", price: "249", pos: "top-[25%] right-0", imgOpacity: 1 },
    { src: heroBannerImg4, mobileSrc: mobileHeroBanner4, title: "Pack of 5 Earrings", price: "299", pos: "top-[25%] right-0", imgOpacity: 1 },
    { src: heroBannerImg5, mobileSrc: mobileHeroBanner5, title: "Infinity Ring", price: "149", pos: "bottom-10 right-0", imgOpacity: 1 },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <section className="relative h-[100vh] lg:min-h-screen flex items-center overflow-hidden pt-16 lg:pt-24 bg-[#EFE7DD]">
      {/* Animated Background Images */}
      <div className="absolute inset-0 z-0 bg-[#EFE7DD]">
        {banners.map((b, i) => (
          <div 
            key={i} 
            className="absolute inset-0 transition-all duration-1000 ease-in-out"
            style={{ opacity: i === currentSlide ? b.imgOpacity : 0, transform: i === currentSlide ? 'scale(1.15)' : 'scale(1.2)' }}
          >
            <div className="hidden lg:block w-full h-full">
              <ImageWithFallback src={b.src} alt={`Shri Vallabh Jewels Collection ${i + 1}`} className="w-full h-full object-cover object-center" />
            </div>
            <div className="lg:hidden w-full h-full">
              <ImageWithFallback src={b.mobileSrc} alt={`Shri Vallabh Jewels Collection ${i + 1}`} className="w-full h-full object-cover object-[80%_center]" />
            </div>
          </div>
        ))}
        {/* Gradient overlay from left to right - softened by 20% to reveal more image */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F8F6F2]/80 via-[#F8F6F2]/60 to-transparent w-full md:w-[70%] lg:w-[55%] z-10 pointer-events-none"></div>
      </div>

      <div className="relative z-10 h-full max-w-7xl mx-auto px-5 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="max-w-xl py-12 lg:py-20">
          <motion.h1 initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-[42px] leading-[1.05] lg:text-[72px] lg:leading-[1.05] mb-6 tracking-tight drop-shadow-sm" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
            <em>Jewels</em> That<br />Tell Your<br /><span className="font-semibold not-italic">Story</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="text-[16px] lg:text-[18px] leading-relaxed mb-8 drop-shadow-sm font-medium tracking-wide max-w-[90%] lg:max-w-none" style={{ color: "#5A4035" }}>
            Beautifully crafted jewellery designed to make you shine with confidence — for everyday wear and every precious occasion.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.82 }} className="absolute bottom-6 left-5 right-5 flex flex-col gap-3 z-30 lg:relative lg:bottom-auto lg:left-auto lg:right-auto lg:mt-2 lg:flex-row lg:w-auto">
            <button onClick={() => document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 py-4 rounded-full text-[12px] uppercase tracking-[0.2em] font-bold transition-all duration-500 hover:scale-[1.02] hover:shadow-lg w-full lg:w-auto text-center"
              style={{ background: "#3D2B1F", color: "#F8F6F2", boxShadow: "0 8px 24px rgba(61,43,31,0.25)" }}>
              Shop Collection
            </button>
            <button onClick={() => document.getElementById("bestsellers")?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 py-4 rounded-full text-[12px] uppercase tracking-[0.2em] font-bold transition-all duration-500 hover:bg-white/80 hover:shadow-md flex items-center justify-center gap-3 w-full lg:w-auto bg-white/40 backdrop-blur-sm"
              style={{ border: "1px solid rgba(61,43,31,0.2)", color: "#3D2B1F" }}>
              View Best Sellers <ArrowRight size={14} />
            </button>
          </motion.div>
        </div>
        
        {/* Empty right column allowing the beautiful image to shine through */}
        <div className="hidden lg:block relative h-full min-h-[400px]">
          {/* Subtle floating product badge matching the active image */}
          <motion.div 
            key={currentSlide}
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            onClick={() => { setPage("shop"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className={`absolute px-4 py-3 rounded-2xl animate-[float_7s_ease-in-out_infinite] cursor-pointer hover:scale-105 transition-transform ${banners[currentSlide].pos}`}
            style={{ background: "rgba(252,251,248,0.94)", backdropFilter: "blur(16px)", border: "1px solid rgba(203,184,169,0.35)", boxShadow: "0 10px 32px rgba(207,161,141,0.22)", zIndex: 20 }}>
            <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "#CFA18D" }}>Just Launched</p>
            <p className="text-[13px] font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>{banners[currentSlide].title}</p>
            <div className="flex items-center justify-between mt-1 gap-3">
              <p className="text-xs font-bold" style={{ color: "#CFA18D" }}>₹{banners[currentSlide].price}</p>
              <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} size={9} className="fill-amber-400 text-amber-400" />)}</div>
            </div>
          </motion.div>
        </div>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 z-10">
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
  const points = [
    "Secure Payments",
    "Premium Quality",
    "Fast Shipping",
    "Easy Returns",
    "Trusted by Customers",
    "Elegant Packaging"
  ];
  return (
    <div style={{ background: "#FCFBF8", borderBottom: "1px solid rgba(203,184,169,0.2)" }} className="overflow-hidden">
      {/* Desktop View */}
      <div className="max-w-[1200px] mx-auto hidden lg:flex items-center justify-center gap-10 xl:gap-14 py-5 px-8">
        {points.map((pt, i) => (
          <div key={`desktop-${i}`} className="flex items-center gap-2">
            <Check size={13} style={{ color: "#CFA18D" }} strokeWidth={2.5} />
            <span className="text-[11px] uppercase tracking-[0.15em] font-semibold" style={{ color: "#3D2B1F" }}>{pt}</span>
          </div>
        ))}
      </div>
      
      {/* Mobile Auto-scrolling Marquee */}
      <div className="lg:hidden flex items-center h-[55px] overflow-hidden" style={{ background: "#FCFBF8" }}>
        <div className="marquee-track flex items-center h-full whitespace-nowrap">
          {[...points, ...points, ...points].map((pt, i) => (
            <div key={`mobile-${i}`} className="inline-flex items-center mx-5">
              <Check size={12} style={{ color: "#CFA18D", marginRight: "8px" }} strokeWidth={2.5} />
              <span className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: "#3D2B1F" }}>
                {pt}
              </span>
            </div>
          ))}
        </div>
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
    <>
      {/* Editorial Split Hero Section (Single Banner) */}
      <section id="about" className="relative w-full min-h-[750px] lg:min-h-[90vh] flex flex-col lg:flex-row items-center bg-[#F3EBE1] overflow-hidden pt-20 lg:pt-0 pb-20 lg:pb-0">
        
        {/* Background Image: Desktop */}
        <div className="absolute top-0 right-0 bottom-0 w-full lg:w-[60%] z-0 h-full hidden lg:block" style={{ maskImage: "linear-gradient(to right, transparent 0%, transparent 15%, black 60%)", WebkitMaskImage: "linear-gradient(to right, transparent 0%, transparent 15%, black 60%)" }}>
          <ImageWithFallback src={promiseImg4} alt="Timeless Elegance" className="w-full h-full object-cover object-center" />
        </div>

        {/* Background Image: Mobile */}
        <div className="absolute inset-0 w-full z-0 h-full lg:hidden">
          <ImageWithFallback src={mobileEleganceImg} alt="Timeless Elegance" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-[#F3EBE1]/40"></div>
        </div>

        {/* Left Side: Content Container */}
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-5 lg:px-8 flex h-full">
          <div className="w-full lg:w-[45%] pt-32 lg:pt-36 pb-8 lg:pb-24 pr-0 lg:pr-12 flex flex-col justify-end lg:justify-center items-center lg:items-start text-center lg:text-left h-full" ref={ref}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col items-center lg:items-start">
              <h2 className="text-5xl md:text-[56px] lg:text-[64px] mb-12 leading-[1.1]" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
                Timeless Elegance,<br /><em>Everyday Luxury</em>
              </h2>
              
              <div className="space-y-8 max-w-md mb-12">
                <p className="text-[16px] lg:text-[17px] leading-[1.8]" style={{ color: "#5C4B40" }}>
                  Shri Vallabh Jewels is a modern jewellery brand dedicated to bringing elegant, premium-looking jewellery at accessible prices.
                </p>
                <p className="text-[16px] lg:text-[17px] leading-[1.8]" style={{ color: "#5C4B40" }}>
                  Our carefully curated collections are designed to help you celebrate everyday moments, special occasions, and personal style with confidence and grace. Every piece reflects our commitment to quality, beauty, and timeless elegance. ✨
                </p>
              </div>

              {/* Shop Collection Button */}
              <button onClick={() => document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" })}
                className="px-8 py-5 text-[11px] uppercase tracking-[0.2em] font-bold transition-all duration-500 hover:bg-black/80 flex items-center justify-between max-w-[260px] shadow-lg shadow-black/10"
                style={{ background: "#3D2B1F", color: "#F8F6F2" }}>
                <span>Shop Collection</span> <ArrowRight size={14} style={{ color: "#CFA18D" }} />
              </button>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}

// ── Combo Section ──────────────────────────────────────────────────────────
function ComboSection() {
  const { combos, addToCart, setCartOpen } = useApp();
  const [showAll, setShowAll] = useState(false);
  
  if (combos.length === 0) return null;

  return (
    <section className="py-24 lg:py-28" style={{ background: "linear-gradient(135deg, #EFE7DD, #F8F6F2, #E8DCC8)" }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <STitle eyebrow="Bundle & Save" title="Combo Collections" subtitle="Two pieces, one perfect story — curated gift sets at special prices." />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8 mb-10">
          {(showAll ? combos : combos.slice(0, 4)).map((c, i) => (
            <ProductCard key={c.id} product={c as unknown as Product} delay={i * 0.15} />
          ))}
        </div>
        {combos.length > 4 && (
          <div className="text-center">
            <Reveal>
              <button 
                onClick={() => setShowAll(!showAll)} 
                className="px-8 py-3.5 rounded-full text-sm font-bold transition-all hover:scale-105" 
                style={{ background: "#FCFBF8", border: "1.5px solid #CFA18D", color: "#3D2B1F", boxShadow: "0 4px 14px rgba(207,161,141,0.1)" }}>
                {showAll ? "View Less" : "View More"}
              </button>
            </Reveal>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Instagram Gallery ──────────────────────────────────────────────────────
function InstagramGallery() {
  const imgs = [insta1, insta2, insta3, insta4, insta5, insta6];
  return (
    <section className="py-24 lg:py-32" style={{ background: "#F8F6F2" }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <STitle eyebrow="" title="Follow Shri Vallabh Jewels" subtitle="Discover new arrivals, customer favorites, styling inspiration, and exclusive offers on Instagram." />
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-14 text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: "#3D2B1F" }}>
          <span className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0" style={{ background: "rgba(212,175,55,0.08)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.2)" }}>✓</span>
            Daily New Arrivals
          </span>
          <span className="hidden sm:inline" style={{ color: "rgba(212,175,55,0.3)" }}>|</span>
          <span className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0" style={{ background: "rgba(212,175,55,0.08)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.2)" }}>✓</span>
            Trusted by 1000+ Customers
          </span>
          <span className="hidden sm:inline" style={{ color: "rgba(212,175,55,0.3)" }}>|</span>
          <span className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0" style={{ background: "rgba(212,175,55,0.08)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.2)" }}>✓</span>
            Exclusive Offers & Launches
          </span>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-5">
          {imgs.map((img, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <div className="rounded-2xl overflow-hidden aspect-square group cursor-pointer relative transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:z-10"
                style={{ border: "1px solid rgba(203,184,169,0.3)", boxShadow: "0 10px 30px rgba(207,161,141,0.08)" }}>
                <ImageWithFallback src={img} alt="Instagram" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "rgba(207,161,141,0.35)", backdropFilter: "blur(4px)" }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-500 delay-100" style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)" }}>
                    <Instagram size={22} className="text-white drop-shadow-md" />
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="text-center mt-12 md:mt-16">
          <a href="https://www.instagram.com/shrivallabh_jewels" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-[12px] font-bold uppercase tracking-[0.2em] transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 hover:brightness-110 active:scale-95"
            style={{ background: "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)", color: "#FFFFFF", boxShadow: "0 8px 24px rgba(221,42,123,0.35)" }}>
            <Instagram size={16} /> Explore Our Instagram
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
  const [touchStart, setTouchStart] = useState<number | null>(null);

  if (!p) return null;
  const wished = wishlist.includes(p.id);
  const allImgs = (p.images && p.images.length > 0 ? p.images : [p.image]).filter(Boolean);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || allImgs.length <= 1) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setActiveImg(prev => (prev + 1) % allImgs.length);
      else setActiveImg(prev => (prev - 1 + allImgs.length) % allImgs.length);
    }
    setTouchStart(null);
  };

  return (
    <div className="min-h-screen pt-24" style={{ background: "#F8F6F2" }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
        <button onClick={() => setPage("home")} className="flex items-center gap-2 text-sm mb-8 transition-colors hover:text-primary" style={{ color: "#8C7B6B" }}>
          <ChevronLeft size={16} /> Back to Shop
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Images */}
          <div>
            <div 
              className="rounded-2xl overflow-hidden aspect-square mb-4 touch-pan-y relative" 
              style={{ background: "#EFE7DD", boxShadow: "0 12px 40px rgba(207,161,141,0.2)" }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <button onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); toast(wished ? "Removed from wishlist" : "Saved to wishlist ♡"); }}
                className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-md"
                style={{ background: "rgba(252,251,248,0.95)", border: "1px solid rgba(203,184,169,0.35)", backdropFilter: "blur(8px)" }}>
                <Heart size={18} className={wished ? "fill-rose-400 text-rose-400" : "text-[#8C7B6B]"} />
              </button>
              <ImageWithFallback src={allImgs[activeImg] || allImgs[0]} alt={p.name} className="w-full h-full object-cover transition-all duration-300" />
            </div>
            {allImgs.length > 1 && (
              <div 
                className="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar touch-pan-y"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {allImgs.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-200 snap-center"
                    style={{ border: activeImg === i ? "2px solid #CFA18D" : "2px solid rgba(203,184,169,0.3)", opacity: activeImg === i ? 1 : 0.7 }}>
                    <ImageWithFallback src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
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
                className="group relative overflow-hidden flex-1 py-3.5 rounded-full font-bold text-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
                style={{ background: "linear-gradient(135deg, #3D2B1F, #5A4035)", color: "#FCFBF8", boxShadow: "0 6px 20px rgba(61,43,31,0.25)" }}>
                <span className="relative z-10">Add to Bag</span>
                <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-[rgba(212,175,55,0.4)] to-transparent skew-x-12 group-hover:translate-x-[150%] transition-transform duration-1000 ease-out" />
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



// ── Policy Pages ───────────────────────────────────────────────────────────
function PolicyPage({ type }: { type: "shipping" | "return" | "privacy" | "terms" }) {
  useEffect(() => { window.scrollTo(0, 0); }, [type]);
  const content: Record<string, { title: string, text: React.ReactNode }> = {
    shipping: { 
      title: "Shipping Policy", 
      text: (
        <div className="space-y-4">
          <p>At Shri Vallabh Jewels, we strive to deliver your orders quickly and safely across India.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Free Shipping</strong> on all prepaid orders.</li>
            <li><strong>Cash on Delivery (COD)</strong> is available on eligible PIN codes with a <strong>₹49 COD charge</strong>.</li>
            <li>Orders are usually processed within <strong>1–2 business days</strong>.</li>
            <li>Delivery typically takes <strong>3–7 business days</strong>, depending on your location.</li>
            <li>Delivery timelines may vary during festivals, sales, or due to unforeseen courier delays.</li>
          </ul>
          <p>For any shipping-related queries, please contact our customer support team.</p>
          <p>Thank you for shopping with Shri Vallabh Jewels.</p>
        </div>
      )
    },
    return: { 
      title: "Return & Refund Policy", 
      text: (
        <div className="space-y-4">
          <p>At Shri Vallabh Jewels, customer satisfaction is important to us.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Returns are accepted within <strong>1 day of delivery</strong>.</li>
            <li>To be eligible for a return, the product must be unused and in its original condition and packaging.</li>
            <li>If you receive a <strong>damaged product</strong> or if <strong>any item is missing</strong> from your order, an <strong>uninterrupted opening video</strong> of the package is mandatory for verification.</li>
            <li>Claims regarding damaged, defective, or missing items without an opening video may not be accepted.</li>
            <li>Once the issue is verified, we will provide a suitable replacement or refund as applicable.</li>
          </ul>
          <p>For any return-related assistance, please contact our customer support team within 24 hours of delivery.</p>
          <p>Thank you for shopping with Shri Vallabh Jewels.</p>
        </div>
      )
    },
    privacy: { 
      title: "Privacy Policy", 
      text: (
        <div className="space-y-4">
          <p>At Shri Vallabh Jewels, we value your privacy and are committed to protecting your personal information.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>We collect only the information necessary to process and deliver your orders, such as your name, phone number, email address, and shipping address.</li>
            <li>Your personal information is used solely for order processing, customer support, and service-related communication.</li>
            <li>We do not sell, rent, or share your personal information with third parties except as required to complete your order or comply with legal obligations.</li>
            <li>We take reasonable measures to protect your information from unauthorized access or misuse.</li>
            <li>By using our website, you agree to the collection and use of information in accordance with this Privacy Policy.</li>
          </ul>
          <p>For any privacy-related questions, please contact our customer support team.</p>
          <p>Thank you for trusting Shri Vallabh Jewels.</p>
        </div>
      )
    },
    terms: { 
      title: "Terms of Service", 
      text: (
        <div className="space-y-4">
          <p>Welcome to Shri Vallabh Jewels. By using our website and placing an order, you agree to the following terms:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>All product prices are listed in Indian Rupees (₹) and are subject to change without prior notice.</li>
            <li>Orders are subject to availability and confirmation.</li>
            <li>We reserve the right to cancel or refuse any order due to pricing errors, stock issues, or suspected fraudulent activity.</li>
            <li>Product images are for illustrative purposes only. Slight variations in color, design, or appearance may occur due to lighting and screen settings.</li>
            <li>Customers are responsible for providing accurate shipping and contact information when placing an order.</li>
            <li>Returns and replacements are governed by our Return Policy.</li>
            <li>Shri Vallabh Jewels reserves the right to update or modify these terms at any time without prior notice.</li>
          </ul>
          <p>By continuing to use our website, you acknowledge and agree to these Terms of Service.</p>
          <p>Thank you for choosing Shri Vallabh Jewels.</p>
        </div>
      )
    }
  };
  const { title, text } = content[type];
  return (
    <div className="min-h-screen pt-32 px-5 pb-24" style={{ background: "#F8F6F2" }}>
      <div className="max-w-3xl mx-auto rounded-2xl p-8 lg:p-12 shadow-sm" style={{ background: "#FCFBF8", border: "1px solid rgba(203,184,169,0.3)" }}>
        <h1 className="text-3xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>{title}</h1>
        <div className="text-sm leading-relaxed" style={{ color: "#6B5A4E" }}>{text}</div>
        <p className="text-sm leading-relaxed mt-8 pt-6 border-t" style={{ color: "#6B5A4E", borderColor: "rgba(203,184,169,0.3)" }}>For any further queries, please reach out to our support team on WhatsApp or via Email at shrivallabhjewels@gmail.com.</p>
      </div>
    </div>
  );
}

// ── Wishlist Page ────────────────────────────────────────────────────────
function WishlistPage() {
  const { wishlist, products, setPage } = useApp();
  const wishlistedProducts = products.filter(p => wishlist.includes(p.id));

  return (
    <div className="pt-32 pb-24 min-h-screen" style={{ background: "#F8F6F2" }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <STitle eyebrow="Your Favorites" title="Wishlist" subtitle="Beautiful pieces you've saved for later." />
        
        {wishlistedProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-[rgba(203,184,169,0.2)] shadow-sm">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(207,161,141,0.1)" }}>
              <Heart size={28} style={{ color: "#CFA18D" }} />
            </div>
            <p className="text-xl font-bold mb-2" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif" }}>Your wishlist is empty</p>
            <p className="text-sm mb-6" style={{ color: "#8C7B6B" }}>Save your favorite pieces here to easily find them later.</p>
            <button onClick={() => { setPage("shop"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="px-8 py-3.5 rounded-full font-bold text-sm transition-all hover:scale-[1.02]" style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 4px 16px rgba(207,161,141,0.4)" }}>
              Explore Collection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-16">
            {wishlistedProducts.map((p, i) => <ProductCard key={`wish-${p.id}`} product={p} delay={i * 0.1} />)}
          </div>
        )}
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
      <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-20 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-10 mb-16">
          <div>
            <div className="mb-6 p-3 rounded-xl inline-block" style={{ background: "rgba(255,255,255,0.07)" }}>
              <ImageWithFallback src={logoImg} alt="Shri Vallabh Jewels" className="h-14 w-auto object-contain" style={{ filter: "brightness(0) invert(1)" }} />
            </div>
            <p className="text-[14px] leading-relaxed mb-6" style={{ color: "rgba(239,231,221,0.7)" }}>
              Shri Vallabh Jewels offers elegant and affordable jewellery designed to elevate your everyday style and special occasions.
            </p>
            <div className="space-y-3">
              {[{ Icon: Phone, t: "Chat on WhatsApp", link: "https://wa.me/917801949426" }, { Icon: Mail, t: "shrivallabhjewels@gmail.com", link: "mailto:shrivallabhjewels@gmail.com" }, { Icon: Instagram, t: "@shrivallabh_jewels", link: "https://instagram.com/shrivallabh_jewels" }].map(({ Icon, t, link }) => (
                <div key={t} className="flex items-center gap-3 text-[14px]" style={{ color: "rgba(239,231,221,0.7)" }}>
                  <Icon size={14} style={{ color: "#CFA18D" }} />
                  <a href={link} target="_blank" rel="noopener noreferrer" className="hover:text-[#CFA18D] transition-colors">
                    {t}
                  </a>
                </div>
              ))}
            </div>
          </div>
          {[
            { title: "Quick Links", links: [["shop", "Shop"], ["new-arrivals", "New Arrivals"], ["bestsellers", "Best Sellers"], ["about", "About Us"], ["contact", "Contact Us"]] },
            { title: "Policies", links: [["shipping", "Shipping Policy"], ["return", "Return Policy"], ["privacy", "Privacy Policy"], ["terms", "Terms of Service"]] },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-[12px] uppercase tracking-[0.25em] font-bold mb-6" style={{ color: "#CFA18D" }}>{title}</h4>
              <ul className="space-y-3">
                {links.map(([id, label]) => (
                  <li key={label}><button onClick={() => { if(["shop", "shipping", "return", "privacy", "terms", "contact"].includes(id)) { setPage(id as any); window.scrollTo({ top: 0, behavior: "smooth" }); } else scroll(id); }} className="text-[14px] hover:text-[#CFA18D] transition-colors text-left" style={{ color: "rgba(239,231,221,0.6)" }}>{label}</button></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        




        <div className="flex items-center justify-center pt-6 border-t" style={{ borderColor: "rgba(203,184,169,0.05)" }}>
          <p className="text-[12px]" style={{ color: "rgba(239,231,221,0.35)" }}>© 2026 Shri Vallabh Jewels. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// ── Home Page ──────────────────────────────────────────────────────────────
function HomePage() {
  const { products, setPage } = useApp();
  const [showAllFeatured, setShowAllFeatured] = useState(false);
  const [showAllBestsellers, setShowAllBestsellers] = useState(false);
  const [showAllNewArrivals, setShowAllNewArrivals] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const featured = products.filter(p => p.isFeatured);
  const bestsellers = products.filter(p => p.isBestseller);
  const newArrivals = products.filter(p => p.isNewArrival);

  return (
    <>
      {/* Marquee banner is now fixed above the navbar */}
      <HeroSection />
      <TrustBar />
      <section id="featured" className="py-24 lg:py-32" style={{ background: "#F8F6F2" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <STitle eyebrow="Handpicked for You" title="Featured Collections" subtitle="Our most-loved pieces, curated for timeless elegance." />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10">
            {(showAllFeatured ? featured : featured.slice(0, 4)).map((p, i) => <ProductCard key={p.id} product={p} delay={i * 0.12} />)}
            {featured.length === 0 && <p className="text-gray-400 text-sm col-span-3 text-center">No featured products selected.</p>}
          </div>
          {featured.length > 4 && (
            <div className="text-center">
              <Reveal>
                <button 
                  onClick={() => setShowAllFeatured(!showAllFeatured)}
                  className="px-8 py-3.5 rounded-full text-sm font-bold transition-all hover:scale-105" 
                  style={{ background: "#FCFBF8", border: "1.5px solid #CFA18D", color: "#3D2B1F", boxShadow: "0 4px 14px rgba(207,161,141,0.1)" }}>
                  {showAllFeatured ? "View Less" : "View More"}
                </button>
              </Reveal>
            </div>
          )}
        </div>
      </section>
      <BrandStory />
      <section id="bestsellers" className="py-24 lg:py-32" style={{ background: "#EFE7DD" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <STitle eyebrow="Most Loved" title="Best Sellers" subtitle="The pieces our customers keep coming back for." />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
            {(showAllBestsellers ? bestsellers : bestsellers.slice(0, 4)).map((p, i) => <ProductCard key={p.id} product={p} delay={i * 0.1} />)}
            {bestsellers.length === 0 && <p className="text-gray-400 text-sm col-span-4 text-center">No bestsellers selected.</p>}
          </div>
          {bestsellers.length > 4 && (
            <div className="text-center">
              <Reveal>
                <button 
                  onClick={() => setShowAllBestsellers(!showAllBestsellers)}
                  className="px-8 py-3.5 rounded-full text-sm font-bold transition-all hover:scale-105" 
                  style={{ background: "#FCFBF8", border: "1.5px solid #CFA18D", color: "#3D2B1F", boxShadow: "0 4px 14px rgba(207,161,141,0.1)" }}>
                  {showAllBestsellers ? "View Less" : "View More"}
                </button>
              </Reveal>
            </div>
          )}
        </div>
      </section>
      <section id="new-arrivals" className="py-24 lg:py-32" style={{ background: "#F8F6F2" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <STitle eyebrow="Fresh In" title="New Arrivals" subtitle="Just landed — discover what's new in our latest drop." />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
            {(showAllNewArrivals ? newArrivals : newArrivals.slice(0, 4)).map((p, i) => <ProductCard key={p.id} product={{ ...p, badge: p.badge || "New In" }} delay={i * 0.1} />)}
            {newArrivals.length === 0 && <p className="text-gray-400 text-sm col-span-4 text-center">No new arrivals selected.</p>}
          </div>
          {newArrivals.length > 4 && (
            <div className="text-center">
              <Reveal>
                <button 
                  onClick={() => setShowAllNewArrivals(!showAllNewArrivals)}
                  className="px-8 py-3.5 rounded-full text-sm font-bold transition-all hover:scale-105" 
                  style={{ background: "#FCFBF8", border: "1.5px solid #CFA18D", color: "#3D2B1F", boxShadow: "0 4px 14px rgba(207,161,141,0.1)" }}>
                  {showAllNewArrivals ? "View Less" : "View More"}
                </button>
              </Reveal>
            </div>
          )}
        </div>
      </section>
      <ComboSection />
      <section className="py-24 lg:py-32" style={{ background: "#EFE7DD" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <STitle eyebrow="Customer Love" title="What Our Customers Say" subtitle="4.7★ average across 400+ genuine reviews." />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.id} className={!showAllReviews && i >= 2 ? "hidden md:block" : ""}>
                <TestiCard t={t} delay={i * 0.1} />
              </div>
            ))}
          </div>
          {TESTIMONIALS.length > 2 && (
            <div className="text-center md:hidden">
              <Reveal>
                <button 
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="px-8 py-3.5 rounded-full text-sm font-bold transition-all hover:scale-105" 
                  style={{ background: "#FCFBF8", border: "1.5px solid #CFA18D", color: "#3D2B1F", boxShadow: "0 4px 14px rgba(207,161,141,0.1)" }}>
                  {showAllReviews ? "Show Less" : "View More Reviews"}
                </button>
              </Reveal>
            </div>
          )}
        </div>
      </section>
      <InstagramGallery />
      <section className="py-24 lg:py-28" style={{ background: "#EFE7DD" }}>
        <div className="max-w-3xl mx-auto px-5 lg:px-8">
          <STitle eyebrow="Questions Answered" title="Frequently Asked Questions" subtitle="Everything you need to know before shopping with us." />
          <div>{FAQS.map((faq, i) => <FAQItem key={i} faq={faq} />)}</div>
        </div>
      </section>
      {/* Contact section moved to ContactPage */}
      <Footer />
    </>
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
  const [isUploadingCombo, setIsUploadingCombo] = useState(false);
  
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
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const originalDataUrl = event.target?.result as string;
      if (!originalDataUrl) return;

      const saveImage = (dataUrl: string) => {
        setFormData(prev => {
          if (index !== undefined) {
            const newImages = [...(prev.images || [])];
            newImages[index] = dataUrl;
            return { ...prev, images: newImages, image: newImages[0] || prev.image };
          }
          return { ...prev, image: dataUrl, images: [dataUrl] };
        });
      };

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("No canvas context");

          const MAX_WIDTH = 800;
          let width = img.width; let height = img.height;
          if (width > MAX_WIDTH) { height = height * (MAX_WIDTH / width); width = MAX_WIDTH; }
          
          canvas.width = width; canvas.height = height;
          // Fill with white background before drawing to prevent transparent PNGs from turning black in JPEG
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
          
          // Safeguard: if canvas fails to render properly
          if (!compressedDataUrl || compressedDataUrl.length < 100) {
            throw new Error("Compression resulted in empty image");
          }

          saveImage(compressedDataUrl);
        } catch (err) {
          console.error("Compression failed, falling back to original", err);
          saveImage(originalDataUrl); // Fallback if compression fails
        }
      };
      
      img.onerror = () => {
        console.error("Image load failed, using original file");
        saveImage(originalDataUrl);
      };
      
      img.src = originalDataUrl;
    };
    reader.readAsDataURL(file);
  };
  const handleRemoveImage = (index: number) => {
    setFormData(prev => {
      const newImages = [...(prev.images || [])];
      newImages.splice(index, 1);
      return { ...prev, images: newImages, image: newImages[0] || "" };
    });
  };
  const saveProduct = async () => {
    if (!formData.name || !formData.image) return toast.error("Name and Image are required");
    
    // Firestore does not support undefined values. Filter out empty slots from sparse arrays.
    const cleanData = { ...formData };
    if (cleanData.images) {
      cleanData.images = cleanData.images.filter(img => !!img);
      // Force sync the main image string with the first valid gallery image to ensure Shop/Cart thumbnails are perfectly updated
      if (cleanData.images.length > 0) {
        cleanData.image = cleanData.images[0];
      }
    }
    // ensure no undefined fields
    Object.keys(cleanData).forEach(key => cleanData[key as keyof Product] === undefined && delete cleanData[key as keyof Product]);

    setLoading(true);
    try { await setDoc(doc(db, "products", cleanData.id!.toString()), cleanData); toast.success("Product saved!"); setEditing(null); } 
    catch (e: any) { toast.error("Save failed", { description: e.message }); }
    setLoading(false);
  };

  const handleComboImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, startIndex?: number) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    if (files.length > 20) return toast.error("You can only upload up to 20 images at a time");

    const validFiles = files.filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return toast.error("Valid image files required.");
    if (validFiles.length < files.length) toast.error(`Ignored ${files.length - validFiles.length} non-image files.`);

    setIsUploadingCombo(true);
    let completedCount = 0;
    const toastId = toast.loading(`Uploading 0/${validFiles.length} images...`);

    const tempUrls = validFiles.map(file => URL.createObjectURL(file));
    
    // Instantly show preview
    setComboData(prev => {
      const newImages = [...(prev.images || [])];
      validFiles.forEach((_, i) => {
        const targetIndex = startIndex !== undefined ? startIndex + i : undefined;
        if (targetIndex !== undefined && targetIndex < 20) {
          newImages[targetIndex] = tempUrls[i];
        } else if (newImages.length < 20) {
          newImages.push(tempUrls[i]);
        }
      });
      return { ...prev, images: newImages, image: newImages[0] || prev.image };
    });

    const uploadPromises = validFiles.map((file, i) => {
      return new Promise<void>((resolve, reject) => {
        const tempUrl = tempUrls[i];
        const targetIndex = startIndex !== undefined ? startIndex + i : undefined;

        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("No ctx"));
            
            const MAX_WIDTH = 800;
            let width = img.width; let height = img.height;
            if (width > MAX_WIDTH) { height = height * (MAX_WIDTH / width); width = MAX_WIDTH; }
            canvas.width = width; canvas.height = height;
            ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(async (blob) => {
              if (!blob) return reject(new Error("Empty blob"));
              try {
                const fileName = `combos/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
                const storageRef = ref(storage, fileName);
                
                await uploadBytes(storageRef, blob);
                const downloadUrl = await getDownloadURL(storageRef);
                
                setComboData(prev => {
                  const newImages = [...(prev.images || [])];
                  const currentIdx = newImages.indexOf(tempUrl);
                  if (currentIdx !== -1) {
                    newImages[currentIdx] = downloadUrl;
                  } else if (targetIndex !== undefined && targetIndex < 20) {
                    newImages[targetIndex] = downloadUrl;
                  }
                  return { ...prev, images: newImages, image: newImages[0] || prev.image };
                });
                
                completedCount++;
                toast.loading(`Uploading ${completedCount}/${validFiles.length} images...`, { id: toastId });
                resolve();
              } catch (err) {
                console.error("Firebase upload error:", err);
                reject(err);
              }
            }, "image/jpeg", 0.6);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = tempUrl;
      }).catch(err => {
        console.error("Failed to process image:", err);
        setComboData(prev => {
          const newImages = [...(prev.images || [])].filter(img => img !== tempUrls[i]);
          return { ...prev, images: newImages, image: newImages[0] || "" };
        });
      });
    });

    await Promise.all(uploadPromises);
    setIsUploadingCombo(false);
    if (completedCount === validFiles.length) {
      toast.success(`Successfully uploaded ${completedCount} images!`, { id: toastId });
    } else {
      toast.error(`Uploaded ${completedCount}/${validFiles.length} images. Some failed.`, { id: toastId });
    }
  };

  const handleComboRemoveImage = (index: number) => {
    setComboData(prev => {
      const newImages = [...(prev.images || [])];
      newImages.splice(index, 1);
      return { ...prev, images: newImages, image: newImages[0] || "" };
    });
  };

  const handleEditCombo = (c: Combo) => { setEditingCombo(c); setComboData(c); };
  const handleAddCombo = () => {
    setEditingCombo({ id: Date.now().toString(), name: "", subtitle: "", description: "", price: 0, originalPrice: 0, category: "Combo", image: "", badge: "", badgeColor: "#CFA18D", stock: 10, rating: 5, reviews: 0, care: "", saving: 0, isFeatured: false, isBestseller: false, isNewArrival: false, images: [] });
    setComboData({ id: Date.now().toString(), name: "", subtitle: "", description: "", price: 0, originalPrice: 0, category: "Combo", image: "", badge: "", badgeColor: "#CFA18D", stock: 10, rating: 5, reviews: 0, care: "", saving: 0, isFeatured: false, isBestseller: false, isNewArrival: false, images: [] });
  };
  const handleDeleteCombo = async (id: string) => {
    if (!confirm("Delete combo?")) return;
    await deleteDoc(doc(db, "combos", id));
  };
  const saveCombo = async () => {
    if (!comboData.name || !comboData.image) return toast.error("Name and Image required");
    setLoading(true);
    try {
      const cleanData = { ...comboData };
      // Migrate any existing base64 images to Storage
      if (cleanData.images && cleanData.images.length > 0) {
        const uploadedImages = await Promise.all(
          cleanData.images.map(async (imgStr, idx) => {
            if (imgStr && imgStr.startsWith("data:image/")) {
              const fileName = `combos/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
              const storageRef = ref(storage, fileName);
              await uploadString(storageRef, imgStr, "data_url");
              return await getDownloadURL(storageRef);
            }
            return imgStr;
          })
        );
        cleanData.images = uploadedImages.filter(img => !!img);
        if (cleanData.images.length > 0) {
          cleanData.image = cleanData.images[0];
        } else {
          cleanData.image = "";
        }
      }
      // Ensure no undefined fields
      Object.keys(cleanData).forEach(key => cleanData[key as keyof Combo] === undefined && delete cleanData[key as keyof Combo]);

      await setDoc(doc(db, "combos", cleanData.id!), cleanData); 
      toast.success("Combo saved!"); 
      setEditingCombo(null); 
    } 
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
                  <div className="col-span-1 md:col-span-2 border p-4 rounded bg-gray-50 flex flex-col gap-4">
                    <label className="block text-sm font-bold">Product Images (Upload up to 10 images. First image is the main image.)</label>
                    <div className="flex flex-wrap gap-4">
                      {Array.from({ length: 10 }).map((_, idx) => {
                        const img = (formData.images || [])[idx] || (idx === 0 ? formData.image : "");
                        return (
                          <div key={idx} className="relative w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white overflow-hidden group">
                            {img ? (
                              <>
                                <img src={img} className="w-full h-full object-cover" />
                                <button onClick={() => handleRemoveImage(idx)} className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><X size={12} className="text-red-500" /></button>
                                <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[9px] text-center py-0.5">{idx === 0 ? "Main" : `Gallery ${idx}`}</div>
                              </>
                            ) : (
                              <div className="text-center p-2">
                                <label className="cursor-pointer flex flex-col items-center justify-center h-full w-full">
                                  <Plus size={16} className="text-gray-400 mb-1" />
                                  <span className="text-[9px] text-gray-500 font-medium leading-tight">{idx === 0 ? "Main Image" : "Add Image"}</span>
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, idx)} />
                                </label>
                              </div>
                            )}
                          </div>
                        );
                      })}
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
                  <input placeholder="Subtitle" value={comboData.subtitle} onChange={e => setComboData({ ...comboData, subtitle: e.target.value })} className="border p-2 rounded" />
                  <input type="number" placeholder="Discounted Price" value={comboData.price || ''} onChange={e => { const p = Number(e.target.value); setComboData({ ...comboData, price: p, saving: (comboData.originalPrice || 0) - p }); }} className="border p-2 rounded" />
                  <input type="number" placeholder="Original Price" value={comboData.originalPrice || ''} onChange={e => { const o = Number(e.target.value); setComboData({ ...comboData, originalPrice: o, saving: o - (comboData.price || 0) }); }} className="border p-2 rounded" />
                  <input placeholder="Badge (e.g. Bestseller)" value={comboData.badge} onChange={e => setComboData({ ...comboData, badge: e.target.value })} className="border p-2 rounded" />
                  
                  <div className="col-span-1 md:col-span-2 flex flex-wrap gap-4 py-2 border-y my-2">
                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                      <input type="checkbox" checked={comboData.isFeatured || false} onChange={e => setComboData({ ...comboData, isFeatured: e.target.checked })} /> Show in Featured
                    </label>
                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                      <input type="checkbox" checked={comboData.isBestseller || false} onChange={e => setComboData({ ...comboData, isBestseller: e.target.checked })} /> Show in Best Sellers
                    </label>
                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                      <input type="checkbox" checked={comboData.isNewArrival || false} onChange={e => setComboData({ ...comboData, isNewArrival: e.target.checked })} /> Show in New Arrivals
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <input placeholder="Badge Color (e.g. #CFA18D)" value={comboData.badgeColor} onChange={e => setComboData({ ...comboData, badgeColor: e.target.value })} className="border p-2 rounded flex-1" />
                    <div className="w-10 h-10 rounded border" style={{ backgroundColor: comboData.badgeColor }} />
                  </div>
                  <input type="number" placeholder="Stock" value={comboData.stock || ''} onChange={e => setComboData({ ...comboData, stock: Number(e.target.value) })} className="border p-2 rounded" />
                  <input type="number" placeholder="Rating (e.g. 4.8)" step="0.1" value={comboData.rating || ''} onChange={e => setComboData({ ...comboData, rating: Number(e.target.value) })} className="border p-2 rounded" />
                  <input type="number" placeholder="Total Reviews" value={comboData.reviews || ''} onChange={e => setComboData({ ...comboData, reviews: Number(e.target.value) })} className="border p-2 rounded" />
                  <div className="col-span-1 md:col-span-2">
                    <textarea placeholder="Description" rows={3} value={comboData.description} onChange={e => setComboData({ ...comboData, description: e.target.value })} className="border p-2 rounded w-full" />
                  </div>
                  <div className="col-span-1 md:col-span-2 border p-4 rounded bg-gray-50 flex flex-col gap-4">
                    <label className="block text-sm font-bold">Combo Images (Upload up to 20 images. First image is the main image.)</label>
                    <div className="flex flex-wrap gap-4">
                      {Array.from({ length: 20 }).map((_, idx) => {
                        const img = (comboData.images || [])[idx] || (idx === 0 ? comboData.image : "");
                        return (
                          <div key={idx} className="relative w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white overflow-hidden group">
                            {img ? (
                              <>
                                <img src={img} className={`w-full h-full object-cover ${img.startsWith('blob:') ? 'opacity-50 grayscale' : ''}`} />
                                {img.startsWith('blob:') && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <RefreshCw className="w-6 h-6 text-white animate-spin" />
                                  </div>
                                )}
                                {!img.startsWith('blob:') && (
                                  <button onClick={() => handleComboRemoveImage(idx)} className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><X size={12} className="text-red-500" /></button>
                                )}
                                <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[9px] text-center py-0.5">{idx === 0 ? "Main" : `Gallery ${idx}`}</div>
                              </>
                            ) : (
                              <div className="text-center p-2">
                                <label className="cursor-pointer flex flex-col items-center justify-center h-full w-full">
                                  <Plus size={16} className="text-gray-400 mb-1" />
                                  <span className="text-[9px] text-gray-500 font-medium leading-tight">{idx === 0 ? "Main Image" : "Add Image"}</span>
                                  <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleComboImageUpload(e, idx)} />
                                </label>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={saveCombo} disabled={loading || isUploadingCombo} className={`px-6 py-2 text-white rounded font-bold ${(loading || isUploadingCombo) ? 'bg-gray-400' : 'bg-black'}`}>
                    {loading ? "Saving..." : isUploadingCombo ? "Uploading Images..." : "Save Combo"}
                  </button>
                  <button onClick={() => setEditingCombo(null)} className="px-6 py-2 bg-gray-200 text-black rounded font-bold">Cancel</button>
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
                    {[...combos].sort((a,b) => Number(b.id) - Number(a.id)).map(c => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="p-4"><img src={c.image} className="w-12 h-12 rounded object-cover" /></td>
                        <td className="p-4 font-semibold">{c.name}</td>
                        <td className="p-4">₹{c.price} <span className="text-xs text-gray-500 line-through">₹{c.originalPrice}</span></td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {c.isFeatured && <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Featured</span>}
                            {c.isBestseller && <span className="text-[9px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded">Bestseller</span>}
                            {c.isNewArrival && <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded">New Arrival</span>}
                          </div>
                        </td>
                        <td className="p-4 flex gap-3">
                          <button onClick={() => handleEditCombo(c)} className="text-blue-600 font-bold hover:underline">Edit</button>
                          <button onClick={() => handleDeleteCombo(c.id)} className="text-red-600 font-bold hover:underline">Delete</button>
                        </td>
                      </tr>
                    ))}
                    {combos.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-500">No combos created yet.</td></tr>}
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

// ── Sales Pop ──────────────────────────────────────────────────────────────
function SalesPop() {
  const [show, setShow] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.6); // Show after 60% scroll (past hero)
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let idx = Math.floor(Math.random() * RECENT_ORDERS.length);
    const trigger = () => {
      setOrder(RECENT_ORDERS[idx % RECENT_ORDERS.length]);
      idx++;
      setShow(true);
      setTimeout(() => setShow(false), 3000);
    };
    const t1 = setTimeout(trigger, 12000);
    const t2 = setInterval(trigger, 45000);
    return () => { clearTimeout(t1); clearInterval(t2); };
  }, []);

  if (!order) return null;

  return (
    <AnimatePresence>
      {show && scrolled && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-28 md:bottom-12 left-4 md:left-6 z-40 max-w-[260px] sm:max-w-[280px] w-[80vw]"
        >
          <div className="flex items-center gap-3 p-3 rounded-2xl shadow-xl"
            style={{ background: "rgba(252,251,248,0.96)", backdropFilter: "blur(12px)", border: "1px solid rgba(203,184,169,0.35)" }}>
            <div className="text-sm">🛍️</div>
            <div>
              <p className="text-[11px] font-bold leading-tight" style={{ color: "#3D2B1F" }}>{order.name} from {order.city} just ordered</p>
              <p className="text-[10px] mt-0.5 leading-tight" style={{ color: "#8C7B6B" }}>{order.product}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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
  const removeFromCart = (id: number | string) => setCart(prev => prev.filter(i => i.product.id !== id));
  const updateQty = (id: number | string, qty: number) => qty <= 0 ? removeFromCart(id) : setCart(prev => prev.map(i => i.product.id === id ? { ...i, qty } : i));
  const clearCart = () => setCart([]);
  const toggleWishlist = (id: number) => setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const ctx: AppCtx = { page, setPage, cart, addToCart, removeFromCart, updateQty, cartTotal, cartCount, clearCart, cartOpen, setCartOpen, selectedProduct, setSelectedProduct, order, setOrder, wishlist, toggleWishlist, user, login, logout, products, combos };

  return (
    <Ctx.Provider value={ctx}>
      <style>{`
        @keyframes marquee-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }
        .marquee-track { animation: marquee-scroll 35s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-18px); } }
        @keyframes sparkle { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.3); } }
        @keyframes scrollPulse { 0% { transform: translateY(-100%); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(250%); opacity: 0; } }
        * { font-family: 'DM Sans', sans-serif; }
        input::placeholder, textarea::placeholder { color: rgba(139,123,107,0.6); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
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
          {page !== "admin" && <SalesPop />}

          {page === "home" && <HomePage />}
          {page === "shop" && <ShopPage />}
          {page === "product" && <ProductDetailPage />}
          {page === "checkout" && <CheckoutPage />}
          {page === "confirmation" && <OrderConfirmation />}
          {page === "account" && <AccountPage />}
          {page === "wishlist" && <WishlistPage />}
          {page === "admin" && <AdminPage />}
          {page === "contact" && <ContactPage />}
          {["shipping", "return", "privacy", "terms"].includes(page) && <PolicyPage type={page as any} />}
        </>
      )}
    </Ctx.Provider>
  );
}

function ContactOptionsList() {
  return (
    <>
      {[
        { Icon: Phone, label: "WHATSAPP", val: "Chat on WhatsApp", link: "https://wa.me/917801949426" }, 
        { Icon: Mail, label: "EMAIL", val: "shrivallabhjewels@gmail.com", link: "mailto:shrivallabhjewels@gmail.com" }
      ].map(({ Icon, label, val, link }) => (
        <a key={label} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-5 group transition-all p-4 rounded-2xl hover:bg-[#F8F6F2] border border-transparent hover:border-[rgba(203,184,169,0.2)]">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg" style={{ background: "rgba(207,161,141,0.15)" }}>
            <Icon size={18} className="transition-transform duration-500 group-hover:scale-110" style={{ color: "#CFA18D" }} />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] mb-1 font-bold" style={{ color: "#8C7B6B" }}>{label}</p>
            <p className="text-[14px] font-semibold group-hover:text-[#CFA18D] transition-colors" style={{ color: "#3D2B1F" }}>{val}</p>
          </div>
        </a>
      ))}
    </>
  );
}

function ContactPage() {
  const [showOptions, setShowOptions] = useState(false);
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="min-h-screen pt-32 pb-24" style={{ background: "#F8F6F2" }}>
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <STitle eyebrow="Get in Touch" title="Contact Us" subtitle="Questions, custom orders, or just want to say hello — we're always here." />
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-start mt-12 bg-white p-8 lg:p-12 rounded-3xl shadow-sm border border-[rgba(203,184,169,0.2)]">
          <div className="flex-1 w-full order-2 lg:order-1">
            <h3 className="text-xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Send us a message</h3>
            <ContactForm />
          </div>
          <div className="flex-1 w-full order-1 lg:order-2">
            <h3 className="text-xl font-bold mb-6 hidden lg:block" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Direct Contact</h3>
            <div className="lg:hidden w-full mb-2">
              <button onClick={() => setShowOptions(!showOptions)} className="w-full py-4 rounded-full text-[13px] font-bold uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2" style={{ border: "1px solid #CFA18D", color: "#3D2B1F" }}>
                {showOptions ? "Hide Contact Options" : "View Contact Options"} <ChevronDown size={14} className={`transition-transform ${showOptions ? "rotate-180" : ""}`} />
              </button>
            </div>
            
            {/* Desktop View (Always visible) */}
            <div className="hidden lg:block space-y-6 max-w-sm">
              <ContactOptionsList />
            </div>

            {/* Mobile View (Animated collapse) */}
            <div className="lg:hidden">
              <AnimatePresence>
                {showOptions && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="pt-4 space-y-4">
                      <ContactOptionsList />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactForm() {
  return (
    <form className="w-full space-y-6" onSubmit={(e) => { e.preventDefault(); toast.success("Message sent successfully! We'll get back to you soon."); }}>
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "#8C7B6B" }}>Your Name</label>
        <input type="text" placeholder="Enter your name" required className="w-full px-6 py-3.5 rounded-full outline-none transition-all focus:ring-2 focus:ring-[#CFA18D]/50" style={{ background: "#FCFBF8", border: "1px solid rgba(203,184,169,0.25)", color: "#3D2B1F", fontSize: "14px" }} />
      </div>
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "#8C7B6B" }}>Email Address</label>
        <input type="email" placeholder="Enter your email address" required className="w-full px-6 py-3.5 rounded-full outline-none transition-all focus:ring-2 focus:ring-[#CFA18D]/50" style={{ background: "#FCFBF8", border: "1px solid rgba(203,184,169,0.25)", color: "#3D2B1F", fontSize: "14px" }} />
      </div>
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "#8C7B6B" }}>Message</label>
        <textarea placeholder="How can we help you?" required rows={4} className="w-full px-6 py-4 rounded-[1.5rem] outline-none transition-all focus:ring-2 focus:ring-[#CFA18D]/50 resize-none" style={{ background: "#FCFBF8", border: "1px solid rgba(203,184,169,0.25)", color: "#3D2B1F", fontSize: "14px" }} />
      </div>
      <button type="submit" className="w-full flex items-center justify-center gap-2 py-4 rounded-full text-[13px] font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-md" style={{ background: "#C8A08C", color: "#FFFFFF" }}>
        Send Message <Send size={14} />
      </button>
    </form>
  );
}
