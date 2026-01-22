-- Seed a test user for login
-- Password: password123 (bcrypt hash with 10 rounds)
-- Hash generated with: bcrypt.hash('password123', 10)

SET search_path TO auth;

-- Insert test user (password: password123)
-- The hash below is bcrypt of 'password123' with 10 rounds
INSERT INTO auth.users (
    email,
    password,
    name,
    role,
    email_verified,
    is_active
) VALUES (
    'jane.doe@example.com',
    '$2b$10$1hymA9s2gUrHOh3FV3EghOC0kLkSzkfytO1z01gY4pNaB5LHN99xq',
    'Jane Doe',
    'customer',
    TRUE,
    TRUE
),
(
    'admin@example.com',
    '$2b$10$1hymA9s2gUrHOh3FV3EghOC0kLkSzkfytO1z01gY4pNaB5LHN99xq',
    'Admin User',
    'admin',
    TRUE,
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Also insert into users schema for user service
SET search_path TO users;

INSERT INTO users.users (
    id,
    email,
    name
) 
SELECT 
    u.id,
    u.email,
    u.name
FROM auth.users u
WHERE u.email IN ('jane.doe@example.com', 'admin@example.com')
ON CONFLICT (email) DO NOTHING;

-- Insert default preferences
INSERT INTO users.user_preferences (user_id)
SELECT id FROM users.users WHERE email IN ('jane.doe@example.com', 'admin@example.com')
ON CONFLICT (user_id) DO NOTHING;

-- Log success
DO $$
BEGIN
    RAISE NOTICE 'Test users created successfully:';
    RAISE NOTICE '  - jane.doe@example.com (password: password123)';
    RAISE NOTICE '  - admin@example.com (password: password123)';
END $$;
