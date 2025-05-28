import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { DatabaseFactory } from './database/factory';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthRequest extends Request {
  user?: User;
}

export class AuthService {
  static generateToken(userId: number): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
  }

  static verifyToken(token: string): { userId: number } {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: number };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async createUser(email: string, password: string): Promise<{ success: boolean; userId?: number; error?: string }> {
    try {
      const db = DatabaseFactory.getConnection();
      
      // Check if user already exists
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        return { success: false, error: 'User already exists' };
      }

      const passwordHash = await this.hashPassword(password);
      
      const result = await db.run(
        `INSERT INTO users (email, password_hash, is_active, created_at, updated_at) 
         VALUES (?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [email, passwordHash]
      );

      return { success: true, userId: result.lastInsertId };
    } catch (error) {
      return { success: false, error: 'Internal server error' };
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const db = DatabaseFactory.getConnection();
      const result = await db.get('SELECT * FROM users WHERE email = ?', [email]);
      return result as User || null;
    } catch (error) {
      throw error;
    }
  }

  static async getUserById(id: number): Promise<User | null> {
    try {
      const db = DatabaseFactory.getConnection();
      const result = await db.get('SELECT * FROM users WHERE id = ?', [id]);
      return result as User || null;
    } catch (error) {
      throw error;
    }
  }

  static async authenticateUser(email: string, password: string): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) {
        return { success: false, error: 'Invalid credentials' };
      }

      if (!user.is_active) {
        return { success: false, error: 'Account is deactivated' };
      }

      const isValidPassword = await this.comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        return { success: false, error: 'Invalid credentials' };
      }

      const token = this.generateToken(user.id);
      return { success: true, user, token };
    } catch (error) {
      return { success: false, error: 'Authentication failed' };
    }
  }
}

// Middleware for authenticating requests
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = AuthService.verifyToken(token);
    const user = await AuthService.getUserById(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Optional authentication middleware (for routes that work with or without auth)
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = AuthService.verifyToken(token);
      const user = await AuthService.getUserById(decoded.userId);
      
      if (user && user.is_active) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};