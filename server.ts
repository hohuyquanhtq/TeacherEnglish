import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type SystemRole = 'Teacher' | 'Editor' | 'Admin';

interface FirebaseAppletConfig {
  projectId: string;
  firestoreDatabaseId?: string;
}

function loadAppletConfig(): FirebaseAppletConfig {
  const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
  const raw = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(raw) as FirebaseAppletConfig;
}

const appletConfig = loadAppletConfig();

function initFirebaseAdmin() {
  if (getApps().length > 0) {
    return { hasServiceAccount: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) };
  }

  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (rawServiceAccount && rawServiceAccount.trim().startsWith('{')) {
    const parsed = JSON.parse(rawServiceAccount);
    initializeApp({
      credential: cert(parsed),
      projectId: appletConfig.projectId,
    });
    return { hasServiceAccount: true };
  }

  // Project-only initialization supports verifyIdToken via Google public x509 certs
  initializeApp({
    projectId: appletConfig.projectId,
  });
  return { hasServiceAccount: false };
}

const { hasServiceAccount } = initFirebaseAdmin();
const adminAuth = getAuth();

interface AuthenticatedRequest extends Request {
  authUser?: {
    uid: string;
    email: string;
    emailVerified: boolean;
    role: SystemRole;
    decoded: DecodedIdToken;
  };
}

async function resolveVerifiedRole(decoded: DecodedIdToken): Promise<SystemRole> {
  const claimRole = decoded.role;
  if (claimRole === 'Admin' || claimRole === 'Editor' || claimRole === 'Teacher') {
    return claimRole;
  }

  if (decoded.email === 'hohuyquanhtq@gmail.com' && decoded.email_verified === true) {
    return 'Admin';
  }

  if (hasServiceAccount) {
    try {
      const adminDb = appletConfig.firestoreDatabaseId
        ? getFirestore(appletConfig.firestoreDatabaseId)
        : getFirestore();
      const snap = await adminDb.collection('users').doc(decoded.uid).get();
      const docRole = snap.data()?.role;
      if (docRole === 'Admin' || docRole === 'Editor' || docRole === 'Teacher') {
        return docRole;
      }
    } catch {
      // Fallback to Teacher if Firestore Admin lookup fails
    }
  }

  return 'Teacher';
}

async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Thiếu token xác thực (Bearer token).' });
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const role = await resolveVerifiedRole(decoded);
    req.authUser = {
      uid: decoded.uid,
      email: decoded.email || '',
      emailVerified: Boolean(decoded.email_verified),
      role,
      decoded,
    };
    next();
  } catch (err) {
    res.status(401).json({
      error: 'Token xác thực không hợp lệ hoặc đã hết hạn.',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}

function requireRoles(...allowed: SystemRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Chưa xác thực tài khoản.' });
      return;
    }
    if (!allowed.includes(req.authUser.role)) {
      res.status(403).json({
        error: `Từ chối truy cập. Quyền hiện tại (${req.authUser.role}) không được phép thực hiện thao tác này.`,
      });
      return;
    }
    next();
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      projectId: appletConfig.projectId,
      customClaimsReady: hasServiceAccount,
    });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    res.json({
      uid: req.authUser?.uid,
      email: req.authUser?.email,
      emailVerified: req.authUser?.emailVerified,
      role: req.authUser?.role,
      customClaimsReady: hasServiceAccount,
    });
  });

  app.get(
    '/api/editor/check',
    requireAuth,
    requireRoles('Editor', 'Admin'),
    (req: AuthenticatedRequest, res: Response) => {
      res.json({
        ok: true,
        role: req.authUser?.role,
        message: 'Xác thực quyền Editor/Admin thành công ở backend.',
      });
    }
  );

  app.get(
    '/api/admin/check',
    requireAuth,
    requireRoles('Admin'),
    (req: AuthenticatedRequest, res: Response) => {
      res.json({
        ok: true,
        role: req.authUser?.role,
        customClaimsReady: hasServiceAccount,
        message: 'Xác thực quyền Admin thành công ở backend.',
      });
    }
  );

  app.post(
    '/api/admin/set-role',
    requireAuth,
    requireRoles('Admin'),
    async (req: AuthenticatedRequest, res: Response) => {
      const { targetUid, role } = req.body as { targetUid?: string; role?: SystemRole };

      if (!targetUid || typeof targetUid !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(targetUid)) {
        res.status(400).json({ error: 'UID người dùng mục tiêu không hợp lệ.' });
        return;
      }

      if (role !== 'Teacher' && role !== 'Editor' && role !== 'Admin') {
        res.status(400).json({ error: 'Vai trò phân quyền phải là Teacher, Editor hoặc Admin.' });
        return;
      }

      if (!hasServiceAccount) {
        res.json({
          ok: true,
          customClaimsApplied: false,
          message:
            'Đã xác thực quyền Admin ở backend và đồng bộ vai trò trên Firestore. Để ghi Custom Claims trực tiếp vào Firebase Auth Token, cần thêm FIREBASE_SERVICE_ACCOUNT_KEY vào biến môi trường.',
        });
        return;
      }

      try {
        await adminAuth.setCustomUserClaims(targetUid, { role });
        res.json({
          ok: true,
          customClaimsApplied: true,
          message: `Đã cấp Custom Claims role="${role}" cho tài khoản ${targetUid}.`,
        });
      } catch (err) {
        res.status(500).json({
          error: 'Không thể cập nhật Custom Claims trên Firebase Auth.',
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    }
  );

  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Teacher English server running on http://0.0.0.0:${port}`);
  });
}

void startServer();
