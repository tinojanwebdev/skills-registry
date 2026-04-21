# 🏗️ Worker Marketplace - Complete Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE LAYER                             │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Buyer UI   │  │  Seller UI   │  │   Shared UI  │                  │
│  │              │  │              │  │              │                  │
│  │ • Home       │  │ • Dashboard  │  │ • Messages   │                  │
│  │ • Bookings   │  │ • Jobs       │  │ • Chat       │                  │
│  │ • Request    │  │ • Posts      │  │ • Profile    │                  │
│  │ • Profile    │  │ • Profile    │  │ • Auth       │                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
│         │                  │                  │                          │
└─────────┼──────────────────┼──────────────────┼──────────────────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND SERVICE LAYER                              │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │            /services/database.service.ts                        │    │
│  │                                                                 │    │
│  │  const USE_MOCK_DATA = true  // ← Toggle Switch               │    │
│  │                                                                 │    │
│  │  if (USE_MOCK_DATA) {                                          │    │
│  │    return mockData()          // Development Mode              │    │
│  │  } else {                                                      │    │
│  │    return fetch(API_URL)      // Production Mode               │    │
│  │  }                                                             │    │
│  └────────────────────────────────────────────────────────────────┘    │
│         │                                    │                           │
│         │ Mock Mode                          │ Real API Mode             │
│         ↓                                    ↓                           │
│  ┌──────────────┐                   ┌─────────────────┐                │
│  │  Mock Data   │                   │  API Config     │                │
│  │  • Workers   │                   │  • Endpoints    │                │
│  │  • Bookings  │                   │  • Headers      │                │
│  │  • Messages  │                   │  • Auth Tokens  │                │
│  └──────────────┘                   └────────┬────────┘                │
│                                               │                          │
└───────────────────────────────────────────────┼──────────────────────────┘
                                                │
                                                │ HTTPS
                                                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND API LAYER (VPS)                          │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Nginx Reverse Proxy                          │   │
│  │  • SSL/TLS Termination                                          │   │
│  │  • Load Balancing                                               │   │
│  │  • Static File Serving                                          │   │
│  └────────────────────────────┬────────────────────────────────────┘   │
│                                │                                         │
│                                ↓                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │           Node.js + Express API Server (PM2)                     │   │
│  │                                                                  │   │
│  │  Authentication      Workers          Bookings      Messages    │   │
│  │  ┌──────────────┐  ┌──────────────┐ ┌────────┐   ┌─────────┐  │   │
│  │  │ POST /login  │  │ GET /sellers │ │ POST / │   │ GET /   │  │   │
│  │  │ POST /signup │  │ GET /:id     │ │ GET /  │   │ POST /  │  │   │
│  │  │              │  │ PUT /:id     │ │ PATCH/ │   │         │  │   │
│  │  └──────────────┘  └──────────────┘ └────────┘   └─────────┘  │   │
│  │                                                                  │   │
│  │  Middleware: CORS, Helmet, Body-Parser, JWT Auth               │   │
│  └────────────────────────────┬────────────────────────────────────┘   │
│                                │                                         │
└────────────────────────────────┼─────────────────────────────────────────┘
                                 │
                                 │ MySQL Connection Pool
                                 ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATABASE LAYER (MySQL)                          │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    MySQL Database Server                          │  │
│  │                                                                   │  │
│  │  Database: worker_marketplace                                    │  │
│  │  Charset: utf8mb4                                                │  │
│  │  Collation: utf8mb4_unicode_ci                                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│         │                                                                │
│         ↓                                                                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                          13 Tables                                │  │
│  │                                                                   │  │
│  │  Core Tables            Relationship Tables    Feature Tables    │  │
│  │  ┌────────────┐        ┌────────────────┐    ┌──────────────┐  │  │
│  │  │ users      │───────→│ seller_services│    │ messages     │  │  │
│  │  │            │        │ seller_languages│   │ notifications│  │  │
│  │  │ seller_    │        │ seller_certs   │    │ favorites    │  │  │
│  │  │ profiles   │        │ seller_portfolio│   │              │  │  │
│  │  │            │        └────────────────┘    └──────────────┘  │  │
│  │  │ categories │                                                 │  │
│  │  │            │        Transaction Tables                       │  │
│  │  │ bookings   │        ┌──────────────┐                        │  │
│  │  │            │        │ reviews      │                        │  │
│  │  │ conversations       │              │                        │  │
│  │  └────────────┘        └──────────────┘                        │  │
│  │                                                                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│         │                                                                │
│         ↓                                                                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   Indexes & Optimization                          │  │
│  │                                                                   │  │
│  │  • idx_email (users)                                             │  │
│  │  • idx_location (seller_profiles) - Geospatial                  │  │
│  │  • idx_booking_status (bookings)                                 │  │
│  │  • idx_message_conversation (messages)                           │  │
│  │  • idx_rating (seller_profiles)                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. User Authentication Flow

```
User enters credentials
        ↓
┌──────────────────────┐
│   AuthScreen.tsx     │
│  - Collect email/pwd │
│  - Validate input    │
└──────────┬───────────┘
           │
           ↓ dbService.login(email, password)
┌──────────────────────┐
│  database.service.ts │
│  - Check USE_MOCK    │
│  - Build request     │
└──────────┬───────────┘
           │
    ┌──────┴──────┐
    │             │
Mock Mode      Real Mode
    │             │
    ↓             ↓
Return Mock   POST /api/auth/login
User + Token      │
                  ↓
              ┌───────────────┐
              │ Express Route │
              │ - Validate    │
              │ - Query DB    │
              │ - Hash check  │
              └───────┬───────┘
                      │
                      ↓
              ┌───────────────┐
              │  MySQL Query  │
              │ SELECT * FROM │
              │ users WHERE   │
              │ email = ?     │
              └───────┬───────┘
                      │
                      ↓
              ┌───────────────┐
              │ Generate JWT  │
              │ Return user   │
              │ + token       │
              └───────┬───────┘
                      │
           ┌──────────┴─────────┐
           │                    │
           ↓                    ↓
    Store in localStorage   Update UI
    - auth_token            Navigate to
    - user_id              Dashboard
```

### 2. Worker Search Flow

```
User enters location
        ↓
┌──────────────────────┐
│   BuyerHome.tsx      │
│  - Get coordinates   │
│  - Apply filters     │
└──────────┬───────────┘
           │
           ↓ dbService.getNearbySellers({lat, lng, radius})
┌──────────────────────┐
│  database.service.ts │
│  - Build params      │
│  - Add filters       │
└──────────┬───────────┘
           │
    ┌──────┴──────┐
    │             │
Mock Mode      Real Mode
    │             │
    ↓             ↓
Return 3       GET /api/sellers/nearby
Workers        ?lat=X&lng=Y&radius=Z
               │
               ↓
          ┌────────────────┐
          │ Express Route  │
          │ - Parse params │
          │ - Build query  │
          └────────┬───────┘
                   │
                   ↓
          ┌────────────────────────────┐
          │  MySQL Geospatial Query    │
          │                            │
          │  SELECT sp.*,              │
          │  (6371 * acos(...))        │
          │  AS distance               │
          │  FROM seller_profiles sp   │
          │  WHERE distance < ?        │
          │  ORDER BY distance, rating │
          └────────┬───────────────────┘
                   │
                   ↓
          ┌────────────────┐
          │ Join user data │
          │ Join services  │
          │ Join categories│
          └────────┬───────┘
                   │
           ┌───────┴────────┐
           │                │
           ↓                ↓
    Return JSON        Transform data
    WorkerProfile[]    Display on map
```

### 3. Booking Creation Flow

```
User fills form
        ↓
┌──────────────────────┐
│ ServiceRequest.tsx   │
│  - Step 1: Details   │
│  - Step 2: DateTime  │
│  - Step 3: Payment   │
└──────────┬───────────┘
           │
           ↓ dbService.createBooking(data)
┌──────────────────────┐
│  database.service.ts │
│  - Validate data     │
│  - Calculate amount  │
└──────────┬───────────┘
           │
    ┌──────┴──────┐
    │             │
Mock Mode      Real Mode
    │             │
    ↓             ↓
Create Mock    POST /api/bookings
Booking        │
ID: random     ↓
          ┌────────────────┐
          │ Express Route  │
          │ - Auth check   │
          │ - Validate     │
          └────────┬───────┘
                   │
                   ↓
          ┌───────────────────────┐
          │  MySQL Transaction    │
          │                       │
          │  BEGIN                │
          │  INSERT INTO bookings │
          │  VALUES (...)         │
          │  UPDATE seller stats  │
          │  INSERT notification  │
          │  COMMIT               │
          └────────┬──────────────┘
                   │
           ┌───────┴────────┐
           │                │
           ↓                ↓
    Return Booking     Trigger webhook
    Navigate to        Send email
    Success screen     Push notification
```

### 4. Real-time Messaging Flow

```
User types message
        ↓
┌──────────────────────┐
│   ChatScreen.tsx     │
│  - Display history   │
│  - Input field       │
└──────────┬───────────┘
           │
           ↓ dbService.sendMessage(data)
┌──────────────────────┐
│  database.service.ts │
│  - Add metadata      │
│  - Timestamp         │
└──────────┬───────────┘
           │
    ┌──────┴──────┐
    │             │
Mock Mode      Real Mode
    │             │
    ↓             ↓
Append to      POST /api/messages
local state    │
               ↓
          ┌────────────────┐
          │ Express Route  │
          │ - Auth check   │
          │ - Validate     │
          └────────┬───────┘
                   │
                   ↓
          ┌─────────────────────────┐
          │  MySQL Insert           │
          │                         │
          │  INSERT INTO messages   │
          │  (conversation_id,      │
          │   sender_id,            │
          │   message_text,         │
          │   created_at)           │
          │  VALUES (?, ?, ?, NOW())│
          │                         │
          │  UPDATE conversations   │
          │  SET last_message_at    │
          └────────┬────────────────┘
                   │
           ┌───────┴────────┐
           │                │
           ↓                ↓
    Return Message     Broadcast via
    Update UI          WebSocket
    Scroll to bottom   (future feature)
```

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       App.tsx (Root)                         │
│                                                              │
│  • Route management                                          │
│  • State management (role, auth, navigation)                │
│  • Screen switching                                          │
└──────────────────────┬───────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ↓              ↓              ↓
┌───────────┐  ┌──────────────┐  ┌──────────┐
│   Buyer   │  │    Seller    │  │  Shared  │
│ Components│  │  Components  │  │Components│
└─────┬─────┘  └──────┬───────┘  └────┬─────┘
      │               │                │
      ↓               ↓                ↓
┌──────────────────────────────────────────┐
│      All import dbService                │
│      All use TypeScript interfaces       │
│      All handle loading/error states     │
└──────────────────────────────────────────┘
```

### Buyer Components
```
BuyerHome.tsx
├── useState: workers, filters, search
├── useEffect: fetchWorkers()
├── useMemo: filteredWorkers
└── Components:
    ├── BuyerMapView
    └── BuyerListView

BuyerBookings.tsx
├── useState: bookings, filter
├── useEffect: fetchBookings()
└── Display: active/past bookings

ServiceRequest.tsx
├── useState: step, formData, worker
├── useEffect: fetchWorker()
└── Steps: Details → DateTime → Payment

WorkerProfileView.tsx
├── useState: worker, isFavorite
├── useEffect: fetchWorkerProfile()
└── Display: Full profile with reviews
```

### Seller Components
```
SellerDashboard.tsx
├── useState: jobs, stats
├── useEffect: fetchJobs() → calculateStats()
└── Display: Stats cards, recent jobs

SellerJobManagement.tsx
├── useState: jobs, filter, selectedJob
├── useEffect: fetchJobs()
└── Actions:
    ├── handleAcceptJob()
    └── handleRejectJob()
```

### Shared Components
```
MessagesList.tsx
├── useState: conversations
├── useEffect: fetchConversations()
└── Display: List with unread counts

ChatScreen.tsx
├── useState: messages, message
├── useEffect: fetchMessages()
└── Actions: handleSend()

ProfileScreen.tsx
├── useState: userProfile, sellerProfile
├── useEffect: fetchProfile()
└── Display: Role-based profile view
```

---

## Database Schema Relationships

```
┌─────────────┐
│    users    │ Primary entity
│             │
│ id (PK)     │◄─────┐
│ email       │      │
│ full_name   │      │
│ role        │      │
└─────────────┘      │
      │              │
      │ 1:1 (seller) │
      ↓              │
┌─────────────────┐  │
│seller_profiles  │  │
│                 │  │
│ id (PK)         │  │
│ user_id (FK)────┘  │
│ rating          │  │
│ latitude        │  │
│ longitude       │  │
│ verified        │  │
└────────┬────────┘  │
         │           │
    1:N  │           │
         ↓           │
┌──────────────────┐ │
│seller_services   │ │
│                  │ │
│ seller_id (FK)───┘ │
│ category_id (FK) │ │
└──────────────────┘ │
                     │
┌────────────────┐   │
│   bookings     │   │
│                │   │
│ id (PK)        │   │
│ buyer_id (FK)──────┘
│ seller_id (FK)─┐
│ status         │
│ total_amount   │
└──────��─┬───────┘
         │
    1:1  │
         ↓
┌──────────────┐
│   reviews    │
│              │
│ booking_id   │
│ rating       │
│ comment      │
└──────────────┘

┌────────────────┐
│ conversations  │
│                │
│ buyer_id (FK)  │
│ seller_id (FK) │
└────────┬───────┘
         │
    1:N  │
         ↓
┌──────────────┐
│  messages    │
│              │
│ conversation │
│ sender_id    │
│ message_text │
└──────────────┘
```

---

## Deployment Architecture (Production)

```
┌─────────────────────────────────────────────────────┐
│              Internet / Public Access                │
└───────────────────┬─────────────────────────────────┘
                    │
                    │ HTTPS (Port 443)
                    ↓
┌─────────────────────────────────────────────────────┐
│                  Domain / DNS                        │
│                                                      │
│  yourdomain.com         → Frontend (Vercel/Netlify) │
│  api.yourdomain.com     → Backend (VPS)             │
└───────────────────┬─────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ↓                       ↓
┌───────────────┐      ┌────────────────┐
│   Frontend    │      │   Backend      │
│   Hosting     │      │   VPS Server   │
│               │      │                │
│ • Vercel      │      │ Ubuntu 22.04   │
│ • Netlify     │      │ Node.js 18+    │
│ • Cloudflare  │      │ MySQL 8.0      │
│               │      │ Nginx          │
└───────────────┘      │ PM2            │
                       │ SSL/Certbot    │
                       └────────┬───────┘
                                │
                                │ Internal (Port 3306)
                                ↓
                       ┌────────────────┐
                       │  MySQL DB      │
                       │  • Backups     │
                       │  • Replication │
                       │  • Monitoring  │
                       └────────────────┘
```

---

## Security Flow

```
Request from Frontend
        ↓
┌──────────────────┐
│ HTTPS/SSL        │ ← Encrypted
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Nginx            │
│ • Rate limiting  │
│ • DDoS protect   │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ CORS Check       │ ← Origin validation
└────────┬─────────┘
         ↓
┌──────────────────┐
│ JWT Verification │ ← Token check
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Input Validation │ ← Sanitize
└────────┬─────────┘
         ↓
┌──────────────────┐
│ SQL Prepared     │ ← Injection protection
│ Statements       │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Database Query   │ ← Execute safely
└────────┬─────────┘
         ↓
Response sent back
```

---

## File Structure

```
worker-marketplace/
│
├── /components/                 # React Components
│   ├── /buyer/                 # Buyer-specific
│   │   ├── BuyerHome.tsx       ✅ Connected
│   │   ├── BuyerBookings.tsx   ✅ Connected
│   │   ├── ServiceRequest.tsx  ✅ Connected
│   │   └── WorkerProfileView.tsx ✅ Connected
│   ├── /seller/                # Seller-specific
│   │   ├── SellerDashboard.tsx ✅ Connected
│   │   └── SellerJobManagement.tsx ✅ Connected
│   └── /shared/                # Shared components
│       ├── MessagesList.tsx    ✅ Connected
│       ├── ChatScreen.tsx      ✅ Connected
│       └── ProfileScreen.tsx   ✅ Connected
│
├── /services/                  # Service Layer
│   ├── database.service.ts     ✅ Main service
│   └── api.config.ts          ✅ API configuration
│
├── /types/                     # TypeScript Types
│   └── database.ts            ✅ All interfaces
│
├── /database/                  # Database Files
│   ├── schema.sql             ✅ MySQL schema
│   ├── sample-backend.js      ✅ Backend sample
│   ├── test-integration.ts    ✅ Test suite
│   ├── README.md              ✅ Setup guide
│   ├── DATABASE_CONNECTION_STATUS.md
│   ├── FRONTEND_BACKEND_INTEGRATION.md
│   ├── DEPLOYMENT_CHECKLIST.md
│   └── ARCHITECTURE_DIAGRAM.md (this file)
│
├── App.tsx                     # Root component
├── package.json               # Dependencies
└── DATABASE_INTEGRATION_SUMMARY.md
```

---

## Technology Stack

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State**: React Hooks (useState, useEffect, useMemo)
- **Routing**: React Router (Data Mode)
- **Icons**: Lucide React
- **HTTP**: Fetch API

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: JavaScript (ES6+)
- **Database Driver**: mysql2
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcrypt, helmet, cors
- **Process Manager**: PM2

### Database
- **DBMS**: MySQL 8.0
- **Charset**: utf8mb4
- **Collation**: utf8mb4_unicode_ci
- **Features**: Transactions, Foreign Keys, Indexes

### Infrastructure
- **Web Server**: Nginx
- **SSL**: Let's Encrypt (Certbot)
- **Hosting**: VPS (DigitalOcean, AWS, etc.)
- **Frontend CDN**: Vercel/Netlify

---

## Performance Metrics

### Target Performance
- **API Response Time**: < 200ms
- **Page Load Time**: < 2s
- **Time to Interactive**: < 3s
- **Database Query Time**: < 50ms
- **Uptime**: 99.9%

### Optimization Strategies
1. **Database**
   - Indexed queries
   - Connection pooling
   - Query caching

2. **Backend**
   - Response compression
   - Redis caching (future)
   - Load balancing (future)

3. **Frontend**
   - Code splitting
   - Lazy loading
   - Asset optimization
   - Service worker (future)

---

**This architecture is production-ready and scalable! 🚀**
