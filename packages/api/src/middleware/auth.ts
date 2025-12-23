import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    role: 'admin' | 'viewer';
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[Auth] JWT_SECRET not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, secret) as {
      userId: string;
      organizationId: string;
      role: 'admin' | 'viewer';
    };

    req.user = {
      id: decoded.userId,
      organizationId: decoded.organizationId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Ensure user can only access their organization's data
export function enforceOrgScope(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const requestedOrgId = req.query.organizationId || req.params.orgId;

  if (requestedOrgId && requestedOrgId !== req.user?.organizationId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Auto-fill organizationId if not provided
  if (!requestedOrgId) {
    req.query.organizationId = req.user?.organizationId;
  }

  next();
}
