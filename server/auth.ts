import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { getMongoDb, getMysqlPool } from './db.ts';
import { previewStore } from './previewStore.ts';
import type { AppRole, AuthState } from '../src/types/dbms.ts';

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const SHORT_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours
const REMEMBER_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
export const SESSION_COOKIE_NAME = 'smartpark_session';

export interface StoredAccountRecord {
  id: string;
  fullName: string;
  username: string;
  email: string;
  salt: string;
  hash: string;
  role: AppRole;
  createdAt: string;
}

// In-memory credential stores (salted scrypt hashes only — zero plaintext passwords)
let claimedAdminRecord: StoredAccountRecord | null = null;
const registeredAccounts = new Map<string, StoredAccountRecord>(); // keyed by lowercase email
const usernameIndex = new Map<string, string>(); // lowercase username -> lowercase email

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
  username: string;
  displayName: string;
  exp: number;
}

export function signToken(
  payload: Omit<SessionPayload, 'exp'>,
  ttlMs: number = SHORT_TTL_MS
): string {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Date.now() + ttlMs,
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

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};
  const result: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      try {
        result[key] = decodeURIComponent(val);
      } catch {
        result[key] = val;
      }
    }
  }
  return result;
}

export function extractSessionFromRequest(req: Request): { payload: SessionPayload | null; viaCookie: boolean } {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const payload = verifyToken(authHeader.slice(7).trim());
    if (payload) return { payload, viaCookie: false };
  }
  const cookies = parseCookies(req);
  if (cookies[SESSION_COOKIE_NAME]) {
    const payload = verifyToken(cookies[SESSION_COOKIE_NAME]);
    if (payload) return { payload, viaCookie: true };
  }
  return { payload: null, viaCookie: false };
}

export function getAuthStatus(req: Request): AuthState {
  const envPasscode = (process.env.ADMIN_PASSCODE || '').trim();
  const hasEnvPasscode = envPasscode.length > 0;
  const adminClaimed = hasEnvPasscode || claimedAdminRecord !== null;

  const { payload } = extractSessionFromRequest(req);
  if (payload) {
    return {
      authenticated: true,
      adminClaimed,
      hasEnvPasscode,
      role: payload.role,
      userEmail: payload.email,
      username: payload.username,
      displayName: payload.displayName,
    };
  }

  return {
    authenticated: false,
    adminClaimed,
    hasEnvPasscode,
    role: null,
    userEmail: null,
    username: null,
    displayName: null,
  };
}

export function claimFirstAdmin(
  passcode: string,
  email?: string,
  displayName?: string
): { ok: boolean; error?: string; token?: string; state?: AuthState } {
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
  const resolvedEmail = (email || 'pragati.mehta@campus.edu').trim().toLowerCase();
  const resolvedName = (displayName || 'Pragati Mehta (Admin)').trim();
  const resolvedUsername = resolvedEmail.split('@')[0] || 'pragati_admin';

  claimedAdminRecord = {
    id: 'admin-root',
    fullName: resolvedName,
    username: resolvedUsername,
    email: resolvedEmail,
    salt,
    hash,
    role: 'ADMIN',
    createdAt: new Date().toISOString(),
  };

  const token = signToken({
    sub: 'admin-root',
    role: 'ADMIN',
    email: resolvedEmail,
    username: resolvedUsername,
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
      username: resolvedUsername,
      displayName: resolvedName,
    },
  };
}

export async function registerUserAccount(params: {
  fullName: string;
  username: string;
  email: string;
  password: string;
}): Promise<{ ok: boolean; status?: number; error?: string; user?: Omit<StoredAccountRecord, 'salt' | 'hash'> }> {
  const fullName = params.fullName.trim();
  const username = params.username.trim().toLowerCase();
  const email = params.email.trim().toLowerCase();
  const password = params.password;

  if (!fullName || fullName.length < 2) {
    return { ok: false, status: 400, error: 'Full name must be at least 2 characters.' };
  }
  if (!/^[a-z0-9_.-]{3,30}$/.test(username)) {
    return {
      ok: false,
      status: 400,
      error: 'Username must be 3–30 characters using letters, numbers, dots, underscores, or hyphens.',
    };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, status: 400, error: 'Please enter a valid email address.' };
  }
  if (!password || password.length < 6) {
    return { ok: false, status: 400, error: 'Password must be at least 6 characters long.' };
  }

  // Check duplicate in memory
  if (
    registeredAccounts.has(email) ||
    claimedAdminRecord?.email === email
  ) {
    return { ok: false, status: 409, error: 'An account with this email already exists.' };
  }
  if (
    usernameIndex.has(username) ||
    claimedAdminRecord?.username === username
  ) {
    return { ok: false, status: 409, error: 'This username is already taken.' };
  }

  // Check duplicate in MongoDB if connected
  const mongo = getMongoDb();
  if (mongo) {
    const existing = await mongo.collection('users').findOne({
      $or: [{ email }, { username }],
    });
    if (existing) {
      if (existing.email === email) {
        return { ok: false, status: 409, error: 'An account with this email already exists.' };
      }
      return { ok: false, status: 409, error: 'This username is already taken.' };
    }
  }

  const { salt, hash } = hashSecret(password);
  const record: StoredAccountRecord = {
    id: crypto.randomUUID(),
    fullName,
    username,
    email,
    salt,
    hash,
    role: 'USER',
    createdAt: new Date().toISOString(),
  };

  if (mongo) {
    await mongo.collection('users').insertOne({
      id: record.id,
      fullName: record.fullName,
      username: record.username,
      email: record.email,
      passwordHash: `${record.salt}:${record.hash}`,
      role: record.role,
      createdAt: record.createdAt,
    });
  }

  registeredAccounts.set(email, record);
  usernameIndex.set(username, email);

  // Sync corresponding relational USER row if not already present
  const pool = getMysqlPool();
  if (pool) {
    try {
      await pool.execute(
        'INSERT IGNORE INTO USER (full_name, email, phone, user_type, department, status) VALUES (?, ?, ?, ?, ?, ?)',
        [fullName, email, '+91-9800000000', 'Student', 'General Campus', 'Active']
      );
    } catch {
      // ignore sync error
    }
  } else if (!previewStore.users.some((u) => u.email.toLowerCase() === email)) {
    previewStore.users.unshift({
      user_id: previewStore.nextId(previewStore.users as any, 'user_id'),
      full_name: fullName,
      email,
      phone: '+91-9800000000',
      user_type: 'Student',
      department: 'General Campus',
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      status: 'Active',
    });
  }

  return {
    ok: true,
    user: {
      id: record.id,
      fullName: record.fullName,
      username: record.username,
      email: record.email,
      role: record.role,
      createdAt: record.createdAt,
    },
  };
}

export async function authenticateUser(
  passcode: string,
  identifier?: string,
  rememberMe: boolean = false
): Promise<{ ok: boolean; error?: string; token?: string; ttlMs?: number; state?: AuthState }> {
  const envPasscode = (process.env.ADMIN_PASSCODE || '').trim();
  const normalizedId = (identifier || '').trim().toLowerCase();
  const ttlMs = rememberMe ? REMEMBER_TTL_MS : SHORT_TTL_MS;

  // 1. Check in-memory registered/operator accounts by email or username
  const resolvedEmailKey = usernameIndex.get(normalizedId) || normalizedId;
  if (resolvedEmailKey && registeredAccounts.has(resolvedEmailKey)) {
    const rec = registeredAccounts.get(resolvedEmailKey)!;
    if (verifySecret(passcode, rec.salt, rec.hash)) {
      const token = signToken(
        {
          sub: rec.id,
          role: rec.role,
          email: rec.email,
          username: rec.username,
          displayName: rec.fullName,
        },
        ttlMs
      );
      return {
        ok: true,
        token,
        ttlMs,
        state: {
          authenticated: true,
          adminClaimed: envPasscode.length > 0 || claimedAdminRecord !== null,
          hasEnvPasscode: envPasscode.length > 0,
          role: rec.role,
          userEmail: rec.email,
          username: rec.username,
          displayName: rec.fullName,
        },
      };
    }
    return { ok: false, error: 'Invalid password for this account.' };
  }

  // 2. Check MongoDB users collection if connected (persists across restarts)
  const mongo = getMongoDb();
  if (mongo && normalizedId) {
    const mongoUser = await mongo.collection('users').findOne({
      $or: [{ email: normalizedId }, { username: normalizedId }],
    });
    if (mongoUser && typeof mongoUser.passwordHash === 'string') {
      const [salt, hash] = mongoUser.passwordHash.split(':');
      if (salt && hash && verifySecret(passcode, salt, hash)) {
        const role = (mongoUser.role as AppRole) || 'USER';
        const token = signToken(
          {
            sub: String(mongoUser.id || mongoUser._id),
            role,
            email: String(mongoUser.email),
            username: String(mongoUser.username),
            displayName: String(mongoUser.fullName),
          },
          ttlMs
        );
        return {
          ok: true,
          token,
          ttlMs,
          state: {
            authenticated: true,
            adminClaimed: envPasscode.length > 0 || claimedAdminRecord !== null,
            hasEnvPasscode: envPasscode.length > 0,
            role,
            userEmail: String(mongoUser.email),
            username: String(mongoUser.username),
            displayName: String(mongoUser.fullName),
          },
        };
      }
      return { ok: false, error: 'Invalid password for this account.' };
    }
  }

  // 3. Env passcode overrides claimed admin record
  if (envPasscode.length > 0 && (!normalizedId || normalizedId === 'pragati.mehta@campus.edu' || normalizedId === 'pragati')) {
    const a = Buffer.from(passcode);
    const b = Buffer.from(envPasscode);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
      const token = signToken(
        {
          sub: 'admin-env',
          role: 'ADMIN',
          email: 'pragati.mehta@campus.edu',
          username: 'pragati.mehta',
          displayName: 'Pragati Mehta (Admin)',
        },
        ttlMs
      );
      return {
        ok: true,
        token,
        ttlMs,
        state: {
          authenticated: true,
          adminClaimed: true,
          hasEnvPasscode: true,
          role: 'ADMIN',
          userEmail: 'pragati.mehta@campus.edu',
          username: 'pragati.mehta',
          displayName: 'Pragati Mehta (Admin)',
        },
      };
    }
    return { ok: false, error: 'Invalid email/username or password.' };
  }

  // 4. Claimed Admin record
  if (
    claimedAdminRecord &&
    (!normalizedId ||
      normalizedId === claimedAdminRecord.email ||
      normalizedId === claimedAdminRecord.username)
  ) {
    if (verifySecret(passcode, claimedAdminRecord.salt, claimedAdminRecord.hash)) {
      const token = signToken(
        {
          sub: 'admin-claimed',
          role: claimedAdminRecord.role,
          email: claimedAdminRecord.email,
          username: claimedAdminRecord.username,
          displayName: claimedAdminRecord.fullName,
        },
        ttlMs
      );
      return {
        ok: true,
        token,
        ttlMs,
        state: {
          authenticated: true,
          adminClaimed: true,
          hasEnvPasscode: false,
          role: claimedAdminRecord.role,
          userEmail: claimedAdminRecord.email,
          username: claimedAdminRecord.username,
          displayName: claimedAdminRecord.fullName,
        },
      };
    }
    return { ok: false, error: 'Invalid password.' };
  }

  return { ok: false, error: 'Invalid email/username or password.' };
}

export function createRbacCredential(
  email: string,
  passcode: string,
  role: AppRole,
  displayName: string
): { ok: boolean; error?: string } {
  const norm = email.trim().toLowerCase();
  if (!norm || !passcode || passcode.length < 6) {
    return { ok: false, error: 'Valid email and passcode (min 6 chars) are required.' };
  }
  const username = norm.split('@')[0];
  const { salt, hash } = hashSecret(passcode);
  registeredAccounts.set(norm, {
    id: crypto.randomUUID(),
    fullName: displayName.trim() || norm,
    username,
    email: norm,
    salt,
    hash,
    role,
    createdAt: new Date().toISOString(),
  });
  usernameIndex.set(username, norm);
  return { ok: true };
}

export function listRbacCredentials(): Array<{
  email: string;
  username: string;
  role: AppRole;
  displayName: string;
  hashPreview: string;
}> {
  const list: Array<{ email: string; username: string; role: AppRole; displayName: string; hashPreview: string }> = [];
  if (claimedAdminRecord) {
    list.push({
      email: claimedAdminRecord.email,
      username: claimedAdminRecord.username,
      role: claimedAdminRecord.role,
      displayName: claimedAdminRecord.fullName,
      hashPreview: `scrypt$${claimedAdminRecord.salt.slice(0, 8)}...$${claimedAdminRecord.hash.slice(0, 12)}...`,
    });
  }
  for (const rec of registeredAccounts.values()) {
    list.push({
      email: rec.email,
      username: rec.username,
      role: rec.role,
      displayName: rec.fullName,
      hashPreview: `scrypt$${rec.salt.slice(0, 8)}...$${rec.hash.slice(0, 12)}...`,
    });
  }
  return list;
}

export interface AuthenticatedRequest extends Request {
  auth?: SessionPayload;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const { payload, viaCookie } = extractSessionFromRequest(req);
  if (!payload) {
    res.status(401).json({
      error: 'Authentication required. Please sign in to access this resource.',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  // CSRF defense for cookie-authenticated state-changing requests
  if (viaCookie && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase())) {
    const customHdr = req.headers['x-requested-with'];
    const origin = req.headers.origin;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    let originMatches = false;
    if (origin && host) {
      try {
        originMatches = new URL(origin).host === String(host).split(',')[0].trim();
      } catch {
        originMatches = false;
      }
    }
    if (customHdr !== 'SmartPark-Client' && !originMatches) {
      res.status(403).json({ error: 'Cross-site request blocked.', code: 'CSRF_BLOCKED' });
      return;
    }
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
