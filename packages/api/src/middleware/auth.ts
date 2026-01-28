import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type UserRole = 'admin' | 'team_admin' | 'viewer';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    organizationId: string;
    role: UserRole;
    teamIds?: string[]; // For team_admin: which teams they can access
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
      email: string;
      organizationId: string;
      role: UserRole;
      teamIds?: string[];
    };

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      organizationId: decoded.organizationId,
      role: decoded.role,
      teamIds: decoded.teamIds,
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

// Allow admin or team_admin access
export function requireTeamAdminOrAbove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin' && req.user?.role !== 'team_admin') {
    return res.status(403).json({ error: 'Team admin access required' });
  }
  next();
}

// Ensure user can only access their organization's data
// Admin users can access any organization by specifying organizationId
export function enforceOrgScope(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const requestedOrgId = req.query.organizationId || req.params.orgId;

  // Admin users can access any organization
  if (req.user?.role === 'admin') {
    // If no org specified, use their default
    if (!requestedOrgId) {
      req.query.organizationId = req.user?.organizationId;
    }
    return next();
  }

  // Non-admin users are restricted to their organization
  if (requestedOrgId && requestedOrgId !== req.user?.organizationId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Auto-fill organizationId if not provided
  if (!requestedOrgId) {
    req.query.organizationId = req.user?.organizationId;
  }

  next();
}

// Ensure team_admin can only access their assigned teams
export function enforceTeamScope(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Admins can access all teams
  if (req.user?.role === 'admin') {
    return next();
  }

  const requestedTeamId = req.query.teamId as string || req.params.teamId;

  // If team_admin and requesting a specific team, check access
  if (req.user?.role === 'team_admin' && requestedTeamId) {
    if (!req.user.teamIds?.includes(requestedTeamId)) {
      return res.status(403).json({ error: 'Access denied to this team' });
    }
  }

  // For team_admin without specific team, filter to their teams only
  if (req.user?.role === 'team_admin' && !requestedTeamId) {
    // Add teamIds to query for downstream filtering
    (req as any).allowedTeamIds = req.user.teamIds;
  }

  next();
}

// Helper to check if user can access a specific user's data
export function canAccessUser(requester: AuthenticatedRequest['user'], targetUserId: string, targetTeamId?: string): boolean {
  if (!requester) return false;
  if (requester.role === 'admin') return true;
  if (requester.role === 'team_admin' && targetTeamId) {
    return requester.teamIds?.includes(targetTeamId) || false;
  }
  return false;
}
