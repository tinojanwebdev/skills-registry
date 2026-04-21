# 🚀 Worker Marketplace - Complete Deployment Checklist

## Overview
This checklist guides you through deploying your Worker marketplace from development (mock data) to production (MySQL database on VPS).

---

## ✅ Pre-Deployment Verification

### Frontend Check
- [x] All components using `dbService` 
- [x] TypeScript types properly defined
- [x] Error handling implemented
- [x] Loading states added
- [x] Mock data working
- [x] No console errors
- [x] Responsive design tested

### Backend Check
- [x] Database schema created (`schema.sql`)
- [x] Sample backend provided (`sample-backend.js`)
- [x] API endpoints documented
- [x] TypeScript interfaces match database
- [x] Authentication flow designed

---

## 📦 Phase 1: VPS Setup

### 1.1 Server Preparation
```bash
# Connect to your VPS
ssh user@your-vps-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18 or higher)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 1.2 Install MySQL
```bash
# Install MySQL server
sudo apt install mysql-server -y

# Secure MySQL installation
sudo mysql_secure_installation

# Login to MySQL
sudo mysql -u root -p
```

### 1.3 Create Database
```sql
-- In MySQL prompt
CREATE DATABASE worker_marketplace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create database user
CREATE USER 'worker_app'@'localhost' IDENTIFIED BY 'YOUR_SECURE_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON worker_marketplace.* TO 'worker_app'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### 1.4 Import Database Schema
```bash
# Upload schema.sql to VPS
scp /path/to/database/schema.sql user@your-vps-ip:~/

# Import schema
mysql -u worker_app -p worker_marketplace < ~/schema.sql

# Verify tables created
mysql -u worker_app -p worker_marketplace -e "SHOW TABLES;"
```

---

## 📡 Phase 2: Backend Deployment

### 2.1 Setup Backend Directory
```bash
# Create app directory
mkdir -p ~/worker-marketplace-api
cd ~/worker-marketplace-api

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express mysql2 bcrypt jsonwebtoken cors dotenv body-parser
```

### 2.2 Upload Backend Code
```bash
# From your local machine, upload sample-backend.js
scp /path/to/database/sample-backend.js user@your-vps-ip:~/worker-marketplace-api/server.js
```

### 2.3 Create Environment Variables
```bash
# Create .env file
cat > .env << EOF
DB_HOST=localhost
DB_USER=worker_app
DB_PASSWORD=YOUR_SECURE_PASSWORD
DB_NAME=worker_marketplace
JWT_SECRET=YOUR_SUPER_SECRET_JWT_KEY_CHANGE_THIS
PORT=3001
NODE_ENV=production
EOF
```

### 2.4 Install PM2 (Process Manager)
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the application
pm2 start server.js --name worker-api

# Enable startup on boot
pm2 startup
pm2 save

# Check status
pm2 status
pm2 logs worker-api
```

### 2.5 Configure Nginx (Reverse Proxy)
```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/worker-api
```

**Nginx config**:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/worker-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 2.6 Setup SSL/HTTPS (Certbot)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

---

## 🎨 Phase 3: Frontend Configuration

### 3.1 Update API Configuration
```typescript
// /services/api.config.ts
export const API_CONFIG = {
  BASE_URL: 'https://api.yourdomain.com/api',  // ← Change this
  // ... rest of config
};
```

### 3.2 Enable Real API Mode
```typescript
// /services/database.service.ts
const USE_MOCK_DATA = false;  // ← Change from true to false
```

### 3.3 Build Frontend
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test build locally
npm run preview
```

### 3.4 Deploy Frontend

#### Option A: Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### Option B: Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

#### Option C: Your VPS
```bash
# Upload build to VPS
scp -r dist/* user@your-vps-ip:/var/www/worker-marketplace/

# Configure Nginx for frontend
sudo nano /etc/nginx/sites-available/worker-frontend
```

**Frontend Nginx config**:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/worker-marketplace;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/worker-frontend /etc/nginx/sites-enabled/

# Get SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🧪 Phase 4: Testing

### 4.1 Test Backend API
```bash
# Test login endpoint
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test get categories
curl https://api.yourdomain.com/api/categories

# Test nearby sellers
curl "https://api.yourdomain.com/api/sellers/nearby?latitude=40.7128&longitude=-74.0060&radius=10"
```

### 4.2 Test Frontend Integration
Open your browser console and run:
```javascript
// Run integration tests
testIntegration()
```

### 4.3 Manual Testing Checklist
- [ ] User can register new account
- [ ] User can login
- [ ] JWT token persists after refresh
- [ ] Worker search returns results
- [ ] Filters work correctly
- [ ] Can view worker profile
- [ ] Can create booking
- [ ] Bookings appear in dashboard
- [ ] Seller can view job requests
- [ ] Seller can accept/reject jobs
- [ ] Messages load correctly
- [ ] Can send and receive messages
- [ ] Profile displays correctly
- [ ] Logout works

---

## 🔒 Phase 5: Security Hardening

### 5.1 Database Security
```sql
-- Remove root remote access
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');

-- Secure worker_app user
ALTER USER 'worker_app'@'localhost' IDENTIFIED BY 'STRONG_RANDOM_PASSWORD';

-- Flush privileges
FLUSH PRIVILEGES;
```

### 5.2 Server Firewall
```bash
# Install UFW
sudo apt install ufw -y

# Allow SSH
sudo ufw allow 22

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 5.3 Backend Security
```bash
# Install helmet for Express security
npm install helmet

# Add to server.js
# const helmet = require('helmet');
# app.use(helmet());
```

### 5.4 Environment Variables
```bash
# Never commit .env file
echo ".env" >> .gitignore

# Use strong secrets
# Generate random JWT secret:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📊 Phase 6: Monitoring & Maintenance

### 6.1 Setup Monitoring
```bash
# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Monitor logs
pm2 logs worker-api --lines 100
```

### 6.2 Database Backups
```bash
# Create backup script
cat > ~/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/user/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
mysqldump -u worker_app -p'YOUR_PASSWORD' worker_marketplace > $BACKUP_DIR/backup_$DATE.sql
# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF

# Make executable
chmod +x ~/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/user/backup-db.sh
```

### 6.3 Update Strategy
```bash
# Backend updates
cd ~/worker-marketplace-api
git pull  # if using git
npm install
pm2 restart worker-api

# Database migrations
mysql -u worker_app -p worker_marketplace < migration.sql
```

---

## 🎯 Phase 7: Performance Optimization

### 7.1 Database Optimization
```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_seller_location ON seller_profiles(latitude, longitude);
CREATE INDEX idx_booking_status ON bookings(status);
CREATE INDEX idx_message_conversation ON messages(conversation_id, created_at);

-- Analyze query performance
EXPLAIN SELECT * FROM seller_profiles WHERE verified = 1;
```

### 7.2 Backend Optimization
```javascript
// Add Redis caching (optional)
// npm install redis
// const redis = require('redis');
// const client = redis.createClient();

// Enable compression
// npm install compression
// const compression = require('compression');
// app.use(compression());
```

### 7.3 Frontend Optimization
```bash
# Analyze bundle size
npm run build -- --analyze

# Add lazy loading for routes
# Implement code splitting
# Optimize images
```

---

## 📋 Final Checklist

### Pre-Launch
- [ ] All tests passing
- [ ] SSL certificates installed
- [ ] CORS configured correctly
- [ ] Environment variables secured
- [ ] Database backed up
- [ ] PM2 running and monitoring
- [ ] Nginx configured
- [ ] Firewall enabled
- [ ] Error logging setup
- [ ] Performance tested

### Launch Day
- [ ] Deploy frontend
- [ ] Deploy backend
- [ ] Update DNS records
- [ ] Test all user flows
- [ ] Monitor error logs
- [ ] Check server resources
- [ ] Verify SSL working
- [ ] Test mobile responsiveness

### Post-Launch
- [ ] Monitor uptime
- [ ] Check error rates
- [ ] Review performance metrics
- [ ] Collect user feedback
- [ ] Plan updates
- [ ] Schedule maintenance

---

## 🆘 Troubleshooting Guide

### Issue: CORS Errors
**Solution**:
```javascript
// In server.js, update CORS config
app.use(cors({
  origin: ['https://yourdomain.com', 'http://localhost:3000'],
  credentials: true
}));
```

### Issue: Database Connection Failed
**Solution**:
```bash
# Check MySQL is running
sudo systemctl status mysql

# Check connection
mysql -u worker_app -p worker_marketplace

# Check .env file has correct credentials
cat .env
```

### Issue: PM2 App Not Starting
**Solution**:
```bash
# Check logs
pm2 logs worker-api --lines 50

# Restart with fresh logs
pm2 delete worker-api
pm2 start server.js --name worker-api

# Check port availability
sudo netstat -tulpn | grep 3001
```

### Issue: Frontend Can't Reach Backend
**Solution**:
```bash
# Test backend directly
curl https://api.yourdomain.com/api/categories

# Check Nginx config
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Check firewall
sudo ufw status
```

---

## 📞 Support Resources

- **Database Schema**: `/database/schema.sql`
- **Sample Backend**: `/database/sample-backend.js`
- **API Documentation**: `/database/README.md`
- **Integration Guide**: `/database/FRONTEND_BACKEND_INTEGRATION.md`
- **Connection Status**: `/database/DATABASE_CONNECTION_STATUS.md`

---

## 🎉 Success Criteria

Your deployment is successful when:
- ✅ Users can register and login
- ✅ Workers appear on map with real data
- ✅ Bookings create database records
- ✅ Messages persist across sessions
- ✅ SSL certificate is valid
- ✅ No CORS errors in console
- ✅ All API calls return data
- ✅ App works on mobile devices
- ✅ Server uptime is 99%+
- ✅ Database backups are automated

---

**Good luck with your deployment! 🚀**

For issues or questions, review the troubleshooting guide or check the other documentation files in `/database/`.
