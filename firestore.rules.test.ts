/**
 * Security Rule Verification Specification for Teacher English (Phase 2 Upgrade)
 * Maps all 12 adversarial "Dirty Dozen" payloads from security_spec.md
 * against firestore.rules invariants.
 */

export interface SecurityTestCase {
  id: string;
  description: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  actorRole: 'anonymous' | 'teacher' | 'editor' | 'admin';
  actorApproved: boolean;
  actorUid: string | null;
  targetUid?: string;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED' | 'ALLOWED';
}

export const DIRTY_DOZEN_CASES: SecurityTestCase[] = [
  {
    id: 'DD-01',
    description: 'User cannot self-assign admin role on user creation',
    collectionPath: 'users/teacher_1',
    operation: 'create',
    actorRole: 'teacher',
    actorApproved: false,
    actorUid: 'teacher_1',
    targetUid: 'teacher_1',
    payload: { uid: 'teacher_1', role: 'admin', status: 'pending', fullName: 'Attacker' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-02',
    description: 'User cannot self-approve account on creation or update',
    collectionPath: 'users/teacher_1',
    operation: 'update',
    actorRole: 'teacher',
    actorApproved: false,
    actorUid: 'teacher_1',
    targetUid: 'teacher_1',
    payload: { status: 'approved', approvedBy: 'teacher_1' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-03',
    description: 'Approved teacher cannot self-escalate role to editor on update',
    collectionPath: 'users/teacher_1',
    operation: 'update',
    actorRole: 'teacher',
    actorApproved: true,
    actorUid: 'teacher_1',
    targetUid: 'teacher_1',
    payload: { role: 'editor' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-04',
    description: 'Pending teacher cannot read curriculum subjects',
    collectionPath: 'subjects/math',
    operation: 'get',
    actorRole: 'teacher',
    actorApproved: false,
    actorUid: 'pending_teacher',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-05',
    description: 'Approved teacher cannot read another teacher profile (PII isolation)',
    collectionPath: 'users/teacher_2',
    operation: 'get',
    actorRole: 'teacher',
    actorApproved: true,
    actorUid: 'teacher_1',
    targetUid: 'teacher_2',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-06',
    description: 'Teacher cannot write to another user library',
    collectionPath: 'userLibrary/teacher_2',
    operation: 'update',
    actorRole: 'teacher',
    actorApproved: true,
    actorUid: 'teacher_1',
    targetUid: 'teacher_2',
    payload: { uid: 'teacher_2', savedIds: ['x'] },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-07',
    description: 'Teacher cannot read another user learningRecords',
    collectionPath: 'learningRecords/teacher_2',
    operation: 'get',
    actorRole: 'teacher',
    actorApproved: true,
    actorUid: 'teacher_1',
    targetUid: 'teacher_2',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-08',
    description: 'Shadow field injection rejected by hasOnly() blueprint',
    collectionPath: 'users/teacher_1',
    operation: 'update',
    actorRole: 'teacher',
    actorApproved: true,
    actorUid: 'teacher_1',
    targetUid: 'teacher_1',
    payload: { fullName: 'Valid', isVerifiedAdmin: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-09',
    description: 'Approved teacher cannot create or edit curriculum lessons',
    collectionPath: 'lessons/lesson_1',
    operation: 'create',
    actorRole: 'teacher',
    actorApproved: true,
    actorUid: 'teacher_1',
    payload: { id: 'lesson_1', title: 'Injected Lesson' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-10',
    description: 'Approved editor cannot modify systemSettings (Admin only)',
    collectionPath: 'systemSettings/global',
    operation: 'update',
    actorRole: 'editor',
    actorApproved: true,
    actorUid: 'editor_1',
    payload: { id: 'global', allowSelfRegistration: false },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-11',
    description: 'Client SDK cannot write or forge adminAuditLogs',
    collectionPath: 'adminAuditLogs/log_1',
    operation: 'create',
    actorRole: 'admin',
    actorApproved: true,
    actorUid: 'admin_1',
    payload: { id: 'log_1', action: 'approve_teacher' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-12',
    description: 'Client cannot mutate immutable uid or createdAt fields',
    collectionPath: 'users/teacher_1',
    operation: 'update',
    actorRole: 'teacher',
    actorApproved: true,
    actorUid: 'teacher_1',
    targetUid: 'teacher_1',
    payload: { uid: 'other_uid', createdAt: '2020-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
];
