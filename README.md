# Binance DCA Bot

A comprehensive Bitcoin Dollar Cost Averaging (DCA) automation bot using Binance API. This application allows you to set up automated Bitcoin purchases at regular intervals with a beautiful React frontend and robust Node.js backend.

## 🚀 Features

### ✅ Phase 1 (Completed - Local Development)
- **API Key Management**: Secure encrypted storage of Binance API credentials
- **DCA Strategy Configuration**: Set purchase amounts and intervals (15min to 24h)
- **Automated Bitcoin Purchases**: Background execution with node-cron
- **Real-time Bot Control**: Start/stop bot with live status monitoring
- **Purchase History**: Detailed transaction history with statistics
- **Local Security**: AES-256 encryption for API keys, SQLite database
- **Beautiful UI**: Modern React interface with real-time updates

### ✅ Phase 2 (Completed - Production Ready)
- **JWT Authentication**: Multi-user authentication system
- **PostgreSQL Support**: Production-grade database with SQLite fallback
- **Docker Containerization**: Full-stack Docker Compose deployment
- **Production Security**: Nginx reverse proxy, SSL/TLS, rate limiting
- **Database Abstraction**: Seamless SQLite/PostgreSQL switching
- **Environment Validation**: Automated security configuration checks
- **Health Monitoring**: Comprehensive health checks and logging

## 📁 Project Structure

```
test-bot/
├── backend/                      # Node.js + Express API server
│   ├── src/
│   │   ├── server.ts            # Main server entry point
│   │   ├── routes.ts            # API endpoints
│   │   ├── authRoutes.ts        # Authentication endpoints
│   │   ├── auth.ts              # JWT authentication service
│   │   ├── database/            # Database abstraction layer
│   │   │   ├── connection.ts    # Database connection interfaces
│   │   │   ├── factory.ts       # Database factory pattern
│   │   │   └── queries.ts       # SQL queries
│   │   ├── dcaEngine.ts         # DCA automation engine
│   │   ├── binanceService.ts    # Binance API integration
│   │   ├── encryption.ts        # API key encryption service
│   │   ├── security.ts          # Security middleware
│   │   └── logger.ts            # Logging service
│   ├── data/                    # SQLite database storage
│   ├── package.json
│   └── tsconfig.json
├── frontend/                    # React + TypeScript UI
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ApiKeySetup.tsx
│   │   │   ├── DCASettings.tsx
│   │   │   ├── BotControl.tsx
│   │   │   └── PurchaseHistory.tsx
│   │   ├── api/                # API client
│   │   ├── App.tsx             # Main application
│   │   └── App.css             # Styling
│   └── package.json
├── nginx/                       # Nginx configuration
│   ├── nginx.conf              # Production Nginx config
│   └── ssl/                    # SSL certificates
├── scripts/                     # Deployment and utility scripts
│   ├── deploy.sh               # Production deployment script
│   ├── validate-env.sh         # Environment validation
│   ├── backup.sh               # Database backup script
│   ├── init.sql                # PostgreSQL initialization
│   └── start-postgres.sh       # Local PostgreSQL setup
├── docker-compose.yml           # Docker services configuration
├── Dockerfile                   # Multi-stage Docker build
├── .env.example                # Environment variables template
├── .env.production             # Production environment template
├── DOCKER_DEPLOYMENT.md        # Detailed deployment guide
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- **Local Development**: Node.js (v18+), npm/yarn, Binance account
- **Production Deployment**: Docker, Docker Compose, Git
- **Server**: VPS/Cloud server with Docker support

## 🚀 Quick Start (Production Deployment)

### 1. Clone Repository
```bash
git clone <your-repository-url>
cd test-bot
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit with your secure values
nano .env
```

### 3. Validate Configuration
```bash
# Check environment setup
./scripts/validate-env.sh
```

### 4. Deploy with Docker
```bash
# Deploy full stack
./scripts/deploy.sh
```

Access your DCA bot at: **https://your-server-ip**

---

## 💻 Local Development Setup

### 1. Install Dependencies
```bash
# Backend
cd backend && npm install

# Frontend  
cd ../frontend && npm install
```

### 2. Environment Configuration
```bash
# Backend environment
cd backend
cp .env.example .env
# Edit .env with development values
```

### 3. Start Development Servers
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start
```

**Development URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

## 🔧 Configuration

### 1. API Key Setup
1. Go to Binance and create API keys with spot trading permissions
2. **For testing: Use Binance Testnet API keys**
3. In the app, navigate to "API Setup" tab
4. Enter your API key and secret
5. Test the connection to verify

### 2. DCA Strategy Configuration
1. Navigate to "DCA Settings" tab
2. Set your purchase amount (minimum 10 USDT)
3. Choose purchase interval (15min to 24h)
4. Save settings

### 3. Bot Control
1. Navigate to "Bot Control" tab
2. Review your settings
3. Click "Start Bot" to begin automation
4. Monitor status and next execution time

## 📊 API Endpoints

### Settings
- `POST /api/settings/apikey` - Save encrypted API keys
- `GET /api/settings` - Get current settings
- `PUT /api/settings` - Update DCA settings
- `POST /api/test-connection` - Test Binance API connection

### Bot Control
- `POST /api/bot/start` - Start DCA bot
- `POST /api/bot/stop` - Stop DCA bot
- `GET /api/bot/status` - Get bot status

### History & Statistics
- `GET /api/history` - Get purchase history
- `GET /api/statistics` - Get trading statistics

## 🔒 Security Features

### Phase 1 (Local)
- **API Key Encryption**: AES-256 encryption for stored credentials
- **Local Storage**: All data stays on your machine
- **No External Transmission**: API keys never leave your local environment
- **Secure Database**: SQLite with encrypted sensitive data

### Phase 2 (Server Deployment)
- JWT authentication
- HTTPS enforcement
- Enhanced database encryption
- Session management
- Rate limiting

## 📈 DCA Strategy Benefits

- **Volatility Smoothing**: Regular purchases reduce impact of price swings
- **Emotion-Free Investing**: Automated execution removes emotional decisions
- **Cost Averaging**: Potentially lower average cost basis over time
- **Discipline Building**: Consistent investment approach

## ⚠️ Important Notes

### For Testing
- **Always use Binance Testnet for initial testing**
- Start with small amounts when using real API keys
- Monitor the bot closely during first runs

### API Requirements
- Minimum order: 10 USDT (Binance requirement)
- API keys need spot trading permissions only
- Rate limits: Respects Binance API limitations

### Data Storage
- Database: `backend/data/dca_bot.db`
- Logs: Console output (Phase 1)
- Backups: Export purchase history as CSV

## 🚦 Development Status

- ✅ **Phase 1**: Local development and testing - **COMPLETED**
- ✅ **Phase 2**: Production deployment ready - **COMPLETED**
- 🎯 **Ready for Production**: Full Docker stack with PostgreSQL

## 🌐 Production Deployment

### Server Requirements
- **VPS/Cloud Server**: 2GB+ RAM, 20GB+ storage
- **Operating System**: Ubuntu 20.04+ or similar Linux
- **Services**: Docker, Docker Compose
- **Domain** (optional): For HTTPS with proper SSL certificates

### Environment Variables
Critical variables to configure in `.env`:
```bash
# Security (REQUIRED)
JWT_SECRET=your_cryptographically_secure_secret_32plus_chars
ENCRYPTION_KEY=exactly_32_character_encryption_key_here

# Database (REQUIRED)  
DB_PASSWORD=your_strong_database_password
REDIS_PASSWORD=your_strong_redis_password

# Application
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

### SSL Certificate Setup
```bash
# Development (self-signed)
# Automatically generated by deploy script

# Production (Let's Encrypt)
certbot certonly --standalone -d yourdomain.com
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/server.crt
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/server.key
```

### Monitoring and Maintenance
```bash
# View application logs
docker-compose logs -f dca-bot

# Monitor resource usage
docker stats

# Backup database
./scripts/backup.sh

# Update application
git pull && ./scripts/deploy.sh
```

## 🔍 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify API keys are correct
   - Check if using testnet keys with testnet URLs
   - Ensure API keys have spot trading permissions

2. **Minimum Order Error**
   - Binance requires minimum 10 USDT orders
   - Check account balance

3. **Bot Won't Start**
   - Verify API keys are set
   - Confirm DCA settings are configured
   - Check backend server is running

### Error Logs
Check the backend console for detailed error messages and debugging information.

## 📝 License

This project is for educational and personal use. Please review Binance's API terms of service and ensure compliance with local regulations regarding automated trading.

## 🤝 Contributing

Currently in Phase 1 development. Feedback and suggestions welcome for Phase 2 planning.

---

**⚠️ Disclaimer**: This bot is for educational purposes. Cryptocurrency trading involves risk. Test thoroughly with small amounts and testnet before using with significant funds.