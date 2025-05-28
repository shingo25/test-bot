import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from './auth';
import { logger } from './logger';

const router = express.Router();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    logger.info('📝 User registration attempt:', email);

    const result = await AuthService.createUser(email, password);
    
    if (!result.success) {
      logger.warn('❌ Registration failed:', result.error);
      return res.status(400).json({ error: result.error });
    }

    logger.info('✅ User registered successfully:', email);
    const token = AuthService.generateToken(result.userId!);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: { id: result.userId, email }
    });
  } catch (error: any) {
    logger.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    logger.info('🔐 Login attempt:', email);

    const result = await AuthService.authenticateUser(email, password);
    
    if (!result.success) {
      logger.warn('❌ Login failed:', email, result.error);
      return res.status(401).json({ error: result.error });
    }

    logger.info('✅ Login successful:', email);
    
    res.json({
      success: true,
      message: 'Login successful',
      token: result.token,
      user: {
        id: result.user!.id,
        email: result.user!.email,
        created_at: result.user!.created_at
      }
    });
  } catch (error: any) {
    logger.error('❌ Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token (for frontend to check if user is still authenticated)
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = AuthService.verifyToken(token);
    const user = await AuthService.getUserById(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;