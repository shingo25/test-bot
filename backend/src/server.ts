import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import routes from './routes';
import authRoutes from './authRoutes';
import { DatabaseFactory } from './database/factory';
import { setupSecurity, authLimiter, apiLimiter, botControlLimiter } from './security';
import { logger } from './logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
setupSecurity(app);

// CORS configuration
const corsOptions = {
  origin: NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://your-domain.com']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Request logging (only in development)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });
}

// Authentication routes (with rate limiting)
app.use('/auth', authLimiter, authRoutes);

// API Routes (with rate limiting)
app.use('/api', apiLimiter, routes);

// Apply specific rate limiting to bot control endpoints
app.use('/api/bot/*', botControlLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
let dbConnection: any = null;

process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  if (dbConnection) {
    dbConnection.close();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  if (dbConnection) {
    dbConnection.close();
  }
  process.exit(0);
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database connection
    dbConnection = DatabaseFactory.getConnection();
    await dbConnection.initialize();
    
    // Start server
    app.listen(PORT, () => {
      const connectionInfo = DatabaseFactory.getConnectionInfo();
      logger.bot(`🚀 DCA Bot backend server running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔗 API base: http://localhost:${PORT}/api`);
      logger.info(`🗄️ Database: ${connectionInfo.type} (${connectionInfo.info})`);
      logger.info(`🌍 Environment: ${NODE_ENV}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();