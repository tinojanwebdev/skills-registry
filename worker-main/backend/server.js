import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import multer from 'multer';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import pool from './db.js';
import { auth, adminOnly } from './middleware.js';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files allowed'));
}});

const signToken = (user) =>
  jwt.sign({ id: user.id, type: user.type }, process.env.JWT_SECRET, { expiresIn: '7d' });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── AUTH ────────────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, type } = req.body;
    // Check if same email+type already exists
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ? AND type = ?', [email, type]);
    if (existing.length) return res.status(409).json({ error: 'You already have an account as this type. Please login instead.' });
    // If email exists with different type, reuse their password hash
    let hash;
    const [otherAccount] = await pool.execute('SELECT password_hash, name FROM users WHERE email = ?', [email]);
    if (otherAccount.length) {
      hash = otherAccount[0].password_hash;
    } else {
      hash = await bcrypt.hash(password, 10);
    }
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, type) VALUES (?, ?, ?, ?)',
      [name, email, hash, type]
    );
    const user = { id: result.insertId, name, email, type };
    await pool.execute('INSERT INTO notification_settings (user_id) VALUES (?)', [result.insertId]);
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, type } = req.body;
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? AND type = ?', [email, type]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const { password_hash, ...safeUser } = user;
    res.json({ token: signToken(user), user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Google Sign-In
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture } = payload;

    // Check if user exists as seeker
    const [existing] = await pool.execute('SELECT * FROM users WHERE email = ? AND type = "seeker"', [email]);
    if (existing.length) {
      // Login existing user
      const user = existing[0];
      // Update google_id and profile_image if not set
      if (!user.google_id) {
        await pool.execute('UPDATE users SET google_id = ?, profile_image = ? WHERE id = ?', [googleId, picture || null, user.id]);
      }
      const { password_hash, ...safeUser } = user;
      return res.json({ token: signToken(user), user: safeUser });
    }

    // Create new seeker account
    const randomPass = crypto.randomBytes(16).toString('hex');
    const hash = await bcrypt.hash(randomPass, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, type, google_id, profile_image) VALUES (?,?,?,?,?,?)',
      [name, email, hash, 'seeker', googleId, picture || null]
    );
    await pool.execute('INSERT INTO notification_settings (user_id) VALUES (?)', [result.insertId]);
    const user = { id: result.insertId, name, email, type: 'seeker' };
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    res.status(401).json({ error: 'Google authentication failed' });
  }
});

// ─── FORGOT / RESET PASSWORD ─────────────────────────────────────────────────

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const [users] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (!users.length) return res.status(404).json({ error: 'No account found with this email' });
    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await pool.execute('INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)', [email, otp, expiresAt]);
    // Send email
    await transporter.sendMail({
      from: `"Worker App" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your OTP Code - Worker',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">
          <h2 style="color:#4f46e5">Password Reset OTP</h2>
          <p>You requested a password reset for your Worker account.</p>
          <p>Your OTP code is:</p>
          <div style="background:#f3f4f6;padding:20px;border-radius:12px;text-align:center;margin:16px 0">
            <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#4f46e5">${otp}</span>
          </div>
          <p style="color:#666;font-size:13px">This code expires in <strong>10 minutes</strong>.</p>
          <p style="color:#999;font-size:12px">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const [rows] = await pool.execute(
      'SELECT * FROM password_resets WHERE email = ? AND token = ? AND used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );
    if (!rows.length) return res.status(400).json({ error: 'Invalid or expired OTP' });
    res.json({ valid: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    const [rows] = await pool.execute(
      'SELECT * FROM password_resets WHERE email = ? AND token = ? AND used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );
    if (!rows.length) return res.status(400).json({ error: 'Invalid or expired OTP' });
    const hash = await bcrypt.hash(password, 10);
    await pool.execute('UPDATE users SET password_hash = ? WHERE email = ?', [hash, email]);
    await pool.execute('UPDATE password_resets SET used = TRUE WHERE id = ?', [rows[0].id]);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── USER PROFILE ────────────────────────────────────────────────────────────

// Check if user has a provider account
app.get('/api/auth/check-provider', auth, async (req, res) => {
  const { email } = req.query;
  const [rows] = await pool.execute('SELECT id FROM users WHERE email = ? AND type = "provider"', [email]);
  res.json({ exists: rows.length > 0 });
});

// Become a provider (create provider account from seeker)
app.post('/api/auth/become-provider', auth, async (req, res) => {
  try {
    const [me] = await pool.execute('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!me.length) return res.status(404).json({ error: 'User not found' });
    const seeker = me[0];
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ? AND type = "provider"', [seeker.email]);
    if (existing.length) return res.status(409).json({ error: 'You already have a seller account' });
    const { business_name, bio, hourly_rate, experience, skill_level, phone, address, city, state, category_ids } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, type, business_name, bio, hourly_rate, experience, skill_level, phone, address, city, state) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [seeker.name, seeker.email, seeker.password_hash, 'provider', business_name, bio, hourly_rate, experience, skill_level, phone || seeker.phone, address, city, state]
    );
    const providerId = result.insertId;
    await pool.execute('INSERT INTO notification_settings (user_id) VALUES (?)', [providerId]);
    // Save selected categories
    if (category_ids && category_ids.length > 0) {
      for (const catId of category_ids) {
        await pool.execute('INSERT INTO provider_categories (provider_id, category_id) VALUES (?, ?)', [providerId, catId]);
      }
    }
    const user = { id: providerId, name: seeker.name, email: seeker.email, type: 'provider' };
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Switch between seeker/provider accounts
app.post('/api/auth/switch-type', auth, async (req, res) => {
  try {
    const { target_type } = req.body;
    const [me] = await pool.execute('SELECT email FROM users WHERE id = ?', [req.user.id]);
    if (!me.length) return res.status(404).json({ error: 'User not found' });
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? AND type = ?', [me[0].email, target_type]);
    if (!rows.length) return res.status(404).json({ error: `No ${target_type} account found` });
    const user = rows[0];
    const { password_hash, ...safeUser } = user;
    res.json({ token: signToken(user), user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/me', auth, async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  const { password_hash, ...user } = rows[0];
  res.json(user);
});

app.put('/api/users/me', auth, async (req, res) => {
  const fields = ['name','phone','business_name','bio','hourly_rate','experience','skill_level','address','city','state','availability','latitude','longitude','radius','profile_image'];
  const updates = [], values = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); }
  }
  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.user.id);
  await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
  res.json({ message: 'Profile updated' });
});

// Upload profile picture
app.post('/api/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const imageUrl = `/uploads/${req.file.filename}`;
    await pool.execute('UPDATE users SET profile_image = ? WHERE id = ?', [imageUrl, req.user.id]);
    res.json({ profile_image: imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

app.get('/api/categories', async (_req, res) => {
  const [rows] = await pool.execute('SELECT * FROM categories ORDER BY name ASC');
  res.json(rows);
});

// User suggests a new category
app.post('/api/categories/suggest', auth, async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Category name required' });
  // Check if already exists (case-insensitive)
  const [existing] = await pool.execute('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)', [name.trim()]);
  if (existing.length) return res.json({ id: existing[0].id });
  const [result] = await pool.execute('INSERT INTO categories (name, icon) VALUES (?, ?)', [name.trim(), '📌']);
  res.status(201).json({ id: result.insertId });
});

// ─── JOBS ────────────────────────────────────────────────────────────────────

app.post('/api/jobs', auth, async (req, res) => {
  const { title, description, provider_id, category_id, amount, scheduled_date, scheduled_time, location } = req.body;
  const [result] = await pool.execute(
    'INSERT INTO jobs (title, description, seeker_id, provider_id, category_id, amount, scheduled_date, scheduled_time, location) VALUES (?,?,?,?,?,?,?,?,?)',
    [title || null, description || null, req.user.id, provider_id, category_id || null, amount, scheduled_date || null, scheduled_time || null, location || null]
  );
  res.status(201).json({ id: result.insertId });
});

app.get('/api/jobs', auth, async (req, res) => {
  const { status } = req.query;
  const col = req.user.type === 'provider' ? 'provider_id' : 'seeker_id';
  let sql = `SELECT j.*, u.name AS client_name FROM jobs j JOIN users u ON u.id = j.${col === 'provider_id' ? 'seeker_id' : 'provider_id'} WHERE j.${col} = ?`;
  const params = [req.user.id];
  if (status && status !== 'all') { sql += ' AND j.status = ?'; params.push(status); }
  sql += ' ORDER BY j.created_at DESC';
  const [rows] = await pool.execute(sql, params);
  // For seekers, check if provider is busy on each pending job
  if (req.user.type === 'seeker') {
    for (const job of rows) {
      if (job.status === 'pending') {
        const [active] = await pool.execute(
          "SELECT id FROM jobs WHERE provider_id = ? AND status IN ('accepted','in_progress')",
          [job.provider_id]
        );
        job.provider_busy = active.length > 0;
      }
    }
  }
  res.json(rows);
});

// Seeker cancel their own booking
app.patch('/api/jobs/:id/cancel', auth, async (req, res) => {
  try {
    await pool.execute(
      'UPDATE jobs SET status = "cancelled" WHERE id = ? AND seeker_id = ? AND status IN ("pending","accepted")',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/jobs/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  // Only block accepting NEW jobs if provider already has an active one
  if (status === 'accepted') {
    const [active] = await pool.execute(
      "SELECT id FROM jobs WHERE provider_id = ? AND status IN ('accepted','in_progress')",
      [req.user.id]
    );
    if (active.length) return res.status(400).json({ error: 'You already have an active job. Complete it first before accepting another.' });
  }
  await pool.execute('UPDATE jobs SET status = ? WHERE id = ? AND provider_id = ?', [status, req.params.id, req.user.id]);
  if (status === 'completed') {
    const [job] = await pool.execute('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
    if (job.length) {
      await pool.execute('UPDATE users SET jobs_done = jobs_done + 1, earned = earned + ? WHERE id = ?', [job[0].amount, req.user.id]);
    }
  }
  res.json({ message: 'Status updated' });
});

// ─── PROVIDERS SEARCH (for seekers) ─────────────────────────────────────────

app.get('/api/providers', async (req, res) => {
  const { category, distance, skill_level, min_rating, lat, lng } = req.query;
  let sql, params = [];

  if (lat && lng) {
    sql = `SELECT u.id, u.name, u.business_name, u.rating, u.hourly_rate, u.skill_level, u.availability, u.latitude, u.longitude, u.profile_image,
      (SELECT COUNT(*) FROM reviews WHERE reviewee_id = u.id) AS review_count,
      (SELECT GROUP_CONCAT(c.name SEPARATOR ', ') FROM provider_categories pc JOIN categories c ON c.id = pc.category_id WHERE pc.provider_id = u.id) AS category,
      CASE WHEN u.latitude IS NOT NULL AND u.longitude IS NOT NULL THEN
        (6371 * acos(cos(radians(?)) * cos(radians(u.latitude)) * cos(radians(u.longitude) - radians(?)) + sin(radians(?)) * sin(radians(u.latitude))))
      ELSE NULL END AS distance
      FROM users u WHERE u.type = 'provider'`;
    params.push(lat, lng, lat);
  } else {
    sql = `SELECT u.id, u.name, u.business_name, u.rating, u.hourly_rate, u.skill_level, u.availability, u.latitude, u.longitude, u.profile_image,
      (SELECT COUNT(*) FROM reviews WHERE reviewee_id = u.id) AS review_count,
      (SELECT GROUP_CONCAT(c.name SEPARATOR ', ') FROM provider_categories pc JOIN categories c ON c.id = pc.category_id WHERE pc.provider_id = u.id) AS category
      FROM users u WHERE u.type = 'provider'`;
  }

  if (category) {
    sql += ' AND u.id IN (SELECT pc.provider_id FROM provider_categories pc JOIN categories c ON c.id = pc.category_id WHERE c.name = ?)';
    params.push(category);
  }

  if (skill_level) { sql += ' AND u.skill_level = ?'; params.push(skill_level); }
  if (min_rating) { sql += ' AND u.rating >= ?'; params.push(min_rating); }

  if (lat && lng && distance) {
    sql += ` HAVING distance <= ? OR distance IS NULL`;
    params.push(distance);
    sql += ' ORDER BY distance IS NULL, distance ASC';
  } else {
    sql += ' ORDER BY u.rating DESC';
  }

  const [rows] = await pool.execute(sql, params);
  res.json(rows);
});

// ─── CONVERSATIONS & MESSAGES ────────────────────────────────────────────────

app.get('/api/conversations', auth, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT c.*, 
      CASE WHEN c.user1_id = ? THEN u2.name ELSE u1.name END AS other_name,
      CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END AS other_id,
      (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
      (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
      (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = FALSE) AS unread
    FROM conversations c
    JOIN users u1 ON u1.id = c.user1_id
    JOIN users u2 ON u2.id = c.user2_id
    WHERE c.user1_id = ? OR c.user2_id = ?
    ORDER BY last_message_at DESC`,
    [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]
  );
  res.json(rows);
});

app.get('/api/conversations/:id/messages', auth, async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT m.*, u.name AS sender_name FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.conversation_id = ? ORDER BY m.created_at ASC',
    [req.params.id]
  );
  await pool.execute(
    'UPDATE messages SET is_read = TRUE WHERE conversation_id = ? AND sender_id != ?',
    [req.params.id, req.user.id]
  );
  res.json(rows);
});

app.post('/api/conversations/:id/messages', auth, async (req, res) => {
  const { content } = req.body;
  const [result] = await pool.execute(
    'INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)',
    [req.params.id, req.user.id, content]
  );
  await pool.execute('UPDATE conversations SET updated_at = NOW() WHERE id = ?', [req.params.id]);
  res.status(201).json({ id: result.insertId });
});

app.post('/api/conversations', auth, async (req, res) => {
  const { other_user_id } = req.body;
  const [u1, u2] = [Math.min(req.user.id, other_user_id), Math.max(req.user.id, other_user_id)];
  const [existing] = await pool.execute(
    'SELECT * FROM conversations WHERE user1_id = ? AND user2_id = ?', [u1, u2]
  );
  if (existing.length) return res.json(existing[0]);
  const [result] = await pool.execute(
    'INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)', [u1, u2]
  );
  res.status(201).json({ id: result.insertId, user1_id: u1, user2_id: u2 });
});

// ─── REVIEWS ─────────────────────────────────────────────────────────────────

app.get('/api/reviews', auth, async (req, res) => {
  const { for_user } = req.query;
  const userId = for_user || req.user.id;
  const col = req.user.type === 'provider' ? 'reviewee_id' : 'reviewer_id';
  const [rows] = await pool.execute(
    `SELECT r.*, u.name AS reviewer_name FROM reviews r JOIN users u ON u.id = r.reviewer_id WHERE r.${col} = ? ORDER BY r.created_at DESC`,
    [userId]
  );
  res.json(rows);
});

app.post('/api/reviews', auth, async (req, res) => {
  const { reviewee_id, job_id, rating, comment, service } = req.body;
  await pool.execute(
    'INSERT INTO reviews (job_id, reviewer_id, reviewee_id, rating, comment, service) VALUES (?,?,?,?,?,?)',
    [job_id, req.user.id, reviewee_id, rating, comment, service]
  );
  const [avg] = await pool.execute(
    'SELECT AVG(rating) AS avg_rating FROM reviews WHERE reviewee_id = ?', [reviewee_id]
  );
  await pool.execute('UPDATE users SET rating = ? WHERE id = ?', [avg[0].avg_rating, reviewee_id]);
  res.status(201).json({ message: 'Review submitted' });
});

// ─── PROMOTIONS ──────────────────────────────────────────────────────────────

app.get('/api/promotions', auth, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT p.*, u.name AS provider_name, u.profile_image AS provider_image
     FROM promotions p JOIN users u ON u.id = p.provider_id
     WHERE p.provider_id = ? ORDER BY p.created_at DESC`, [req.user.id]
  );
  res.json(rows);
});

app.post('/api/promotions', auth, upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, price } = req.body;
    const images = req.files?.length ? JSON.stringify(req.files.map(f => `/uploads/${f.filename}`)) : null;
    const [result] = await pool.execute(
      'INSERT INTO promotions (provider_id, title, description, price, images) VALUES (?,?,?,?,?)',
      [req.user.id, title, description, price, images]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete own promotion
app.delete('/api/promotions/:id', auth, async (req, res) => {
  try {
    await pool.execute('DELETE FROM promotions WHERE id = ? AND provider_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Promotion deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public promotions for seekers
app.get('/api/promotions/public', async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.*, u.name AS provider_name, u.profile_image AS provider_image, u.business_name AS provider_business
       FROM promotions p JOIN users u ON u.id = p.provider_id
       WHERE p.is_active = TRUE ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── NOTIFICATION SETTINGS ───────────────────────────────────────────────────

app.get('/api/settings/notifications', auth, async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM notification_settings WHERE user_id = ?', [req.user.id]);
  res.json(rows[0] || {});
});

app.put('/api/settings/notifications', auth, async (req, res) => {
  const { email_notifications, push_notifications, job_alerts, message_alerts } = req.body;
  await pool.execute(
    `INSERT INTO notification_settings (user_id, email_notifications, push_notifications, job_alerts, message_alerts)
     VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE email_notifications=?, push_notifications=?, job_alerts=?, message_alerts=?`,
    [req.user.id, email_notifications, push_notifications, job_alerts, message_alerts,
     email_notifications, push_notifications, job_alerts, message_alerts]
  );
  res.json({ message: 'Settings updated' });
});

// ─── FEEDBACK ────────────────────────────────────────────────────────────────

app.post('/api/feedbacks', auth, async (req, res) => {
  const { subject, message, type } = req.body;
  const [result] = await pool.execute(
    'INSERT INTO feedbacks (user_id, subject, message, type) VALUES (?,?,?,?)',
    [req.user.id, subject, message, type || 'general']
  );
  res.status(201).json({ id: result.insertId });
});

app.get('/api/feedbacks', auth, async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT * FROM feedbacks WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]
  );
  res.json(rows);
});

// ─── ADMIN ROUTES ────────────────────────────────────────────────────────────

// Dashboard stats
app.get('/api/admin/stats', auth, adminOnly, async (_req, res) => {
  const [[users]] = await pool.execute('SELECT COUNT(*) as total, SUM(type="provider") as providers, SUM(type="seeker") as seekers FROM users WHERE type != "admin"');
  const [[jobs]] = await pool.execute('SELECT COUNT(*) as total, SUM(status="pending") as pending, SUM(status="completed") as completed, SUM(status="in_progress") as in_progress FROM jobs');
  const [[reviews]] = await pool.execute('SELECT COUNT(*) as total, AVG(rating) as avg_rating FROM reviews');
  const [[revenue]] = await pool.execute('SELECT COALESCE(SUM(amount),0) as total FROM jobs WHERE status="completed"');
  const [[feedbacks]] = await pool.execute('SELECT COUNT(*) as total, SUM(status="pending") as pending FROM feedbacks');
  res.json({ users, jobs, reviews, revenue, feedbacks });
});

// All users
app.get('/api/admin/users', auth, adminOnly, async (req, res) => {
  const { type, search } = req.query;
  let sql = 'SELECT id, name, email, type, phone, business_name, rating, jobs_done, earned, availability, is_active, created_at FROM users WHERE type != "admin"';
  const params = [];
  if (type) { sql += ' AND type = ?'; params.push(type); }
  if (search) { sql += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  sql += ' ORDER BY created_at DESC';
  const [rows] = await pool.execute(sql, params);
  res.json(rows);
});

// Toggle user active status
app.patch('/api/admin/users/:id/toggle', auth, adminOnly, async (req, res) => {
  await pool.execute('UPDATE users SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
  res.json({ message: 'User status toggled' });
});

// Delete user
app.delete('/api/admin/users/:id', auth, adminOnly, async (req, res) => {
  await pool.execute('DELETE FROM users WHERE id = ? AND type != "admin"', [req.params.id]);
  res.json({ message: 'User deleted' });
});

// All jobs
app.get('/api/admin/jobs', auth, adminOnly, async (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT j.*, s.name as seeker_name, p.name as provider_name FROM jobs j JOIN users s ON s.id = j.seeker_id JOIN users p ON p.id = j.provider_id';
  const params = [];
  if (status && status !== 'all') { sql += ' WHERE j.status = ?'; params.push(status); }
  sql += ' ORDER BY j.created_at DESC';
  const [rows] = await pool.execute(sql, params);
  res.json(rows);
});

// Update job status (admin)
app.patch('/api/admin/jobs/:id/status', auth, adminOnly, async (req, res) => {
  await pool.execute('UPDATE jobs SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
  res.json({ message: 'Job status updated' });
});

// All reviews
app.get('/api/admin/reviews', auth, adminOnly, async (_req, res) => {
  const [rows] = await pool.execute(
    'SELECT r.*, reviewer.name as reviewer_name, reviewee.name as reviewee_name FROM reviews r JOIN users reviewer ON reviewer.id = r.reviewer_id JOIN users reviewee ON reviewee.id = r.reviewee_id ORDER BY r.created_at DESC'
  );
  res.json(rows);
});

// Delete review
app.delete('/api/admin/reviews/:id', auth, adminOnly, async (req, res) => {
  const [review] = await pool.execute('SELECT reviewee_id FROM reviews WHERE id = ?', [req.params.id]);
  await pool.execute('DELETE FROM reviews WHERE id = ?', [req.params.id]);
  if (review.length) {
    const [avg] = await pool.execute('SELECT AVG(rating) as avg_rating FROM reviews WHERE reviewee_id = ?', [review[0].reviewee_id]);
    await pool.execute('UPDATE users SET rating = COALESCE(?, 0) WHERE id = ?', [avg[0].avg_rating, review[0].reviewee_id]);
  }
  res.json({ message: 'Review deleted' });
});

// Categories CRUD
app.post('/api/admin/categories', auth, adminOnly, async (req, res) => {
  const { name, icon } = req.body;
  const [result] = await pool.execute('INSERT INTO categories (name, icon) VALUES (?, ?)', [name, icon || '📌']);
  res.status(201).json({ id: result.insertId });
});

app.delete('/api/admin/categories/:id', auth, adminOnly, async (req, res) => {
  await pool.execute('DELETE FROM categories WHERE id = ?', [req.params.id]);
  res.json({ message: 'Category deleted' });
});

// Admin feedbacks
app.get('/api/admin/feedbacks', auth, adminOnly, async (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT f.*, u.name as user_name, u.email as user_email, u.type as user_type FROM feedbacks f JOIN users u ON u.id = f.user_id';
  const params = [];
  if (status && status !== 'all') { sql += ' WHERE f.status = ?'; params.push(status); }
  sql += ' ORDER BY f.created_at DESC';
  const [rows] = await pool.execute(sql, params);
  res.json(rows);
});

app.patch('/api/admin/feedbacks/:id', auth, adminOnly, async (req, res) => {
  const { status, admin_reply } = req.body;
  const updates = [], values = [];
  if (status) { updates.push('status = ?'); values.push(status); }
  if (admin_reply !== undefined) { updates.push('admin_reply = ?'); values.push(admin_reply); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
  values.push(req.params.id);
  await pool.execute(`UPDATE feedbacks SET ${updates.join(', ')} WHERE id = ?`, values);
  res.json({ message: 'Feedback updated' });
});

app.delete('/api/admin/feedbacks/:id', auth, adminOnly, async (req, res) => {
  await pool.execute('DELETE FROM feedbacks WHERE id = ?', [req.params.id]);
  res.json({ message: 'Feedback deleted' });
});

// ─── START ───────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
