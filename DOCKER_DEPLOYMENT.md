# Docker Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- Basic knowledge of environment variables
- Access to PostgreSQL and Redis (or use Docker services)

## Quick Start

### 1. Environment Setup

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your secure values:
```bash
# Required: Update these passwords
DB_PASSWORD=your_secure_database_password_here
REDIS_PASSWORD=your_secure_redis_password_here

# Required: Generate secure secrets (32+ characters)
JWT_SECRET=your_jwt_secret_minimum_32_characters_long
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Optional: Update domain for production
FRONTEND_URL=https://yourdomain.com
```

### 2. SSL Certificate (Development)

For HTTPS in development, generate self-signed certificates:
```bash
# Create SSL directory if not exists
mkdir -p nginx/ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/server.key \
  -out nginx/ssl/server.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

### 3. Deploy with Docker Compose

Start all services:
```bash
# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f dca-bot
```

### 4. Verify Deployment

1. **Health Check**: http://localhost/health
2. **API Status**: http://localhost/api/settings
3. **Database**: Check PostgreSQL is running
4. **Application**: Access web interface at http://localhost

## Service Details

### Services Included

1. **PostgreSQL** (port 5432)
   - Database: `dca_bot`
   - User: `dca_user`
   - Health check enabled

2. **Redis** (port 6379)
   - Password protected
   - Persistent storage
   - Health check enabled

3. **DCA Bot Application** (port 3001)
   - Node.js backend + React frontend
   - Database abstraction layer
   - Health monitoring

4. **Nginx** (ports 80, 443)
   - Reverse proxy
   - SSL termination
   - Rate limiting
   - Security headers

### Health Checks

All services include health checks:
```bash
# Check service health
docker-compose ps

# View health check logs
docker-compose logs nginx
docker-compose logs dca-bot
docker-compose logs postgres
docker-compose logs redis
```

## Production Deployment

### Security Checklist

- [ ] Update all default passwords
- [ ] Generate strong JWT secret (32+ characters)
- [ ] Generate strong encryption key (32 characters)
- [ ] Use proper SSL certificates (not self-signed)
- [ ] Configure firewall rules
- [ ] Enable log monitoring
- [ ] Set up backup procedures

### Environment Variables

Production environment variables:
```bash
NODE_ENV=production
LOG_LEVEL=info
DB_PASSWORD=strong_database_password
REDIS_PASSWORD=strong_redis_password
JWT_SECRET=cryptographically_secure_jwt_secret_32plus_chars
ENCRYPTION_KEY=exactly_32_character_encryption_key
FRONTEND_URL=https://your-production-domain.com
```

### SSL Certificates

For production, replace self-signed certificates:
```bash
# Use Let's Encrypt or your certificate provider
# Place certificates in nginx/ssl/
nginx/ssl/server.crt  # Your SSL certificate
nginx/ssl/server.key  # Your private key
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Stop existing services on ports 80, 443, 3001, 5432, 6379
2. **Permission errors**: Check Docker user permissions
3. **SSL errors**: Verify certificate paths and formats
4. **Database connection**: Check PostgreSQL startup logs

### Useful Commands

```bash
# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# View service logs
docker-compose logs [service_name]

# Execute commands in containers
docker-compose exec dca-bot sh
docker-compose exec postgres psql -U dca_user -d dca_bot

# Reset volumes (CAUTION: deletes data)
docker-compose down -v
```

### Log Locations

- Application logs: Docker container logs
- Nginx logs: `/var/log/nginx/` in nginx container
- PostgreSQL logs: Container logs
- Redis logs: Container logs

## Backup and Restore

### Database Backup

```bash
# Backup PostgreSQL database
docker-compose exec postgres pg_dump -U dca_user dca_bot > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U dca_user -d dca_bot
```

### Volume Backup

```bash
# Backup all volumes
docker run --rm -v test-bot_postgres_data:/data -v $(pwd):/backup ubuntu tar czf /backup/postgres_backup.tar.gz /data
```

## Monitoring

### Application Metrics

- Health endpoint: `/health`
- API endpoints: `/api/*`
- Purchase history: `/api/history`
- Bot status: `/api/bot/status`

### Resource Usage

```bash
# Monitor resource usage
docker stats

# View system resources
docker system df
```