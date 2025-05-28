-- DCA Bot PostgreSQL Database Initialization
-- This script is automatically run when PostgreSQL container starts

-- Create database user (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'dca_user') THEN
        CREATE ROLE dca_user WITH LOGIN PASSWORD 'change_this_password';
    END IF;
END
$$;

-- Grant necessary privileges
GRANT ALL PRIVILEGES ON DATABASE dca_bot TO dca_user;

-- Connect to the dca_bot database
\c dca_bot;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO dca_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dca_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dca_user;

-- Create extension for UUID generation (optional, for future use)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create extension for cryptographic functions (optional, for future use)
CREATE EXTENSION IF NOT EXISTS pgcrypto;