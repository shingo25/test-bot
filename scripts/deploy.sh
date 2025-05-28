#!/bin/bash

# DCA Bot Production Deployment Script
# This script helps deploy the DCA Bot in production environment

set -e  # Exit on any error

echo "🚀 DCA Bot Production Deployment"
echo "================================="
echo ""

# Check if running as root (not recommended)
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  WARNING: Running as root is not recommended for security reasons"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if Docker and Docker Compose are installed
echo "🔍 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Check if .env file exists
if [ ! -f .env ]; then
    echo ""
    echo "📋 Setting up environment configuration..."
    
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env from .env.example"
    else
        echo "❌ .env.example not found. Cannot create environment configuration."
        exit 1
    fi
    
    echo ""
    echo "⚠️  IMPORTANT: You must configure .env before deployment!"
    echo "   1. Edit .env file with your secure passwords and secrets"
    echo "   2. Run: ./scripts/validate-env.sh to verify configuration"
    echo "   3. Run this script again to deploy"
    exit 1
fi

# Validate environment configuration
echo ""
echo "🔍 Validating environment configuration..."

if [ -f scripts/validate-env.sh ]; then
    if ./scripts/validate-env.sh; then
        echo "✅ Environment configuration is valid"
    else
        echo "❌ Environment configuration has errors. Fix them before deployment."
        echo "   Run: ./scripts/validate-env.sh for details"
        exit 1
    fi
else
    echo "⚠️  Environment validation script not found. Proceeding without validation."
fi

# Check if SSL certificates exist for production
echo ""
echo "🔐 Checking SSL certificates..."

if [ ! -f nginx/ssl/server.crt ] || [ ! -f nginx/ssl/server.key ]; then
    echo "⚠️  SSL certificates not found. Generating self-signed certificates for development..."
    
    mkdir -p nginx/ssl
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/server.key \
        -out nginx/ssl/server.crt \
        -subj "/C=US/ST=State/L=City/O=DCA-Bot/CN=localhost" \
        2>/dev/null
    
    echo "✅ Self-signed certificates generated"
    echo "   ⚠️  PRODUCTION WARNING: Replace with proper SSL certificates!"
else
    echo "✅ SSL certificates found"
fi

# Create necessary directories
echo ""
echo "📁 Creating directories..."
mkdir -p logs data/backups

# Build and deploy
echo ""
echo "🏗️  Building and deploying DCA Bot..."

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Build and start services
echo "Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."

# Wait for database
echo "Waiting for PostgreSQL..."
timeout=60
while ! docker-compose exec -T postgres pg_isready -U dca_user -d dca_bot &>/dev/null; do
    sleep 2
    timeout=$((timeout - 2))
    if [ $timeout -le 0 ]; then
        echo "❌ PostgreSQL failed to start within 60 seconds"
        exit 1
    fi
done
echo "✅ PostgreSQL is ready"

# Wait for Redis
echo "Waiting for Redis..."
timeout=30
while ! docker-compose exec -T redis redis-cli ping &>/dev/null; do
    sleep 2
    timeout=$((timeout - 2))
    if [ $timeout -le 0 ]; then
        echo "❌ Redis failed to start within 30 seconds"
        exit 1
    fi
done
echo "✅ Redis is ready"

# Wait for application
echo "Waiting for DCA Bot application..."
timeout=60
while ! curl -f http://localhost/health &>/dev/null; do
    sleep 3
    timeout=$((timeout - 3))
    if [ $timeout -le 0 ]; then
        echo "❌ DCA Bot application failed to start within 60 seconds"
        docker-compose logs dca-bot
        exit 1
    fi
done
echo "✅ DCA Bot application is ready"

# Check deployment status
echo ""
echo "📊 Deployment Status:"
echo "===================="

docker-compose ps

echo ""
echo "🔗 Service URLs:"
echo "==============="
echo "🌐 Web Interface: http://localhost (or https://localhost)"
echo "📊 Health Check:  http://localhost/health"
echo "🔌 API Endpoint:  http://localhost/api"

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Access the web interface and configure your Binance API keys"
echo "2. Set up your DCA purchase settings"
echo "3. Monitor the application logs: docker-compose logs -f dca-bot"
echo "4. Set up regular backups: ./scripts/backup.sh"
echo ""
echo "🛡️  Security Reminders:"
echo "======================"
echo "• Replace self-signed SSL certificates with proper ones for production"
echo "• Regularly update Docker images: docker-compose pull && docker-compose up -d"
echo "• Monitor logs for any suspicious activity"
echo "• Backup your database regularly"
echo ""
echo "📖 For more information, see DOCKER_DEPLOYMENT.md"