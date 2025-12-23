import { Router } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/connection.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// Admin emails that can access the dashboard
// Set via ADMIN_EMAILS env var (comma-separated) or defaults
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'geoff.gibbins@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase());

// Admin password - should be set via environment variable in production
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'corrix-alpha-2024';

// Demo users for development
const DEMO_USERS = [
  {
    email: 'admin@demo.corrix.ai',
    password: 'demo123',
    role: 'admin',
    organizationId: '00000000-0000-0000-0000-000000000001',
  },
];

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Check demo users first
    const demoUser = DEMO_USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (demoUser) {
      // Get organization name
      const orgResult = await db.query(
        'SELECT name FROM organizations WHERE id = $1',
        [demoUser.organizationId]
      );

      const token = jwt.sign(
        {
          userId: 'demo-admin',
          email: demoUser.email,
          organizationId: demoUser.organizationId,
          role: demoUser.role,
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        token,
        user: {
          id: 'demo-admin',
          email: demoUser.email,
          organizationId: demoUser.organizationId,
          organizationName: orgResult.rows[0]?.name || 'Demo Organization',
          role: demoUser.role,
        },
      });
    }

    // Check if email is in admin list
    const normalizedEmail = email.toLowerCase().trim();
    if (ADMIN_EMAILS.includes(normalizedEmail) && password === ADMIN_PASSWORD) {
      // Default organization for admin users
      const defaultOrgId = '00000000-0000-0000-0000-000000000001';

      // Try to get organization name, but don't fail if DB unavailable
      let orgName = 'Corrix';
      try {
        const orgResult = await db.query(
          'SELECT name FROM organizations WHERE id = $1',
          [defaultOrgId]
        );
        if (orgResult.rows[0]?.name) {
          orgName = orgResult.rows[0].name;
        }
      } catch {
        // DB query failed, use default org name
      }

      const token = jwt.sign(
        {
          userId: `admin-${normalizedEmail.replace(/[^a-z0-9]/g, '-')}`,
          email: normalizedEmail,
          organizationId: defaultOrgId,
          role: 'admin',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        token,
        user: {
          id: `admin-${normalizedEmail.replace(/[^a-z0-9]/g, '-')}`,
          email: normalizedEmail,
          organizationId: defaultOrgId,
          organizationName: orgName,
          role: 'admin',
        },
      });
    }

    // Reject non-admin users
    return res.status(401).json({ message: 'Invalid credentials or not authorized for dashboard access' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      organizationId: string;
      role: string;
    };

    const orgResult = await db.query(
      'SELECT name FROM organizations WHERE id = $1',
      [decoded.organizationId]
    );

    res.json({
      id: decoded.userId,
      email: decoded.email,
      organizationId: decoded.organizationId,
      organizationName: orgResult.rows[0]?.name || 'Unknown',
      role: decoded.role,
    });
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
});

export default router;
