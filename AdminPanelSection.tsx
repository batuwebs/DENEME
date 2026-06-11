import React, { useState, useEffect } from "react";
import { Search, ShoppingCart, ExternalLink, ChevronLeft, ChevronRight, Sparkles, Star, Tag, Info } from "lucide-react";
import { Product, DynamicCategory } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface StoreSectionProps {
  products: Product[];
  categories: DynamicCategory[];
  onAddToCart: (p: Product) => void;
  cartItemsCount: number;
  currentUser: { username: string; role: string; credits: number } | null;
  onSimulatePurchase: (product: Product) => void;
  activeCategoryFilter?: string; // Optional default pre-filter (e.g. "vip" or "kasa")
}

interface SliderItem {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  image: string;
  color: string;
}

const SLIDES: SliderItem[] = [
  {
    id: 1,
    title: "Sarsılmaz VIP Sezonu Başladı",
    subtitle: "/fly yetkisi, kitler ve renkli isim ayrıcalıklarıyla sunucunun hakimi olun!",
    badge: "%40 ENERJİ İNDİRİMİ",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCT3zrEX24p3gdClgwg-TEqOKsn3unm-TTq5KXJtmWyERQ6MAExeAwaVlLqAsCCyf4u9V5-ikRrxxViBI9KirsS6VAc8zHz3rep8MsyO5C4_DSitTmL5-ECXGoUGtxent3U8nFcXqItUHfGK3ni4Lipv906W7NmCbWKa0r64P20n5ZGrTboUsIsDPnpkjencXVgFgy7iRg9HYkhuDaWp4Gvk2TdVnC1aAx_t33IBuZ6xbpCed6ToNbud8aQgYKDo1x-4jAynEZwfeA",
    color: "from-[#0a1823] to-[#04334f]"
  },
  {
    id: 2,
    title: "Efsanevi Kozmik Kasalar Aktif!",
    subtitle: "Rütbe, para ödülü, efsanevi büyülü eşyalar ve özel efekt kartları şansı.",
    badge: "YENİ GÜNCELLEME",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD-miQg7nXBkkT22rTxmoeDbSm-iXBuDqSDkzCDLUEymuVV8yhin895ztuItkoHzamVDVvTDleUE4BdHvj4JpA7whPRKVDN5cu_y1LDlSZwh3x8gOHbebjLlmv2WImV1XC_kFI8EzI8Eaq_PQVWkPBirTpDiB49AjYw-BOSumiIImnWU0kFZdgiblcspA-1I3jCcJDKM41JQftG42KPnGxu09m0RpdEGjzEzlfHJlHD4sIcfVUfyQ2V3XDMBozlxNijB8HxAPHL_JE",
    color: "from-[#150d24] to-[#391a56]"
  },
  {
    id: 3,
    title: "Haftalık %25 Ekstra Kredi Bonusu",
    subtitle: "Yüklediğiniz tüm kredilerde anında bonus kazanın. Destek üzerinden talep açabilirsiniz.",
    badge: "REKOR KAMPANYA",
    image: "https://lh3.googleusercontent.com/aida/AP1WRLvOEjzRYPX8vAksLz7qHqL7Nzw2VZKeiIO_UsrflI09nQRCxklEXhXc-CUdu-nVlDa8zSegIvmBGD1ht38QdvuJzJaxxOZOWjD2cHUbXxDlHEKgF1g27e5bE-XFAc1ZURXabUV7cpEs1EQCGHzotElUNbNzF3FRj64rxUrSGPqRNYtHqgE0Etd-6mBt_0Eq-URAgkL2ZEgBsWy1Z5kH3dwVdg_vpPFKo9qptzBUxkUPH_liLxJMSztSvVA",
    color: "from-[#1a1c1d] to-[#122e30]"
  }
];

export default function StoreSection({
  products,
  categories,
  onAddToCart,
  cartItemsCount,
  currentUser,
  onSimulatePurchase,
  activeCategoryFilter
}: StoreSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);

  // Sync category filter from top level navigation (VIP vs Kasa)
  useEffect(() => {
    if (activeCategoryFilter) {
      setActiveCategory(activeCategoryFilter);
    } else {
      setActiveCategory("all");
    }
  }, [activeCategoryFilter]);

  // Autoplay slider interval
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlideIdx((prev) => (prev + 1) % SLIDES.length);
    }, 5500);
    return () => clearInterval(slideTimer);
  }, []);

  const handleNextSlide = () => {
    setCurrentSlideIdx((prev) => (prev + 1) % SLIDES.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlideIdx((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  // Filter products by category, keyword
  const filteredProducts = products.filter((prod) => {
    const matchesKeyword = prod.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "all" || prod.category === activeCategory;
    return matchesKeyword && matchesCategory;
  });

  const handleDirectPurchase = (prod: Product) => {
    // Direct purchasing URL redirect as requested! "satin al sayfasini yapma direct satin alma linkine gitsin"
    const checkoutUrl = prod.buyUrl || "https://www.papara.com/";
    
    // Redirect directly to the checkout secure gateway
    window.open(checkoutUrl, "_blank", "referrer");
  };

  const activeSlide = SLIDES[currentSlideIdx];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-16 font-sans"
    >
      {/* Top Slider Carousel Banner */}
      <div className="relative aspect-[21/9] min-h-[160px] md:min-h-[220px] rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/25">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide.id}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 bg-gradient-to-r ${activeSlide.color} p-5 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6`}
          >
            {/* Dynamic text details */}
            <div className="space-y-2 md:space-y-3 z-10 text-left max-w-full md:max-w-[60%]">
              <span className="inline-block bg-primary px-3 py-1 rounded-full text-[9px] md:text-[10px] font-mono font-black text-on-primary tracking-widest shadow-md animate-pulse">
                {activeSlide.badge}
              </span>
              <h2 className="text-xl md:text-3xl font-black font-display text-white tracking-tight leading-none">
                {activeSlide.title}
              </h2>
              <p className="text-[11px] md:text-xs text-on-surface-variant/90 font-medium">
                {activeSlide.subtitle}
              </p>
            </div>

            {/* Slider image representation */}
            <div className="hidden md:block w-36 h-36 border border-outline-variant/30 rounded-xl overflow-hidden bg-black/30 shrink-0">
              <img
                src={activeSlide.image}
                alt="Kampanya"
                className="w-full h-full object-cover select-none pointer-events-none"
              />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Arrow controllers */}
        <button
          onClick={handlePrevSlide}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white cursor-pointer z-10 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={handleNextSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white cursor-pointer z-10 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Page Slider Dot Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {SLIDES.map((slide, sIdx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlideIdx(sIdx)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                sIdx === currentSlideIdx ? "bg-primary-container w-4" : "bg-outline-variant/70"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Dynamic Category List Left-Siderail */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-4 rounded-xl border border-outline-variant/30 bg-[#0c1214]/65">
            <h3 className="font-label-caps text-[10px] text-primary-container font-bold mb-4 tracking-widest pl-2">KATEGORİ FILTRESI</h3>
            
            <div className="flex flex-row overflow-x-auto lg:flex-col gap-1.5 scrollbar-none pb-2 lg:pb-0">
              <button
                onClick={() => setActiveCategory("all")}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left border shrink-0 lg:w-full cursor-pointer ${
                  activeCategory === "all"
                    ? "bg-primary-container/15 text-primary-container border-primary-container/40"
                    : "bg-transparent text-outline border-transparent hover:bg-surface-container-high/40 hover:text-on-surface"
                }`}
              >
                <Sparkles className="w-4 h-4" /> Tümü ({products.length})
              </button>
              
              {categories.map((cat) => {
                const isSelected = activeCategory === cat.id;
                const count = products.filter((p) => p.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left border shrink-0 lg:w-full cursor-pointer ${
                      isSelected
                        ? "bg-primary-container/25 text-primary-container border-primary-container/55 shadow-md"
                        : "bg-transparent text-outline border-transparent hover:bg-surface-container-high/40 hover:text-on-surface"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Tag className="w-4 h-4" /> {cat.name}
                    </span>
                    <span className="text-[10px] font-mono opacity-80">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Ürün adı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#080d0f] border border-outline-variant/30 rounded-xl py-3.5 pl-10 pr-4 focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all font-mono text-xs text-on-surface"
            />
          </div>
        </div>

        {/* Product Grid Area - Simplified Cards Displaying No Descriptions */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full glass-card p-12 text-center rounded-2xl border border-dashed border-outline-variant/40">
                <p className="text-outline font-mono text-sm">Aranan kriterde veya kategoride ürün bulunmuyor.</p>
              </div>
            ) : (
              filteredProducts.map((prod) => {
                const categoryLabel = categories.find((c) => c.id === prod.category)?.name || prod.category.toUpperCase();
                return (
                  <motion.div
                    key={prod.id}
                    layout
                    className="glass-card rounded-2xl p-4 flex flex-col justify-between group border border-outline-variant/20 hover:border-primary-container/45 transition-all duration-300 relative overflow-hidden bg-surface-container-lowest/80"
                  >
                    {prod.popular && (
                      <div className="absolute top-3 right-3 z-10 bg-primary-container/15 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-primary-container/40">
                        <span className="font-label-caps text-[8px] text-primary-container font-black">POPÜLER</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      {/* Product display thumbnail */}
                      <div 
                        onClick={() => handleDirectPurchase(prod)}
                        className="aspect-[16/10] w-full rounded-xl overflow-hidden bg-surface-container-highest border border-outline-variant/10 cursor-pointer group-hover:opacity-90 transition-opacity"
                        title="Hızlı Satın Alma Linkine Git"
                      >
                        <img
                          src={prod.image}
                          alt={prod.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      {/* Header details with no descriptive body blocks */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-surface-variant/50 border border-outline-variant/20 px-2.5 py-0.5 rounded text-[9px] font-mono font-bold text-outline uppercase tracking-wider">
                            {categoryLabel}
                          </span>
                        </div>
                        
                        <h3 
                          onClick={() => handleDirectPurchase(prod)}
                          className="font-headline-md text-base text-on-background font-black group-hover:text-primary-container transition-colors truncate cursor-pointer"
                          title="Hızlı Satın Alma Linkine Git"
                        >
                          {prod.title}
                        </h3>
                      </div>
                    </div>

                    {/* Bottom pricing row */}
                    <div className="pt-3 border-t border-outline-variant/20 mt-4 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col text-left">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-outline-variant">TUTAR</span>
                          <span className="text-lg font-black font-mono text-primary-container">
                            {prod.price},00 ₺
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-mono font-bold text-outline-variant uppercase">TESLİMAT</span>
                          <span className="block text-[10px] text-zinc-400 font-bold">Onay Kuyruğu</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 w-full pt-1">
                        {/* Direct purchase external link */}
                        <button
                          onClick={() => handleDirectPurchase(prod)}
                          className="bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-on-surface font-bold font-mono text-[9px] py-1.5 px-1 rounded-lg cursor-pointer hover:scale-102 active:scale-98 transition-all text-center flex items-center justify-center gap-1"
                          title="Doğrudan Papara Ödeme Linki"
                        >
                          LİNKLE AL <ExternalLink className="w-3 h-3 text-secondary" />
                        </button>

                        {/* Buy with Site Balance (credits system with approval queue) */}
                        <button
                          onClick={() => onSimulatePurchase(prod)}
                          className="bg-secondary hover:bg-secondary/90 text-on-secondary font-black font-mono text-[9px] py-1.5 px-1 rounded-lg cursor-pointer shadow-[0_0_10px_rgba(254,183,10,0.15)] hover:scale-102 active:scale-98 transition-all text-center flex items-center justify-center gap-0.5"
                          title="SarsılmazMC bakiyenizle satın alım yapın ve onay kuyruğuna alın"
                        >
                          BAKİYE İLE AL
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Trust guarantees footer section */}
      <section className="border-t border-outline-variant/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 px-1 text-xs text-outline font-body-md">
        <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start">
          <span className="flex items-center gap-1.5 grayscale hover:grayscale-0 transition-opacity opacity-75">
            <span className="bg-primary/15 p-1 px-1.5 rounded text-primary font-mono font-black text-[10px]">VISA</span> Kredi Kartı
          </span>
          <span className="flex items-center gap-1.5 grayscale hover:grayscale-0 transition-opacity opacity-75">
            <span className="bg-secondary/15 p-1 px-1.5 rounded text-secondary font-mono font-black text-[10px]">PREPAID</span> Papara Cüzdan
          </span>
        </div>
        <p className="text-center md:text-right text-[10px] tracking-wide font-mono uppercase text-outline-variant font-medium">
          🛡️ TÜM SATIN ALIMLAR 256-BIT SSL VE PAYTR/MEFETE SİSTEMİYLE GÜVENCE ALTINDADIR.
        </p>
      </section>
    </motion.div>
  );
}
