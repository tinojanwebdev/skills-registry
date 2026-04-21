USE worker;
ALTER TABLE users MODIFY COLUMN type ENUM('provider','seeker','admin') NOT NULL;
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
