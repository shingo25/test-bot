# 🚀 DCA Bot - Production Deployment Guide

## 📋 Prerequisites

### System Requirements
- **Docker** 20.10+ and **Docker Compose** 2.0+
- **Minimum**: 2GB RAM, 20GB Storage
- **Recommended**: 4GB RAM, 50GB Storage
- **OS**: Ubuntu 20.04+, CentOS 7+, or similar

### External Services
- Domain name with DNS configured
- SSL certificate (Let's Encrypt recommended)
- Binance API keys (production or testnet)

## 🔧 Installation

### 1. Clone Repository
```bash
git clone <your-repository-url>
cd test-bot
```

### 2. Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit configuration
nano .env
```

### 3. Required Environment Variables
```env
# Security (CHANGE THESE!)
JWT_SECRET=your_very_secure_jwt_secret_at_least_32_characters_long
ENCRYPTION_KEY=your_32_character_encryption_key_here
DB_PASSWORD=your_secure_database_password
REDIS_PASSWORD=your_secure_redis_password

# Application
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://dca_user:your_secure_password@postgres:5432/dca_bot
```

### 4. Deploy
```bash
./scripts/deploy.sh
```

## 🔒 Security Configuration

### SSL Certificate Setup
```bash
# Using Let's Encrypt (certbot)
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/
```

### Firewall Configuration
```bash
# Ubuntu/Debian
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable

# Block direct access to application port
sudo ufw deny 3001
```

## 🛠️ Management Commands

### Service Control
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f [service-name]

# Scale services (if needed)
docker-compose up -d --scale dca-bot=2
```

### Database Management
```bash
# Access PostgreSQL
docker-compose exec postgres psql -U dca_user -d dca_bot

# Database backup
./scripts/backup.sh

# Database restore
docker-compose exec -T postgres psql -U dca_user -d dca_bot < backup.sql
```

### Application Updates
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d
```

## 📊 Monitoring

### Health Checks
- Application: `https://your-domain.com/health`
- Database: Built-in Docker health checks
- Redis: Built-in Docker health checks

### Log Locations
```bash
# Application logs
docker-compose logs dca-bot

# Nginx access logs
docker-compose exec nginx tail -f /var/log/nginx/access.log

# Database logs
docker-compose logs postgres
```

### Performance Monitoring
```bash
# Resource usage
docker stats

# Service status
docker-compose ps

# System resources
htop
df -h
```

## 🔧 Configuration Options

### Rate Limiting
Default limits in `src/security.ts`:
- General: 100 requests/15min per IP
- Authentication: 5 attempts/15min per IP
- API calls: 20 requests/1min per IP
- Bot control: 10 requests/1min per IP

### Logging Levels
- `debug`: All logs (development only)
- `info`: Important events (recommended)
- `warn`: Warnings and errors only
- `error`: Errors only

### Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_purchase_history_user_id ON purchase_history(user_id);
CREATE INDEX idx_purchase_history_date ON purchase_history(purchase_date);
```

## 🆘 Troubleshooting

### Common Issues

#### 1. Service Won't Start
```bash
# Check logs
docker-compose logs

# Check environment variables
docker-compose config

# Restart services
docker-compose restart
```

#### 2. Database Connection Issues
```bash
# Check PostgreSQL status
docker-compose exec postgres pg_isready -U dca_user

# Reset database connection
docker-compose restart postgres dca-bot
```

#### 3. High Memory Usage
```bash
# Check container stats
docker stats

# Restart services
docker-compose restart

# Clean up unused containers/images
docker system prune -a
```

#### 4. SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in nginx/ssl/fullchain.pem -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew
```

### Emergency Procedures

#### Complete Service Reset
```bash
# Stop all services
docker-compose down

# Remove all data (WARNING: This will delete all data!)
docker-compose down -v

# Rebuild and restart
./scripts/deploy.sh
```

#### Database Recovery
```bash
# Stop application
docker-compose stop dca-bot

# Restore from backup
./scripts/restore.sh backup_file.sql

# Restart application
docker-compose start dca-bot
```

## 📈 Scaling

### Horizontal Scaling
```bash
# Run multiple app instances
docker-compose up -d --scale dca-bot=3

# Use external load balancer
# Configure nginx upstream in nginx.conf
```

### Vertical Scaling
```yaml
# In docker-compose.yml
services:
  dca-bot:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
```

## 🔐 Security Best Practices

1. **Change all default passwords**
2. **Use strong, unique secrets**
3. **Enable firewall**
4. **Set up SSL/TLS**
5. **Regular backups**
6. **Monitor logs**
7. **Keep system updated**
8. **Use non-root user**
9. **Limit network exposure**
10. **Regular security audits**

## 📞 Support

### Error Reporting
Include the following information:
- Docker version: `docker --version`
- Compose version: `docker-compose --version`
- System info: `uname -a`
- Recent logs: `docker-compose logs --tail=50`
- Configuration (without secrets): `docker-compose config`

### Performance Optimization
- Monitor resource usage
- Optimize database queries
- Use Redis for caching
- Configure CDN for static assets
- Implement database connection pooling