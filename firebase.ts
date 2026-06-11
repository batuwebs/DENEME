import React, { useState, useEffect, useRef } from "react";
import { AppUser, Product, Ticket, TicketMessage, DynamicCategory, ApprovalRequest } from "./types";
import { 
  db, 
  seedDatabaseIfNeeded, 
  seedTicketsIfNeeded, 
  seedCategoriesIfNeeded,
  seedUsersIfNeeded,
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  SAMPLE_TICKETS,
  sanitizeData
} from "./firebase";
import { 
  collection, 
  getDocs, 
  setDoc, 
  getDoc,
  doc, 
  deleteDoc, 
  updateDoc 
} from "firebase/firestore";
import HomeSection from "./components/HomeSection";
import StoreSection from "./components/StoreSection";
import RanksSection from "./components/RanksSection";
import ProfileSection from "./components/ProfileSection";
import SupportSection from "./components/SupportSection";
import AdminPanelSection from "./components/AdminPanelSection";
import BalanceSection from "./components/BalanceSection";

import { 
  ShieldCheck, 
  MessageSquare, 
  Store, 
  BarChart2, 
  User, 
  Copy, 
  Check, 
  Info, 
  Star, 
  Tag, 
  Coins, 
  Bell, 
  X,
  AlertTriangle,
  ChevronDown,
  Settings,
  FolderPlus,
  ShieldAlert,
  Boxes
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface AppToast {
  id: string;
  title: string;
  message: string;
  type: "success" | "info" | "warning";
}

export default function App() {
  const [view, setView] = useState<"home" | "vip" | "kasa" | "ranks" | "profile" | "support" | "admin" | "bakiye">("home");
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  // Database lists
  const [products, setProducts] = useState<Product[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [categories, setCategories] = useState<DynamicCategory[]>([
    { id: "vip", name: "VIP Paketleri" },
    { id: "kasa", name: "Kozmik Kasalar" }
  ]);
  const [usersList, setUsersList] = useState<AppUser[]>([]);

  // Page States
  const [cartCount, setCartCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Admin interactive triggers & nav menu state
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [adminNavigationTrigger, setAdminNavigationTrigger] = useState<{
    tab: "dashboard" | "products" | "categories" | "tickets" | "users" | "approvals";
    action?: {
      type: "open_product_form";
      category: string;
    };
    timestamp: number;
  } | null>(null);

  const adminDropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target as Node)) {
        setAdminDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // In-app custom elegant toast center
  const [toasts, setToasts] = useState<AppToast[]>([]);

  // Ref to track previous tickets to check for status updates to send push notifications
  const prevTicketsRef = useRef<Ticket[]>([]);

  const addToast = (title: string, message: string, type: "success" | "info" | "warning" = "info") => {
    const id = "toast-" + Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    
    // Auto clear after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  // Ask for browser push notifications access on first click
  const requestNotificationPermission = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  // Seed and fetch data
  useEffect(() => {
    const initData = async () => {
      setIsRefreshing(true);
      // Seed initial databases if first time
      await seedDatabaseIfNeeded();
      await seedCategoriesIfNeeded();
      await seedTicketsIfNeeded();
      await seedUsersIfNeeded();
      
      // Fetch fresh data
      await fetchAllData();
      
      // Recall local session
      const storedUser = localStorage.getItem("sarsilmaz_user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser) as AppUser;
          // Refresh their credit balance in real-time from Firestore!
          const uDoc = await getDoc(doc(db, "users", parsed.username.toLowerCase()));
          if (uDoc.exists()) {
            const data = uDoc.data();
            const freshUser: AppUser = {
              username: data.username || parsed.username,
              role: data.role || parsed.role,
              credits: typeof data.credits === "number" ? data.credits : parsed.credits,
              password: data.password || parsed.password
            };
            setCurrentUser(freshUser);
            localStorage.setItem("sarsilmaz_user", JSON.stringify(freshUser));
          } else {
            setCurrentUser(parsed);
          }
        } catch (err) {
          console.warn("Failed to retrieve user cache cleanly", err);
        }
      }
      setIsRefreshing(false);
    };
    initData();

    // Setup an interval for light poll checkups (e.g. every 10 seconds) to simulate real-time notifications updates
    const pollTimer = setInterval(async () => {
      await fetchAllDataSilent();
    }, 10000);

    return () => clearInterval(pollTimer);
  }, [currentUser?.username, currentUser?.role]);

  // Silent update tracker for notification comparisons
  const fetchAllDataSilent = async () => {
    try {
      const ticketSnapshot = await getDocs(collection(db, "tickets"));
      let loadedTickets: Ticket[] = [];
      if (!ticketSnapshot.empty) {
        ticketSnapshot.forEach((d) => {
          loadedTickets.push({ ...d.data() } as Ticket);
        });
        loadedTickets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        
        // Match updates for notifications!
        checkForTicketUpdates(loadedTickets);
        setTickets(loadedTickets);
      }
    } catch (err) {
      // ignore silent poll errors
    }
  };

  // Comparative notifications trigger
  const checkForTicketUpdates = (newTickets: Ticket[]) => {
    if (prevTicketsRef.current.length === 0) {
      prevTicketsRef.current = newTickets;
      return;
    }

    // Role-dependent checking logic
    if (currentUser) {
      if (currentUser.role?.toLowerCase() === "admin") {
        // Admin: Look for absolute new tickets or tickets changed to 'beklemede'
        newTickets.forEach((nt) => {
          const oldt = prevTicketsRef.current.find((t) => t.id === nt.id);
          if (!oldt) {
            // Unseen new ticket added!
            const title = "Yeni Destek Talebi!";
            const msg = `${nt.user} isimli oyuncu yeni bir bilet başlattı: ${nt.subject}`;
            addToast(title, msg, "info");
            triggerPushNotification(title, msg);
          } else if (oldt.status !== "beklemede" && nt.status === "beklemede") {
            // Ticket re-opened or reset to waiting
            const title = "Bilet Güncellendi";
            const msg = `${nt.user} destek talebini güncelledi. Cevap bekleniyor.`;
            addToast(title, msg, "info");
            triggerPushNotification(title, msg);
          }
        });
      } else {
        // Free / Normal user check: look for updates in their specific tickets
        newTickets.forEach((nt) => {
          if (nt.user.toLowerCase() === currentUser.username.toLowerCase()) {
            const oldt = prevTicketsRef.current.find((t) => t.id === nt.id);
            if (oldt) {
              if (oldt.status !== "yanıtlandı" && nt.status === "yanıtlandı") {
                const title = "Destek Talebiniz Cevaplandı!";
                const msg = `"${nt.subject}" başlıklı biletiniz teknik ekip tarafından yanıtlandı.`;
                addToast(title, msg, "success");
                triggerPushNotification(title, msg);
              } else if (oldt.status !== "kapatıldı" && nt.status === "kapatıldı") {
                const title = "Destek Talebiniz Kapatıldı.";
                const msg = `"${nt.subject}" başlıklı talebiniz çözümlenerek kapatılmıştır.`;
                addToast(title, msg, "warning");
                triggerPushNotification(title, msg);
              }
            }
          }
        });
      }
    }

    prevTicketsRef.current = newTickets;
  };

  const triggerPushNotification = (title: string, body: string) => {
    try {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: `https://mc-heads.net/avatar/${currentUser?.username || "Admin"}`
        });
      }
    } catch (e) {
      console.warn("Could not fire standard browser Notification due to sandbox iframe restrictions", e);
    }
  };

  const fetchAllData = async () => {
    setIsRefreshing(true);
    let loadedProducts: Product[] = [];
    let loadedCategories: DynamicCategory[] = [];
    let loadedTickets: Ticket[] = [];
    let loadedUsers: AppUser[] = [];

    // 1. Fetch Products
    try {
      const prodSnapshot = await getDocs(collection(db, "products"));
      if (!prodSnapshot.empty) {
        prodSnapshot.forEach((d) => {
          loadedProducts.push({ ...d.data() } as Product);
        });
      }
    } catch (err) {
      console.warn("Failed to fetch products from Firestore, using initial products fallback.", err);
    }
    if (loadedProducts.length === 0) {
      loadedProducts = INITIAL_PRODUCTS;
    }
    setProducts(loadedProducts);

    // 2. Fetch Categories
    try {
      const catSnapshot = await getDocs(collection(db, "categories"));
      if (!catSnapshot.empty) {
        catSnapshot.forEach((d) => {
          loadedCategories.push({ ...d.data() } as DynamicCategory);
        });
      }
    } catch (err) {
      console.warn("Failed to fetch categories from Firestore, using initial categories fallback.", err);
    }
    if (loadedCategories.length === 0) {
      loadedCategories = INITIAL_CATEGORIES;
    }
    setCategories(loadedCategories);

    // 3. Fetch Tickets
    try {
      const ticketSnapshot = await getDocs(collection(db, "tickets"));
      if (!ticketSnapshot.empty) {
        ticketSnapshot.forEach((d) => {
          loadedTickets.push({ ...d.data() } as Ticket);
        });
        loadedTickets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      }
    } catch (err) {
      console.warn("Failed to fetch tickets from Firestore, using sample tickets fallback.", err);
    }
    if (loadedTickets.length === 0) {
      loadedTickets = SAMPLE_TICKETS;
    }
    
    // Compare and update prevTicketsRef before updating state
    checkForTicketUpdates(loadedTickets);
    setTickets(loadedTickets);

    // 4. Fetch Users List for administrative management
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      if (!usersSnapshot.empty) {
        usersSnapshot.forEach((d) => {
          loadedUsers.push({ ...d.data() } as AppUser);
        });
      }
    } catch (err) {
      console.warn("Failed to fetch users list from Firestore.", err);
    }
    setUsersList(loadedUsers);

    // 5. Fetch Approvals List for admin panel
    let loadedApprovals: ApprovalRequest[] = [];
    try {
      const approvalsSnapshot = await getDocs(collection(db, "approvals"));
      if (!approvalsSnapshot.empty) {
        approvalsSnapshot.forEach((d) => {
          loadedApprovals.push({ ...d.data() } as ApprovalRequest);
        });
        loadedApprovals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    } catch (err) {
      console.warn("Failed to fetch approvals list from Firestore.", err);
    }
    setApprovals(loadedApprovals);

    setIsRefreshing(false);
  };

  // User Auth Actions with direct credential support
  const handleLogin = async (username: string, password?: string, isRegister?: boolean) => {
    const cleanNick = username.trim();
    const docId = cleanNick.toLowerCase();

    try {
      const uRef = doc(db, "users", docId);
      const uSnap = await getDoc(uRef);

      if (isRegister) {
        if (uSnap.exists()) {
          throw new Error(JSON.stringify({ error: "Bu kullanıcı adı zaten sisteme kayıtlıdır!" }));
        }

        // Automatic Admin assignment if nickname is standard Admin / Sarsilmaz
        let initialRole: "free" | "admin" = "free";
        if (cleanNick.toLowerCase() === "admin" || cleanNick.toLowerCase() === "sarsilmaz") {
          initialRole = "admin";
        }

        const newUser: AppUser = {
          username: cleanNick,
          role: initialRole,
          credits: 250, // Register welcome gift bakiye
          password: password || "123"
        };

        await setDoc(uRef, newUser);
        setCurrentUser(newUser);
        localStorage.setItem("sarsilmaz_user", JSON.stringify(newUser));
        addToast("Kayıt Başarılı!", `Tebrikler ${cleanNick}, hesabınız başarıyla tanımlandı! İlk kayda özel bakiye hediye edildi.`, "success");
        await fetchAllData();
        return newUser;
      } else {
        // Standard Log In Mode
        if (!uSnap.exists()) {
          throw new Error(JSON.stringify({ error: "SarsılmazMC veritabanında böyle bir kullanıcı bulunamadı! Lütfen önce kayıt olunuz." }));
        }

        const data = uSnap.data();
        if (password && data.password && data.password !== password) {
          throw new Error(JSON.stringify({ error: "Şifre doğrulanamadı. Lütfen tekrar deneyin!" }));
        }

        const loggedInUser: AppUser = {
          username: data.username || cleanNick,
          role: data.role || "free",
          credits: typeof data.credits === "number" ? data.credits : 0,
          password: data.password || password
        };

        setCurrentUser(loggedInUser);
        localStorage.setItem("sarsilmaz_user", JSON.stringify(loggedInUser));
        addToast("Giriş Yapıldı", `SarsılmazMC portalına hoş geldiniz, ${loggedInUser.username}!`, "success");
        await fetchAllData();
        return loggedInUser;
      }
    } catch (err) {
      console.warn("Auth processing error", err);
      throw err;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("sarsilmaz_user");
    setView("home");
    addToast("Güvenli Çıkış", "Hesap bağlantınız güvenle sonlandırıldı.", "info");
  };

  const handleAddToCart = (product: Product) => {
    setCartCount((prev) => prev + 1);
    addToast("Sepete Eklendi", `${product.title} satın alma talebiniz kaydedildi.`, "success");
  };

  // Deducts credits from user account (Now updated to generate approvals & auto-support tickets)
  const handleSimulatePurchase = async (product: Product) => {
    if (!currentUser) {
      addToast("Giriş Gerekli", "Ürün satın almak için önce oyuncu profiliyle bağlanmalısınız!", "warning");
      setView("profile");
      return;
    }

    if (currentUser.credits >= product.price) {
      // 1. Create a support ticket automatically under "Ödeme" or "Genel" category
      const ticketSubject = `Satın Alma Talebi - ${product.title}`;
      const ticketMsg = `merhaba ben ${currentUser.username} marketten "${product.title}" isimli ürünü ${product.price} ₺ karşılığında satın almak istiyorum. Bakiyemden düşülerek onaylanmasını talep ediyorum.`;

      await handleCreateTicket(ticketSubject, "Genel", ticketMsg);

      // 2. Create the approvals request record
      const randomId = "APR-" + Math.floor(10000 + Math.random() * 90000);
      const approvalReq: ApprovalRequest = {
        id: randomId,
        user: currentUser.username,
        type: "satin_alma",
        details: `${product.title} Alımı`,
        amount: product.price,
        status: "beklemede",
        createdAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, "approvals", randomId), approvalReq);
        addToast("Onay Talebi Gönderildi", `"${product.title}" satın alımı için destek talebiniz ve onay kaydınız iletildi. Admin onayından sonra oyun içinde aktif edilecektir.`, "success");
        await fetchAllData();
        setView("support");
      } catch (err) {
        console.warn("Failed to register purchase approval", err);
      }
    } else {
      addToast("Bakiye Yetersiz", `${product.title} fiyatı: ${product.price} ₺. Mevcut cüzdanınız yetersiz.`, "warning");
      setView("bakiye"); // Redirect to topup page
    }
  };

  // Automated Bakiye Request Generator with Support tickets
  const onCreateBakiyeRequest = async (amount: number) => {
    if (!currentUser) return;

    // 1. Create support ticket first
    const ticketSubject = `Bakiye Yükleme Talebi - ${amount} ₺`;
    const ticketMsg = `merhaba ben ${currentUser.username} ${amount} tutarında Bakiye yüklemek istiyorum. Bakiye yükleme Linki atar mısınız ?`;

    await handleCreateTicket(ticketSubject, "Ödeme", ticketMsg);

    // 2. Create tracking approval request
    const randomId = "APR-" + Math.floor(10000 + Math.random() * 90000);
    const approvalReq: ApprovalRequest = {
      id: randomId,
      user: currentUser.username,
      type: "bakiye",
      details: `${amount} ₺ Bakiye Yükleme Talebi`,
      amount,
      status: "beklemede",
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "approvals", randomId), approvalReq);
      addToast("Bakiye Talebi Oluşturuldu", `${amount} ₺ için destek biletiniz ve onay kaydınız açıldı! Ödeme linkiniz destek üzerinden gönderilecektir.`, "success");
      await fetchAllData();
      setView("support");
    } catch (err) {
      console.warn("Bakiye request writing failed", err);
    }
  };

  // Administrator Approver Handler
  const handleApproveRequest = async (requestId: string) => {
    try {
      const appRef = doc(db, "approvals", requestId);
      const appSnap = await getDoc(appRef);
      if (!appSnap.exists()) {
        addToast("Hata", "Talep bulunamadı.", "warning");
        return;
      }

      const reqData = appSnap.data() as ApprovalRequest;
      if (reqData.status !== "beklemede") {
        addToast("Hata", "Bu talep daha önce zaten işlenmiş.", "warning");
        return;
      }

      // Load user record to update credit
      const userDocId = reqData.user.toLowerCase();
      const uRef = doc(db, "users", userDocId);
      const uSnap = await getDoc(uRef);

      if (!uSnap.exists()) {
        addToast("Hata", "Kullanıcı bulunamadı.", "warning");
        return;
      }

      const uData = uSnap.data() as AppUser;
      let currentCredits = typeof uData.credits === "number" ? uData.credits : 0;

      if (reqData.type === "bakiye") {
        // TOPUP: add credentials
        const finalCredits = currentCredits + reqData.amount;
        await updateDoc(uRef, { credits: finalCredits });

        // Update local state if the user is currently logged in
        if (currentUser && currentUser.username.toLowerCase() === userDocId) {
          const updated = { ...currentUser, credits: finalCredits };
          setCurrentUser(updated);
          localStorage.setItem("sarsilmaz_user", JSON.stringify(updated));
        }

        // Notify
        addToast("Talep Onaylandı", `${reqData.user} için +${reqData.amount} ₺ bakiye teslim edildi!`, "success");
      } else {
        // PURCHASE: deduct credentials
        if (currentCredits < reqData.amount) {
          addToast("Onay İptal", "Kullanıcının bakiyesi yetersiz!", "warning");
          return;
        }

        const finalCredits = currentCredits - reqData.amount;
        await updateDoc(uRef, { credits: finalCredits });

        // Update local state if currently logged in
        if (currentUser && currentUser.username.toLowerCase() === userDocId) {
          const updated = { ...currentUser, credits: finalCredits };
          setCurrentUser(updated);
          localStorage.setItem("sarsilmaz_user", JSON.stringify(updated));
        }

        addToast("Satın Alma Onaylandı", `${reqData.user} satın alımı onaylandı, bakiye tahsil edildi.`, "success");
      }

      // Update approval record state
      await updateDoc(appRef, { status: "onaylandi" });
      await fetchAllData();
    } catch (err) {
      console.warn("Approval routing failure", err);
      addToast("Hata", "Onay işlemi gerçekleştirilemedi.", "warning");
    }
  };

  // Administrator Rejection Handler
  const handleRejectRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, "approvals", requestId), { status: "reddedildi" });
      addToast("Talep Reddedildi", "Talep reddedilerek iptal edildi.", "warning");
      await fetchAllData();
    } catch (err) {
      console.warn("Rejection failure", err);
    }
  };


  // Administrator Manual Credit Loader Update
  const handleLoadCredits = async (targetUserNick: string, amount: number) => {
    const cleanNick = targetUserNick.trim();
    const docId = cleanNick.toLowerCase();

    try {
      const uRef = doc(db, "users", docId);
      const uSnap = await getDoc(uRef);

      let currentCredits = 0;
      let existingRole: "free" | "admin" = "free";
      let existingPassword = "123";
      if (uSnap.exists()) {
        const data = uSnap.data();
        currentCredits = typeof data.credits === "number" ? data.credits : 0;
        existingRole = data.role || "free";
        existingPassword = data.password || "123";
      }

      const finalCredits = Math.max(0, currentCredits + amount);

      // Write to database
      await setDoc(uRef, {
        username: cleanNick,
        role: existingRole,
        credits: finalCredits,
        password: existingPassword
      }, { merge: true });

      // If loaded user is CURRENT logged in profile, sync their layout instantly
      if (currentUser && currentUser.username.toLowerCase() === docId) {
        const updated = { ...currentUser, credits: finalCredits };
        setCurrentUser(updated);
        localStorage.setItem("sarsilmaz_user", JSON.stringify(updated));
      }

      addToast("Bakiye Güncellendi", `${cleanNick} oyuncusunun bakiyesine +${amount} ₺ başarıyla eklendi!`, "success");
      await fetchAllData(); // refresh lists
    } catch (err) {
      console.error(err);
      throw new Error("Kredi yüklemesi veritabanına işlenemedi.");
    }
  };

  // Create dynamic category in admin panel
  const handleAddCategory = async (newCat: DynamicCategory) => {
    try {
      await setDoc(doc(db, "categories", newCat.id), newCat);
      setCategories((prev) => [...prev, newCat]);
      addToast("Kategori Oluşturuldu", `"${newCat.name}" kategorisi başarıyla eklendi.`, "success");
      await fetchAllData();
    } catch (err) {
      console.warn("Failed to write category", err);
    }
  };

  // Support Ticket Actions
  const handleCreateTicket = async (
    subject: string,
    category: "Genel" | "Ödeme" | "Hata Bildirimi" | "Klan İşlemleri",
    initialMessage: string,
    attachment?: string
  ) => {
    if (!currentUser) return;

    requestNotificationPermission();

    const randomId = "T-" + Math.floor(1000 + Math.random() * 9000);
    const newMsg: TicketMessage = {
      sender: "user",
      senderName: currentUser.username,
      text: initialMessage,
      createdAt: new Date().toISOString(),
      attachment: attachment || undefined
    };

    const freshTicket: Ticket = {
      id: randomId,
      subject,
      category,
      user: currentUser.username,
      status: "beklemede",
      messages: [newMsg],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save locally
    setTickets((prev) => [freshTicket, ...prev]);

    // Save to Firestore
    try {
      await setDoc(doc(db, "tickets", randomId), sanitizeData(freshTicket));
      addToast("Talep Açıldı", `"${subject}" destek biletiniz başarıyla iletildi.`, "success");
      await fetchAllData();
    } catch (err) {
      console.warn("Tickets sync failed", err);
    }
  };

  const handleSendMessage = async (ticketId: string, text: string, attachment?: string) => {
    if (!currentUser) return;

    const freshMsg: TicketMessage = {
      sender: currentUser.role?.toLowerCase() === "admin" ? "admin" : "user",
      senderName: currentUser.username,
      text,
      createdAt: new Date().toISOString(),
      attachment: attachment || undefined
    };

    // Update locally
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            messages: [...t.messages, freshMsg],
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      })
    );

    // Save to Firestore
    try {
      const ticketRef = doc(db, "tickets", ticketId);
      const ticketSnap = await getDoc(ticketRef);
      if (ticketSnap.exists()) {
        const data = ticketSnap.data() as Ticket;
        const updatedMessages = [...data.messages, freshMsg];
        await updateDoc(ticketRef, sanitizeData({
          messages: updatedMessages,
          updatedAt: new Date().toISOString()
        }));
        addToast("Mesaj Gönderildi", "Destek ekibine yeni bildiri iletildi.", "success");
        await fetchAllData();
      }
    } catch (err) {
      console.warn("Append message sync failed", err);
    }
  };

  // Ticket status update
  const handleChangeTicketStatus = async (ticketId: string, status: "beklemede" | "yanıtlandı" | "kapatıldı") => {
    try {
      await updateDoc(doc(db, "tickets", ticketId), {
        status,
        updatedAt: new Date().toISOString()
      });
      addToast("Bilet Güncellendi", `Destek bileti durumu "${status.toUpperCase()}" yapıldı.`, "info");
      await fetchAllData();
    } catch (err) {
      console.warn("Status change sync failing", err);
    }
  };

  // Support bilet silme
  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm("Bu destek biletini kalıcı olarak silmek istediğinizden emin misiniz?")) return;
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    try {
      await deleteDoc(doc(db, "tickets", ticketId));
      addToast("Bilet Silindi", `${ticketId} destek kaydı veritabanından kalıcı olarak temizlendi.`, "warning");
      await fetchAllData();
    } catch (err) {
      console.warn("Delete ticket failed", err);
    }
  };

  // Support Bilet Alanlarını Düzenleme (Sarsılmaz Admin Özelliği)
  const handleUpdateTicketFields = async (ticketId: string, updates: Partial<Ticket>) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
    );
    try {
      const ticketRef = doc(db, "tickets", ticketId);
      await updateDoc(ticketRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      addToast("Bilet Güncellendi", `${ticketId} bilet detayları başarıyla düzenlendi.`, "success");
      await fetchAllData();
    } catch (err) {
      console.warn("Ticket field updates failed", err);
    }
  };

  // Support Bilet Mesajı İçeriğini Düzenleme
  const handleUpdateTicketMessage = async (ticketId: string, messageIndex: number, newText: string) => {
    let updatedTickets = [...tickets];
    const ticketIdx = updatedTickets.findIndex((t) => t.id === ticketId);
    if (ticketIdx !== -1) {
      const ticket = { ...updatedTickets[ticketIdx] };
      const msgs = [...ticket.messages];
      if (msgs[messageIndex]) {
        msgs[messageIndex] = {
          ...msgs[messageIndex],
          text: newText
        };
        ticket.messages = msgs;
        ticket.updatedAt = new Date().toISOString();
        updatedTickets[ticketIdx] = ticket;
        setTickets(updatedTickets);

        try {
          const ticketRef = doc(db, "tickets", ticketId);
          await updateDoc(ticketRef, {
            messages: msgs,
            updatedAt: new Date().toISOString()
          });
          addToast("Mesaj Düzenlendi", "Bilet mesajı başarıyla güncellendi.", "success");
          await fetchAllData();
        } catch (err) {
          console.warn("Ticket message update failed", err);
        }
      }
    }
  };

  // Oyuncu Rol Değiştirme
  const handleChangeUserRole = async (username: string, newRole: "free" | "admin") => {
    setUsersList((prev) =>
      prev.map((u) => (u.username.toLowerCase() === username.toLowerCase() ? { ...u, role: newRole } : u))
    );
    try {
      const uRef = doc(db, "users", username.toLowerCase());
      await updateDoc(uRef, { role: newRole });
      addToast("Rol Güncellendi", `${username} rolü "${newRole.toUpperCase()}" olarak değiştirildi!`, "success");
      await fetchAllData();
    } catch (err) {
      console.warn("Change user role failed", err);
    }
  };

  // Admin Panel Actions
  const handleAddOrUpdateProduct = async (product: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.map((p) => (p.id === product.id ? product : p));
      }
      return [...prev, product];
    });

    try {
      await setDoc(doc(db, "products", product.id), product);
      addToast("Ürün Güncellendi", `${product.title} mağazaya başarıyla işlendi!`, "success");
      await fetchAllData();
    } catch (err) {
      console.warn("Write product sync failed", err);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Bu ürünü marketten tamamen silmek istediğinizden emin misiniz?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    try {
      await deleteDoc(doc(db, "products", productId));
      addToast("Ürün Kaldırıldı", "Ürün market listesinden temizlendi.", "warning");
      await fetchAllData();
    } catch (err) {
      console.warn("Delete product sync failing", err);
    }
  };

  const handleAddAdminReply = async (ticketId: string, text: string) => {
    if (!currentUser) return;
    const freshReply: TicketMessage = {
      sender: "admin",
      senderName: currentUser.username,
      text,
      createdAt: new Date().toISOString()
    };

    try {
      const ticketRef = doc(db, "tickets", ticketId);
      const ticketSnap = await getDoc(ticketRef);
      if (ticketSnap.exists()) {
        const data = ticketSnap.data() as Ticket;
        await updateDoc(ticketRef, sanitizeData({
          messages: [...data.messages, freshReply],
          status: "yanıtlandı",
          updatedAt: new Date().toISOString()
        }));
        addToast("Bilet Yanıtlandı", "Kullanıcı biletine yetkili cevabı gönderildi.", "success");
        await fetchAllData();
      }
    } catch (err) {
      console.warn("Reply registration error", err);
    }
  };

  const handleCopyIp = () => {
    navigator.clipboard.writeText("play.sarsilmazmc.com");
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070c0f] text-on-background flex flex-col font-sans selection:bg-secondary/40 selection:text-white relative">
      
      {/* Dynamic Toaster Notification Center */}
      <div className="fixed top-20 right-4 z-[9999] max-w-sm w-full space-y-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className="pointer-events-auto bg-[#0f191d] border-l-4 border-secondary rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.55)] border border-outline-variant/30 flex items-start gap-3 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-1">
                <button
                  onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                  className="text-outline hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-secondary/15 p-1.5 rounded-lg border border-secondary/30 text-secondary shrink-0">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>

              <div className="text-left space-y-0.5 pr-4">
                <h5 className="font-bold text-xs text-on-surface uppercase tracking-wide">{t.title}</h5>
                <p className="text-[11px] text-outline font-medium leading-normal">{t.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Network background mesh */}
      <div className="absolute top-0 left-0 right-0 h-[450px] bg-gradient-to-b from-[#feb700]/5 via-transparent to-transparent pointer-events-none select-none z-0"></div>

      {/* Header element matches visual layout */}
      <header className="bg-[#10191c]/75 backdrop-blur-md border-b border-outline-variant/20 py-4 px-4 sticky top-0 z-50">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
          
          {/* Logo Brand click navigates home */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("home")}
              className="flex items-center gap-2.5 transition-transform active:scale-95 text-left cursor-pointer group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center font-black text-[#070c0e] shadow-[0_0_20px_rgba(254,183,10,0.4)] transition-all duration-300 group-hover:rotate-6">
                <ShieldCheck className="w-6 h-6 text-[#070c0e] stroke-[2.5]" />
              </div>
              <div className="text-left">
                <h1 className="font-headline-lg text-base font-black tracking-tight leading-none text-on-surface group-hover:text-secondary transition-colors">
                  Sarsılmaz<span className="text-secondary">MC</span>
                </h1>
                <span className="text-[9px] text-outline font-mono tracking-wider block">CYBER-TOWNY WORLD</span>
              </div>
            </button>
          </div>

          {/* Navigation layout on Desktop */}
          <nav className="hidden md:flex items-center gap-1 bg-[#090f11] border border-outline-variant/15 p-1 rounded-xl">
            <button
              onClick={() => setView("home")}
              className={`px-3.5 py-1.5 font-mono text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                view === "home" ? "bg-secondary/15 text-secondary" : "text-outline hover:text-on-surface"
              }`}
            >
              ANASAYFA
            </button>
            
            {/* Split Page VIP */}
            <button
              onClick={() => setView("vip")}
              className={`px-3.5 py-1.5 font-mono text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                view === "vip" ? "bg-secondary/15 text-secondary font-black" : "text-outline hover:text-on-surface"
              }`}
            >
              <Star className="w-3.5 h-3.5 text-secondary" /> VIP MARKET
            </button>

            {/* Split Page Kasa */}
            <button
              onClick={() => setView("kasa")}
              className={`px-3.5 py-1.5 font-mono text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                view === "kasa" ? "bg-secondary/15 text-secondary font-black" : "text-outline hover:text-on-surface"
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-secondary" /> KOZMİK KASALAR
            </button>

            <button
              onClick={() => {
                requestNotificationPermission();
                setView("ranks");
              }}
              className={`px-3.5 py-1.5 font-mono text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                view === "ranks" ? "bg-secondary/15 text-secondary font-black" : "text-outline hover:text-on-surface"
              }`}
            >
              SIRALAMALAR
            </button>

            <button
              onClick={() => {
                requestNotificationPermission();
                setView("support");
              }}
              className={`px-3.5 py-1.5 font-mono text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                view === "support" ? "bg-secondary/15 text-secondary font-black" : "text-outline hover:text-on-surface"
              }`}
            >
              DESTEK MERKEZİ
            </button>

            {currentUser && (
              <button
                onClick={() => setView("bakiye")}
                className={`px-3.5 py-1.5 font-mono text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  view === "bakiye" ? "bg-secondary/25 text-secondary border-dashed border border-secondary/45" : "text-secondary hover:text-white"
                }`}
              >
                <Coins className="w-3.5 h-3.5" /> BAKİYE SATIN AL
              </button>
            )}

            {currentUser && currentUser.role?.toLowerCase() === "admin" && (
              <div className="relative" ref={adminDropdownRef}>
                <button
                  onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                  className="px-3.5 py-1.5 font-mono text-[11px] font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/35 text-yellow-400 hover:bg-yellow-500/20 shadow-[0_0_12px_rgba(254,183,10,0.15)] animate-pulse hover:animate-none"
                >
                  <Settings className="w-3.5 h-3.5" /> ADMİN PANELİ <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${adminDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {adminDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 rounded-xl bg-[#090f11] border border-yellow-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.85)] overflow-hidden z-[100] text-left"
                    >
                      <div className="px-3.5 py-2.5 bg-yellow-500/15 border-b border-yellow-500/25 flex items-center gap-1.5 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[9px] font-mono font-black text-yellow-400 uppercase tracking-widest">YETKİLİ TERMİNALİ</span>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        {/* Option 1: Destek Talepleri */}
                        <button
                          onClick={() => {
                            setAdminNavigationTrigger({
                              tab: "tickets",
                              timestamp: Date.now()
                            });
                            setView("admin");
                            setAdminDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2 rounded-lg text-xs font-bold font-mono text-outline hover:text-white hover:bg-yellow-500/10 flex items-center gap-2.5 transition-all text-left cursor-pointer border-none"
                        >
                          <MessageSquare className="w-4 h-4 text-yellow-400 shrink-0" /> Destek Talepleri
                        </button>

                        {/* Option 2: Kasa Ekle */}
                        <button
                          onClick={() => {
                            setAdminNavigationTrigger({
                              tab: "products",
                              action: { type: "open_product_form", category: "kasa" },
                              timestamp: Date.now()
                            });
                            setView("admin");
                            setAdminDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2 rounded-lg text-xs font-bold font-mono text-outline hover:text-white hover:bg-yellow-500/10 flex items-center gap-2.5 transition-all text-left cursor-pointer border-none"
                        >
                          <Boxes className="w-4 h-4 text-yellow-400 shrink-0" /> Kasa Ekle
                        </button>

                        {/* Option 3: Mc vip üye Ekle */}
                        <button
                          onClick={() => {
                            setAdminNavigationTrigger({
                              tab: "products",
                              action: { type: "open_product_form", category: "vip" },
                              timestamp: Date.now()
                            });
                            setView("admin");
                            setAdminDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2 rounded-lg text-xs font-bold font-mono text-outline hover:text-white hover:bg-yellow-500/10 flex items-center gap-2.5 transition-all text-left cursor-pointer border-none"
                        >
                          <Star className="w-4 h-4 text-yellow-400 shrink-0" /> Mc vip üye Ekle
                        </button>

                        <div className="h-[1px] bg-yellow-500/15 my-1.5"></div>

                        {/* Option 4: Full Panel Dashboard */}
                        <button
                          onClick={() => {
                            setAdminNavigationTrigger({
                              tab: "dashboard",
                              timestamp: Date.now()
                            });
                            setView("admin");
                            setAdminDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2 rounded-lg text-xs font-black font-mono bg-yellow-500 text-black hover:bg-yellow-400 flex items-center justify-between gap-1 transition-all text-left cursor-pointer border-none"
                        >
                          <span className="flex items-center gap-2.5"><Settings className="w-4 h-4 shrink-0" /> Genel Panel</span>
                          <span className="text-[8px] bg-black/10 px-1.5 py-0.5 rounded font-black font-mono text-black">PRO</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </nav>

          {/* Action elements */}
          <div className="flex items-center gap-2">
            {/* Quick IP host helper clicker */}
            <button
              onClick={handleCopyIp}
              className="hidden sm:flex items-center gap-2 bg-[#090f11] border border-outline-variant/30 px-3 py-2 rounded-xl text-[10px] font-mono tracking-widest text-secondary hover:border-secondary/80 cursor-pointer transition-all active:scale-95 text-center font-black"
            >
              play.sarsilmazmc.com
              {copiedNotification ? <Check className="w-3.5 h-3.5 text-green-400 font-bold" /> : <Copy className="w-3.5 h-3.5 opacity-70" />}
            </button>

            {/* Account Profile block */}
            <button
              onClick={() => {
                requestNotificationPermission();
                setView("profile");
              }}
              className={`px-4 py-2 rounded-xl border font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                currentUser
                  ? "bg-secondary/15 border-secondary/55 text-secondary"
                  : "bg-secondary text-on-secondary border-secondary hover:bg-secondary/90 shadow-[0_0_12px_rgba(254,183,10,0.25)]"
              }`}
            >
              <User className="w-4 h-4" />
              {currentUser ? currentUser.username.toUpperCase() : "GİRİŞ YAP"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 pt-6 z-10 relative">
        <AnimatePresence mode="wait">
          {view === "home" && (
            <div key="home">
              <HomeSection setView={setView} onlinePlayers={842} />
            </div>
          )}

          {view === "vip" && (
            <div key="vip-page">
              <div className="mb-4 text-left">
                <span className="text-[10px] bg-secondary/15 border border-secondary/35 text-secondary font-mono px-3 py-1 rounded-full uppercase font-bold tracking-widest">
                  ★ SARSILMAZ VIP SEÇENEKLERİ ★
                </span>
              </div>
              <StoreSection
                products={products}
                categories={categories}
                onAddToCart={handleAddToCart}
                cartItemsCount={cartCount}
                currentUser={currentUser}
                onSimulatePurchase={handleSimulatePurchase}
                activeCategoryFilter="vip"
              />
            </div>
          )}

          {view === "kasa" && (
            <div key="kasa-page">
              <div className="mb-4 text-left">
                <span className="text-[10px] bg-secondary/15 border border-secondary/35 text-secondary font-mono px-3 py-1 rounded-full uppercase font-bold tracking-widest">
                  🗳️ KOZMİK OYUNCU KASALARI 🗳️
                </span>
              </div>
              <StoreSection
                products={products}
                categories={categories}
                onAddToCart={handleAddToCart}
                cartItemsCount={cartCount}
                currentUser={currentUser}
                onSimulatePurchase={handleSimulatePurchase}
                activeCategoryFilter="kasa"
              />
            </div>
          )}

          {view === "ranks" && (
            <div key="ranks">
              <RanksSection />
            </div>
          )}

          {view === "profile" && (
            <div key="profile">
              <ProfileSection
                currentUser={currentUser}
                onLogin={handleLogin}
                onLogout={handleLogout}
                userTickets={tickets.filter(
                  (t) => currentUser && t.user.toLowerCase() === currentUser.username.toLowerCase()
                )}
                setView={setView}
              />
            </div>
          )}

          {view === "support" && (
            <div key="support">
              <SupportSection
                currentUser={currentUser}
                tickets={tickets}
                onCreateTicket={handleCreateTicket}
                onSendMessage={handleSendMessage}
                onRefreshTickets={fetchAllData}
                isGlobalRefreshing={isRefreshing}
                onDeleteTicket={handleDeleteTicket}
              />
            </div>
          )}

          {view === "admin" && currentUser?.role?.toLowerCase() === "admin" && (
            <div key="admin">
              <AdminPanelSection
                currentUser={currentUser}
                products={products}
                tickets={tickets}
                categories={categories}
                usersList={usersList}
                onAddOrUpdateProduct={handleAddOrUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onAddCategory={handleAddCategory}
                onLoadCredits={handleLoadCredits}
                onAddAdminReply={handleAddAdminReply}
                onChangeTicketStatus={handleChangeTicketStatus}
                onDeleteTicket={handleDeleteTicket}
                onRefreshDatabase={fetchAllData}
                isDatabaseRefreshing={isRefreshing}
                approvals={approvals}
                onApproveRequest={handleApproveRequest}
                onRejectRequest={handleRejectRequest}
                adminNavigationTrigger={adminNavigationTrigger}
                onUpdateTicketFields={handleUpdateTicketFields}
                onUpdateTicketMessage={handleUpdateTicketMessage}
                onChangeUserRole={handleChangeUserRole}
              />
            </div>
          )}

          {view === "bakiye" && (
            <div key="bakiye">
              <BalanceSection
                currentUser={currentUser}
                onCreateBakiyeRequest={onCreateBakiyeRequest}
              />
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Sticky Bottom Navigation Rail (Mobile Responsive optimization) */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 bg-[#070c0e]/95 backdrop-blur-md border border-outline-variant/30 px-2 py-1.5 rounded-2xl shadow-2xl flex items-center justify-around gap-1 font-mono">
        <button
          onClick={() => setView("home")}
          className={`flex flex-col items-center gap-0.5 p-2 rounded-xl text-[9px] font-bold transition-all cursor-pointer ${
            view === "home" ? "text-secondary bg-secondary/10" : "text-outline"
          }`}
        >
          <Info className="w-4 h-4" />
          <span>Ev</span>
        </button>

        <button
          onClick={() => setView("vip")}
          className={`flex flex-col items-center gap-0.5 p-2 rounded-xl text-[9px] font-bold transition-all cursor-pointer ${
            view === "vip" ? "text-secondary bg-secondary/10 font-bold" : "text-outline"
          }`}
        >
          <Star className="w-4 h-4" />
          <span>VIP</span>
        </button>

        <button
          onClick={() => setView("kasa")}
          className={`flex flex-col items-center gap-0.5 p-2 rounded-xl text-[9px] font-bold transition-all cursor-pointer ${
            view === "kasa" ? "text-secondary bg-secondary/10 font-bold" : "text-outline"
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Kasalar</span>
        </button>

        {currentUser && (
          currentUser.role?.toLowerCase() === "admin" ? (
            <button
              onClick={() => {
                setAdminNavigationTrigger({
                  tab: "dashboard",
                  timestamp: Date.now()
                });
                setView("admin");
              }}
              className={`flex flex-col items-center gap-0.5 p-2 rounded-xl text-[9px] font-extrabold transition-all cursor-pointer ${
                view === "admin" ? "text-yellow-400 bg-yellow-500/10 font-black" : "text-yellow-400/70"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Admin</span>
            </button>
          ) : (
            <button
              onClick={() => setView("bakiye")}
              className={`flex flex-col items-center gap-0.5 p-2 rounded-xl text-[9px] font-bold transition-all cursor-pointer ${
                view === "bakiye" ? "text-secondary bg-secondary/10 font-bold" : "text-outline"
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Bakiye</span>
            </button>
          )
        )}

        <button
          onClick={() => setView("support")}
          className={`flex flex-col items-center gap-0.5 p-2 rounded-xl text-[9px] font-bold transition-all cursor-pointer ${
            view === "support" ? "text-secondary bg-secondary/10" : "text-outline"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Destek</span>
        </button>

        <button
          onClick={() => setView("profile")}
          className={`flex flex-col items-center gap-0.5 p-2 rounded-xl text-[9px] font-bold transition-all cursor-pointer ${
            view === "profile" ? "text-secondary bg-secondary/10" : "text-outline"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profil</span>
        </button>
      </div>

      {/* Footer representation */}
      <footer className="bg-[#05090a] border-t border-outline-variant/10 py-8 px-4 mt-16 z-10 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-start text-xs text-outline font-body-md">
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-secondary/15 border border-secondary rounded flex items-center justify-center font-black font-mono text-xs text-secondary">
                S
              </div>
              <span className="font-bold text-on-surface">SarsılmazMC Towny</span>
            </div>
            <p className="leading-relaxed opacity-85 text-left">
              SarsılmazMC, oyuncularına kesintisiz, adil ve siber temalı bir Towny dünyasında eşsiz mücadele tecrübesi sunmak amacıyla kurulmuş bağımsız bir Minecraft topluluğudur.
            </p>
          </div>

          <div className="space-y-2 text-left">
            <span className="font-label-caps text-[10px] text-on-surface font-extrabold tracking-wider block">YÖNETİM &amp; GÜVENLİK</span>
            <p className="leading-relaxed opacity-85 text-left">
              Ödeme operasyonlarımız, müşteri veri gizliliğini korumak amacıyla SSL sertifikalı şifreli tünellerle korunan PayTR ve Papara simülasyon sistemleriyle güvendedir.
            </p>
          </div>

          <div className="space-y-2 text-left">
            <span className="font-label-caps text-[10px] text-on-surface font-extrabold tracking-wider block">YASAL MEVZUAT</span>
            <p className="leading-relaxed opacity-80 mb-2 text-left">
              Minecraft, Mojang Synergies AB markasının tescilli ürünüdür. SarsılmazMC, Mojang veya Microsoft ile doğrudan organik bağ barındırmayan bağımsız bir sunucudur.
            </p>
            <p className="font-mono text-[9px] text-outline-variant text-left">
              Copyright © 2026 SarsılmazMC. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
