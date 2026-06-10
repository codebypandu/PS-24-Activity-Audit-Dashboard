INSERT INTO users (full_name, email, password_hash, role, created_at)
VALUES
('Audit Admin', 'admin@audit.local', '{noop}Admin@123', 'ADMIN', CURRENT_TIMESTAMP),
('Security Analyst', 'analyst@audit.local', '{noop}Analyst@123', 'ANALYST', CURRENT_TIMESTAMP)
ON CONFLICT (email) DO UPDATE SET
full_name = EXCLUDED.full_name,
password_hash = EXCLUDED.password_hash,
role = EXCLUDED.role;

SELECT 'Seed data inserted successfully' AS message;
