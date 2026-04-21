// TypeScript interfaces matching MySQL database schema

export type UserRole = 'buyer' | 'seller' | 'both';
export type SkillLevel = 'Beginner' | 'Intermediate' | 'Expert';
export type AvailabilityStatus = 'available' | 'busy' | 'offline';
export type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'wallet' | 'bank_transfer';
export type MessageType = 'text' | 'image' | 'file' | 'location';
export type NotificationType = 'booking' | 'message' | 'review' | 'payment' | 'system';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  profile_image?: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface SellerProfile {
  id: number;
  user_id: number;
  business_name?: string;
  bio?: string;
  hourly_rate?: number;
  skill_level: SkillLevel;
  years_experience?: number;
  verified: boolean;
  rating: number;
  total_reviews: number;
  total_jobs: number;
  latitude?: number;
  longitude?: number;
  service_radius_km?: number;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  availability_status: AvailabilityStatus;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  created_at: Date;
}

export interface SellerService {
  id: number;
  seller_id: number;
  category_id: number;
  service_title: string;
  service_description?: string;
  base_price?: number;
  created_at: Date;
}

export interface SellerLanguage {
  id: number;
  seller_id: number;
  language: string;
}

export interface SellerCertification {
  id: number;
  seller_id: number;
  title: string;
  issuer?: string;
  issue_date?: Date;
  expiry_date?: Date;
  credential_id?: string;
  file_url?: string;
}

export interface SellerPortfolio {
  id: number;
  seller_id: number;
  title?: string;
  description?: string;
  image_url: string;
  created_at: Date;
}

export interface SellerPost {
  id: number;
  seller_id: number;
  title: string;
  description?: string;
  type: 'promotion' | 'discount' | 'availability';
  visibility_radius: number;
  expires_at?: Date;
  image_url?: string;
  views: number;
  created_at: Date;
}

export interface Booking {
  id: number;
  buyer_id: number;
  seller_id: number;
  category_id: number;
  title: string;
  description?: string;
  status: BookingStatus;
  scheduled_date?: Date;
  scheduled_time?: string;
  location_address?: string;
  location_lat?: number;
  location_lng?: number;
  estimated_hours?: number;
  hourly_rate?: number;
  total_amount?: number;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

export interface Review {
  id: number;
  booking_id: number;
  reviewer_id: number;
  reviewee_id: number;
  rating: number;
  comment?: string;
  helpful_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface Conversation {
  id: number;
  buyer_id: number;
  seller_id: number;
  booking_id?: number;
  last_message_at: Date;
  created_at: Date;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  message_text: string;
  message_type: MessageType;
  attachment_url?: string;
  is_read: boolean;
  created_at: Date;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: NotificationType;
  reference_id?: number;
  is_read: boolean;
  created_at: Date;
}

export interface Favorite {
  id: number;
  buyer_id: number;
  seller_id: number;
  created_at: Date;
}

// Extended types with joined data (for API responses)
export interface WorkerProfile extends SellerProfile {
  user?: User;
  services?: SellerService[];
  languages?: string[];
  certifications?: SellerCertification[];
  portfolio?: SellerPortfolio[];
  categories?: Category[];
}

export interface BookingWithDetails extends Booking {
  buyer?: User;
  seller?: SellerProfile & { user?: User };
  category?: Category;
  review?: Review;
}

export interface ConversationWithDetails extends Conversation {
  buyer?: User;
  seller?: User;
  last_message?: Message;
  unread_count?: number;
}
