import React, { useState } from "react";
import { Copy, Check, Cpu, Shield, Store, Newspaper, BarChart2, MessageSquare } from "lucide-react";
import { motion } from "motion/react";

interface HomeSectionProps {
  setView: (view: "home" | "store" | "ranks" | "profile" | "support" | "admin") => void;
  onlinePlayers: number;
}

export default function HomeSection({ setView, onlinePlayers }: HomeSectionProps) {
  const [copied, setCopied] = useState(false);

  const copyIp = () => {
    navigator.clipboard.writeText("play.sarsilmazmc.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-10 pb-16"
    >
      {/* Hero Section */}
      <section className="relative h-[55vh] md:h-[60vh] flex flex-col justify-end px-4 pb-10 rounded-2xl overflow-hidden border border-outline-variant/20 shadow-2xl">
        <div className="absolute inset-0 z-0">
          <img
            alt="Cinematic cyber city view"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida/AP1WRLvOEjzRYPX8vAksLz7qHqL7Nzw2VZKeiIO_UsrflI09nQRCxklEXhXc-CUdu-nVlDa8zSegIvmBGD1ht38QdvuJzJaxxOZOWjD2cHUbXxDlHEKgF1g27e5bE-XFAc1ZURXabUV7cpEs1EQCGHzotElUNbNzF3FRj64rxUrSGPqRNYtHqgE0Etd-6mBt_0Eq-URAgkL2ZEgBsWy1Z5kH3dwVdg_vpPFKo9qptzBUxkUPH_liLxJMSztSvVA"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e1417] via-[#0e1417]/40 to-transparent"></div>
        </div>

        <div className="relative z-10 space-y-6 max-w-xl">
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md w-fit px-3 py-1 rounded-full border border-primary-container/30">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
            <span className="font-label-caps text-[11px] text-primary tracking-wider">{onlinePlayers} / 1000 AKTİF OYUNCU</span>
          </div>

          <div className="space-y-2">
            <h2 className="font-headline-lg font-extrabold text-on-background leading-none md:text-5xl text-3xl">
              Geleceğe <span className="text-primary-container">Adım At.</span>
            </h2>
            <p className="text-on-surface-variant text-sm md:text-base max-w-sm">
              Türkiye'nin öncü Cyber-Towny deneyimine katılın. Köyünüzü kurun, ticaret yapın ve hükmedin.
            </p>
          </div>

          {/* Copyable IP Module */}
          <div className="flex items-center gap-0 border border-primary-container/40 rounded-xl overflow-hidden bg-surface-container-low/90 backdrop-blur-md max-w-md shadow-[0_0_20px_rgba(0,d4,ff,0.15)] hover:border-primary-container transition-all">
            <div className="flex-1 px-4 py-3.5 font-mono text-xs md:text-sm tracking-widest text-primary-container select-all">
              play.sarsilmazmc.com
            </div>
            <button
              onClick={copyIp}
              className="bg-primary-container hover:bg-primary-container/80 text-on-primary-container px-5 py-3.5 active:scale-95 transition-all flex items-center justify-center border-l border-primary-container/20 cursor-pointer"
              title="IP Adresini Kopyala"
            >
              {copied ? <Check className="w-5 h-5 text-green-950" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </section>

      {/* Quick Actions Panel */}
      <section className="px-1">
        <h3 className="font-label-caps text-xs text-outline mb-4">HIZLI MENÜ</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setView("store")}
            className="glass-card p-6 rounded-xl flex flex-col items-center gap-3 hover:border-primary-container hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Store className="w-6 h-6 text-primary-container" />
            </div>
            <span className="font-label-caps text-xs text-on-surface">MAĞAZA</span>
          </button>

          <button
            onClick={() => setView("ranks")}
            className="glass-card p-6 rounded-xl flex flex-col items-center gap-3 hover:border-secondary hover:shadow-[0_0_15px_rgba(254,183,0,0.15)] transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart2 className="w-6 h-6 text-secondary" />
            </div>
            <span className="font-label-caps text-xs text-on-surface">SIRALAMA</span>
          </button>

          <button
            onClick={() => setView("support")}
            className="glass-card p-6 rounded-xl flex flex-col items-center gap-3 hover:border-primary-container hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 bg-tertiary-container/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6 text-tertiary-container" />
            </div>
            <span className="font-label-caps text-xs text-on-surface">DESTEK</span>
          </button>

          <button
            onClick={() => setView("profile")}
            className="glass-card p-6 rounded-xl flex flex-col items-center gap-3 hover:border-primary-container hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 bg-primary-fixed-dim/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-primary-fixed-dim" />
            </div>
            <span className="font-label-caps text-xs text-on-surface">PROFİLİM</span>
          </button>
        </div>
      </section>

      {/* Featured News Post */}
      <section className="px-1">
        <div className="flex justify-between items-end mb-4">
          <h3 className="font-headline-md text-xl md:text-2xl font-bold">Öne Çıkan Gelişmeler</h3>
          <span className="font-label-caps text-[10px] text-primary/60">SARSILMAZ REHBERLER</span>
        </div>
        <div className="glass-card rounded-2xl overflow-hidden border border-outline-variant/20 hover:border-secondary/40 transition-all flex flex-col md:flex-row shadow-lg">
          <div className="h-48 md:h-auto md:w-2/5 relative">
            <img
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBneyEcuPzvgvsex6ebROFXTSVtmXwPOpuBIV2deKROZkBk52P6qBnSmqpnTcCPjNs69BYnY40nx2Gxnws4pLdtElO8C2B25ykO71zbiDkKBMxoHuyNlbxjJZQbm9rzapiaV3jezym2_EpEHEXpOMnkip4K_YArohWlCkVYLJbb9_S-64wU4qJWjFr4OK1N6fEdBOd9zTaU38CFcaz1VDKilPC97jomSlshlfhJDLu2470JVzqn8lSo7KoKr-g_MGnvFBsCG7414R0"
              alt="Season announcement core"
            />
            <div className="absolute top-4 left-4 z-20 bg-secondary/20 backdrop-blur-md px-3 py-1 rounded-full border border-secondary/50">
              <span className="font-label-caps text-[10px] text-secondary font-bold font-mono tracking-wider">YENİ SEZON</span>
            </div>
          </div>
          <div className="p-6 md:p-8 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h4 className="font-headline-md text-xl md:text-2xl text-secondary font-extrabold tracking-tight">
                Sezon 2: Cyber-Genesis Başladı!
              </h4>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Yeni cyber-netic geliştirmeler, genişletilmiş köy bölge savaşları ve neon tasarımlı yeni haritalar sizleri bekliyor. Teknolojik üstünlüğünüzü kurmak için hemen sunucuya bağlanın veya Web Mağazamızdan en özel donanımları elde edin.
              </p>
            </div>
            <button
              onClick={() => setView("store")}
              className="w-full sm:w-fit px-6 py-3 bg-secondary/10 hover:bg-secondary/20 border border-secondary text-secondary font-label-caps text-xs rounded-xl tracking-wider hover:scale-105 active:scale-95 transition-all text-center cursor-pointer"
            >
              MAĞAZAYI GÖRÜNTÜLE
            </button>
          </div>
        </div>
      </section>

      {/* Network Nodes Status */}
      <section className="px-1 space-y-6">
        <div>
          <h3 className="font-headline-md text-xl font-bold">Ağ Bağlantı Birimleri</h3>
          <p className="text-xs text-outline mt-1 font-body-md">Mevcut oyun sunucu birimlerimizin kapasite ve doluluk oranları.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-container/30 rounded-2xl p-5 border border-outline-variant/10">
          {/* Towny Status */}
          <div className="space-y-3 p-4 rounded-xl bg-surface-container-low/50 border border-outline-variant/30">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary-container" />
                <span className="font-label-caps text-xs text-on-surface">CYBER-TOWNY REALM (AKTİF)</span>
              </div>
              <span className="text-xs text-primary-container font-mono font-bold">92% KAPASİTE</span>
            </div>
            <div className="h-2.5 w-full bg-surface-container-highest rounded-full overflow-hidden border border-outline-variant/30">
              <div className="h-full bg-primary-container shadow-[0_0_10px_rgba(0,212,255,0.5)] rounded-full w-[92%]"></div>
            </div>
            <p className="text-[11px] text-outline font-body-md">Sarsılmaz cyber-altyapı ile sıfır gecikmeli şehir kurma simülasyonu.</p>
          </div>

          {/* Creative status */}
          <div className="space-y-3 p-4 rounded-xl bg-surface-container-low/50 border border-outline-variant/30">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-tertiary-container" />
                <span className="font-label-caps text-xs text-on-surface">CREATIVE HUB (AKTİF)</span>
              </div>
              <span className="text-xs text-tertiary-container font-mono font-bold">45% KAPASİTE</span>
            </div>
            <div className="h-2.5 w-full bg-surface-container-highest rounded-full overflow-hidden border border-outline-variant/30">
              <div className="h-full bg-tertiary-container shadow-[0_0_10px_rgba(254,181,40,0.5)] rounded-full w-[45%]"></div>
            </div>
            <p className="text-[11px] text-outline font-body-md">Yaratıcılığınızı özgür bırakan geniş cyber-flat düz plot inşa alanı.</p>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
