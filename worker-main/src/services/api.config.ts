/// <reference types="vite/client" />

// API Configuration
// Update this file with your VPS MySQL API endpoint

export const API_CONFIG = {
  // Replace with your VPS API URL
  // Vite exposes env vars via import.meta.env with VITE_ prefix
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:4001/api',
  
  // API Endpoints
  ENDPOINTS: {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    
    // Users
    USERS: '/users',
    USER_PROFILE: '/users/:id',
    USER_PROFILE_IMAGE: '/users/:id/profile-image',
    
    // Sellers
    SELLERS: '/sellers',
    SELLER_PROFILE: '/sellers/:id',
    SELLER_PROFILE_BY_USER: '/sellers/by-user/:id',
    SELLER_SERVICES: '/sellers/:id/services',
    SELLER_PORTFOLIO: '/sellers/:id/portfolio',
    SELLER_CERTIFICATIONS: '/sellers/:id/certifications',
    SELLER_REVIEWS: '/sellers/:id/reviews',
    NEARBY_SELLERS: '/sellers/nearby',

    // Posts
    POSTS: '/posts',
    
    // Categories
    CATEGORIES: '/categories',
    
    // Bookings
    BOOKINGS: '/bookings',
    BOOKING_DETAIL: '/bookings/:id',
    BUYER_BOOKINGS: '/bookings/buyer/:id',
    SELLER_BOOKINGS: '/bookings/seller/:id',
    
    // Reviews
    REVIEWS: '/reviews',
    CREATE_REVIEW: '/reviews',
    
    // Messages
    CONVERSATIONS: '/conversations',
    MESSAGES: '/messages/:conversationId',
    SEND_MESSAGE: '/messages',
    
    // Notifications
    NOTIFICATIONS: '/notifications',
    MARK_READ: '/notifications/:id/read',
    
    // Favorites
    FAVORITES: '/favorites',
    ADD_FAVORITE: '/favorites',
    REMOVE_FAVORITE: '/favorites/:id',
  },
  
  // Request timeout in milliseconds
  TIMEOUT: 10000,
  
  // Headers
  getHeaders: () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
  }),
};

// Helper function to build URLs with params
export const buildUrl = (endpoint: string, params?: Record<string, string | number>) => {
  let url = API_CONFIG.BASE_URL + endpoint;
  
  if (params) {
    Object.keys(params).forEach(key => {
      url = url.replace(`:${key}`, String(params[key]));
    });
  }
  
  return url;
};

// Helper function for query strings
export const buildQueryString = (params: Record<string, any>) => {
  const query = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      query.append(key, String(params[key]));
    }
  });
  
  return query.toString();
};
