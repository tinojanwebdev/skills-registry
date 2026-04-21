// Database Service Layer
// This service provides methods to interact with the MySQL database
// Currently using mock data - replace with actual API calls to your VPS

import { 
  User, 
  WorkerProfile, 
  Booking, 
  BookingWithDetails,
  Review, 
  Message, 
  Conversation,
  ConversationWithDetails,
  Category,
  Notification,
  SellerProfile,
  SellerCertification,
  SellerPost
} from '../types/database';
import { API_CONFIG, buildUrl, buildQueryString } from './api.config';
import { decryptMessageText, encryptMessageText } from '../utils/messageCrypto';

// Mock data flag - set to false when connecting to real API
const USE_MOCK_DATA = false;

class DatabaseService {
  private readonly profileViewsKey = 'seller_profile_views';

  private async postJsonWithFallback<T>(urls: string[], payload: Record<string, any>): Promise<T> {
    let lastError: Error | null = null;

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: API_CONFIG.getHeaders(),
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          return response.json();
        }

        if (response.status === 404 || response.status === 405) {
          lastError = new Error(`Endpoint unavailable at ${url} (${response.status})`);
          continue;
        }

        let message = `Request failed (${response.status})`;
        try {
          const errorBody = await response.json();
          if (errorBody?.error) message = errorBody.error;
        } catch {
          // ignore parse failures
        }
        throw new Error(message);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Network request failed');
      }
    }

    throw lastError || new Error('Request failed');
  }

  private buildAuthUrls(endpoint: '/auth/login' | '/auth/register'): string[] {
    return [buildUrl(endpoint)];
  }

  private readProfileViews(): Record<string, number> {
    try {
      const raw = localStorage.getItem(this.profileViewsKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return {};
      return Object.entries(parsed).reduce<Record<string, number>>((acc, [key, value]) => {
        const count = Number(value);
        if (Number.isFinite(count) && count >= 0) {
          acc[key] = Math.floor(count);
        }
        return acc;
      }, {});
    } catch {
      return {};
    }
  }

  private writeProfileViews(map: Record<string, number>) {
    localStorage.setItem(this.profileViewsKey, JSON.stringify(map));
  }

  async getSellerProfileViews(sellerId: number): Promise<number> {
    const map = this.readProfileViews();
    const value = map[String(sellerId)] || 0;
    return Number.isFinite(value) ? value : 0;
  }

  async incrementSellerProfileView(sellerId: number): Promise<number> {
    const map = this.readProfileViews();
    const key = String(sellerId);
    const current = map[key] || 0;
    map[key] = current + 1;
    this.writeProfileViews(map);
    return map[key];
  }

  private uniqueByUserId<T extends { userId: number }>(items: T[]): T[] {
    const seen = new Set<number>();
    const out: T[] = [];
    for (const item of items) {
      if (seen.has(item.userId)) continue;
      seen.add(item.userId);
      out.push(item);
    }
    return out;
  }

  private normalizeCategories(raw: unknown): Category[] {
    if (Array.isArray(raw)) {
      return raw
        .map((item, index) => {
          if (typeof item === 'string') {
            return { id: index + 1, name: item, created_at: new Date() } as Category;
          }
          if (item && typeof item === 'object' && 'name' in item) {
            const casted = item as Partial<Category>;
            return {
              id: casted.id ?? index + 1,
              name: casted.name || 'General',
              description: casted.description,
              icon: casted.icon,
              created_at: casted.created_at ? new Date(casted.created_at) : new Date(),
            } as Category;
          }
          return null;
        })
        .filter((item): item is Category => !!item);
    }

    if (typeof raw === 'string') {
      return raw
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name, index) => ({
          id: index + 1,
          name,
          created_at: new Date(),
        }));
    }

    return [];
  }

  private normalizeWorkerProfile(raw: any): WorkerProfile {
    const categories = this.normalizeCategories(raw?.categories);
    const services = Array.isArray(raw?.services)
      ? raw.services
      : categories.map((category) => ({
          id: category.id,
          seller_id: raw?.id ?? 0,
          category_id: category.id,
          service_title: category.name,
          service_description: raw?.bio,
          created_at: raw?.created_at ? new Date(raw.created_at) : new Date(),
        }));

    const user = raw?.user
      ? {
          ...raw.user,
          created_at: raw.user.created_at ? new Date(raw.user.created_at) : new Date(),
          updated_at: raw.user.updated_at ? new Date(raw.user.updated_at) : new Date(),
        }
      : (raw?.full_name || raw?.profile_image || raw?.email || raw?.phone)
      ? {
          id: raw?.user_id ?? raw?.id ?? 0,
          email: raw?.email || '',
          password_hash: '',
          full_name: raw?.full_name || raw?.business_name || 'Worker',
          phone: raw?.phone,
          role: 'seller' as const,
          profile_image: raw?.profile_image,
          created_at: raw?.created_at ? new Date(raw.created_at) : new Date(),
          updated_at: raw?.updated_at ? new Date(raw.updated_at) : new Date(),
          is_active: true,
        }
      : undefined;

    return {
      ...raw,
      created_at: raw?.created_at ? new Date(raw.created_at) : new Date(),
      updated_at: raw?.updated_at ? new Date(raw.updated_at) : new Date(),
      user,
      categories,
      services,
      languages: Array.isArray(raw?.languages) ? raw.languages : [],
    } as WorkerProfile;
  }

  // ==================== AUTH ====================
  
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    if (USE_MOCK_DATA) {
      return this.mockLogin(email, password);
    }

    return this.postJsonWithFallback<{ user: User; token: string }>(
      this.buildAuthUrls('/auth/login'),
      { email, password }
    );
  }
  
  async register(userData: Partial<User> & { password?: string; password_hash?: string }): Promise<{ user: User; token: string }> {
    if (USE_MOCK_DATA) {
      return this.mockRegister(userData);
    }
    
    const payload = {
      ...userData,
      // Backend expects "password"
      password: userData.password ?? userData.password_hash,
    };
    delete (payload as any).password_hash;

    return this.postJsonWithFallback<{ user: User; token: string }>(
      this.buildAuthUrls('/auth/register'),
      payload
    );
  }

  // ==================== USERS ====================

  async getUser(id: number): Promise<User> {
    const response = await fetch(
      buildUrl(API_CONFIG.ENDPOINTS.USER_PROFILE, { id }),
      { headers: API_CONFIG.getHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  }

  async updateUser(id: number, data: Partial<User>): Promise<void> {
    const response = await fetch(
      buildUrl(API_CONFIG.ENDPOINTS.USER_PROFILE, { id }),
      {
        method: 'PUT',
        headers: API_CONFIG.getHeaders(),
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) throw new Error('Failed to update user');
  }

  async uploadProfileImage(id: number, file: File): Promise<{ profile_image: string }> {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(
      buildUrl(API_CONFIG.ENDPOINTS.USER_PROFILE_IMAGE, { id }),
      {
        method: 'POST',
        headers: {
          'Authorization': API_CONFIG.getHeaders().Authorization,
        },
        body: formData,
      }
    );
    if (!response.ok) throw new Error('Failed to upload profile image');
    return response.json();
  }
  
  // ==================== SELLERS ====================
  
  async getNearbySellers(params: {
    latitude: number;
    longitude: number;
    radius?: number; // in km
    category?: string;
    rating?: number;
    skillLevel?: string;
  }): Promise<WorkerProfile[]> {
    if (USE_MOCK_DATA) {
      return this.mockGetNearbySellers(params);
    }
    
    const queryString = buildQueryString(params);
    const response = await fetch(
      `${buildUrl(API_CONFIG.ENDPOINTS.NEARBY_SELLERS)}?${queryString}`,
      {
        headers: API_CONFIG.getHeaders(),
      }
    );
    
    if (!response.ok) throw new Error('Failed to fetch sellers');
    const raw = await response.json();
    if (!Array.isArray(raw)) return [];
    return raw.map((seller) => this.normalizeWorkerProfile(seller));
  }

  async getAllSellers(): Promise<WorkerProfile[]> {
    if (USE_MOCK_DATA) {
      return this.mockGetNearbySellers({});
    }

    const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.SELLERS), {
      headers: API_CONFIG.getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch sellers');
    const raw = await response.json();
    const rows = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.sellers)
      ? raw.sellers
      : [];

    return rows.map((seller) => this.normalizeWorkerProfile(seller));
  }
  
  async getSellerById(id: number): Promise<WorkerProfile> {
    if (USE_MOCK_DATA) {
      return this.mockGetSellerById(id);
    }
    
    const response = await fetch(
      buildUrl(API_CONFIG.ENDPOINTS.SELLER_PROFILE, { id }),
      {
        headers: API_CONFIG.getHeaders(),
      }
    );
    
    if (!response.ok) throw new Error('Failed to fetch seller');
    const raw = await response.json();
    return this.normalizeWorkerProfile(raw);
  }

  async getSellerProfileByUser(userId: number): Promise<SellerProfile> {
    const response = await fetch(
      buildUrl(API_CONFIG.ENDPOINTS.SELLER_PROFILE_BY_USER, { id: userId }),
      { headers: API_CONFIG.getHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch seller profile');
    return response.json();
  }

  async createSellerProfile(data: {
    business_name?: string;
    bio?: string;
    hourly_rate?: number;
    skill_level?: string;
    years_experience?: number;
    address?: string;
    latitude?: number;
    longitude?: number;
    service_radius_km?: number;
    city?: string;
    state?: string;
    postal_code?: string;
    availability_status?: string;
    categories?: string[];
    languages?: string[];
    service_title?: string;
    service_description?: string;
  }): Promise<SellerProfile> {
    const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.SELLERS), {
      method: 'POST',
      headers: API_CONFIG.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create seller profile');
    return response.json();
  }

  async uploadSellerCertifications(sellerId: number, files: File[]): Promise<SellerCertification[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const response = await fetch(
      buildUrl(API_CONFIG.ENDPOINTS.SELLER_CERTIFICATIONS, { id: sellerId }),
      {
        method: 'POST',
        headers: {
          'Authorization': API_CONFIG.getHeaders().Authorization,
        },
        body: formData,
      }
    );
    if (!response.ok) throw new Error('Failed to upload certifications');
    return response.json();
  }

  // ==================== POSTS ====================

  async getSellerPosts(sellerId: number): Promise<SellerPost[]> {
    const response = await fetch(
      `${buildUrl(API_CONFIG.ENDPOINTS.POSTS)}?sellerId=${sellerId}`,
      { headers: API_CONFIG.getHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch posts');
    return response.json();
  }

  async createSellerPost(data: {
    seller_id: number;
    title: string;
    description?: string;
    type: 'promotion' | 'discount' | 'availability';
    visibility_radius: number;
    expiry_days: number;
    image?: File | null;
  }): Promise<SellerPost> {
    const formData = new FormData();
    formData.append('seller_id', data.seller_id.toString());
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    formData.append('type', data.type);
    formData.append('visibility_radius', data.visibility_radius.toString());
    formData.append('expiry_days', data.expiry_days.toString());
    if (data.image) formData.append('image', data.image);

    const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.POSTS), {
      method: 'POST',
      headers: {
        'Authorization': API_CONFIG.getHeaders().Authorization,
      },
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to create post');
    return response.json();
  }

  async deleteSellerPost(id: number): Promise<void> {
    const response = await fetch(
      `${buildUrl(API_CONFIG.ENDPOINTS.POSTS)}/${id}`,
      {
        method: 'DELETE',
        headers: API_CONFIG.getHeaders(),
      }
    );
    if (!response.ok) throw new Error('Failed to delete post');
  }
  
  async updateSellerProfile(id: number, data: Partial<SellerProfile>): Promise<SellerProfile> {
    if (USE_MOCK_DATA) {
      return this.mockUpdateSellerProfile(id, data);
    }
    
    const response = await fetch(
      buildUrl(API_CONFIG.ENDPOINTS.SELLER_PROFILE, { id }),
      {
        method: 'PUT',
        headers: API_CONFIG.getHeaders(),
        body: JSON.stringify(data),
      }
    );
    
    if (!response.ok) {
      let message = 'Failed to update seller profile';
      try {
        const errorBody = await response.json();
        if (errorBody?.error) message = errorBody.error;
      } catch {
        // ignore parse errors and keep generic message
      }
      throw new Error(message);
    }
    return response.json();
  }
  
  // ==================== CATEGORIES ====================
  
  async getCategories(): Promise<Category[]> {
    if (USE_MOCK_DATA) {
      return this.mockGetCategories();
    }
    
    const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.CATEGORIES), {
      headers: API_CONFIG.getHeaders(),
    });
    
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  }
  
  // ==================== BOOKINGS ====================
  
  async createBooking(bookingData: Partial<Booking>): Promise<Booking> {
    if (USE_MOCK_DATA) {
      return this.mockCreateBooking(bookingData);
    }
    
    const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.BOOKINGS), {
      method: 'POST',
      headers: API_CONFIG.getHeaders(),
      body: JSON.stringify(bookingData),
    });
    
    if (!response.ok) throw new Error('Failed to create booking');
    return response.json();
  }
  
  async getBuyerBookings(buyerId: number): Promise<BookingWithDetails[]> {
    if (USE_MOCK_DATA) {
      return this.mockGetBuyerBookings(buyerId);
    }
    
    const response = await fetch(
      buildUrl(API_CONFIG.ENDPOINTS.BUYER_BOOKINGS, { id: buyerId }),
      {
        headers: API_CONFIG.getHeaders(),
      }
    );
    
    if (!response.ok) throw new Error('Failed to fetch bookings');
    return response.json();
  }
  
  async getSellerBookings(sellerId: number): Promise<BookingWithDetails[]> {
    if (USE_MOCK_DATA) {
      return this.mockGetSellerBookings(sellerId);
    }
    
    const response = await fetch(
      buildUrl(API_CONFIG.ENDPOINTS.SELLER_BOOKINGS, { id: sellerId }),
      {
        headers: API_CONFIG.getHeaders(),
      }
    );
    
    if (!response.ok) throw new Error('Failed to fetch bookings');
    return response.json();
  }
  
  async updateBookingStatus(bookingId: number, status: string): Promise<Booking> {
    if (USE_MOCK_DATA) {
      return this.mockUpdateBookingStatus(bookingId, status);
    }
    
    const response = await fetch(
      buildUrl(API_CONFIG.ENDPOINTS.BOOKING_DETAIL, { id: bookingId }),
      {
        method: 'PATCH',
        headers: API_CONFIG.getHeaders(),
        body: JSON.stringify({ status }),
      }
    );
    
    if (!response.ok) throw new Error('Failed to update booking');
    return response.json();
  }
  
  // ==================== REVIEWS ====================
  
  async createReview(reviewData: Partial<Review>): Promise<Review> {
    if (USE_MOCK_DATA) {
      return this.mockCreateReview(reviewData);
    }
    
    const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.CREATE_REVIEW), {
      method: 'POST',
      headers: API_CONFIG.getHeaders(),
      body: JSON.stringify(reviewData),
    });
    
    if (!response.ok) throw new Error('Failed to create review');
    return response.json();
  }
  
  async getSellerReviews(sellerId: number): Promise<Review[]> {
    if (USE_MOCK_DATA) {
      return this.mockGetSellerReviews(sellerId);
    }
    
    const response = await fetch(
      buildUrl(API_CONFIG.ENDPOINTS.SELLER_REVIEWS, { id: sellerId }),
      {
        headers: API_CONFIG.getHeaders(),
      }
    );
    
    if (!response.ok) throw new Error('Failed to fetch reviews');
    return response.json();
  }
  
  // ==================== MESSAGES ====================
  
  async getConversations(userId: number): Promise<ConversationWithDetails[]> {
    if (USE_MOCK_DATA) {
      return this.mockGetConversations(userId);
    }
    
    const response = await fetch(
      `${buildUrl(API_CONFIG.ENDPOINTS.CONVERSATIONS)}?userId=${userId}`,
      {
        headers: API_CONFIG.getHeaders(),
      }
    );
    
    if (!response.ok) throw new Error('Failed to fetch conversations');
    const raw = await response.json();
    if (!Array.isArray(raw)) return [];

    const mapped = await Promise.all(
      raw.map(async (conversation) => ({
        ...conversation,
        last_message: conversation.last_message
          ? {
              ...conversation.last_message,
              message_text: await decryptMessageText(
                conversation.last_message.message_text || ''
              ),
            }
          : conversation.last_message,
      }))
    );
    return mapped;
  }
  
  async getMessages(conversationId: number): Promise<Message[]> {
    if (USE_MOCK_DATA) {
      return this.mockGetMessages(conversationId);
    }
    
    const response = await fetch(
      buildUrl(API_CONFIG.ENDPOINTS.MESSAGES, { conversationId }),
      {
        headers: API_CONFIG.getHeaders(),
      }
    );
    
    if (!response.ok) throw new Error('Failed to fetch messages');
    const raw = await response.json();
    if (!Array.isArray(raw)) return [];
    const decrypted = await Promise.all(
      raw.map(async (message) => ({
        ...message,
        message_text: await decryptMessageText(message.message_text || ''),
      }))
    );
    return decrypted;
  }
  
  async sendMessage(messageData: Partial<Message>): Promise<Message> {
    if (USE_MOCK_DATA) {
      return this.mockSendMessage(messageData);
    }
    
    const encryptedText = await encryptMessageText(messageData.message_text || '');
    const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.SEND_MESSAGE), {
      method: 'POST',
      headers: API_CONFIG.getHeaders(),
      body: JSON.stringify({
        ...messageData,
        message_text: encryptedText,
      }),
    });
    
    if (!response.ok) throw new Error('Failed to send message');
    const created = await response.json();
    return {
      ...created,
      message_text: await decryptMessageText(created.message_text || ''),
    };
  }

  async getOrCreateConversation(otherUserId: number, bookingId?: number): Promise<Conversation> {
    const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.CONVERSATIONS), {
      method: 'POST',
      headers: API_CONFIG.getHeaders(),
      body: JSON.stringify({
        other_user_id: otherUserId,
        booking_id: bookingId,
      }),
    });
    if (!response.ok) throw new Error('Failed to create conversation');
    return response.json();
  }

  async getMessageContacts(role: 'buyer' | 'seller'): Promise<Array<{
    userId: number;
    name: string;
    image?: string;
    subtitle?: string;
  }>> {
    if (role === 'buyer') {
      const sellers = await this.getAllSellers();
      const rows = sellers
        .map((seller) => ({
          userId: seller.user_id || seller.user?.id || 0,
          name: seller.user?.full_name || seller.business_name || 'Seller',
          image: seller.user?.profile_image,
          subtitle: seller.business_name || seller.categories?.[0]?.name || 'Service Provider',
        }))
        .filter((row) => Number.isInteger(row.userId) && row.userId > 0);
      return this.uniqueByUserId(rows);
    }

    const userId = Number.parseInt(localStorage.getItem('user_id') || '0', 10);
    if (!Number.isInteger(userId) || userId <= 0) return [];

    const sellerProfile = await this.getSellerProfileByUser(userId);
    const bookings = await this.getSellerBookings(sellerProfile.id);
    const rows = bookings
      .map((booking: any) => ({
        userId: booking.buyer_id || booking.buyer?.id || 0,
        name: booking.buyer_name || booking.buyer?.full_name || 'Client',
        image: booking.buyer_image || booking.buyer?.profile_image,
        subtitle: booking.title || 'Service request',
      }))
      .filter((row) => Number.isInteger(row.userId) && row.userId > 0);

    return this.uniqueByUserId(rows);
  }
  
  // ==================== MOCK DATA METHODS ====================
  
  private mockLogin(email: string, password: string): Promise<{ user: User; token: string }> {
    return Promise.resolve({
      user: {
        id: 1,
        email,
        password_hash: '',
        full_name: 'John Doe',
        phone: '+1234567890',
        role: 'buyer',
        profile_image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
      },
      token: 'mock_jwt_token_12345',
    });
  }
  
  private mockRegister(userData: Partial<User>): Promise<{ user: User; token: string }> {
    return Promise.resolve({
      user: {
        id: Math.floor(Math.random() * 10000),
        email: userData.email || '',
        password_hash: '',
        full_name: userData.full_name || '',
        phone: userData.phone,
        role: userData.role || 'buyer',
        profile_image: userData.profile_image,
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
      },
      token: 'mock_jwt_token_12345',
    });
  }
  
  private mockGetNearbySellers(params: any): Promise<WorkerProfile[]> {
    const workers: WorkerProfile[] = [
      {
        id: 1,
        user_id: 101,
        business_name: 'John Smith Electrical',
        bio: 'Professional electrician with 10+ years of experience',
        hourly_rate: 50,
        skill_level: 'Expert',
        years_experience: 10,
        verified: true,
        rating: 4.9,
        total_reviews: 142,
        total_jobs: 350,
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Main St, New York, NY',
        city: 'New York',
        state: 'NY',
        postal_code: '10001',
        availability_status: 'available',
        created_at: new Date(),
        updated_at: new Date(),
        user: {
          id: 101,
          email: 'john@example.com',
          password_hash: '',
          full_name: 'John Smith',
          role: 'seller',
          profile_image: 'https://images.unsplash.com/photo-1636218685495-8f6545aadb71?w=400',
          created_at: new Date(),
          updated_at: new Date(),
          is_active: true,
        },
        categories: [{ id: 1, name: 'Electrician', created_at: new Date() }],
      },
      {
        id: 2,
        user_id: 102,
        business_name: 'Sarah Johnson Plumbing',
        bio: 'Expert plumber specializing in residential services',
        hourly_rate: 55,
        skill_level: 'Expert',
        years_experience: 8,
        verified: true,
        rating: 4.8,
        total_reviews: 98,
        total_jobs: 220,
        latitude: 40.7589,
        longitude: -73.9851,
        address: '456 Park Ave, New York, NY',
        city: 'New York',
        state: 'NY',
        postal_code: '10022',
        availability_status: 'available',
        created_at: new Date(),
        updated_at: new Date(),
        user: {
          id: 102,
          email: 'sarah@example.com',
          password_hash: '',
          full_name: 'Sarah Johnson',
          role: 'seller',
          profile_image: 'https://images.unsplash.com/photo-1635221798248-8a3452ad07cd?w=400',
          created_at: new Date(),
          updated_at: new Date(),
          is_active: true,
        },
        categories: [{ id: 2, name: 'Plumber', created_at: new Date() }],
      },
      {
        id: 3,
        user_id: 103,
        business_name: 'Mike Davis Carpentry',
        bio: 'Master carpenter with expertise in custom furniture',
        hourly_rate: 60,
        skill_level: 'Expert',
        years_experience: 15,
        verified: true,
        rating: 5.0,
        total_reviews: 205,
        total_jobs: 480,
        latitude: 40.7489,
        longitude: -73.9680,
        address: '789 Broadway, New York, NY',
        city: 'New York',
        state: 'NY',
        postal_code: '10003',
        availability_status: 'available',
        created_at: new Date(),
        updated_at: new Date(),
        user: {
          id: 103,
          email: 'mike@example.com',
          password_hash: '',
          full_name: 'Mike Davis',
          role: 'seller',
          profile_image: 'https://images.unsplash.com/photo-1667771510023-7a321ceaf981?w=400',
          created_at: new Date(),
          updated_at: new Date(),
          is_active: true,
        },
        categories: [{ id: 4, name: 'Carpenter', created_at: new Date() }],
      },
    ];
    
    return Promise.resolve(workers);
  }
  
  private mockGetSellerById(id: number): Promise<WorkerProfile> {
    return this.mockGetNearbySellers({}).then(workers => {
      const worker = workers.find(w => w.id === id);
      if (!worker) throw new Error('Seller not found');
      return worker;
    });
  }
  
  private mockUpdateSellerProfile(id: number, data: Partial<SellerProfile>): Promise<SellerProfile> {
    return Promise.resolve({
      id,
      user_id: 101,
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    } as SellerProfile);
  }
  
  private mockGetCategories(): Promise<Category[]> {
    return Promise.resolve([
      { id: 1, name: 'Electrician', description: 'Electrical services', icon: 'zap', created_at: new Date() },
      { id: 2, name: 'Plumber', description: 'Plumbing services', icon: 'droplet', created_at: new Date() },
      { id: 3, name: 'Cleaner', description: 'Cleaning services', icon: 'sparkles', created_at: new Date() },
      { id: 4, name: 'Carpenter', description: 'Carpentry services', icon: 'hammer', created_at: new Date() },
      { id: 5, name: 'Painter', description: 'Painting services', icon: 'paintbrush', created_at: new Date() },
      { id: 6, name: 'Gardener', description: 'Gardening services', icon: 'leaf', created_at: new Date() },
    ]);
  }
  
  private mockCreateBooking(data: Partial<Booking>): Promise<Booking> {
    return Promise.resolve({
      id: Math.floor(Math.random() * 10000),
      ...data,
      status: 'pending',
      payment_status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    } as Booking);
  }
  
  private mockGetBuyerBookings(buyerId: number): Promise<BookingWithDetails[]> {
    return Promise.resolve([]);
  }
  
  private mockGetSellerBookings(sellerId: number): Promise<BookingWithDetails[]> {
    return Promise.resolve([]);
  }
  
  private mockUpdateBookingStatus(bookingId: number, status: string): Promise<Booking> {
    return Promise.resolve({
      id: bookingId,
      status: status as any,
      updated_at: new Date(),
    } as Booking);
  }
  
  private mockCreateReview(data: Partial<Review>): Promise<Review> {
    return Promise.resolve({
      id: Math.floor(Math.random() * 10000),
      ...data,
      helpful_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    } as Review);
  }
  
  private mockGetSellerReviews(sellerId: number): Promise<Review[]> {
    return Promise.resolve([]);
  }
  
  private mockGetConversations(userId: number): Promise<ConversationWithDetails[]> {
    return Promise.resolve([]);
  }
  
  private mockGetMessages(conversationId: number): Promise<Message[]> {
    return Promise.resolve([]);
  }
  
  private mockSendMessage(data: Partial<Message>): Promise<Message> {
    return Promise.resolve({
      id: Math.floor(Math.random() * 10000),
      ...data,
      is_read: false,
      created_at: new Date(),
    } as Message);
  }
}

export const dbService = new DatabaseService();
