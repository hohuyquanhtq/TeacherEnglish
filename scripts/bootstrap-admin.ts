import 'dotenv/config';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, getAdminDb, hasServiceAccount } from '../server/firebaseAdmin.js';

function getUidArg(): string | null {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--uid' && args[i + 1]) {
      return args[i + 1].trim();
    }
    if (args[i].startsWith('--uid=')) {
      return args[i].slice('--uid='.length).trim();
    }
  }
  if (args[0] && !args[0].startsWith('--')) {
    return args[0].trim();
  }
  return process.env.INITIAL_ADMIN_UID?.trim() || null;
}

async function main() {
  if (!hasServiceAccount) {
    console.error(
      'Lỗi: Chưa tìm thấy FIREBASE_SERVICE_ACCOUNT_KEY trong biến môi trường hoặc .env.'
    );
    process.exit(1);
  }

  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error('Lỗi: Không thể kết nối Firestore qua Firebase Admin SDK.');
    process.exit(1);
  }

  const uid = getUidArg();
  if (!uid || !/^[a-zA-Z0-9_-]{1,128}$/.test(uid)) {
    console.error(
      'Cách dùng: npm run bootstrap:admin -- --uid <FIREBASE_AUTH_UID>'
    );
    process.exit(1);
  }

  // Disabled automatically once an active approved Admin already exists
  const existingAdminsSnap = await adminDb
    .collection('users')
    .where('status', '==', 'approved')
    .get();

  const alreadyHasAdmin = existingAdminsSnap.docs.some((docItem) => {
    const role = String(docItem.data().role || '').toLowerCase();
    return role === 'admin';
  });

  if (alreadyHasAdmin) {
    console.error(
      'Từ chối thực thi: Hệ thống đã có tài khoản Admin hoạt động. Cơ chế bootstrap đã tự động vô hiệu hóa.'
    );
    process.exit(1);
  }

  const userRecord = await adminAuth.getUser(uid);

  await adminAuth.updateUser(uid, { disabled: false });
  await adminAuth.setCustomUserClaims(uid, {
    role: 'admin',
    approved: true,
  });

  const userRef = adminDb.collection('users').doc(uid);
  const existingUserDoc = await userRef.get();

  if (existingUserDoc.exists) {
    await userRef.update({
      role: 'admin',
      previousRole: 'admin',
      status: 'approved',
      approvedAt: FieldValue.serverTimestamp(),
      approvedBy: 'bootstrap-script',
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    await userRef.set({
      uid,
      fullName: userRecord.displayName || 'Quản trị viên hệ thống',
      email: userRecord.email || '',
      school: 'Quản trị hệ thống Teacher English',
      schoolName: 'Quản trị hệ thống Teacher English',
      educationLevel: 'THPT',
      subject: 'english',
      primarySubject: 'english',
      subjects: ['english'],
      schoolStage: 'thpt',
      grades: [10, 11, 12],
      province: 'TP. Hồ Chí Minh',
      phone: '',
      teacherPosition: 'Ban giám hiệu',
      yearsOfExperience: 5,
      bio: 'Tài khoản quản trị viên hệ thống được khởi tạo qua Admin SDK.',
      currentLevel: 'C1',
      targetLevel: 'C2',
      weeklyMinutesTarget: 180,
      onboardingCompleted: true,
      role: 'admin',
      previousRole: 'admin',
      status: 'approved',
      approvedAt: FieldValue.serverTimestamp(),
      approvedBy: 'bootstrap-script',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  const logRef = adminDb.collection('adminAuditLogs').doc();
  await logRef.set({
    id: logRef.id,
    actorUid: 'bootstrap-script',
    actorEmail: userRecord.email || '',
    actorRole: 'admin',
    action: 'bootstrap_admin',
    targetUid: uid,
    targetEmail: userRecord.email || '',
    targetName: userRecord.displayName || 'Admin đầu tiên',
    oldValue: { role: 'none', status: 'none' },
    newValue: { role: 'admin', status: 'approved' },
    reason: 'Khởi tạo tài khoản Admin đầu tiên qua CLI Admin SDK (tự vô hiệu hóa sau khi hoàn tất).',
    createdAt: FieldValue.serverTimestamp(),
  });

  console.log(
    `Thành công: Đã khởi tạo Admin đầu tiên cho UID=${uid} (${userRecord.email || 'no-email'}). Cơ chế bootstrap hiện đã khóa.`
  );
}

main().catch((err) => {
  console.error('Lỗi khởi tạo Admin đầu tiên:', err);
  process.exit(1);
});
