export interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string; // Dynamic category name (like "vip", "kasa", "spawner" etc)
  buyUrl?: string; // Product checkout/redirect link (managed by admin)
  description?: string;
  features?: string[];
  popular?: boolean;
}

export interface TicketMessage {
  sender: "user" | "admin";
  senderName: string;
  text: string;
  createdAt: string; // ISO format or formatted time
  attachment?: string; // Encoded Base64 Image or direct image URL
}

export interface Ticket {
  id: string;
  subject: string;
  category: "Genel" | "Ödeme" | "Hata Bildirimi" | "Klan İşlemleri";
  user: string; // Minecraft Username
  status: "beklemede" | "yanıtlandı" | "kapatıldı";
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AppUser {
  username: string;
  role: "free" | "admin";
  email?: string;
  credits: number; // Persistent credit amount
  password?: string; // Direct password option for secure custom auth
}

export interface DynamicCategory {
  id: string;
  name: string;
}

export interface ApprovalRequest {
  id: string;
  user: string;
  type: "bakiye" | "satin_alma";
  details: string;
  amount: number;
  status: "beklemede" | "onaylandi" | "reddedildi";
  createdAt: string;
}
