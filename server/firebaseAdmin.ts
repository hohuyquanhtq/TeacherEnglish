import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface FirebaseAppletConfig {
  projectId: string;
  firestoreDatabaseId?: string;
}

function loadAppletConfig(): FirebaseAppletConfig {
  const candidates = [
    path.resolve(__dirname, '../firebase-applet-config.json'),
    path.resolve(process.cwd(), 'firebase-applet-config.json'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const raw = fs.readFileSync(candidate, 'utf-8');
      return JSON.parse(raw) as FirebaseAppletConfig;
    }
  }

  return {
    projectId: process.env.FIREBASE_PROJECT_ID || 'agile-booster-w8p5g',
    firestoreDatabaseId: process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
  };
}

export const appletConfig = loadAppletConfig();

function parseServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw || !raw.trim()) return null;

  try {
    const trimmed = raw.trim();
    const jsonString = trimmed.startsWith('{')
      ? trimmed
      : Buffer.from(trimmed, 'base64').toString('utf-8');
    const parsed = JSON.parse(jsonString) as ServiceAccount;
    if (parsed && typeof parsed === 'object' && 'project_id' in parsed) {
      return parsed;
    }
    return parsed;
  } catch (err) {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY không đúng định dạng JSON:', err);
    return null;
  }
}

const serviceAccount = parseServiceAccount();
export const hasServiceAccount = Boolean(serviceAccount);

if (getApps().length === 0) {
  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: appletConfig.projectId,
    });
  } else {
    // Project-only initialization supports verifyIdToken via Google public x509 certs
    initializeApp({
      projectId: appletConfig.projectId,
    });
  }
}

export const adminAuth: Auth = getAuth();

let cachedDb: Firestore | null = null;

export function getAdminDb(): Firestore | null {
  if (!hasServiceAccount) return null;
  if (!cachedDb) {
    cachedDb = appletConfig.firestoreDatabaseId
      ? getFirestore(appletConfig.firestoreDatabaseId)
      : getFirestore();
  }
  return cachedDb;
}
