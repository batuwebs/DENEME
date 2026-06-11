import React, { useState } from "react";
import { User, Shield, CreditCard, Ticket, Check, LogIn, LogOut, Lock, Mail, Users, Star, AlertTriangle, ShieldAlert } from "lucide-react";
import { AppUser, Ticket as TicketType } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface ProfileSectionProps {
  currentUser: AppUser | null;
  onLogin: (username: string, password?: string, isRegister?: boolean) => Promise<any>;
  onLogout: () => void;
  userTickets: TicketType[];
  setView: (view: "home" | "store" | "ranks" | "profile" | "support" | "admin" | "bakiye") => void;
}

export default function ProfileSection({
  currentUser,
  onLogin,
  onLogout,
  userTickets,
  setView
}: ProfileSectionProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!usernameInput.trim()) {
      setLoginError("Kullanıcı adınızı boş bırakamazsınız!");
      return;
    }

    if (!passwordInput.trim()) {
      setLoginError("Şifrenizi boş bırakamazsınız!");
      return;
    }

    setIsSubmitting(true);
    try {
      await onLogin(usernameInput.trim(), passwordInput.trim(), isRegisterMode);
      setLoginError("");
      setUsernameInput("");
      setPasswordInput("");
    } catch (err: any) {
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          setLoginError(parsed.error || "Giriş bilgileri hatalı veya kullanıcı bulunamadı.");
        } catch {
          setLoginError(err.message);
        }
      } else {
        setLoginError("İşlem gerçekleştirilemedi. Lütfen bilgilerinizi kontrol edin.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="pb-16 max-w-2xl mx-auto space-y-8 font-sans text-left"
    >
      <AnimatePresence mode="popLayout">
        {!currentUser ? (
          /* SECTION A: NOT SIGNED IN (GIRIS / KAYIT) */
          <motion.div
            key="auth-flow-container"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-secondary/10 border-2 border-dashed border-secondary rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(254,183,0,0.15)]">
                <User className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="font-headline-lg text-2xl font-extrabold text-on-surface">
                SarsılmazMC {isRegisterMode ? "Hesap Kaydı" : "Giriş Paneli"}
              </h3>
              <p className="text-xs text-outline font-body-md max-w-sm mx-auto leading-relaxed">
                {isRegisterMode 
                  ? "SarsılmazMC web platformunda yerinizi alın ve bakiye yükleyerek hemen başlayın!" 
                  : "Normal site girişi ve yetkili işlemleri için bilgilerinizi eksiksiz doldurun."}
              </p>
            </div>

            <div className="glass-card p-6 md:p-8 rounded-2xl border border-outline-variant/30 space-y-6">
              {/* Toggle Mode buttons */}
              <div className="flex bg-[#070b0c] p-1 rounded-xl border border-outline-variant/15">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(false);
                    setLoginError("");
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    !isRegisterMode 
                      ? "bg-secondary text-on-secondary shadow-md font-black" 
                      : "text-outline hover:text-white"
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5 inline mr-1.5" /> GİRİŞ YAP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(true);
                    setLoginError("");
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    isRegisterMode 
                      ? "bg-secondary text-on-secondary shadow-md font-black" 
                      : "text-outline hover:text-white"
                  }`}
                >
                  <Users className="w-3.5 h-3.5 inline mr-1.5" /> KAYIT OL
                </button>
              </div>

              {/* Warning box during Sign up */}
              {isRegisterMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-4 bg-secondary/5 border border-dashed border-secondary/40 rounded-xl text-xs text-secondary space-y-2 leading-relaxed"
                >
                  <div className="flex items-center gap-2 font-black">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>ÖNEMLİ DIKKAT VE UYARI!</span>
                  </div>
                  <p className="font-medium text-on-surface-variant font-sans text-[11px]">
                    Kullanıcı adınız, Minecraft oyunundaki adınız (nickname) ile <strong className="text-secondary underline">BİREBİR AYNI</strong> olmalıdır! Karakter uyumsuzluğu olması durumunda mağazadan satın aldığınız ögeler oyunda hesabınıza teslim edilemez.
                  </p>
                </motion.div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {/* Username Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-outline uppercase tracking-wider block font-bold">
                    MINECRAFT OYUNCU ADINIZ (USERNAME)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: BatuMC"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-[#080d0f] border border-outline-variant/30 rounded-xl py-3.5 px-4 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all font-mono text-xs text-on-surface"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-outline uppercase tracking-wider block font-bold">
                    GÜVENLİGİNİZ İÇİN ŞİFRE
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-[#080d0f] border border-outline-variant/30 rounded-xl py-3.5 px-4 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all font-mono text-xs text-on-surface"
                  />
                </div>

                {loginError && (
                  <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-xs text-error font-mono leading-relaxed">
                    ⚠️ {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary font-mono text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(254,183,0,0.25)] cursor-pointer active:scale-95 text-center flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    "DOĞRULANIYOR..."
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" /> {isRegisterMode ? "HESABIMI RESMEN OLUŞTUR" : "GİRİŞ YAP / BAĞLAN"}
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          /* SECTION B: SIGNED IN DEEP REDESIGN */
          <motion.div
            key="profile-details-container"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            {/* Header Profil Card */}
            <div className="glass-card p-6 md:p-8 rounded-2xl border border-secondary/35 bg-surface-container-low/75 relative overflow-hidden flex flex-col md:flex-row items-center gap-6 justify-between shadow-xl">
              <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left z-10 w-full md:w-auto">
                <div className="w-20 h-20 rounded-full border-2 border-secondary p-1 shadow-[0_0_15px_rgba(254,183,0,0.25)] bg-background flex items-center justify-center overflow-hidden">
                  <img
                    src={`https://mc-heads.net/avatar/${currentUser.username}`}
                    alt="Skin"
                    className="w-16 h-16 object-contain"
                    onError={(e) => {
                      // Fallback if skin service is offline
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <User className="w-10 h-10 text-secondary" style={{ display: "none" }} />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                    <h3 className="font-headline-lg text-xl md:text-2xl font-black text-on-surface">
                      {currentUser.username}
                    </h3>
                    <span className="bg-secondary/15 border border-secondary/40 text-secondary font-label-caps text-[9px] px-2.5 py-0.5 rounded-full font-bold">
                      ROL: {currentUser.role.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-outline font-body-md">
                    SarsılmazMC dünyasına bağlı güvenli oyuncu profili.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto z-10 font-mono">
                {currentUser.role?.toLowerCase() === "admin" ? (
                  <button
                    onClick={() => setView("admin")}
                    className="flex-grow px-4 py-2.5 bg-secondary text-on-secondary font-bold text-[11px] rounded-lg border border-secondary/50 flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(254,183,10,0.2)] active:scale-95 transition-all text-center uppercase font-black"
                  >
                    <Shield className="w-3.5 h-3.5" /> YÖNETİM PANELİ
                  </button>
                ) : null}
                
                <button
                  onClick={onLogout}
                  className="flex-grow px-4 py-2 bg-transparent text-outline hover:text-error hover:border-error border border-outline-variant/35 text-[11px] font-mono font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" /> GÜVENLİ ÇIKIŞ
                </button>
              </div>
            </div>

            {/* Wallet & Support Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Wallet Block */}
              <div className="glass-card p-6 rounded-2xl border border-outline-variant/30 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-secondary" />
                    <span className="font-label-caps text-[10px] text-outline font-bold">BAKİYE KONTROLÜ</span>
                  </div>
                  
                  {/* Notice about balance visibility constraint */}
                  <div className="p-3 bg-secondary/5 border border-secondary/20 rounded-xl">
                    <p className="text-[11px] font-mono text-outline leading-normal">
                      🔒 <strong className="text-secondary uppercase">Bakiye Gizliliği:</strong> Kamu cüzdan güvenliğiniz için bakiyeniz sadece yükleme ve satın alma ekranlarında görüntülenebilir.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setView("bakiye")}
                  className="w-full py-2.5 bg-secondary text-on-secondary hover:bg-secondary/85 font-mono text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer text-center block"
                >
                  Bakiye Satın Al / Yükle
                </button>
              </div>

              {/* Support Tickets Counter Block */}
              <div className="glass-card p-6 rounded-2xl border border-outline-variant/30 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-primary-container" />
                    <span className="font-label-caps text-[10px] text-outline font-bold">SİTELİK TALEPLER</span>
                  </div>
                  <h4 className="text-3xl font-black font-display text-primary-container">{userTickets.length} Destek</h4>
                  <p className="text-xs text-on-surface-variant font-body-md leading-relaxed">
                    Açtığınız tüm destek taleplerini, teknik ekibimizin yazı geçmişini ve yanıtlarını inceleyin.
                  </p>
                </div>

                <button
                  onClick={() => setView("support")}
                  className="w-full py-2.5 bg-primary-container hover:bg-primary-container/85 text-on-primary font-mono text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer text-center block shadow-[0_0_12px_rgba(0,d4,ff,0.15)]"
                >
                  Destek Taleplerime Git
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
