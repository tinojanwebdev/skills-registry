-- Freelance Service Marketplace - MySQL Schema

CREATE DATABASE IF NOT EXISTS worker;
USE worker;

-- Users table (providers, seekers, and admins)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  type ENUM('provider', 'seeker', 'admin') NOT NULL,
  phone VARCHAR(20),
  business_name VARCHAR(100),
  bio TEXT,
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  experience INT DEFAULT 0,
  skill_level ENUM('Beginner', 'Intermediate', 'Expert') DEFAULT 'Beginner',
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  availability ENUM('available', 'busy', 'offline') DEFAULT 'available',
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  radius INT DEFAULT 10,
  rating DECIMAL(3,2) DEFAULT 0,
  jobs_done INT DEFAULT 0,
  earned DECIMAL(12,2) DEFAULT 0,
  google_id VARCHAR(255),
  profile_image VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE KEY unique_email_type (email, type),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Service categories
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50)
);

INSERT INTO categories (name, icon) VALUES
  ('Plumber', '🔧'), ('Electrician', '⚡'), ('Cleaner', '🧹'),
  ('Carpenter', '🔨'), ('Painter', '🎨'), ('Gardener', '🌱'),
  ('Tutor', '📚'), ('Designer', '🎯'), ('Technician', '💻'),
  ('Mechanic', '🔩'), ('Chef', '👨‍🍳'), ('Photographer', '📷');

-- Provider-category mapping
CREATE TABLE provider_categories (
  provider_id INT NOT NULL,
  category_id INT NOT NULL,
  PRIMARY KEY (provider_id, category_id),
  FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Jobs / Bookings
CREATE TABLE jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  seeker_id INT NOT NULL,
  provider_id INT NOT NULL,
  category_id INT,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'accepted', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  scheduled_date DATE,
  scheduled_time TIME,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (seeker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Reviews
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT,
  reviewer_id INT NOT NULL,
  reviewee_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  service VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Conversations
CREATE TABLE conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user1_id INT NOT NULL,
  user2_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_conversation (user1_id, user2_id)
);

-- Messages
CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Promotions / Posts
CREATE TABLE promotions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  images JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notification settings
CREATE TABLE notification_settings (
  user_id INT PRIMARY KEY,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  job_alerts BOOLEAN DEFAULT TRUE,
  message_alerts BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Feedbacks
CREATE TABLE feedbacks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('bug', 'feature', 'complaint', 'general') DEFAULT 'general',
  status ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending',
  admin_reply TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_users_type ON users(type);
CREATE INDEX idx_users_location ON users(latitude, longitude);
CREATE INDEX idx_jobs_provider ON jobs(provider_id, status);
CREATE INDEX idx_jobs_seeker ON jobs(seeker_id, status);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_feedbacks_user ON feedbacks(user_id);
CREATE INDEX idx_feedbacks_status ON feedbacks(status);
CREATE INDEX idx_reset_token ON password_resets(token);
