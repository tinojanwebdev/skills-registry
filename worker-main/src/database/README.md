# Worker Marketplace - MySQL Database Setup

## Database Structure

This application uses MySQL as the database backend. The complete schema is defined in `schema.sql`.

### Tables Overview

1. **users** - Stores all user accounts (buyers and sellers)
2. **seller_profiles** - Extended profile data for sellers/workers
3. **categories** - Service categories (Electrician, Plumber, etc.)
4. **seller_services** - Services offered by each seller
5. **seller_languages** - Languages spoken by sellers
6. **seller_certifications** - Professional certifications
7. **seller_portfolio** - Work samples and portfolio images
8. **bookings** - Service bookings/job requests
9. **reviews** - User reviews and ratings
10. **conversations** - Chat conversation threads
11. **messages** - Individual chat messages
12. **notifications** - System notifications
13. **favorites** - Saved/favorite workers

## Setup Instructions

### 1. Create MySQL Database

Connect to your VPS MySQL server and create the database:

```bash
mysql -u root -p
```

```sql
CREATE DATABASE worker_marketplace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE worker_marketplace;
```

### 2. Import Schema

Import the schema file:

```bash
mysql -u root -p worker_marketplace < database/schema.sql
```

Or from MySQL prompt:

```sql
USE worker_marketplace;
SOURCE /path/to/database/schema.sql;
```

### 3. Create Database User

Create a dedicated user for the application:

```sql
CREATE USER 'worker_app'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON worker_marketplace.* TO 'worker_app'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Backend API Setup

You need to create a REST API backend on your VPS. Here are recommended options:

#### Option A: Node.js + Express + MySQL2

```bash
npm install express mysql2 bcrypt jsonwebtoken cors dotenv
```

Create `.env` file:
```
DB_HOST=localhost
DB_USER=worker_app
DB_PASSWORD=your_secure_password
DB_NAME=worker_marketplace
JWT_SECRET=your_jwt_secret_key
PORT=3001
```

#### Option B: PHP + Laravel

```bash
composer create-project laravel/laravel worker-api
composer require mysql
```

#### Option C: Python + Flask + SQLAlchemy

```bash
pip install flask flask-sqlalchemy pymysql flask-cors flask-jwt-extended
```

### 5. Update Frontend Configuration

Edit `/services/api.config.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: 'https://your-vps-domain.com/api',
  // or
  BASE_URL: 'http://your-vps-ip:3001/api',
  ...
};
```

Edit `/services/database.service.ts`:

```typescript
const USE_MOCK_DATA = false; // Change to false to use real API
```

## API Endpoints Required

Your backend API should implement these endpoints:

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile

### Sellers
- `GET /api/sellers` - List all sellers
- `GET /api/sellers/nearby?lat=X&lng=Y&radius=Z` - Find nearby sellers
- `GET /api/sellers/:id` - Get seller profile
- `PUT /api/sellers/:id` - Update seller profile
- `GET /api/sellers/:id/reviews` - Get seller reviews
- `GET /api/sellers/:id/portfolio` - Get seller portfolio

### Categories
- `GET /api/categories` - List all categories

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/buyer/:id` - Get buyer's bookings
- `GET /api/bookings/seller/:id` - Get seller's bookings
- `PATCH /api/bookings/:id` - Update booking status

### Reviews
- `POST /api/reviews` - Create review

### Messages
- `GET /api/conversations?userId=X` - Get user conversations
- `GET /api/messages/:conversationId` - Get messages
- `POST /api/messages` - Send message

### Notifications
- `GET /api/notifications?userId=X` - Get notifications
- `PATCH /api/notifications/:id/read` - Mark as read

## Database Indexes

The schema includes optimized indexes for:
- Location-based queries (latitude, longitude)
- User lookups (email, role)
- Booking searches (status, dates)
- Message retrieval (conversation_id, timestamp)

## Example Queries

### Find nearby workers by category

```sql
SELECT 
  sp.*,
  u.full_name,
  u.profile_image,
  c.name as category_name,
  (6371 * acos(cos(radians(40.7128)) 
    * cos(radians(latitude)) 
    * cos(radians(longitude) - radians(-74.0060)) 
    + sin(radians(40.7128)) 
    * sin(radians(latitude)))) AS distance
FROM seller_profiles sp
JOIN users u ON sp.user_id = u.id
JOIN seller_services ss ON sp.id = ss.seller_id
JOIN categories c ON ss.category_id = c.id
WHERE c.name = 'Electrician'
  AND sp.verified = 1
HAVING distance < 10
ORDER BY distance ASC, sp.rating DESC
LIMIT 20;
```

### Get booking with full details

```sql
SELECT 
  b.*,
  buyer.full_name as buyer_name,
  seller_user.full_name as seller_name,
  sp.hourly_rate,
  sp.rating,
  c.name as category_name
FROM bookings b
JOIN users buyer ON b.buyer_id = buyer.id
JOIN seller_profiles sp ON b.seller_id = sp.id
JOIN users seller_user ON sp.user_id = seller_user.id
JOIN categories c ON b.category_id = c.id
WHERE b.id = ?;
```

## Security Recommendations

1. **Never commit database credentials** - Use environment variables
2. **Hash passwords** - Use bcrypt with salt rounds >= 10
3. **Use prepared statements** - Prevent SQL injection
4. **Implement rate limiting** - Prevent brute force attacks
5. **Enable SSL/TLS** - For database connections
6. **Regular backups** - Automated daily backups
7. **JWT tokens** - For authentication with expiration

## Migration to PostgreSQL (Future)

If you decide to switch to PostgreSQL later:

1. Export data: `mysqldump worker_marketplace > backup.sql`
2. Convert schema to PostgreSQL syntax
3. Use `pgloader` for data migration:
   ```bash
   pgloader mysql://user:pass@localhost/worker_marketplace 
            postgresql://user:pass@localhost/worker_marketplace
   ```
4. Add PostGIS extension for advanced location queries
5. Update backend database driver
6. Test thoroughly

## Performance Tips

1. **Enable query caching** in MySQL config
2. **Use connection pooling** in your backend
3. **Add Redis** for session/cache management
4. **Implement pagination** for large result sets
5. **Use database replication** for scaling
6. **Monitor slow queries** and optimize
