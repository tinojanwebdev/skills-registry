USE worker;
ALTER TABLE users DROP INDEX email;
ALTER TABLE users ADD UNIQUE KEY unique_email_type (email, type);
