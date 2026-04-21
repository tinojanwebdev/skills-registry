// Sample Node.js + Express + MySQL Backend
// This is a starter backend API for your VPS
// Install: npm install express mysql2 bcrypt jsonwebtoken cors dotenv body-parser

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});
const upload = multer({ storage });
const toPublicUrl = (req, filename) => `${req.protocol}://${req.get('host')}/uploads/${filename}`;

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

let hasEnsuredSellerRadiusColumn = false;
const ensureSellerRadiusColumn = async () => {
  if (hasEnsuredSellerRadiusColumn) return;
  const [columns] = await pool.execute(
    `SHOW COLUMNS FROM seller_profiles LIKE 'service_radius_km'`
  );
  if (Array.isArray(columns) && columns.length === 0) {
    await pool.execute(
      `ALTER TABLE seller_profiles
       ADD COLUMN service_radius_km DECIMAL(6,2) DEFAULT 10`
    );
  }
  hasEnsuredSellerRadiusColumn = true;
};

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

const getRequestedId = (req) => Number.parseInt(req.params.id, 10);

const requireSelfUserId = (req, res) => {
  const requestedUserId = getRequestedId(req);
  const authenticatedUserId = Number.parseInt(String(req.user.id), 10);
  if (!Number.isInteger(requestedUserId)) {
    res.status(400).json({ error: 'Invalid user id' });
    return null;
  }
  if (requestedUserId !== authenticatedUserId) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }
  return requestedUserId;
};

const assertSellerOwnership = async (sellerId, userId) => {
  const [rows] = await pool.execute(
    'SELECT id FROM seller_profiles WHERE id = ? AND user_id = ? LIMIT 1',
    [sellerId, userId]
  );
  return rows.length > 0;
};

const assertBookingOwnership = async (bookingId, userId) => {
  const [rows] = await pool.execute(
    `SELECT b.id
     FROM bookings b
     JOIN seller_profiles sp ON sp.id = b.seller_id
     WHERE b.id = ? AND (b.buyer_id = ? OR sp.user_id = ?)
     LIMIT 1`,
    [bookingId, userId, userId]
  );
  return rows.length > 0;
};

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, full_name, phone, role } = req.body;
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    
    // Insert user
    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, ?)',
      [email, password_hash, full_name, phone ?? null, role || 'buyer']
    );
    
    // Generate token
    const token = jwt.sign({ id: result.insertId, email, role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      user: {
        id: result.insertId,
        email,
        full_name,
        phone,
        role: role || 'buyer'
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email is already registered. Please sign in instead.' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Remove password from response
    delete user.password_hash;
    
    res.json({ user, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ==================== USER ROUTES ====================

app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const userId = requireSelfUserId(req, res);
    if (userId === null) return;

    const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = users[0];
    delete user.password_hash;
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const userId = requireSelfUserId(req, res);
    if (userId === null) return;

    const updates = req.body;
    const fields = [];
    const values = [];
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    values.push(userId);
    await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.post('/api/users/:id/profile-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const userId = requireSelfUserId(req, res);
    if (userId === null) return;

    if (!req.file) {
      return res.status(400).json({ error: 'Image file required' });
    }
    const fileUrl = toPublicUrl(req, req.file.filename);
    await pool.execute('UPDATE users SET profile_image = ? WHERE id = ?', [fileUrl, userId]);
    res.json({ profile_image: fileUrl });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ error: 'Failed to upload profile image' });
  }
});

// ==================== SELLER ROUTES ====================

// Create seller profile
app.post('/api/sellers', authenticateToken, async (req, res) => {
  try {
    await ensureSellerRadiusColumn();
    const {
      business_name,
      bio,
      hourly_rate,
      skill_level,
      years_experience,
      latitude,
      longitude,
      service_radius_km,
      address,
      city,
      state,
      postal_code,
      availability_status,
      categories = [],
      languages = [],
      service_title,
      service_description
    } = req.body;

    const [existing] = await pool.execute(
      'SELECT * FROM seller_profiles WHERE user_id = ?',
      [req.user.id]
    );
    if (existing.length > 0) {
      return res.json(existing[0]);
    }

    const [result] = await pool.execute(
      `INSERT INTO seller_profiles 
       (user_id, business_name, bio, hourly_rate, skill_level, years_experience, 
        latitude, longitude, service_radius_km, address, city, state, postal_code, availability_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        req.user.id,
        business_name || null,
        bio || null,
        hourly_rate || null,
        skill_level || 'Intermediate',
        years_experience || null,
        latitude || null,
        longitude || null,
        service_radius_km || 10,
        address || null,
        city || null,
        state || null,
        postal_code || null,
        availability_status || 'available'
      ]
    );

    const sellerId = result.insertId;

    // Ensure categories exist and add services
    for (const name of categories) {
      const [catResult] = await pool.execute(
        'INSERT INTO categories (name) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)',
        [name]
      );
      const categoryId = catResult.insertId;
      await pool.execute(
        `INSERT INTO seller_services (seller_id, category_id, service_title, service_description, base_price)
         VALUES (?, ?, ?, ?, ?)`,
        [
          sellerId,
          categoryId,
          service_title || business_name || 'Service',
          service_description || bio || null,
          hourly_rate || null
        ]
      );
    }

    // Add languages
    for (const language of languages) {
      await pool.execute(
        'INSERT INTO seller_languages (seller_id, language) VALUES (?, ?)',
        [sellerId, language]
      );
    }

    const [profiles] = await pool.execute('SELECT * FROM seller_profiles WHERE id = ?', [sellerId]);
    res.json(profiles[0]);
  } catch (error) {
    console.error('Error creating seller profile:', error);
    res.status(500).json({ error: 'Failed to create seller profile' });
  }
});

// Get seller profile by user id
app.get('/api/sellers/by-user/:id', authenticateToken, async (req, res) => {
  try {
    const userId = requireSelfUserId(req, res);
    if (userId === null) return;

    const [profiles] = await pool.execute(
      'SELECT * FROM seller_profiles WHERE user_id = ?',
      [userId]
    );
    if (profiles.length === 0) {
      return res.status(404).json({ error: 'Seller profile not found' });
    }
    res.json(profiles[0]);
  } catch (error) {
    console.error('Error fetching seller profile:', error);
    res.status(500).json({ error: 'Failed to fetch seller profile' });
  }
});

// Get all sellers
app.get('/api/sellers', async (_req, res) => {
  try {
    const query = `
      SELECT 
        sp.*,
        u.full_name,
        u.email,
        u.profile_image,
        u.phone,
        GROUP_CONCAT(DISTINCT c.name) as categories
      FROM seller_profiles sp
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN seller_services ss ON sp.id = ss.seller_id
      LEFT JOIN categories c ON ss.category_id = c.id
      GROUP BY sp.id
      ORDER BY sp.created_at DESC
    `;

    const [sellers] = await pool.execute(query);
    res.json(sellers);
  } catch (error) {
    console.error('Error fetching all sellers:', error);
    res.status(500).json({ error: 'Failed to fetch sellers' });
  }
});

// Get nearby sellers
app.get('/api/sellers/nearby', async (req, res) => {
  try {
    await ensureSellerRadiusColumn();
    const { latitude, longitude, radius = 10, category, rating, skillLevel } = req.query;
    
    let query = `
      SELECT 
        sp.*,
        u.full_name,
        u.email,
        u.profile_image,
        u.phone,
        GROUP_CONCAT(DISTINCT c.name) as categories,
        (6371 * acos(cos(radians(?)) 
          * cos(radians(sp.latitude)) 
          * cos(radians(sp.longitude) - radians(?)) 
          + sin(radians(?)) 
          * sin(radians(sp.latitude)))) AS distance
      FROM seller_profiles sp
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN seller_services ss ON sp.id = ss.seller_id
      LEFT JOIN categories c ON ss.category_id = c.id
      WHERE sp.latitude IS NOT NULL 
        AND sp.longitude IS NOT NULL
    `;
    
    const params = [latitude, longitude, latitude];
    
    if (category) {
      query += ' AND c.name = ?';
      params.push(category);
    }
    
    if (skillLevel) {
      query += ' AND sp.skill_level = ?';
      params.push(skillLevel);
    }
    
    query += ' GROUP BY sp.id HAVING distance < ? AND distance <= COALESCE(sp.service_radius_km, 10)';
    params.push(radius);
    
    if (rating) {
      query += ' AND sp.rating >= ?';
      params.push(rating);
    }
    
    query += ' ORDER BY distance ASC, sp.rating DESC LIMIT 50';
    
    const [sellers] = await pool.execute(query, params);
    
    res.json(sellers);
  } catch (error) {
    console.error('Error fetching sellers:', error);
    res.status(500).json({ error: 'Failed to fetch sellers' });
  }
});

// Get seller by ID
app.get('/api/sellers/:id', async (req, res) => {
  try {
    const [sellers] = await pool.execute(
      `SELECT 
        sp.*,
        u.full_name,
        u.email,
        u.profile_image,
        u.phone
      FROM seller_profiles sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.id = ?`,
      [req.params.id]
    );
    
    if (sellers.length === 0) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    
    // Get services
    const [services] = await pool.execute(
      `SELECT ss.*, c.name as category_name
       FROM seller_services ss
       JOIN categories c ON ss.category_id = c.id
       WHERE ss.seller_id = ?`,
      [req.params.id]
    );
    
    // Get portfolio
    const [portfolio] = await pool.execute(
      'SELECT * FROM seller_portfolio WHERE seller_id = ?',
      [req.params.id]
    );
    
    // Get languages
    const [languages] = await pool.execute(
      'SELECT language FROM seller_languages WHERE seller_id = ?',
      [req.params.id]
    );

    // Get certifications
    const [certifications] = await pool.execute(
      'SELECT * FROM seller_certifications WHERE seller_id = ?',
      [req.params.id]
    );
    
    const seller = {
      ...sellers[0],
      services,
      portfolio,
      languages: languages.map(l => l.language),
      certifications
    };
    
    res.json(seller);
  } catch (error) {
    console.error('Error fetching seller:', error);
    res.status(500).json({ error: 'Failed to fetch seller' });
  }
});

// Get seller services
app.get('/api/sellers/:id/services', async (req, res) => {
  try {
    const [services] = await pool.execute(
      `SELECT ss.*, c.name as category_name
       FROM seller_services ss
       JOIN categories c ON ss.category_id = c.id
       WHERE ss.seller_id = ?`,
      [req.params.id]
    );
    res.json(services);
  } catch (error) {
    console.error('Error fetching seller services:', error);
    res.status(500).json({ error: 'Failed to fetch seller services' });
  }
});

// Update seller profile
app.put('/api/sellers/:id', authenticateToken, async (req, res) => {
  try {
    await ensureSellerRadiusColumn();
    const sellerId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(sellerId)) {
      return res.status(400).json({ error: 'Invalid seller id' });
    }

    const isOwner = await assertSellerOwnership(sellerId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updates = req.body;
    const fields = [];
    const values = [];
    
    // Build dynamic update query
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    values.push(sellerId);
    
    await pool.execute(
      `UPDATE seller_profiles SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating seller:', error);
    res.status(500).json({ error: 'Failed to update seller' });
  }
});

// Get seller reviews
app.get('/api/sellers/:id/reviews', async (req, res) => {
  try {
    const [reviews] = await pool.execute(
      `SELECT r.*, u.full_name as reviewer_name, u.profile_image as reviewer_image
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.reviewee_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching seller reviews:', error);
    res.status(500).json({ error: 'Failed to fetch seller reviews' });
  }
});

// Get seller portfolio
app.get('/api/sellers/:id/portfolio', async (req, res) => {
  try {
    const [portfolio] = await pool.execute(
      'SELECT * FROM seller_portfolio WHERE seller_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(portfolio);
  } catch (error) {
    console.error('Error fetching seller portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch seller portfolio' });
  }
});

// Add seller portfolio item (image upload)
app.post('/api/sellers/:id/portfolio', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file required' });
    }
    const { title, description } = req.body;
    const imageUrl = toPublicUrl(req, req.file.filename);
    const [result] = await pool.execute(
      'INSERT INTO seller_portfolio (seller_id, title, description, image_url) VALUES (?, ?, ?, ?)',
      [req.params.id, title || null, description || null, imageUrl]
    );
    res.json({ id: result.insertId, image_url: imageUrl });
  } catch (error) {
    console.error('Error adding portfolio:', error);
    res.status(500).json({ error: 'Failed to add portfolio' });
  }
});

// Get seller certifications
app.get('/api/sellers/:id/certifications', async (req, res) => {
  try {
    const [certs] = await pool.execute(
      'SELECT * FROM seller_certifications WHERE seller_id = ? ORDER BY issue_date DESC',
      [req.params.id]
    );
    res.json(certs);
  } catch (error) {
    console.error('Error fetching certifications:', error);
    res.status(500).json({ error: 'Failed to fetch certifications' });
  }
});

// Add seller certifications (file upload)
app.post('/api/sellers/:id/certifications', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Certification files required' });
    }
    const created = [];
    for (const file of req.files) {
      const fileUrl = toPublicUrl(req, file.filename);
      const title = path.basename(file.originalname, path.extname(file.originalname));
      const [result] = await pool.execute(
        'INSERT INTO seller_certifications (seller_id, title, file_url) VALUES (?, ?, ?)',
        [req.params.id, title, fileUrl]
      );
      created.push({ id: result.insertId, title, file_url: fileUrl });
    }
    res.json(created);
  } catch (error) {
    console.error('Error adding certifications:', error);
    res.status(500).json({ error: 'Failed to add certifications' });
  }
});

// ==================== BOOKING ROUTES ====================

// Create booking
app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const {
      seller_id,
      category_id,
      title,
      description,
      scheduled_date,
      scheduled_time,
      location_address,
      estimated_hours,
      hourly_rate
    } = req.body;
    
    const total_amount = estimated_hours * hourly_rate;
    
    const [result] = await pool.execute(
      `INSERT INTO bookings 
       (buyer_id, seller_id, category_id, title, description, scheduled_date, 
        scheduled_time, location_address, estimated_hours, hourly_rate, total_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        seller_id,
        category_id,
        title,
        description,
        scheduled_date,
        scheduled_time,
        location_address,
        estimated_hours,
        hourly_rate,
        total_amount
      ]
    );
    
    res.json({ id: result.insertId, message: 'Booking created successfully' });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get buyer bookings
app.get('/api/bookings/buyer/:id', authenticateToken, async (req, res) => {
  try {
    const buyerId = requireSelfUserId(req, res);
    if (buyerId === null) return;

    const [bookings] = await pool.execute(
      `SELECT 
        b.*,
        sp.business_name,
        u.full_name as seller_name,
        u.profile_image as seller_image,
        c.name as category_name
      FROM bookings b
      JOIN seller_profiles sp ON b.seller_id = sp.id
      JOIN users u ON sp.user_id = u.id
      JOIN categories c ON b.category_id = c.id
      WHERE b.buyer_id = ?
      ORDER BY b.created_at DESC`,
      [buyerId]
    );
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get seller bookings
app.get('/api/bookings/seller/:id', authenticateToken, async (req, res) => {
  try {
    const sellerId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(sellerId)) {
      return res.status(400).json({ error: 'Invalid seller id' });
    }

    const isOwner = await assertSellerOwnership(sellerId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const [bookings] = await pool.execute(
      `SELECT 
        b.*,
        u.full_name as buyer_name,
        u.profile_image as buyer_image,
        u.phone as buyer_phone,
        c.name as category_name,
        r.id as review_id,
        r.rating as review_rating,
        r.comment as review_comment,
        r.created_at as review_created_at
      FROM bookings b
      JOIN users u ON b.buyer_id = u.id
      JOIN categories c ON b.category_id = c.id
      LEFT JOIN reviews r ON r.booking_id = b.id
      WHERE b.seller_id = ?
      ORDER BY b.created_at DESC`,
      [sellerId]
    );
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Update booking status
app.patch('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const bookingId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking id' });
    }

    const canUpdate = await assertBookingOwnership(bookingId, req.user.id);
    if (!canUpdate) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { status } = req.body;
    
    await pool.execute(
      'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, bookingId]
    );
    
    res.json({ message: 'Booking updated successfully' });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// ==================== CATEGORY ROUTES ====================

app.get('/api/categories', async (req, res) => {
  try {
    const [categories] = await pool.execute('SELECT * FROM categories');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ==================== REVIEW ROUTES ====================

app.post('/api/reviews', authenticateToken, async (req, res) => {
  try {
    const { booking_id, reviewee_id, rating, comment } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [booking_id, req.user.id, reviewee_id, rating, comment]
    );
    
    // Update seller rating
    await pool.execute(
      `UPDATE seller_profiles 
       SET rating = (SELECT AVG(rating) FROM reviews WHERE reviewee_id = ?),
           total_reviews = (SELECT COUNT(*) FROM reviews WHERE reviewee_id = ?)
       WHERE user_id = ?`,
      [reviewee_id, reviewee_id, reviewee_id]
    );
    
    res.json({ id: result.insertId, message: 'Review created successfully' });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// ==================== POSTS ROUTES ====================

app.get('/api/posts', authenticateToken, async (req, res) => {
  try {
    const sellerId = parseInt(req.query.sellerId);
    if (!sellerId) return res.status(400).json({ error: 'sellerId required' });
    const [posts] = await pool.execute(
      'SELECT * FROM seller_posts WHERE seller_id = ? ORDER BY created_at DESC',
      [sellerId]
    );
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

app.post('/api/posts', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { seller_id, title, description, type, visibility_radius, expiry_days } = req.body;
    if (!seller_id || !title) {
      return res.status(400).json({ error: 'seller_id and title required' });
    }
    const imageUrl = req.file ? toPublicUrl(req, req.file.filename) : null;
    const days = parseInt(expiry_days || '7');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (isNaN(days) ? 7 : days));

    const [result] = await pool.execute(
      `INSERT INTO seller_posts 
       (seller_id, title, description, type, visibility_radius, expires_at, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        seller_id,
        title,
        description || null,
        type || 'promotion',
        visibility_radius ? parseInt(visibility_radius) : 10,
        expiresAt,
        imageUrl
      ]
    );
    const [rows] = await pool.execute('SELECT * FROM seller_posts WHERE id = ?', [result.insertId]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  try {
    await pool.execute('DELETE FROM seller_posts WHERE id = ?', [req.params.id]);
    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Get seller reviews (alias for API_CONFIG)
app.get('/api/reviews/:id', async (req, res) => {
  try {
    const [reviews] = await pool.execute(
      `SELECT r.*, u.full_name as reviewer_name, u.profile_image as reviewer_image
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.reviewee_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// ==================== CONVERSATION & MESSAGE ROUTES ====================

app.post('/api/conversations', authenticateToken, async (req, res) => {
  try {
    const authUserId = Number.parseInt(String(req.user.id), 10);
    const authRole = String(req.user.role || '');
    const otherUserId = Number.parseInt(String(req.body.other_user_id), 10);
    const bookingId = req.body.booking_id ?? null;

    if (!Number.isInteger(otherUserId)) {
      return res.status(400).json({ error: 'other_user_id is required' });
    }
    if (otherUserId === authUserId) {
      return res.status(400).json({ error: 'Cannot create conversation with yourself' });
    }

    let buyerId;
    let sellerId;

    if (authRole === 'seller') {
      buyerId = otherUserId;
      sellerId = authUserId;
    } else {
      buyerId = authUserId;
      sellerId = otherUserId;
    }

    const [existing] = await pool.execute(
      `SELECT * FROM conversations
       WHERE buyer_id = ? AND seller_id = ?
       ORDER BY id DESC
       LIMIT 1`,
      [buyerId, sellerId]
    );

    if (existing.length > 0) {
      return res.json(existing[0]);
    }

    const [result] = await pool.execute(
      `INSERT INTO conversations (buyer_id, seller_id, booking_id, last_message_at)
       VALUES (?, ?, ?, NOW())`,
      [buyerId, sellerId, bookingId]
    );
    const [rows] = await pool.execute('SELECT * FROM conversations WHERE id = ?', [result.insertId]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

app.get('/api/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.query.userId || req.user.id);
    const [rows] = await pool.execute(
      `SELECT 
         c.*,
         bu.id as buyer_user_id,
         bu.full_name as buyer_name,
         bu.profile_image as buyer_image,
         su.id as seller_user_id,
         su.full_name as seller_name,
         su.profile_image as seller_image,
         lm.id as last_message_id,
         lm.message_text as last_message_text,
         lm.sender_id as last_message_sender_id,
         lm.created_at as last_message_created_at,
         (SELECT COUNT(*) FROM messages m2 
          WHERE m2.conversation_id = c.id AND m2.sender_id <> ? AND m2.is_read = 0) as unread_count
       FROM conversations c
       JOIN users bu ON c.buyer_id = bu.id
       JOIN users su ON c.seller_id = su.id
       LEFT JOIN messages lm ON lm.id = (
         SELECT id FROM messages m 
         WHERE m.conversation_id = c.id 
         ORDER BY m.created_at DESC LIMIT 1
       )
       WHERE c.buyer_id = ? OR c.seller_id = ?
       ORDER BY c.last_message_at DESC`,
      [userId, userId, userId]
    );

    const conversations = rows.map(r => ({
      id: r.id,
      buyer_id: r.buyer_id,
      seller_id: r.seller_id,
      booking_id: r.booking_id,
      last_message_at: r.last_message_at,
      created_at: r.created_at,
      buyer: {
        id: r.buyer_user_id,
        full_name: r.buyer_name,
        profile_image: r.buyer_image
      },
      seller: {
        id: r.seller_user_id,
        full_name: r.seller_name,
        profile_image: r.seller_image
      },
      last_message: r.last_message_id
        ? {
            id: r.last_message_id,
            conversation_id: r.id,
            sender_id: r.last_message_sender_id,
            message_text: r.last_message_text,
            created_at: r.last_message_created_at
          }
        : null,
      unread_count: r.unread_count || 0
    }));

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

app.get('/api/messages/:conversationId', authenticateToken, async (req, res) => {
  try {
    const [messages] = await pool.execute(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [req.params.conversationId]
    );
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { conversation_id, message_text, message_type = 'text', attachment_url } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO messages (conversation_id, sender_id, message_text, message_type, attachment_url)
       VALUES (?, ?, ?, ?, ?)`,
      [conversation_id, req.user.id, message_text, message_type, attachment_url || null]
    );
    await pool.execute(
      'UPDATE conversations SET last_message_at = NOW() WHERE id = ?',
      [conversation_id]
    );
    const [rows] = await pool.execute('SELECT * FROM messages WHERE id = ?', [result.insertId]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ==================== FAVORITES ROUTES ====================

app.get('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const buyerId = parseInt(req.query.buyerId || req.user.id);
    const [favorites] = await pool.execute(
      `SELECT f.*, sp.business_name, u.full_name, u.profile_image
       FROM favorites f
       JOIN seller_profiles sp ON f.seller_id = sp.id
       JOIN users u ON sp.user_id = u.id
       WHERE f.buyer_id = ?
       ORDER BY f.created_at DESC`,
      [buyerId]
    );
    res.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

app.post('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const { seller_id } = req.body;
    const [result] = await pool.execute(
      'INSERT IGNORE INTO favorites (buyer_id, seller_id) VALUES (?, ?)',
      [req.user.id, seller_id]
    );
    res.json({ id: result.insertId, message: 'Favorite added' });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

app.delete('/api/favorites/:id', authenticateToken, async (req, res) => {
  try {
    await pool.execute('DELETE FROM favorites WHERE id = ?', [req.params.id]);
    res.json({ message: 'Favorite removed' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

// ==================== NOTIFICATION ROUTES ====================

app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.query.userId || req.user.id);
    const [notifications] = await pool.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.patch('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    await pool.execute('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Worker Marketplace API running on port ${PORT}`);
});

module.exports = app;
