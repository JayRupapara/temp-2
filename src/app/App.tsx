import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { Toaster, toast } from "sonner";
import {
  Menu, X, ShoppingBag, Search, Heart, Star,
  ArrowRight, Phone, Mail, MapPin, ChevronDown,
  Package, Truck, CreditCard, Sparkles, Instagram,
  Send,
} from "lucide-react";

import logoImg from "@/imports/Vallabh_Jewels_Transparent.png";
import pearlImg from "@/imports/ChatGPT_Image_Jun_10__2026__02_58_08_PM.png";
import heartImg from "@/imports/ChatGPT_Image_Jun_10__2026__03_25_26_PM.png";
import butterflyImg from "@/imports/ChatGPT_Image_Jun_8__2026__06_13_30_PM.png";
import ringImg from "@/imports/ChatGPT_Image_Jun_10__2026__03_55_57_PM.png";

// ── Types ──────────────────────────────────────────────────────────────────
type Product = {
  id: number;
  name: string;
  subtitle: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  badge?: string;
};

// ── Product Data ───────────────────────────────────────────────────────────
const PRODUCTS: Product[] = [
  { id: 1, name: "Pearl Seashell Necklace", subtitle: "Rose gold oceanic pendant", price: 349, originalPrice: 499, category: "Necklace", image: pearlImg, badge: "Bestseller" },
  { id: 2, name: "Petite Heart Necklace", subtitle: "Minimalist rose gold charm", price: 299, originalPrice: 399, category: "Necklace", image: heartImg, badge: "New" },
  { id: 3, name: "Butterfly Bloom Necklace", subtitle: "Gold butterfly, crystal wings", price: 309, originalPrice: 449, category: "Necklace", image: butterflyImg, badge: "Trending" },
  { id: 4, name: "Infinity Spark Ring", subtitle: "Sterling silver with CZ stones", price: 160, originalPrice: 250, category: "Ring", image: ringImg, badge: "New" },
];

const TESTIMONIALS = [
  { id: 1, name: "Priya Sharma", city: "Mumbai", rating: 5, text: "Absolutely stunning! The Pearl Seashell Necklace arrived beautifully packaged and exceeded all my expectations. The quality feels genuinely luxurious." },
  { id: 2, name: "Anjali Mehta", city: "Delhi", rating: 5, text: "I ordered the Butterfly Bloom Necklace for my anniversary and it was perfect. Fast delivery, beautiful packaging, and the piece looked even better in person." },
  { id: 3, name: "Sneha Patel", city: "Ahmedabad", rating: 5, text: "My go-to for jewellery gifting. The Heart Necklace I ordered was delicate and premium. My sister absolutely loved it. Will definitely order again!" },
  { id: 4, name: "Riya Desai", city: "Surat", rating: 5, text: "The Infinity Ring fits beautifully and catches so much light. I receive compliments every time I wear it. Shri Vallabh Jewels never disappoints." },
];

const FAQS = [
  { q: "How long does delivery take?", a: "Orders are delivered within 5–7 business days across India. Express delivery (2–3 days) is available at checkout." },
  { q: "Do you offer Cash on Delivery?", a: "Yes! COD is available across most pin codes in India. Simply select Cash on Delivery at the payment step." },
  { q: "How can I place an order?", a: "Browse our collections, add favourites to your bag, and complete checkout. You can also order via WhatsApp for a personal shopping experience." },
  { q: "What if I receive a damaged product?", a: "Contact us within 48 hours with photos of the item, and we will arrange a free replacement or full refund — no questions asked." },
  { q: "Are the pieces hypoallergenic?", a: "All our jewellery is nickel-free, lead-free, and crafted from skin-safe materials. Suitable for sensitive skin." },
  { q: "Do you offer gift wrapping?", a: "Every order ships in our signature champagne gift box at no extra cost. Personalised message cards are available on request." },
];

// ── Hook: Scroll Reveal ────────────────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ── RevealWrapper ──────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={className}>
      <motion.div
        initial={{ opacity: 0, y: 36 }}
        animate={visible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// ── SectionTitle ───────────────────────────────────────────────────────────
function SectionTitle({ eyebrow, title, subtitle, center = true }: {
  eyebrow?: string; title: string; subtitle?: string; center?: boolean;
}) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={`mb-12 ${center ? "text-center" : ""}`}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={visible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {eyebrow && (
          <p className="text-[11px] uppercase tracking-[0.28em] mb-3 font-medium" style={{ color: "#CFA18D", fontFamily: "'DM Sans', sans-serif" }}>
            {eyebrow}
          </p>
        )}
        <h2 className="text-4xl md:text-5xl leading-tight mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-base leading-relaxed max-w-lg" style={{ color: "#8C7B6B", fontFamily: "'DM Sans', sans-serif", ...(center ? { margin: "0 auto" } : {}) }}>
            {subtitle}
          </p>
        )}
        <div className={`mt-5 h-px w-16 ${center ? "mx-auto" : ""}`} style={{ background: "linear-gradient(90deg, transparent, #CFA18D 40%, #E8DCC8)" }} />
      </motion.div>
    </div>
  );
}

// ── ProductCard ────────────────────────────────────────────────────────────
function ProductCard({ product, delay = 0 }: { product: Product; delay?: number }) {
  const { ref: revealRef, visible } = useReveal();
  const cardRef = useRef<HTMLDivElement>(null);
  const [wished, setWished] = useState(false);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(1200px) rotateX(${(y - 0.5) * -9}deg) rotateY(${(x - 0.5) * 9}deg) translateZ(10px)`;
    el.style.boxShadow = "0 24px 60px rgba(207,161,141,0.28), 0 4px 16px rgba(61,43,31,0.08)";
  };
  const onMouseLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0)";
    el.style.boxShadow = "0 4px 20px rgba(207,161,141,0.1), 0 1px 4px rgba(61,43,31,0.04)";
  };

  return (
    <div ref={revealRef} className="group">
      <motion.div
        initial={{ opacity: 0, y: 48 }}
        animate={visible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
        className="h-full"
      >
        <div
          ref={cardRef}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          className="relative bg-card rounded-2xl overflow-hidden h-full flex flex-col cursor-pointer"
          style={{
            boxShadow: "0 4px 20px rgba(207,161,141,0.1), 0 1px 4px rgba(61,43,31,0.04)",
            border: "1px solid rgba(203,184,169,0.22)",
            transition: "box-shadow 0.3s ease, transform 0.14s ease",
          }}
        >
          {product.badge && (
            <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide"
              style={{ background: "rgba(207,161,141,0.9)", color: "#FCFBF8", backdropFilter: "blur(8px)" }}>
              {product.badge}
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setWished(!wished); toast(wished ? "Removed from wishlist" : "Added to wishlist ♡"); }}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{ background: "rgba(252,251,248,0.9)", backdropFilter: "blur(8px)", border: "1px solid rgba(203,184,169,0.2)" }}
          >
            <Heart size={13} className={wished ? "fill-rose-400 text-rose-400" : "text-[#8C7B6B]"} />
          </button>
          <div className="relative overflow-hidden" style={{ paddingTop: "100%", background: "#EFE7DD" }}>
            <div className="absolute inset-0">
              <ImageWithFallback
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
              />
            </div>
          </div>
          <div className="p-5 flex flex-col flex-1">
            <p className="text-[10px] uppercase tracking-[0.22em] font-medium mb-1.5" style={{ color: "#CFA18D", fontFamily: "'DM Sans', sans-serif" }}>
              {product.category}
            </p>
            <h3 className="text-[15px] leading-snug mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontWeight: 500 }}>
              {product.name}
            </h3>
            <p className="text-xs mb-4 leading-relaxed flex-1" style={{ color: "#8C7B6B", fontFamily: "'DM Sans', sans-serif" }}>
              {product.subtitle}
            </p>
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-baseline gap-2">
                <span className="text-base font-semibold" style={{ color: "#CFA18D", fontFamily: "'DM Sans', sans-serif" }}>₹{product.price}</span>
                {product.originalPrice && (
                  <span className="text-xs line-through" style={{ color: "#CBB8A9" }}>₹{product.originalPrice}</span>
                )}
              </div>
              <button
                onClick={() => toast.success("Added to bag", { description: product.name, icon: "✦" })}
                className="text-[11px] px-3.5 py-1.5 rounded-full font-semibold tracking-wide transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ background: "#CFA18D", color: "#FCFBF8", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 2px 8px rgba(207,161,141,0.35)" }}
              >
                Add to Bag
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── LoadingScreen ──────────────────────────────────────────────────────────
function LoadingScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: "#F8F6F2" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full opacity-30 animate-ping" style={{ background: "radial-gradient(circle, #CFA18D, transparent)", transform: "scale(1.5)" }} />
          <ImageWithFallback src={logoImg} alt="Shri Vallabh Jewels" className="w-40 h-auto object-contain relative z-10" />
        </div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "160px" }}
          transition={{ duration: 1.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="h-px rounded-full overflow-hidden"
          style={{ background: "linear-gradient(90deg, transparent, #CFA18D, #E8DCC8)" }}
        />
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-[11px] uppercase tracking-[0.35em] font-medium"
          style={{ color: "#8C7B6B", fontFamily: "'DM Sans', sans-serif" }}
        >
          Timeless Elegance
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

// ── Navbar ─────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const navLinks = ["Collections", "Necklaces", "Rings", "New Arrivals", "About"];

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: scrolled ? "rgba(248,246,242,0.92)" : "rgba(248,246,242,0.55)",
          backdropFilter: "blur(24px)",
          borderBottom: scrolled ? "1px solid rgba(203,184,169,0.28)" : "1px solid transparent",
          boxShadow: scrolled ? "0 4px 32px rgba(207,161,141,0.1)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center cursor-pointer flex-shrink-0">
            <ImageWithFallback src={logoImg} alt="Shri Vallabh Jewels" className="h-9 w-auto object-contain" />
          </div>

          <nav className="hidden md:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <a key={link} href="#" className="text-[13px] font-medium relative group" style={{ color: "#3D2B1F", fontFamily: "'DM Sans', sans-serif" }}>
                {link}
                <span className="absolute -bottom-0.5 left-0 w-0 h-[1.5px] transition-all duration-300 group-hover:w-full rounded-full" style={{ background: "#CFA18D" }} />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            {[Search, Heart].map((Icon, i) => (
              <button key={i} className="hidden md:flex w-9 h-9 items-center justify-center rounded-full transition-all duration-200 hover:bg-secondary" style={{ color: "#5A4035" }}>
                <Icon size={16} />
              </button>
            ))}
            <button
              onClick={() => toast.info("Shopping bag is empty")}
              className="relative flex w-9 h-9 items-center justify-center rounded-full transition-all duration-200 hover:bg-secondary"
              style={{ color: "#5A4035" }}
            >
              <ShoppingBag size={16} />
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-secondary"
              style={{ color: "#5A4035" }}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28 }}
            className="fixed top-16 left-0 right-0 z-40 md:hidden px-6 py-6"
            style={{ background: "rgba(248,246,242,0.97)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(203,184,169,0.3)" }}
          >
            <div className="flex flex-col gap-5">
              {navLinks.map((link) => (
                <a key={link} href="#" onClick={() => setMobileOpen(false)} className="text-base font-medium" style={{ color: "#3D2B1F", fontFamily: "'DM Sans', sans-serif" }}>
                  {link}
                </a>
              ))}
              <div className="pt-4 border-t flex gap-6" style={{ borderColor: "rgba(203,184,169,0.3)" }}>
                <button className="text-sm flex items-center gap-2" style={{ color: "#8C7B6B" }}><Search size={14} /> Search</button>
                <button className="text-sm flex items-center gap-2" style={{ color: "#8C7B6B" }}><Heart size={14} /> Wishlist</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── HeroSection ────────────────────────────────────────────────────────────
function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden pt-16" style={{ background: "linear-gradient(135deg, #F8F6F2 0%, #EFE7DD 50%, #E8DCC8 100%)" }}>
      {/* Ambient blobs */}
      <div className="absolute top-1/4 right-0 w-96 h-96 rounded-full pointer-events-none opacity-25" style={{ background: "radial-gradient(circle, #CFA18D, transparent)", filter: "blur(80px)", transform: "translate(30%,0)" }} />
      <div className="absolute bottom-1/4 left-0 w-72 h-72 rounded-full pointer-events-none opacity-15" style={{ background: "radial-gradient(circle, #E8DCC8, transparent)", filter: "blur(60px)", transform: "translate(-20%,0)" }} />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center py-20 lg:py-28">
        {/* Text column */}
        <motion.div style={{ opacity: textOpacity }}>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="text-[11px] uppercase tracking-[0.32em] mb-5 font-semibold" style={{ color: "#CFA18D", fontFamily: "'DM Sans', sans-serif" }}>
            New Collection · 2026
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl lg:text-[72px] leading-[1.08] mb-7"
            style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
            <em>Jewellery</em><br />
            That Tells<br />
            <span className="font-semibold not-italic">Your Story</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, duration: 0.7 }}
            className="text-base md:text-[17px] max-w-[440px] leading-relaxed mb-10" style={{ color: "#6B5A4E", fontFamily: "'DM Sans', sans-serif" }}>
            Beautifully crafted jewellery designed to shine with confidence — for everyday wear and every precious occasion.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-wrap gap-4 mb-10">
            <button className="px-8 py-3.5 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl"
              style={{ background: "#CFA18D", color: "#FCFBF8", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 6px 24px rgba(207,161,141,0.45)" }}>
              Explore Collections
            </button>
            <button className="px-8 py-3.5 rounded-full text-sm font-semibold transition-all duration-300 hover:bg-secondary flex items-center gap-2"
              style={{ border: "1.5px solid rgba(207,161,141,0.7)", color: "#CFA18D", fontFamily: "'DM Sans', sans-serif" }}>
              View Lookbook <ArrowRight size={14} />
            </button>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.6 }}
            className="flex flex-wrap gap-6">
            {[{ t: "Premium Quality" }, { t: "Fast Delivery" }, { t: "COD Available" }].map((x) => (
              <div key={x.t} className="flex items-center gap-1.5 text-[12px]" style={{ color: "#8C7B6B", fontFamily: "'DM Sans', sans-serif" }}>
                <span className="text-[10px]" style={{ color: "#CFA18D" }}>✦</span> {x.t}
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Image column */}
        <motion.div initial={{ opacity: 0, x: 48, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: 0.55, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ y: imgY }} className="relative flex justify-center items-center">
          <div className="absolute w-[340px] h-[340px] lg:w-[420px] lg:h-[420px] rounded-full border border-dashed opacity-20 animate-[spin_22s_linear_infinite]"
            style={{ borderColor: "#CFA18D" }} />
          <div className="absolute w-[280px] h-[280px] lg:w-[360px] lg:h-[360px] rounded-full opacity-15"
            style={{ border: "1px solid #CBB8A9" }} />

          <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] lg:w-[380px] lg:h-[380px] rounded-[2rem] overflow-hidden animate-[float_7s_ease-in-out_infinite]"
            style={{ boxShadow: "0 40px 100px rgba(207,161,141,0.4), 0 8px 32px rgba(61,43,31,0.1)", border: "2px solid rgba(207,161,141,0.35)" }}>
            <ImageWithFallback src={pearlImg} alt="Pearl Seashell Necklace — featured piece" className="w-full h-full object-cover" />
            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(61,43,31,0.08), transparent 55%)" }} />
          </div>

          {/* Floating info card */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.7 }}
            className="absolute -bottom-5 -left-4 lg:-left-10 px-4 py-3 rounded-2xl animate-[float_7s_ease-in-out_infinite_1.5s]"
            style={{ background: "rgba(252,251,248,0.94)", backdropFilter: "blur(16px)", border: "1px solid rgba(203,184,169,0.35)", boxShadow: "0 10px 32px rgba(207,161,141,0.22)" }}>
            <p className="text-[9px] uppercase tracking-[0.22em] mb-0.5" style={{ color: "#CFA18D" }}>Bestseller</p>
            <p className="text-[13px] font-medium" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Pearl Seashell Necklace</p>
            <div className="flex items-center justify-between mt-1 gap-3">
              <p className="text-xs font-bold" style={{ color: "#CFA18D" }}>₹349</p>
              <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} size={9} className="fill-amber-400 text-amber-400" />)}</div>
            </div>
          </motion.div>

          {/* Sparkles */}
          {[
            { style: { top: 16, right: 16 }, size: "text-xl", delay: "0s" },
            { style: { top: "30%", right: -14 }, size: "text-sm", delay: "1s" },
            { style: { bottom: "35%", left: -8 }, size: "text-sm", delay: "2s" },
          ].map((s, i) => (
            <div key={i} className={`absolute ${s.size} pointer-events-none animate-[sparkle_3s_ease-in-out_infinite]`}
              style={{ color: i % 2 === 0 ? "#CFA18D" : "#CBB8A9", animationDelay: s.delay, ...s.style }}>
              {i === 0 ? "✦" : i === 1 ? "◆" : "◈"}
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5">
        <p className="text-[9px] uppercase tracking-[0.25em]" style={{ color: "#8C7B6B" }}>Scroll</p>
        <div className="w-px h-8 rounded-full overflow-hidden" style={{ background: "rgba(207,161,141,0.25)" }}>
          <div className="w-full bg-primary rounded-full animate-[scrollPulse_2s_ease-in-out_infinite]" style={{ height: "40%", background: "#CFA18D" }} />
        </div>
      </motion.div>
    </section>
  );
}

// ── TrustBar ───────────────────────────────────────────────────────────────
function TrustBar() {
  const { ref, visible } = useReveal();
  const items = [
    { Icon: Sparkles, label: "Premium Quality", sub: "Artisan crafted" },
    { Icon: Truck, label: "Fast Delivery", sub: "Pan India shipping" },
    { Icon: CreditCard, label: "Cash on Delivery", sub: "Available everywhere" },
    { Icon: Package, label: "Gift Packaging", sub: "Complimentary box" },
  ];
  return (
    <div ref={ref} style={{ background: "rgba(232,220,200,0.35)", borderTop: "1px solid rgba(203,184,169,0.2)", borderBottom: "1px solid rgba(203,184,169,0.2)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4">
          {items.map(({ Icon, label, sub }, i) => (
            <div key={i} className="flex items-center gap-3 py-4 px-5" style={{ borderRight: i < 3 ? "1px solid rgba(203,184,169,0.2)" : "none" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(207,161,141,0.12)" }}>
                <Icon size={14} style={{ color: "#CFA18D" }} />
              </div>
              <div>
                <p className="text-xs font-semibold leading-tight" style={{ color: "#3D2B1F", fontFamily: "'DM Sans', sans-serif" }}>{label}</p>
                <p className="text-[10px]" style={{ color: "#8C7B6B" }}>{sub}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

// ── BrandStory ─────────────────────────────────────────────────────────────
function BrandStorySection() {
  const { ref, visible } = useReveal();
  return (
    <section className="py-24 lg:py-32 overflow-hidden" style={{ background: "#EFE7DD" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div ref={ref}>
            <motion.div initial={{ opacity: 0, x: -48 }} animate={visible ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}>
              <p className="text-[11px] uppercase tracking-[0.28em] mb-4 font-semibold" style={{ color: "#CFA18D" }}>Our Story</p>
              <h2 className="text-4xl md:text-5xl mb-6 leading-[1.15]" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
                Timeless Elegance,<br /><em>Everyday Luxury</em>
              </h2>
              <p className="text-[15px] leading-relaxed mb-5" style={{ color: "#6B5A4E", fontFamily: "'DM Sans', sans-serif" }}>
                At Shri Vallabh Jewels, we offer beautifully crafted artificial jewellery that blends elegance, quality, and affordability — designed to make you shine with confidence for everyday wear and every special occasion.
              </p>
              <p className="text-[15px] leading-relaxed mb-8" style={{ color: "#6B5A4E", fontFamily: "'DM Sans', sans-serif" }}>
                Each piece is thoughtfully designed to complement the modern Indian woman — feminine, refined, and deeply personal.
              </p>
              <button className="flex items-center gap-2 text-sm font-semibold group transition-all duration-200" style={{ color: "#CFA18D", fontFamily: "'DM Sans', sans-serif" }}>
                Discover Our Collections
                <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1.5" />
              </button>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, x: 48 }} animate={visible ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.85, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative">
            <div className="grid grid-cols-2 gap-4">
              {[heartImg, butterflyImg, ringImg, pearlImg].map((img, i) => (
                <div key={i} className={`rounded-2xl overflow-hidden aspect-square ${i % 2 !== 0 ? "mt-6" : ""}`}
                  style={{ boxShadow: "0 8px 32px rgba(207,161,141,0.18)" }}>
                  <ImageWithFallback src={img} alt="Shri Vallabh Jewels piece" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── ComboCollection ────────────────────────────────────────────────────────
function ComboCollectionSection() {
  const { ref, visible } = useReveal();
  return (
    <section className="py-24 lg:py-32 overflow-hidden" style={{ background: "linear-gradient(135deg, #EFE7DD 0%, #F8F6F2 60%, #E8DCC8 100%)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionTitle eyebrow="Curated Sets" title="The Combo Collection" subtitle="Two pieces, one perfect story. Gift sets crafted with intention." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { name: "The Romance Set", items: "Pearl Seashell + Heart Necklace", price: 599, original: 748, imgs: [pearlImg, heartImg], desc: "The perfect pair for the one who loves soft, romantic elegance." },
            { name: "The Golden Dream Set", items: "Butterfly Bloom + Infinity Ring", price: 439, original: 569, imgs: [butterflyImg, ringImg], desc: "Bold yet delicate — for those who wear their dreams." },
          ].map((combo, i) => (
            <Reveal key={i} delay={i * 0.15}>
              <div ref={ref} className="rounded-3xl overflow-hidden relative group cursor-pointer"
                style={{ background: "#FCFBF8", boxShadow: "0 8px 40px rgba(207,161,141,0.15)", border: "1px solid rgba(203,184,169,0.2)" }}>
                <div className="grid grid-cols-2 gap-0">
                  {combo.imgs.map((img, j) => (
                    <div key={j} className="overflow-hidden" style={{ paddingTop: "100%" , position: "relative" }}>
                      <div className="absolute inset-0">
                        <ImageWithFallback src={img} alt={combo.name} className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-6">
                  <div className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide mb-3"
                    style={{ background: "rgba(207,161,141,0.15)", color: "#CFA18D" }}>
                    Combo Set
                  </div>
                  <h3 className="text-xl mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>{combo.name}</h3>
                  <p className="text-xs mb-2" style={{ color: "#8C7B6B" }}>{combo.items}</p>
                  <p className="text-sm mb-4 leading-relaxed" style={{ color: "#6B5A4E" }}>{combo.desc}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold" style={{ color: "#CFA18D" }}>₹{combo.price}</span>
                      <span className="text-sm line-through" style={{ color: "#CBB8A9" }}>₹{combo.original}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(207,161,141,0.12)", color: "#CFA18D" }}>
                        Save ₹{combo.original - combo.price}
                      </span>
                    </div>
                    <button onClick={() => toast.success("Combo added to bag ✦")}
                      className="px-5 py-2 rounded-full text-xs font-semibold transition-all duration-200 hover:scale-105"
                      style={{ background: "#CFA18D", color: "#FCFBF8" }}>
                      Add Set
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

// ── TestimonialCard ────────────────────────────────────────────────────────
function TestimonialCard({ t, delay }: { t: typeof TESTIMONIALS[0]; delay: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl p-6 h-full"
        style={{ background: "#FCFBF8", boxShadow: "0 4px 24px rgba(207,161,141,0.1)", border: "1px solid rgba(203,184,169,0.2)" }}>
        <div className="flex mb-4">
          {[...Array(t.rating)].map((_, i) => <Star key={i} size={13} className="fill-amber-400 text-amber-400" />)}
        </div>
        <p className="text-[14px] leading-relaxed mb-6" style={{ color: "#6B5A4E", fontFamily: "'DM Sans', sans-serif", fontStyle: "italic" }}>
          "{t.text}"
        </p>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #CFA18D, #E8DCC8)", color: "#FCFBF8" }}>
            {t.name.split(" ").map(w => w[0]).join("")}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#3D2B1F", fontFamily: "'DM Sans', sans-serif" }}>{t.name}</p>
            <p className="text-[11px]" style={{ color: "#8C7B6B" }}>{t.city}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── FaqItem ────────────────────────────────────────────────────────────────
function FaqItem({ faq, index }: { faq: typeof FAQS[0]; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b" style={{ borderColor: "rgba(203,184,169,0.25)" }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-5 text-left gap-4">
        <span className="text-[15px] font-medium" style={{ color: "#3D2B1F", fontFamily: "'DM Sans', sans-serif" }}>
          {faq.q}
        </span>
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
          style={{ background: open ? "#CFA18D" : "rgba(207,161,141,0.12)", color: open ? "#FCFBF8" : "#CFA18D" }}>
          <ChevronDown size={14} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <p className="pb-5 text-[14px] leading-relaxed" style={{ color: "#6B5A4E", fontFamily: "'DM Sans', sans-serif" }}>
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── InstagramGallery ───────────────────────────────────────────────────────
function InstagramGallery() {
  const imgs = [pearlImg, heartImg, butterflyImg, ringImg, pearlImg, heartImg];
  return (
    <section className="py-20 overflow-hidden" style={{ background: "#F8F6F2" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionTitle eyebrow="@shrivallabhjewels" title="Our World of Jewels" subtitle="Follow along for daily drops, styling inspiration, and new arrivals." />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {imgs.map((img, i) => (
            <Reveal key={i} delay={i * 0.07}>
              <div className="rounded-xl overflow-hidden aspect-square group cursor-pointer relative"
                style={{ boxShadow: "0 4px 16px rgba(207,161,141,0.12)" }}>
                <ImageWithFallback src={img} alt="Instagram gallery" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "rgba(207,161,141,0.5)", backdropFilter: "blur(2px)" }}>
                  <Instagram size={20} className="text-white" />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="text-center mt-8">
          <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105"
            style={{ border: "1.5px solid rgba(207,161,141,0.6)", color: "#CFA18D" }}>
            <Instagram size={15} /> Follow on Instagram
          </button>
        </div>
      </div>
    </section>
  );
}

// ── ContactSection ─────────────────────────────────────────────────────────
function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  return (
    <section className="py-24 lg:py-32" style={{ background: "#EFE7DD" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.28em] mb-4 font-semibold" style={{ color: "#CFA18D" }}>Get in Touch</p>
            <h2 className="text-4xl md:text-5xl mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
              We'd love to<br /><em>hear from you</em>
            </h2>
            <p className="text-[15px] leading-relaxed mb-10" style={{ color: "#6B5A4E" }}>
              Questions, custom orders, or just want to say hello — we're always here.
            </p>
            <div className="flex flex-col gap-5">
              {[
                { Icon: Phone, label: "WhatsApp Us", val: "+91 98765 43210" },
                { Icon: Mail, label: "Email", val: "hello@shrivallabhjewels.com" },
                { Icon: MapPin, label: "Location", val: "Surat, Gujarat, India" },
              ].map(({ Icon, label, val }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(207,161,141,0.15)" }}>
                    <Icon size={16} style={{ color: "#CFA18D" }} />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-widest" style={{ color: "#8C7B6B" }}>{label}</p>
                    <p className="text-sm font-medium" style={{ color: "#3D2B1F" }}>{val}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <form onSubmit={(e) => { e.preventDefault(); toast.success("Message sent! We'll reply shortly."); setForm({ name: "", email: "", message: "" }); }}
              className="flex flex-col gap-4">
              {["name", "email"].map((field) => (
                <div key={field}>
                  <label className="block text-[11px] uppercase tracking-[0.2em] mb-2 font-medium" style={{ color: "#8C7B6B" }}>
                    {field === "name" ? "Your Name" : "Email Address"}
                  </label>
                  <input
                    type={field === "email" ? "email" : "text"}
                    required
                    value={form[field as "name" | "email"]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 focus:ring-2"
                    style={{ background: "rgba(252,251,248,0.8)", border: "1px solid rgba(203,184,169,0.4)", color: "#3D2B1F", fontFamily: "'DM Sans', sans-serif" }}
                    placeholder={field === "name" ? "Priya Sharma" : "priya@example.com"}
                  />
                </div>
              ))}
              <div>
                <label className="block text-[11px] uppercase tracking-[0.2em] mb-2 font-medium" style={{ color: "#8C7B6B" }}>
                  Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 resize-none focus:ring-2"
                  style={{ background: "rgba(252,251,248,0.8)", border: "1px solid rgba(203,184,169,0.4)", color: "#3D2B1F", fontFamily: "'DM Sans', sans-serif" }}
                  placeholder="Tell us about your order, custom request, or anything else..."
                />
              </div>
              <button type="submit" className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                style={{ background: "#CFA18D", color: "#FCFBF8", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 20px rgba(207,161,141,0.4)" }}>
                Send Message <Send size={14} />
              </button>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: "#3D2B1F" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          <div className="lg:col-span-1">
            <div className="mb-5 p-3 rounded-xl inline-block" style={{ background: "rgba(255,255,255,0.08)" }}>
              <ImageWithFallback src={logoImg} alt="Shri Vallabh Jewels" className="h-10 w-auto object-contain" style={{ filter: "brightness(0) invert(1)" }} />
            </div>
            <p className="text-[14px] leading-relaxed mb-6" style={{ color: "rgba(239,231,221,0.7)", fontFamily: "'DM Sans', sans-serif" }}>
              Beautifully crafted jewellery designed to make you shine with confidence — for everyday wear and every precious occasion.
            </p>
            <div className="flex gap-3">
              {[Instagram, Phone, Mail].map((Icon, i) => (
                <button key={i} className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                  style={{ background: "rgba(207,161,141,0.2)", color: "#CFA18D" }}>
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>

          {[
            { title: "Collections", links: ["Featured Collection", "Necklaces", "Rings & Charms", "Combo Sets", "New Arrivals"] },
            { title: "Information", links: ["About Us", "Our Story", "Shipping Policy", "Return Policy", "Privacy Policy"] },
            { title: "Support", links: ["Contact Us", "WhatsApp Order", "Size Guide", "Care Instructions", "Track Order"] },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-[11px] uppercase tracking-[0.25em] font-semibold mb-5" style={{ color: "#CFA18D" }}>{title}</h4>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-[14px] transition-colors duration-200 hover:text-[#CFA18D]"
                      style={{ color: "rgba(239,231,221,0.65)", fontFamily: "'DM Sans', sans-serif" }}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="rounded-2xl p-6 mb-12" style={{ background: "rgba(207,161,141,0.12)", border: "1px solid rgba(207,161,141,0.2)" }}>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <h4 className="text-base font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#EFE7DD" }}>
                Join the Inner Circle
              </h4>
              <p className="text-[13px]" style={{ color: "rgba(239,231,221,0.65)" }}>
                Early access, exclusive drops, and styling inspiration — straight to your inbox.
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <input type="email" placeholder="your@email.com"
                className="flex-1 md:w-60 px-4 py-2.5 rounded-full text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(207,161,141,0.3)", color: "#EFE7DD", fontFamily: "'DM Sans', sans-serif" }} />
              <button onClick={() => toast.success("Welcome to the Inner Circle! ✦")}
                className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105 whitespace-nowrap"
                style={{ background: "#CFA18D", color: "#FCFBF8" }}>
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: "rgba(203,184,169,0.15)" }}>
          <p className="text-[12px]" style={{ color: "rgba(239,231,221,0.4)", fontFamily: "'DM Sans', sans-serif" }}>
            © 2026 Shri Vallabh Jewels. All rights reserved.
          </p>
          <p className="text-[12px]" style={{ color: "rgba(239,231,221,0.4)" }}>
            Crafted with ✦ in Surat, Gujarat
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [loading, setLoading] = useState(true);

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-18px); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.35; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes scrollPulse {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(250%); opacity: 0; }
        }
        * { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <AnimatePresence>
        {loading && <LoadingScreen key="loader" onDone={() => setLoading(false)} />}
      </AnimatePresence>

      {!loading && (
        <>
          <Toaster position="bottom-center" toastOptions={{ style: { background: "#FCFBF8", border: "1px solid rgba(203,184,169,0.35)", color: "#3D2B1F", fontFamily: "'DM Sans', sans-serif", borderRadius: "1rem" } }} />
          <Navbar />

          <main>
            {/* Hero */}
            <HeroSection />

            {/* Trust Bar */}
            <TrustBar />

            {/* Featured Collections */}
            <section className="py-24 lg:py-32" style={{ background: "#F8F6F2" }}>
              <div className="max-w-7xl mx-auto px-6 lg:px-10">
                <SectionTitle eyebrow="Handpicked for You" title="Featured Collections" subtitle="Our most-loved pieces, curated for timeless elegance." />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {PRODUCTS.slice(0, 3).map((p, i) => <ProductCard key={p.id} product={p} delay={i * 0.12} />)}
                </div>
              </div>
            </section>

            {/* Best Sellers */}
            <section className="py-24 lg:py-32" style={{ background: "#EFE7DD" }}>
              <div className="max-w-7xl mx-auto px-6 lg:px-10">
                <SectionTitle eyebrow="Most Loved" title="Best Sellers" subtitle="The pieces our customers can't stop coming back for." />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...PRODUCTS].reverse().map((p, i) => <ProductCard key={p.id + 10} product={p} delay={i * 0.1} />)}
                </div>
              </div>
            </section>

            {/* New Arrivals */}
            <section className="py-24 lg:py-32" style={{ background: "#F8F6F2" }}>
              <div className="max-w-7xl mx-auto px-6 lg:px-10">
                <SectionTitle eyebrow="Fresh In" title="New Arrivals" subtitle="Just arrived — discover what's new in our latest drop." />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {PRODUCTS.map((p, i) => (
                    <ProductCard key={p.id + 20} product={{ ...p, badge: "New" }} delay={i * 0.1} />
                  ))}
                </div>
              </div>
            </section>

            {/* Brand Story */}
            <BrandStorySection />

            {/* Necklace Collection */}
            <section className="py-24 lg:py-32" style={{ background: "#F8F6F2" }}>
              <div className="max-w-7xl mx-auto px-6 lg:px-10">
                <SectionTitle eyebrow="Statement Pieces" title="Necklace Collection" subtitle="From minimalist pendants to ornate drops — for every neckline." />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {PRODUCTS.filter(p => p.category === "Necklace").map((p, i) => (
                    <ProductCard key={p.id + 30} product={p} delay={i * 0.12} />
                  ))}
                </div>
              </div>
            </section>

            {/* Combo Collection */}
            <ComboCollectionSection />

            {/* Earrings Collection */}
            <section className="py-24 lg:py-32" style={{ background: "#F8F6F2" }}>
              <div className="max-w-7xl mx-auto px-6 lg:px-10">
                <SectionTitle eyebrow="For Every Ear" title="Earrings Collection" subtitle="Delicate drops and charming studs to frame your face beautifully." />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  {[PRODUCTS[1], PRODUCTS[2]].map((p, i) => (
                    <ProductCard key={p.id + 40} product={{ ...p, category: "Earrings", badge: "Collection" }} delay={i * 0.15} />
                  ))}
                </div>
              </div>
            </section>

            {/* Bracelet Collection */}
            <section className="py-24 lg:py-32" style={{ background: "#EFE7DD" }}>
              <div className="max-w-7xl mx-auto px-6 lg:px-10">
                <SectionTitle eyebrow="Wrist Adornments" title="Bracelet Collection" subtitle="Stack them, layer them, or wear one alone — each piece tells your story." />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  {[PRODUCTS[0], PRODUCTS[3]].map((p, i) => (
                    <ProductCard key={p.id + 50} product={{ ...p, category: "Bracelet", badge: "Exclusive" }} delay={i * 0.15} />
                  ))}
                </div>
              </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 lg:py-32" style={{ background: "#F8F6F2" }}>
              <div className="max-w-7xl mx-auto px-6 lg:px-10">
                <SectionTitle eyebrow="Customer Love" title="What Our Customers Say" subtitle="Real reviews from real women who wear Shri Vallabh Jewels every day." />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {TESTIMONIALS.map((t, i) => <TestimonialCard key={t.id} t={t} delay={i * 0.1} />)}
                </div>
              </div>
            </section>

            {/* Instagram Gallery */}
            <InstagramGallery />

            {/* FAQ */}
            <section className="py-24 lg:py-32" style={{ background: "#EFE7DD" }}>
              <div className="max-w-3xl mx-auto px-6 lg:px-10">
                <SectionTitle eyebrow="Questions Answered" title="FAQs" subtitle="Everything you need to know before shopping with us." />
                <div>
                  {FAQS.map((faq, i) => <FaqItem key={i} faq={faq} index={i} />)}
                </div>
              </div>
            </section>

            {/* Contact */}
            <ContactSection />
          </main>

          <Footer />
        </>
      )}
    </>
  );
}
