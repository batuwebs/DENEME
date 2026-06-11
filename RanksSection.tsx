import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Product, Ticket } from "./types";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const firebaseConfig = {
  apiKey: "AIzaSyC26hs6zzQX197HjuJ19H-dfiAXyimY6N8",
  authDomain: "sarsilmazmc.firebaseapp.com",
  projectId: "sarsilmazmc",
  storageBucket: "sarsilmazmc.firebasestorage.app",
  messagingSenderId: "453344744830",
  appId: "1:453344744830:web:58ecfc01146588b8680f2f",
  measurementId: "G-8YZ385DJDK"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

// Initial Products Data to Seed if database is empty - keeping it simplified as requested
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "sarsilmaz-vip",
    title: "Sarsılmaz VIP",
    price: 75,
    category: "vip",
    popular: true,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCT3zrEX24p3gdClgwg-TEqOKsn3unm-TTq5KXJtmWyERQ6MAExeAwaVlLqAsCCyf4u9V5-ikRrxxViBI9KirsS6VAc8zHz3rep8MsyO5C4_DSitTmL5-ECXGoUGtxent3U8nFcXqItUHfGK3ni4Lipv906W7NmCbWKa0r64P20n5ZGrTboUsIsDPnpkjencXVgFgy7iRg9HYkhuDaWp4Gvk2TdVnC1aAx_t33IBuZ6xbpCed6ToNbud8aQgYKDo1x-4jAynEZwfeA",
    buyUrl: "https://www.papara.com/",
    description: "Özel [VIP] renkli isim ve /fly komut yetkisi.",
    features: ["/fly yetkisi", "VIP kiti (P4 Set)"]
  },
  {
    id: "sarsilmaz-vip-plus",
    title: "Sarsılmaz VIP+",
    price: 150,
    category: "vip",
    popular: false,
    image: "https://lh3.googleusercontent.com/aida/AP1WRLvOEjzRYPX8vAksLz7qHqL7Nzw2VZKeiIO_UsrflI09nQRCxklEXhXc-CUdu-nVlDa8zSegIvmBGD1ht38QdvuJzJaxxOZOWjD2cHUbXxDlHEKgF1g27e5bE-XFAc1ZURXabUV7cpEs1EQCGHzotElUNbNzF3FRj64rxUrSGPqRNYtHqgE0Etd-6mBt_0Eq-URAgkL2ZEgBsWy1Z5kH3dwVdg_vpPFKo9qptzBUxkUPH_liLxJMSztSvVA",
    buyUrl: "https://www.papara.com/",
    description: "Kalıcı ve en üst düzey ayrıcalıklı Towny VIP paketidir.",
    features: ["/fly yetkisi", "VIP+ kiti (P5 Set)"]
  },
  {
    id: "efsanevi-kozmik-kasa",
    title: "Efsanevi Kozmik Kutu (Kasa)",
    price: 100,
    category: "kasa",
    popular: true,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD-miQg7nXBkkT22rTxmoeDbSm-iXBuDqSDkzCDLUEymuVV8yhin895ztuItkoHzamVDVvTDleUE4BdHvj4JpA7whPRKVDN5cu_y1LDlSZwh3x8gOHbebjLlmv2WImV1XC_kFI8EzI8Eaq_PQVWkPBirTpDiB49AjYw-BOSumiIImnWU0kFZdgiblcspA-1I3jCcJDKM41JQftG42KPnGxu09m0RpdEGjzEzlfHJlHD4sIcfVUfyQ2V3XDMBozlxNijB8HxAPHL_JE",
    buyUrl: "https://www.papara.com/",
    description: "İçinden paha biçilemez Minecraft rütbeleri ve büyülü eşyalar çıkar.",
    features: ["5x Kasa Anahtarı", "Süper Efekt Kartları"]
  },
  {
    id: "altin-kasa-paketi",
    title: "Altın Kasa Anahtarı",
    price: 35,
    category: "kasa",
    popular: false,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDEH1Oh8y3nif7S0-ProEXvPJwfYg4dhaYS-sx-7HHB26NpReSFNqqrD5AGeY7sfhmd75XWAM_7XL8e4S06bjLg39Aaunr1LQZ0Gn2jae8629QxDrhX2pT9s1sNo6otQu57RlOOwmwYLbR352bS7DbEgXRl1lZVfSiDKgj7pUL1f3_RDeWOXXDzheGfD6x_K1Zy7Eb2KvUUQb5izTPMfmFRsnMrf6V-PMHFXganM8tQCsq845Wk2d-XgzfmIsgX8qD2QrWykEVxenY",
    buyUrl: "https://www.papara.com/",
    description: "Müthiş zırh setleri ve binek hayvan yumurtaları şansı kazandırır.",
    features: ["2x Altın Anahtar"]
  }
];

// Helper to seed database products if empty
export async function seedDatabaseIfNeeded() {
  try {
    const productsSnap = await getDocs(collection(db, "products"));
    if (productsSnap.empty) {
      console.log("Seeding initial products into Firestore...");
      for (const prod of INITIAL_PRODUCTS) {
        await setDoc(doc(db, "products", prod.id), prod);
      }
    }
  } catch (err) {
    console.warn("Firebase seeding products skipped or blocked (permissions). Falling back to local data.", err);
  }
}

// Seed categories if empty
export const INITIAL_CATEGORIES = [
  { id: "vip", name: "VIP Paketleri" },
  { id: "kasa", name: "Kozmik Kasalar" }
];

export async function seedCategoriesIfNeeded() {
  try {
    const snap = await getDocs(collection(db, "categories"));
    if (snap.empty) {
      console.log("Seeding categories into Firestore...");
      for (const cat of INITIAL_CATEGORIES) {
        await setDoc(doc(db, "categories", cat.id), cat);
      }
    }
  } catch (err) {
    console.warn("Seeding categories skipped or blocked (permissions). Falling back to local data.", err);
  }
}

// Support ticket seeding function
export const SAMPLE_TICKETS: Ticket[] = [
  {
    id: "T-8421",
    subject: "VIP Üyelik Aktifleşmedi",
    category: "Ödeme",
    user: "BatuMC",
    status: "yanıtlandı",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    messages: [
      {
        sender: "user",
        senderName: "BatuMC",
        text: "Selam, az önce kredi kartı ile işlemi tamamladım ama oyunda VIP yetkim hala gelmedi. İlgilenebilir misiniz?",
        createdAt: new Date(Date.now() - 2.1 * 60 * 60 * 1000).toISOString()
      },
      {
        sender: "admin",
        senderName: "Admin_Sarsilmaz",
        text: "Merhaba! SarsılmazMC destek ekibine hoş geldiniz. VIP üyeliğinizle ilgili sorununuz inceleniyor. Ödeme dekontunuzu veya işlem numaranızı paylaşabilir misiniz?",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "T-8435",
    subject: "Spawner Yerleşmeme Sorunu",
    category: "Hata Bildirimi",
    user: "CrazyCraft",
    status: "beklemede",
    createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    messages: [
      {
        sender: "user",
        senderName: "CrazyCraft",
        text: "Enderman spawnerını claim dışı bir alana yerleştirmeye çalıştığımda yok oluyor ve geri gelmiyor.",
        createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString()
      }
    ]
  }
];

export async function seedTicketsIfNeeded() {
  try {
    const ticketsSnap = await getDocs(collection(db, "tickets"));
    if (ticketsSnap.empty) {
      console.log("Seeding sample tickets...");
      for (const t of SAMPLE_TICKETS) {
        await setDoc(doc(db, "tickets", t.id), t);
      }
    }
  } catch (err) {
    console.warn("Tickets seeding skipped or blocked", err);
  }
}

export async function seedUsersIfNeeded() {
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    if (usersSnap.empty) {
      console.log("Seeding initial users into Firestore...");
      const initialUsers = [
        {
          username: "Admin",
          password: "adminpassword123",
          role: "admin",
          credits: 1000
        },
        {
          username: "BatuMC",
          password: "batupassword123",
          role: "free",
          credits: 250
        }
      ];
      for (const user of initialUsers) {
        await setDoc(doc(db, "users", user.username.toLowerCase()), user);
      }
    }
  } catch (err) {
    console.warn("Users seeding skipped or blocked", err);
  }
}

/**
 * Recursively removes any undefined fields from an object to prevent Firestore "Unsupported field value: undefined" error.
 */
export function sanitizeData<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeData(item)) as any;
  }
  if (typeof obj === 'object') {
    const fresh: any = {};
    for (const key of Object.keys(obj as any)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        fresh[key] = sanitizeData(val);
      }
    }
    return fresh;
  }
  return obj;
}


