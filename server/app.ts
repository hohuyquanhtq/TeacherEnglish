import express, { NextFunction, Request, Response } from 'express';
import { type DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import {
  adminAuth,
  appletConfig,
  getAdminDb,
  hasServiceAccount,
} from './firebaseAdmin.js';

type CanonicalRole = 'teacher' | 'editor' | 'admin';
type AccountStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

const ALLOWED_SUBJECTS = new Set([
  'math',
  'physics',
  'chemistry',
  'biology',
  'science',
  'informatics',
  'history_geo',
  'literature',
  'english',
  'civics',
]);

function normalizeRole(val: unknown): CanonicalRole {
  if (typeof val !== 'string') return 'teacher';
  const lower = val.trim().toLowerCase();
  if (lower === 'admin') return 'admin';
  if (lower === 'editor') return 'editor';
  return 'teacher';
}

function normalizeStatus(val: unknown): AccountStatus {
  if (typeof val !== 'string') return 'pending';
  const lower = val.trim().toLowerCase();
  if (lower === 'approved' || lower === 'rejected' || lower === 'suspended' || lower === 'pending') {
    return lower;
  }
  return 'pending';
}

function toIsoString(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

function isValidUid(uid: unknown): uid is string {
  return typeof uid === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(uid);
}

interface AuthenticatedRequest extends Request {
  authUser?: {
    uid: string;
    email: string;
    emailVerified: boolean;
    claimRole: CanonicalRole | null;
    claimApproved: boolean;
    effectiveRole: CanonicalRole;
    status: AccountStatus;
    decoded: DecodedIdToken;
  };
}

async function resolveUserAuthContext(decoded: DecodedIdToken) {
  const claimRole =
    typeof decoded.role === 'string' ? normalizeRole(decoded.role) : null;
  const claimApproved = decoded.approved === true;

  let status: AccountStatus = claimApproved ? 'approved' : 'pending';
  let docRole: CanonicalRole | null = null;

  const adminDb = getAdminDb();
  if (adminDb) {
    try {
      const snap = await adminDb.collection('users').doc(decoded.uid).get();
      if (snap.exists) {
        const data = snap.data() || {};
        docRole = normalizeRole(data.role);
        status = normalizeStatus(data.status);
      }
    } catch (err) {
      console.error('AdminDb lookup warning in resolveUserAuthContext:', err);
    }
  }

  const effectiveRole: CanonicalRole = claimRole ?? docRole ?? 'teacher';

  return {
    claimRole,
    claimApproved,
    effectiveRole,
    status,
  };
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
    const decoded = await adminAuth.verifyIdToken(token, hasServiceAccount);
    const resolved = await resolveUserAuthContext(decoded);

    req.authUser = {
      uid: decoded.uid,
      email: decoded.email || '',
      emailVerified: Boolean(decoded.email_verified),
      claimRole: resolved.claimRole,
      claimApproved: resolved.claimApproved,
      effectiveRole: resolved.effectiveRole,
      status: resolved.status,
      decoded,
    };
    next();
  } catch (err) {
    res.status(401).json({
      error: 'Token xác thực không hợp lệ, đã bị thu hồi hoặc đã hết hạn.',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}

function requireAdminClaim(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.authUser) {
    res.status(401).json({ error: 'Chưa xác thực tài khoản.' });
    return;
  }

  if (req.authUser.status === 'suspended') {
    res.status(403).json({
      error: 'Tài khoản quản trị đang bị tạm khóa.',
    });
    return;
  }

  if (req.authUser.claimRole !== 'admin' || !req.authUser.claimApproved) {
    res.status(403).json({
      error:
        'Từ chối truy cập. Chức năng này yêu cầu Custom Claim role="admin" và approved=true đã được xác thực.',
    });
    return;
  }

  next();
}

function requireEditorOrAdminClaim(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.authUser) {
    res.status(401).json({ error: 'Chưa xác thực tài khoản.' });
    return;
  }

  if (req.authUser.status !== 'approved' || !req.authUser.claimApproved) {
    res.status(403).json({
      error: 'Tài khoản chưa được phê duyệt hoặc đang bị khóa.',
    });
    return;
  }

  if (req.authUser.claimRole !== 'editor' && req.authUser.claimRole !== 'admin') {
    res.status(403).json({
      error: 'Từ chối truy cập. Yêu cầu quyền Editor hoặc Admin đã phê duyệt.',
    });
    return;
  }

  next();
}

function requireAdminSdkReady(res: Response): Firestore | null {
  const adminDb = getAdminDb();
  if (!hasServiceAccount || !adminDb) {
    res.status(503).json({
      error:
        'Máy chủ chưa có FIREBASE_SERVICE_ACCOUNT_KEY nên chưa thể thực thi thao tác Firebase Admin SDK (Custom Claims / khóa tài khoản / ghi nhật ký). Vui lòng cấu hình biến môi trường FIREBASE_SERVICE_ACCOUNT_KEY.',
    });
    return null;
  }
  return adminDb;
}

async function countActiveAdmins(adminDb: Firestore): Promise<number> {
  const snap = await adminDb.collection('users').get();
  let count = 0;
  for (const docItem of snap.docs) {
    const data = docItem.data();
    const role = normalizeRole(data.role);
    const status = normalizeStatus(data.status);
    if (role === 'admin' && status === 'approved') {
      count += 1;
    }
  }
  return count;
}

async function writeAuditLog(
  adminDb: Firestore,
  entry: {
    actorUid: string;
    actorEmail?: string;
    action:
      | 'approve_teacher'
      | 'reject_teacher'
      | 'suspend_user'
      | 'unlock_user'
      | 'set_role'
      | 'bootstrap_admin';
    targetUid: string;
    targetEmail?: string;
    targetName?: string;
    oldValue: Record<string, unknown>;
    newValue: Record<string, unknown>;
    reason?: string;
  }
): Promise<void> {
  const logRef = adminDb.collection('adminAuditLogs').doc();
  await logRef.set({
    id: logRef.id,
    actorUid: entry.actorUid,
    actorEmail: entry.actorEmail || '',
    actorRole: 'admin',
    action: entry.action,
    targetUid: entry.targetUid,
    targetEmail: entry.targetEmail || '',
    targetName: entry.targetName || '',
    oldValue: entry.oldValue,
    newValue: entry.newValue,
    reason: entry.reason || '',
    createdAt: FieldValue.serverTimestamp(),
  });
}

function serializeUserDoc(uid: string, data: Record<string, unknown>) {
  const role = normalizeRole(data.role);
  const previousRole = data.previousRole ? normalizeRole(data.previousRole) : undefined;
  const status = normalizeStatus(data.status);
  return {
    uid,
    fullName: typeof data.fullName === 'string' ? data.fullName : 'Giáo viên',
    email: typeof data.email === 'string' ? data.email : '',
    school:
      typeof data.school === 'string' && data.school
        ? data.school
        : typeof data.schoolName === 'string'
        ? data.schoolName
        : '',
    educationLevel: data.educationLevel === 'THCS' ? 'THCS' : 'THPT',
    subject:
      typeof data.subject === 'string' && ALLOWED_SUBJECTS.has(data.subject)
        ? data.subject
        : typeof data.primarySubject === 'string' && ALLOWED_SUBJECTS.has(data.primarySubject)
        ? data.primarySubject
        : 'physics',
    province: typeof data.province === 'string' ? data.province : 'TP. Hồ Chí Minh',
    phone: typeof data.phone === 'string' ? data.phone : '',
    role,
    previousRole,
    status,
    currentLevel: typeof data.currentLevel === 'string' ? data.currentLevel : 'B1',
    targetLevel: typeof data.targetLevel === 'string' ? data.targetLevel : 'B2',
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
    approvedAt: toIsoString(data.approvedAt),
    approvedBy: typeof data.approvedBy === 'string' ? data.approvedBy : null,
    rejectedAt: toIsoString(data.rejectedAt),
    rejectedBy: typeof data.rejectedBy === 'string' ? data.rejectedBy : null,
    rejectionReason: typeof data.rejectionReason === 'string' ? data.rejectionReason : null,
    suspendedAt: toIsoString(data.suspendedAt),
    suspendedBy: typeof data.suspendedBy === 'string' ? data.suspendedBy : null,
    suspendedReason: typeof data.suspendedReason === 'string' ? data.suspendedReason : null,
    lastLoginAt: toIsoString(data.lastLoginAt),
  };
}

export function createApiApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      projectId: appletConfig.projectId,
      databaseId: appletConfig.firestoreDatabaseId || '(default)',
      customClaimsReady: hasServiceAccount,
      adminSdkReady: hasServiceAccount,
    });
  });

  app.get('/api/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    let profile: Record<string, unknown> | null = null;
    const adminDb = getAdminDb();

    if (adminDb) {
      try {
        const snap = await adminDb.collection('users').doc(authUser.uid).get();
        if (snap.exists) {
          profile = serializeUserDoc(authUser.uid, snap.data() || {});
        }
      } catch {
        // Non-fatal
      }
    }

    res.json({
      uid: authUser.uid,
      email: authUser.email,
      emailVerified: authUser.emailVerified,
      role: authUser.effectiveRole,
      claimRole: authUser.claimRole,
      claimApproved: authUser.claimApproved,
      status: authUser.status,
      customClaimsReady: hasServiceAccount,
      profile,
    });
  });

  app.post(
    '/api/auth/register-profile',
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      const authUser = req.authUser!;
      const body = req.body as {
        fullName?: unknown;
        school?: unknown;
        educationLevel?: unknown;
        subject?: unknown;
        province?: unknown;
        phone?: unknown;
      };

      const fullName =
        typeof body.fullName === 'string' ? body.fullName.trim().slice(0, 120) : '';
      const school =
        typeof body.school === 'string' ? body.school.trim().slice(0, 200) : '';
      const educationLevel = body.educationLevel === 'THCS' ? 'THCS' : 'THPT';
      const subject =
        typeof body.subject === 'string' && ALLOWED_SUBJECTS.has(body.subject)
          ? body.subject
          : 'physics';
      const province =
        typeof body.province === 'string' && body.province.trim()
          ? body.province.trim().slice(0, 100)
          : 'TP. Hồ Chí Minh';
      const phone =
        typeof body.phone === 'string' ? body.phone.trim().slice(0, 30) : '';

      if (!fullName) {
        res.status(400).json({ error: 'Vui lòng cung cấp họ và tên hợp lệ.' });
        return;
      }

      if (!school) {
        res.status(400).json({ error: 'Vui lòng cung cấp tên trường công tác.' });
        return;
      }

      const adminDb = getAdminDb();
      if (!hasServiceAccount || !adminDb) {
        // Report honestly that Admin SDK is not configured; frontend creates locked pending/teacher doc under Firestore rules
        res.status(202).json({
          ok: true,
          profileWrittenByBackend: false,
          customClaimsApplied: false,
          role: 'teacher',
          status: 'pending',
          message:
            'Đã xác thực token đăng ký. Máy chủ chưa có FIREBASE_SERVICE_ACCOUNT_KEY nên hồ sơ chờ duyệt sẽ được tạo với quy tắc bảo mật mặc định.',
        });
        return;
      }

      try {
        const userRef = adminDb.collection('users').doc(authUser.uid);
        const existingSnap = await userRef.get();

        if (existingSnap.exists) {
          const existingData = existingSnap.data() || {};
          res.json({
            ok: true,
            profileWrittenByBackend: true,
            customClaimsApplied: true,
            role: normalizeRole(existingData.role),
            status: normalizeStatus(existingData.status),
            message: 'Hồ sơ tài khoản đã tồn tại trong hệ thống.',
          });
          return;
        }

        const schoolStage = educationLevel === 'THCS' ? 'thcs' : 'thpt';
        const defaultGrades = educationLevel === 'THCS' ? [6, 7, 8, 9] : [10, 11, 12];

        await userRef.set({
          uid: authUser.uid,
          fullName,
          email: authUser.email.slice(0, 200),
          school,
          schoolName: school,
          educationLevel,
          subject,
          primarySubject: subject,
          subjects: [subject],
          schoolStage,
          grades: defaultGrades,
          province,
          phone,
          teacherPosition: 'Giáo viên bộ môn',
          yearsOfExperience: 1,
          bio: '',
          currentLevel: 'B1',
          targetLevel: 'B2',
          weeklyMinutesTarget: 180,
          onboardingCompleted: false,
          // Strictly forced on backend — never read from client body
          role: 'teacher',
          previousRole: 'teacher',
          status: 'pending',
          approvedAt: null,
          approvedBy: null,
          rejectedAt: null,
          rejectedBy: null,
          rejectionReason: null,
          suspendedAt: null,
          suspendedBy: null,
          suspendedReason: null,
          lastLoginAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        await adminAuth.setCustomUserClaims(authUser.uid, {
          role: 'teacher',
          approved: false,
        });

        res.status(201).json({
          ok: true,
          profileWrittenByBackend: true,
          customClaimsApplied: true,
          role: 'teacher',
          status: 'pending',
          message:
            'Đăng ký thành công! Tài khoản của bạn đang chờ Admin phê duyệt. Vui lòng quay lại sau khi được xác nhận.',
        });
      } catch (err) {
        res.status(500).json({
          error: 'Không thể khởi tạo hồ sơ tài khoản trên máy chủ.',
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    }
  );

  app.post(
    '/api/auth/sync-login',
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      const authUser = req.authUser!;
      const adminDb = getAdminDb();

      if (!hasServiceAccount || !adminDb) {
        res.json({ ok: true, synced: false });
        return;
      }

      try {
        const userRef = adminDb.collection('users').doc(authUser.uid);
        const snap = await userRef.get();
        if (snap.exists) {
          const data = snap.data() || {};
          if (normalizeStatus(data.status) === 'suspended') {
            res.status(403).json({
              error: 'Tài khoản này hiện đang bị tạm khóa.',
              status: 'suspended',
              suspendedReason: data.suspendedReason || null,
            });
            return;
          }

          await userRef.update({
            lastLoginAt: FieldValue.serverTimestamp(),
          });
        }
        res.json({ ok: true, synced: true });
      } catch {
        res.json({ ok: true, synced: false });
      }
    }
  );

  app.get(
    '/api/editor/check',
    requireAuth,
    requireEditorOrAdminClaim,
    (req: AuthenticatedRequest, res: Response) => {
      res.json({
        ok: true,
        role: req.authUser?.claimRole,
        approved: req.authUser?.claimApproved,
        message: 'Xác thực Custom Claims Editor/Admin thành công ở backend.',
      });
    }
  );

  app.get(
    '/api/admin/check',
    requireAuth,
    requireAdminClaim,
    (req: AuthenticatedRequest, res: Response) => {
      res.json({
        ok: true,
        role: req.authUser?.claimRole,
        approved: req.authUser?.claimApproved,
        customClaimsReady: hasServiceAccount,
        message: 'Xác thực Custom Claims Admin thành công ở backend.',
      });
    }
  );

  app.get(
    '/api/admin/stats',
    requireAuth,
    requireAdminClaim,
    async (_req: AuthenticatedRequest, res: Response) => {
      const adminDb = requireAdminSdkReady(res);
      if (!adminDb) return;

      try {
        const snap = await adminDb.collection('users').get();
        let totalAccounts = 0;
        let approvedTeachers = 0;
        let pendingTeachers = 0;
        let rejectedAccounts = 0;
        let suspendedAccounts = 0;
        let editorsCount = 0;
        let adminsCount = 0;

        for (const docItem of snap.docs) {
          const data = docItem.data();
          const role = normalizeRole(data.role);
          const status = normalizeStatus(data.status);
          totalAccounts += 1;

          if (status === 'pending') pendingTeachers += 1;
          else if (status === 'rejected') rejectedAccounts += 1;
          else if (status === 'suspended') suspendedAccounts += 1;
          else if (status === 'approved' && role === 'teacher') approvedTeachers += 1;

          if (role === 'editor' && status === 'approved') editorsCount += 1;
          if (role === 'admin' && status === 'approved') adminsCount += 1;
        }

        res.json({
          totalAccounts,
          approvedTeachers,
          pendingTeachers,
          rejectedAccounts,
          suspendedAccounts,
          editorsCount,
          adminsCount,
        });
      } catch (err) {
        res.status(500).json({
          error: 'Không thể tải thống kê quản trị từ Firestore.',
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    }
  );

  app.get(
    '/api/admin/users',
    requireAuth,
    requireAdminClaim,
    async (req: AuthenticatedRequest, res: Response) => {
      const adminDb = requireAdminSdkReady(res);
      if (!adminDb) return;

      const statusFilter =
        typeof req.query.status === 'string' ? req.query.status.trim().toLowerCase() : 'all';
      const roleFilter =
        typeof req.query.role === 'string' ? req.query.role.trim().toLowerCase() : 'all';
      const search =
        typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';

      try {
        const [usersSnap, authUsersResult] = await Promise.all([
          adminDb.collection('users').get(),
          adminAuth.listUsers(1000).catch(() => ({ users: [] })),
        ]);

        const authMetaMap = new Map<
          string,
          { lastSignInTime: string | null; disabled: boolean; emailVerified: boolean }
        >();

        for (const record of authUsersResult.users) {
          authMetaMap.set(record.uid, {
            lastSignInTime: record.metadata.lastSignInTime || null,
            disabled: Boolean(record.disabled),
            emailVerified: Boolean(record.emailVerified),
          });
        }

        const users = usersSnap.docs
          .map((docItem) => {
            const base = serializeUserDoc(docItem.id, docItem.data() || {});
            const authMeta = authMetaMap.get(docItem.id);
            return {
              ...base,
              lastLoginAt: authMeta?.lastSignInTime || base.lastLoginAt,
              disabled: authMeta?.disabled ?? base.status === 'suspended',
              emailVerified: authMeta?.emailVerified ?? false,
            };
          })
          .filter((item) => {
            if (statusFilter !== 'all' && item.status !== statusFilter) return false;
            if (roleFilter !== 'all' && item.role !== roleFilter) return false;
            if (search) {
              const haystack = `${item.fullName} ${item.email} ${item.school} ${item.province}`.toLowerCase();
              if (!haystack.includes(search)) return false;
            }
            return true;
          })
          .sort((a, b) => {
            const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
            const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
            return tb - ta;
          });

        res.json({ users });
      } catch (err) {
        res.status(500).json({
          error: 'Không thể tải danh sách tài khoản từ Firestore.',
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    }
  );

  app.post(
    '/api/admin/approve',
    requireAuth,
    requireAdminClaim,
    async (req: AuthenticatedRequest, res: Response) => {
      const adminDb = requireAdminSdkReady(res);
      if (!adminDb) return;

      const { targetUid, targetRole } = req.body as {
        targetUid?: unknown;
        targetRole?: unknown;
      };

      if (!isValidUid(targetUid)) {
        res.status(400).json({ error: 'UID tài khoản cần phê duyệt không hợp lệ.' });
        return;
      }

      const actor = req.authUser!;

      try {
        const userRef = adminDb.collection('users').doc(targetUid);
        const snap = await userRef.get();
        if (!snap.exists) {
          res.status(404).json({ error: 'Không tìm thấy hồ sơ tài khoản này trong Firestore.' });
          return;
        }

        const existingData = snap.data() || {};
        const oldStatus = normalizeStatus(existingData.status);
        const oldRole = normalizeRole(existingData.role);

        if (oldStatus !== 'pending') {
          res.status(409).json({
            error: `Chỉ có thể phê duyệt tài khoản đang ở trạng thái pending (hiện tại: ${oldStatus}).`,
          });
          return;
        }

        const nextRole: CanonicalRole =
          targetRole === 'editor' || targetRole === 'teacher' ? targetRole : oldRole;

        await adminAuth.updateUser(targetUid, { disabled: false }).catch(() => undefined);
        await adminAuth.setCustomUserClaims(targetUid, {
          role: nextRole,
          approved: true,
        });

        await userRef.update({
          status: 'approved',
          role: nextRole,
          previousRole: nextRole,
          approvedAt: FieldValue.serverTimestamp(),
          approvedBy: actor.uid,
          rejectedAt: null,
          rejectedBy: null,
          rejectionReason: null,
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Ensure personal supporting collections exist once approved
        await adminDb
          .collection('userLibrary')
          .doc(targetUid)
          .set(
            {
              uid: targetUid,
              savedIds: [],
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

        await adminDb
          .collection('learningRecords')
          .doc(targetUid)
          .set(
            {
              uid: targetUid,
              goals: [],
              weeklyMinutes: 0,
              completedModules: 0,
              streakDays: 1,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

        await writeAuditLog(adminDb, {
          actorUid: actor.uid,
          actorEmail: actor.email,
          action: 'approve_teacher',
          targetUid,
          targetEmail: String(existingData.email || ''),
          targetName: String(existingData.fullName || ''),
          oldValue: { status: oldStatus, role: oldRole },
          newValue: { status: 'approved', role: nextRole },
        });

        res.json({
          ok: true,
          message: `Đã phê duyệt tài khoản ${existingData.fullName || targetUid} với vai trò ${nextRole}.`,
        });
      } catch (err) {
        res.status(500).json({
          error: 'Không thể phê duyệt tài khoản.',
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    }
  );

  app.post(
    '/api/admin/reject',
    requireAuth,
    requireAdminClaim,
    async (req: AuthenticatedRequest, res: Response) => {
      const adminDb = requireAdminSdkReady(res);
      if (!adminDb) return;

      const { targetUid, reason } = req.body as {
        targetUid?: unknown;
        reason?: unknown;
      };

      if (!isValidUid(targetUid)) {
        res.status(400).json({ error: 'UID tài khoản không hợp lệ.' });
        return;
      }

      const cleanReason = typeof reason === 'string' ? reason.trim().slice(0, 500) : '';
      if (cleanReason.length < 3) {
        res.status(400).json({
          error: 'Vui lòng nhập lý do từ chối tối thiểu 3 ký tự.',
        });
        return;
      }

      const actor = req.authUser!;

      try {
        const userRef = adminDb.collection('users').doc(targetUid);
        const snap = await userRef.get();
        if (!snap.exists) {
          res.status(404).json({ error: 'Không tìm thấy hồ sơ tài khoản.' });
          return;
        }

        const existingData = snap.data() || {};
        const oldStatus = normalizeStatus(existingData.status);
        const oldRole = normalizeRole(existingData.role);

        if (oldRole === 'admin') {
          res.status(403).json({ error: 'Không thể từ chối tài khoản Admin.' });
          return;
        }

        if (oldStatus !== 'pending') {
          res.status(409).json({
            error: `Chỉ có thể từ chối tài khoản đang ở trạng thái pending (hiện tại: ${oldStatus}).`,
          });
          return;
        }

        await adminAuth.setCustomUserClaims(targetUid, {
          role: 'teacher',
          approved: false,
        });

        await userRef.update({
          status: 'rejected',
          rejectedAt: FieldValue.serverTimestamp(),
          rejectedBy: actor.uid,
          rejectionReason: cleanReason,
          updatedAt: FieldValue.serverTimestamp(),
        });

        await writeAuditLog(adminDb, {
          actorUid: actor.uid,
          actorEmail: actor.email,
          action: 'reject_teacher',
          targetUid,
          targetEmail: String(existingData.email || ''),
          targetName: String(existingData.fullName || ''),
          oldValue: { status: oldStatus, role: oldRole },
          newValue: { status: 'rejected', role: oldRole },
          reason: cleanReason,
        });

        res.json({
          ok: true,
          message: `Đã từ chối tài khoản ${existingData.fullName || targetUid}.`,
        });
      } catch (err) {
        res.status(500).json({
          error: 'Không thể từ chối tài khoản.',
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    }
  );

  app.post(
    '/api/admin/suspend',
    requireAuth,
    requireAdminClaim,
    async (req: AuthenticatedRequest, res: Response) => {
      const adminDb = requireAdminSdkReady(res);
      if (!adminDb) return;

      const { targetUid, reason } = req.body as {
        targetUid?: unknown;
        reason?: unknown;
      };

      if (!isValidUid(targetUid)) {
        res.status(400).json({ error: 'UID tài khoản không hợp lệ.' });
        return;
      }

      const actor = req.authUser!;
      if (targetUid === actor.uid) {
        res.status(400).json({ error: 'Bạn không thể tự khóa tài khoản của chính mình.' });
        return;
      }

      const cleanReason =
        typeof reason === 'string' && reason.trim()
          ? reason.trim().slice(0, 500)
          : 'Tạm khóa bởi Quản trị viên hệ thống.';

      try {
        const userRef = adminDb.collection('users').doc(targetUid);
        const snap = await userRef.get();
        if (!snap.exists) {
          res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
          return;
        }

        const existingData = snap.data() || {};
        const oldStatus = normalizeStatus(existingData.status);
        const oldRole = normalizeRole(existingData.role);

        if (oldStatus === 'suspended') {
          res.status(409).json({ error: 'Tài khoản này đã ở trạng thái tạm khóa.' });
          return;
        }

        if (oldRole === 'admin' && oldStatus === 'approved') {
          const activeAdmins = await countActiveAdmins(adminDb);
          if (activeAdmins <= 1) {
            res.status(409).json({
              error: 'Không thể khóa tài khoản Admin hoạt động cuối cùng trong hệ thống.',
            });
            return;
          }
        }

        await adminAuth.updateUser(targetUid, { disabled: true });
        await adminAuth.setCustomUserClaims(targetUid, {
          role: oldRole,
          approved: false,
        });
        await adminAuth.revokeRefreshTokens(targetUid);

        await userRef.update({
          previousRole: oldRole,
          status: 'suspended',
          suspendedAt: FieldValue.serverTimestamp(),
          suspendedBy: actor.uid,
          suspendedReason: cleanReason,
          updatedAt: FieldValue.serverTimestamp(),
        });

        await writeAuditLog(adminDb, {
          actorUid: actor.uid,
          actorEmail: actor.email,
          action: 'suspend_user',
          targetUid,
          targetEmail: String(existingData.email || ''),
          targetName: String(existingData.fullName || ''),
          oldValue: { status: oldStatus, role: oldRole },
          newValue: { status: 'suspended', role: oldRole },
          reason: cleanReason,
        });

        res.json({
          ok: true,
          message: `Đã khóa tài khoản ${existingData.fullName || targetUid} và thu hồi phiên đăng nhập.`,
        });
      } catch (err) {
        res.status(500).json({
          error: 'Không thể khóa tài khoản.',
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    }
  );

  app.post(
    '/api/admin/unlock',
    requireAuth,
    requireAdminClaim,
    async (req: AuthenticatedRequest, res: Response) => {
      const adminDb = requireAdminSdkReady(res);
      if (!adminDb) return;

      const { targetUid, reason } = req.body as {
        targetUid?: unknown;
        reason?: unknown;
      };

      if (!isValidUid(targetUid)) {
        res.status(400).json({ error: 'UID tài khoản không hợp lệ.' });
        return;
      }

      const actor = req.authUser!;
      const cleanReason =
        typeof reason === 'string' && reason.trim()
          ? reason.trim().slice(0, 500)
          : 'Mở khóa tài khoản bởi Quản trị viên.';

      try {
        const userRef = adminDb.collection('users').doc(targetUid);
        const snap = await userRef.get();
        if (!snap.exists) {
          res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
          return;
        }

        const existingData = snap.data() || {};
        const oldStatus = normalizeStatus(existingData.status);
        const currentRole = normalizeRole(existingData.role);
        const prevRoleRaw = existingData.previousRole;
        const restoredRole: CanonicalRole = prevRoleRaw
          ? normalizeRole(prevRoleRaw)
          : currentRole;

        if (oldStatus !== 'suspended') {
          res.status(409).json({
            error: `Chỉ có thể mở khóa tài khoản đang bị tạm khóa (hiện tại: ${oldStatus}).`,
          });
          return;
        }

        await adminAuth.updateUser(targetUid, { disabled: false });
        await adminAuth.setCustomUserClaims(targetUid, {
          role: restoredRole,
          approved: true,
        });

        await userRef.update({
          status: 'approved',
          role: restoredRole,
          suspendedAt: null,
          suspendedBy: null,
          suspendedReason: null,
          approvedAt: existingData.approvedAt || FieldValue.serverTimestamp(),
          approvedBy: existingData.approvedBy || actor.uid,
          updatedAt: FieldValue.serverTimestamp(),
        });

        await writeAuditLog(adminDb, {
          actorUid: actor.uid,
          actorEmail: actor.email,
          action: 'unlock_user',
          targetUid,
          targetEmail: String(existingData.email || ''),
          targetName: String(existingData.fullName || ''),
          oldValue: { status: oldStatus, role: currentRole },
          newValue: { status: 'approved', role: restoredRole },
          reason: cleanReason,
        });

        res.json({
          ok: true,
          message: `Đã mở khóa tài khoản ${existingData.fullName || targetUid} với vai trò ${restoredRole}.`,
        });
      } catch (err) {
        res.status(500).json({
          error: 'Không thể mở khóa tài khoản.',
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    }
  );

  app.post(
    '/api/admin/set-role',
    requireAuth,
    requireAdminClaim,
    async (req: AuthenticatedRequest, res: Response) => {
      const adminDb = requireAdminSdkReady(res);
      if (!adminDb) return;

      const { targetUid, role, reason } = req.body as {
        targetUid?: unknown;
        role?: unknown;
        reason?: unknown;
      };

      if (!isValidUid(targetUid)) {
        res.status(400).json({ error: 'UID người dùng mục tiêu không hợp lệ.' });
        return;
      }

      if (
        role !== 'teacher' &&
        role !== 'editor' &&
        role !== 'admin' &&
        role !== 'Teacher' &&
        role !== 'Editor' &&
        role !== 'Admin'
      ) {
        res.status(400).json({ error: 'Vai trò phân quyền phải là teacher, editor hoặc admin.' });
        return;
      }

      const nextRole = normalizeRole(role);
      const actor = req.authUser!;
      const cleanReason =
        typeof reason === 'string' && reason.trim()
          ? reason.trim().slice(0, 500)
          : `Cập nhật phân quyền thành ${nextRole}`;

      try {
        const userRef = adminDb.collection('users').doc(targetUid);
        const snap = await userRef.get();
        if (!snap.exists) {
          res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng trong Firestore.' });
          return;
        }

        const existingData = snap.data() || {};
        const oldRole = normalizeRole(existingData.role);
        const status = normalizeStatus(existingData.status);

        if (oldRole === nextRole) {
          res.json({
            ok: true,
            customClaimsApplied: true,
            message: `Tài khoản đã mang vai trò ${nextRole}.`,
          });
          return;
        }

        if (oldRole === 'admin' && nextRole !== 'admin' && status === 'approved') {
          const activeAdmins = await countActiveAdmins(adminDb);
          if (activeAdmins <= 1) {
            res.status(409).json({
              error: 'Không thể hạ quyền tài khoản Admin hoạt động cuối cùng trong hệ thống.',
            });
            return;
          }
        }

        const isApproved = status === 'approved';
        await adminAuth.setCustomUserClaims(targetUid, {
          role: nextRole,
          approved: isApproved,
        });

        await userRef.update({
          role: nextRole,
          previousRole: nextRole,
          updatedAt: FieldValue.serverTimestamp(),
        });

        await writeAuditLog(adminDb, {
          actorUid: actor.uid,
          actorEmail: actor.email,
          action: 'set_role',
          targetUid,
          targetEmail: String(existingData.email || ''),
          targetName: String(existingData.fullName || ''),
          oldValue: { role: oldRole, status },
          newValue: { role: nextRole, status },
          reason: cleanReason,
        });

        res.json({
          ok: true,
          customClaimsApplied: true,
          message: `Đã cập nhật phân quyền thành ${nextRole} và đồng bộ Custom Claims cho ${existingData.fullName || targetUid}.`,
        });
      } catch (err) {
        res.status(500).json({
          error: 'Không thể cập nhật phân quyền trên Firebase Auth.',
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    }
  );

  app.get(
    '/api/admin/audit-logs',
    requireAuth,
    requireAdminClaim,
    async (_req: AuthenticatedRequest, res: Response) => {
      const adminDb = requireAdminSdkReady(res);
      if (!adminDb) return;

      try {
        const snap = await adminDb
          .collection('adminAuditLogs')
          .orderBy('createdAt', 'desc')
          .limit(100)
          .get();

        const logs = snap.docs.map((docItem) => {
          const data = docItem.data() || {};
          return {
            id: docItem.id,
            actorUid: String(data.actorUid || ''),
            actorEmail: String(data.actorEmail || ''),
            actorRole: normalizeRole(data.actorRole),
            action: String(data.action || ''),
            targetUid: String(data.targetUid || ''),
            targetEmail: String(data.targetEmail || ''),
            targetName: String(data.targetName || ''),
            oldValue: (data.oldValue as Record<string, unknown>) || {},
            newValue: (data.newValue as Record<string, unknown>) || {},
            reason: String(data.reason || ''),
            createdAt: toIsoString(data.createdAt) || new Date(0).toISOString(),
          };
        });

        res.json({ logs });
      } catch (err) {
        res.status(500).json({
          error: 'Không thể tải nhật ký hoạt động quản trị.',
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    }
  );

  return app;
}
