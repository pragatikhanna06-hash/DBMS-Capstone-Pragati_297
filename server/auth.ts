import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import type { AppRole, AuthState } from '../src/types/dbms.ts';

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

interface ScryptRecord {
  salt: string;
  hash: string;
  role: AppRole;
  email: string;
  displayName: string;
}

// In-memory credential store (hashed with scrypt + per-user random salt)
let claimedAdminRecord: ScryptRecord | null = null;
const operatorAccounts = new Map<string, ScryptRecord>();

export function hashSecret(secret: string, salt?: string): { salt: string; hash: string } {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(secret, s, 64).toString('hex');
  return { salt: s, hash: derived };
}

export function verifySecret(secret: string, salt: string, expectedHash: string): boolean {
  const derived = crypto.scryptSync(secret, salt, 64);
  const expectedBuf = Buffer.from(expectedHash, 'hex');
  if (derived.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(derived, expectedBuf);
}

export interface SessionPayload {
  sub: string;
  role: AppRole;
  email: string;
  displayName: string;
  exp: number;
}

export function signToken(payload: Omit<SessionPayload, 'exp'>): string {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyToken(token: string): SessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getAuthStatus(req: Request): AuthState {
  const envPasscode = (process.env.ADMIN_PASSCODE || '').trim();
  const hasEnvPasscode = envPasscode.length > 0;
  const adminClaimed = hasEnvPasscode || claimedAdminRecord !== null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const payload = verifyToken(authHeader.slice(7).trim());
    if (payload) {
      return {
        authenticated: true,
        adminClaimed,
        hasEnvPasscode,
        role: payload.role,
        userEmail: payload.email,
        displayName: payload.displayName,
      };
    }
  }

  return {
    authenticated: false,
    adminClaimed,
    hasEnvPasscode,
    role: null,
    userEmail: null,
    displayName: null,
  };
}

export function claimFirstAdmin(passcode: string, email?: string, displayName?: string): { ok: boolean; error?: string; token?: string; state?: AuthState } {
  const envPasscode = (process.env.ADMIN_PASSCODE || '').trim();
  if (envPasscode.length > 0) {
    return { ok: false, error: 'Admin passcode is managed by environment secrets.' };
  }
  if (claimedAdminRecord !== null) {
    return { ok: false, error: 'Admin account has already been claimed. Please sign in.' };
  }
  if (!passcode || passcode.length < 6) {
    return { ok: false, error: 'Passcode must be at least 6 characters.' };
  }

  const { salt, hash } = hashSecret(passcode);
  const resolvedEmail = (email || 'aarav.mehta@campus.edu').trim().toLowerCase();
  const resolvedName = (displayName || 'Aarav Mehta (Admin)').trim();
  claimedAdminRecord = {
    salt,
    hash,
    role: 'ADMIN',
    email: resolvedEmail,
    displayName: resolvedName,
  };

  const token = signToken({
    sub: 'admin-root',
    role: 'ADMIN',
    email: resolvedEmail,
    displayName: resolvedName,
  });

  return {
    ok: true,
    token,
    state: {
      authenticated: true,
      adminClaimed: true,
      hasEnvPasscode: false,
      role: 'ADMIN',
      userEmail: resolvedEmail,
      displayName: resolvedName,
    },
  };
}

export function authenticateUser(passcode: string, email?: string): { ok: boolean; error?: string; token?: string; state?: AuthState } {
  const envPasscode = (process.env.ADMIN_PASSCODE || '').trim();
  const normalizedEmail = (email || '').trim().toLowerCase();

  // Check operator account first if email matches
  if (normalizedEmail && operatorAccounts.has(normalizedEmail)) {
    const rec = operatorAccounts.get(normalizedEmail)!;
    if (verifySecret(passcode, rec.salt, rec.hash)) {
      const token = signToken({
        sub: normalizedEmail,
        role: rec.role,
        email: rec.email,
        displayName: rec.displayName,
      });
      return {
        ok: true,
        token,
        state: {
          authenticated: true,
          adminClaimed: true,
          hasEnvPasscode: envPasscode.length > 0,
          role: rec.role,
          userEmail: rec.email,
          displayName: rec.displayName,
        },
      };
    }
    return { ok: false, error: 'Invalid credentials for this account.' };
  }

  // Env passcode overrides claimed admin record
  if (envPasscode.length > 0) {
    const a = Buffer.from(passcode);
    const b = Buffer.from(envPasscode);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
      const token = signToken({
        sub: 'admin-env',
        role: 'ADMIN',
        email: 'aarav.mehta@campus.edu',
        displayName: 'Aarav Mehta (Admin)',
      });
      return {
        ok: true,
        token,
        state: {
          authenticated: true,
          adminClaimed: true,
          hasEnvPasscode: true,
          role: 'ADMIN',
          userEmail: 'aarav.mehta@campus.edu',
          displayName: 'Aarav Mehta (Admin)',
        },
      };
    }
    return { ok: false, error: 'Invalid admin passcode.' };
  }

  if (claimedAdminRecord) {
    if (verifySecret(passcode, claimedAdminRecord.salt, claimedAdminRecord.hash)) {
      const token = signToken({
        sub: 'admin-claimed',
        role: claimedAdminRecord.role,
        email: claimedAdminRecord.email,
        displayName: claimedAdminRecord.displayName,
      });
      return {
        ok: true,
        token,
        state: {
          authenticated: true,
          adminClaimed: true,
          hasEnvPasscode: false,
          role: claimedAdminRecord.role,
          userEmail: claimedAdminRecord.email,
          displayName: claimedAdminRecord.displayName,
        },
      };
    }
    return { ok: false, error: 'Invalid passcode.' };
  }

  return { ok: false, error: 'Admin passcode has not been claimed yet.' };
}

export function createRbacCredential(email: string, passcode: string, role: AppRole, displayName: string): { ok: boolean; error?: string } {
  const norm = email.trim().toLowerCase();
  if (!norm || !passcode || passcode.length < 6) {
    return { ok: false, error: 'Valid email and passcode (min 6 chars) are required.' };
  }
  const { salt, hash } = hashSecret(passcode);
  operatorAccounts.set(norm, {
    salt,
    hash,
    role,
    email: norm,
    displayName: displayName.trim() || norm,
  });
  return { ok: true };
}

export function listRbacCredentials(): Array<{ email: string; role: AppRole; displayName: string; hashPreview: string }> {
  const list: Array<{ email: string; role: AppRole; displayName: string; hashPreview: string }> = [];
  if (claimedAdminRecord) {
    list.push({
      email: claimedAdminRecord.email,
      role: claimedAdminRecord.role,
      displayName: claimedAdminRecord.displayName,
      hashPreview: `scrypt$${claimedAdminRecord.salt.slice(0, 8)}...$${claimedAdminRecord.hash.slice(0, 12)}...`,
    });
  }
  for (const rec of operatorAccounts.values()) {
    list.push({
      email: rec.email,
      role: rec.role,
      displayName: rec.displayName,
      hashPreview: `scrypt$${rec.salt.slice(0, 8)}...$${rec.hash.slice(0, 12)}...`,
    });
  }
  return list;
}

export interface AuthenticatedRequest extends Request {
  auth?: SessionPayload;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Authentication required. Please claim or sign in via the RBAC Access dialog.',
      code: 'AUTH_REQUIRED',
    });
    return;
  }
  const payload = verifyToken(authHeader.slice(7).trim());
  if (!payload) {
    res.status(401).json({
      error: 'Session expired or invalid token. Please sign in again.',
      code: 'INVALID_TOKEN',
    });
    return;
  }
  req.auth = payload;
  next();
}

export function requireRole(allowedRoles: AppRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: 'Authentication required.', code: 'AUTH_REQUIRED' });
      return;
    }
    if (!allowedRoles.includes(req.auth.role)) {
      res.status(403).json({
        error: `Access denied for role ${req.auth.role}. Required: ${allowedRoles.join(' or ')}.`,
        code: 'FORBIDDEN_ROLE',
      });
      return;
    }
    next();
  };
}
