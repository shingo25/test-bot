#!/bin/bash

# Environment Variables Validation Script for DCA Bot
# Run this script to validate your production environment configuration

echo "🔍 Validating DCA Bot Environment Variables..."
echo "================================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Copy .env.example to .env and configure it."
    exit 1
fi

# Source the environment file
set -a
source .env
set +a

# Validation results
ERRORS=0
WARNINGS=0

# Function to check if variable exists and is not default
check_required() {
    local var_name=$1
    local default_value=$2
    local var_value=${!var_name}
    
    if [ -z "$var_value" ]; then
        echo "❌ REQUIRED: $var_name is not set"
        ((ERRORS++))
    elif [ "$var_value" = "$default_value" ]; then
        echo "⚠️  WARNING: $var_name is using default value (security risk)"
        ((WARNINGS++))
    else
        echo "✅ VALID: $var_name is configured"
    fi
}

# Function to check optional variables
check_optional() {
    local var_name=$1
    local var_value=${!var_name}
    
    if [ -z "$var_value" ]; then
        echo "ℹ️  OPTIONAL: $var_name is not set (using defaults)"
    else
        echo "✅ SET: $var_name is configured"
    fi
}

# Function to validate string length
check_length() {
    local var_name=$1
    local min_length=$2
    local var_value=${!var_name}
    
    if [ -n "$var_value" ] && [ ${#var_value} -lt $min_length ]; then
        echo "❌ SECURITY: $var_name is too short (minimum $min_length characters)"
        ((ERRORS++))
    fi
}

echo ""
echo "🔐 Security Configuration:"
echo "-------------------------"

# Check critical security variables
check_required "JWT_SECRET" "your_jwt_secret_at_least_32_characters_long"
check_length "JWT_SECRET" 32

check_required "ENCRYPTION_KEY" "your_32_character_encryption_key_here"
check_length "ENCRYPTION_KEY" 32

if [ -n "$ENCRYPTION_KEY" ] && [ ${#ENCRYPTION_KEY} -ne 32 ]; then
    echo "❌ CRITICAL: ENCRYPTION_KEY must be exactly 32 characters"
    ((ERRORS++))
fi

echo ""
echo "🗄️ Database Configuration:"
echo "--------------------------"

check_required "DB_PASSWORD" "your_secure_db_password_here"
check_length "DB_PASSWORD" 12

check_required "DATABASE_URL" ""

echo ""
echo "📦 Redis Configuration:"
echo "-----------------------"

check_required "REDIS_PASSWORD" "your_secure_redis_password_here"
check_length "REDIS_PASSWORD" 12

echo ""
echo "🌐 Application Configuration:"
echo "-----------------------------"

check_optional "NODE_ENV"
check_optional "PORT"
check_optional "LOG_LEVEL"
check_optional "FRONTEND_URL"

# Validate NODE_ENV
if [ "$NODE_ENV" = "production" ]; then
    echo "✅ PRODUCTION: NODE_ENV is set to production"
    
    # Additional production checks
    if [[ "$JWT_SECRET" == *"change"* ]] || [[ "$JWT_SECRET" == *"example"* ]]; then
        echo "❌ PRODUCTION ERROR: JWT_SECRET contains default values"
        ((ERRORS++))
    fi
    
    if [[ "$ENCRYPTION_KEY" == *"change"* ]] || [[ "$ENCRYPTION_KEY" == *"example"* ]]; then
        echo "❌ PRODUCTION ERROR: ENCRYPTION_KEY contains default values"
        ((ERRORS++))
    fi
    
    if [[ "$DB_PASSWORD" == *"change"* ]] || [[ "$DB_PASSWORD" == *"example"* ]]; then
        echo "❌ PRODUCTION ERROR: DB_PASSWORD contains default values"
        ((ERRORS++))
    fi
fi

echo ""
echo "🔌 Optional Binance Configuration:"
echo "----------------------------------"

check_optional "BINANCE_API_KEY"
check_optional "BINANCE_SECRET_KEY"

echo ""
echo "📊 Optional Monitoring:"
echo "----------------------"

check_optional "WEBHOOK_URL"
check_optional "ALERT_EMAIL"

echo ""
echo "📋 Validation Summary:"
echo "======================"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "🎉 Perfect! All environment variables are properly configured."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  Configuration valid but has $WARNINGS warning(s). Consider updating default values."
    exit 0
else
    echo "❌ Configuration has $ERRORS error(s) and $WARNINGS warning(s)."
    echo ""
    echo "🛠️  Action Required:"
    echo "   1. Update all variables marked as REQUIRED"
    echo "   2. Generate secure random values for JWT_SECRET and ENCRYPTION_KEY"
    echo "   3. Use strong passwords for database and Redis"
    echo "   4. Update FRONTEND_URL for your domain"
    echo ""
    echo "🔧 Quick fixes:"
    echo "   # Generate JWT secret:"
    echo "   openssl rand -base64 48"
    echo ""
    echo "   # Generate encryption key (32 chars):"
    echo "   openssl rand -hex 16"
    echo ""
    echo "   # Generate strong passwords:"
    echo "   openssl rand -base64 24"
    exit 1
fi