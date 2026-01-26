import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../db/connection.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const MAGIC_LINK_EXPIRY_MINUTES = 15;
const BASE_URL = process.env.DASHBOARD_URL || 'http://localhost:5173';

// Legacy admin password for backwards compatibility during transition
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'corrix-alpha-2024';

// Demo user password
const DEMO_PASSWORD = 'demo123';
const DEMO_EMAIL = 'admin@demo.corrix.ai';

// Request a magic link to be sent to email
router.post('/magic-link/request', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email is in admin_accounts table
    const accountResult = await db.query(
      'SELECT id, email, name, role, organization_id, team_ids, is_active FROM admin_accounts WHERE email = $1',
      [normalizedEmail]
    );

    if (accountResult.rows.length === 0) {
      // Don't reveal if email exists or not
      console.log(`[Auth] Magic link requested for unknown email: ${normalizedEmail}`);
      return res.json({ message: 'If this email is registered, you will receive a login link.' });
    }

    const account = accountResult.rows[0];

    if (!account.is_active) {
      console.log(`[Auth] Magic link requested for inactive account: ${normalizedEmail}`);
      return res.json({ message: 'If this email is registered, you will receive a login link.' });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

    // Store token in database
    await db.query(
      `INSERT INTO auth_tokens (admin_account_id, token, token_type, expires_at)
       VALUES ($1, $2, 'magic_link', $3)`,
      [account.id, token, expiresAt]
    );

    // Build magic link URL
    const magicLink = `${BASE_URL}/auth/verify?token=${token}`;

    // In production, send email here. For now, log the link.
    console.log(`[Auth] Magic link for ${normalizedEmail}: ${magicLink}`);

    // TODO: Implement actual email sending (SendGrid, Resend, etc.)
    // For now, we'll just return success and log the link

    res.json({
      message: 'If this email is registered, you will receive a login link.',
      // Only include link in development for testing
      ...(process.env.NODE_ENV !== 'production' && { _devLink: magicLink })
    });
  } catch (error) {
    console.error('[Auth] Magic link request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Verify magic link token and return JWT
router.post('/magic-link/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token required' });
    }

    // Look up token
    const tokenResult = await db.query(
      `SELECT t.id, t.admin_account_id, t.expires_at, t.used_at,
              a.id as account_id, a.email, a.name, a.role, a.organization_id, a.team_ids, a.is_active
       FROM auth_tokens t
       JOIN admin_accounts a ON t.admin_account_id = a.id
       WHERE t.token = $1 AND t.token_type = 'magic_link'`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid or expired link' });
    }

    const tokenData = tokenResult.rows[0];

    // Check if token already used
    if (tokenData.used_at) {
      return res.status(401).json({ message: 'This link has already been used' });
    }

    // Check if token expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return res.status(401).json({ message: 'This link has expired' });
    }

    // Check if account is active
    if (!tokenData.is_active) {
      return res.status(401).json({ message: 'Account is disabled' });
    }

    // Mark token as used
    await db.query(
      'UPDATE auth_tokens SET used_at = NOW() WHERE id = $1',
      [tokenData.id]
    );

    // Update last login
    await db.query(
      'UPDATE admin_accounts SET last_login_at = NOW() WHERE id = $1',
      [tokenData.account_id]
    );

    // Get organization name
    let orgName = 'Corrix';
    if (tokenData.organization_id) {
      const orgResult = await db.query(
        'SELECT name FROM organizations WHERE id = $1',
        [tokenData.organization_id]
      );
      if (orgResult.rows[0]?.name) {
        orgName = orgResult.rows[0].name;
      }
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      {
        userId: tokenData.account_id,
        email: tokenData.email,
        organizationId: tokenData.organization_id,
        role: tokenData.role,
        teamIds: tokenData.team_ids || [],
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: tokenData.account_id,
        email: tokenData.email,
        name: tokenData.name,
        organizationId: tokenData.organization_id,
        organizationName: orgName,
        role: tokenData.role,
        teamIds: tokenData.team_ids || [],
      },
    });
  } catch (error) {
    console.error('[Auth] Magic link verify error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Legacy password login - kept for backwards compatibility
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check admin_accounts table first
    const accountResult = await db.query(
      'SELECT id, email, name, role, organization_id, team_ids, is_active FROM admin_accounts WHERE email = $1',
      [normalizedEmail]
    );

    // Check password - demo user has special password, others use admin password
    const isValidPassword =
      (normalizedEmail === DEMO_EMAIL && password === DEMO_PASSWORD) ||
      password === ADMIN_PASSWORD;

    if (accountResult.rows.length > 0 && isValidPassword) {
      const account = accountResult.rows[0];

      if (!account.is_active) {
        return res.status(401).json({ message: 'Account is disabled' });
      }

      // Only allow password login for full admins
      if (account.role !== 'admin') {
        return res.status(401).json({ message: 'Please use magic link login' });
      }

      // Update last login
      await db.query(
        'UPDATE admin_accounts SET last_login_at = NOW() WHERE id = $1',
        [account.id]
      );

      // Get organization name
      let orgName = 'Corrix';
      if (account.organization_id) {
        const orgResult = await db.query(
          'SELECT name FROM organizations WHERE id = $1',
          [account.organization_id]
        );
        if (orgResult.rows[0]?.name) {
          orgName = orgResult.rows[0].name;
        }
      }

      const token = jwt.sign(
        {
          userId: account.id,
          email: account.email,
          organizationId: account.organization_id,
          role: account.role,
          teamIds: account.team_ids || [],
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: account.id,
          email: account.email,
          name: account.name,
          organizationId: account.organization_id,
          organizationName: orgName,
          role: account.role,
          teamIds: account.team_ids || [],
        },
      });
    }

    // Reject all other logins
    return res.status(401).json({ message: 'Invalid credentials or not authorized' });
  } catch (error) {
    console.error('[Auth] Login error:', error);
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
      teamIds?: string[];
    };

    let orgName = 'Unknown';
    if (decoded.organizationId) {
      const orgResult = await db.query(
        'SELECT name FROM organizations WHERE id = $1',
        [decoded.organizationId]
      );
      if (orgResult.rows[0]?.name) {
        orgName = orgResult.rows[0].name;
      }
    }

    // Get account details for name
    const accountResult = await db.query(
      'SELECT name FROM admin_accounts WHERE id = $1',
      [decoded.userId]
    );

    res.json({
      id: decoded.userId,
      email: decoded.email,
      name: accountResult.rows[0]?.name || null,
      organizationId: decoded.organizationId,
      organizationName: orgName,
      role: decoded.role,
      teamIds: decoded.teamIds || [],
    });
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
});

export default router;
