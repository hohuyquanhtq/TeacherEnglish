/**
 * Security Rule Verification Specification for Teacher English (Phase 2)
 * Maps all 12 adversarial "Dirty Dozen" payloads from security_spec.md
 * against firestore.rules invariants.
 */

export interface SecurityTestCase {
  id: string;
  description: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  actorRole: 'anonymous' | 'Teacher' | 'Editor' | 'Admin';
  actorUid: string | null;
  targetUid?: string;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED' | 'ALLOWED';
}

export const DIRTY_DOZEN_CASES: SecurityTestCase[] = [
  {
    id: 'DD-01',
    description: 'Teacher cannot self-assign Admin role on user creation',
    collectionPath: 'users/teacher_1',
    operation: 'create',
    actorRole: 'Teacher',
    actorUid: 'teacher_1',
    targetUid: 'teacher_1',
    payload: { uid: 'teacher_1', role: 'Admin', fullName: 'Attacker' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-02',
    description: 'Teacher cannot self-escalate role to Editor on update',
    collectionPath: 'users/teacher_1',
    operation: 'update',
    actorRole: 'Teacher',
    actorUid: 'teacher_1',
    targetUid: 'teacher_1',
    payload: { role: 'Editor' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-03',
    description: 'Teacher cannot read another teacher profile (PII isolation)',
    collectionPath: 'users/teacher_2',
    operation: 'get',
    actorRole: 'Teacher',
    actorUid: 'teacher_1',
    targetUid: 'teacher_2',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-04',
    description: 'Teacher cannot write to another user library',
    collectionPath: 'userLibrary/teacher_2',
    operation: 'update',
    actorRole: 'Teacher',
    actorUid: 'teacher_1',
    targetUid: 'teacher_2',
    payload: { uid: 'teacher_2', savedIds: ['x'] },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-05',
    description: 'Teacher cannot read another user learningRecords',
    collectionPath: 'learningRecords/teacher_2',
    operation: 'get',
    actorRole: 'Teacher',
    actorUid: 'teacher_1',
    targetUid: 'teacher_2',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-06',
    description: 'Teacher cannot read another user aiSessions',
    collectionPath: 'aiSessions/teacher_2',
    operation: 'get',
    actorRole: 'Teacher',
    actorUid: 'teacher_1',
    targetUid: 'teacher_2',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-07',
    description: 'Shadow field injection rejected by hasOnly() blueprint',
    collectionPath: 'users/teacher_1',
    operation: 'update',
    actorRole: 'Teacher',
    actorUid: 'teacher_1',
    targetUid: 'teacher_1',
    payload: { fullName: 'Valid', isVerifiedAdmin: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-08',
    description: 'Teacher cannot create or edit curriculum lessons',
    collectionPath: 'lessons/lesson_1',
    operation: 'create',
    actorRole: 'Teacher',
    actorUid: 'teacher_1',
    payload: { id: 'lesson_1', title: 'Injected Lesson' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-09',
    description: 'Editor cannot modify systemSettings (Admin only)',
    collectionPath: 'systemSettings/global',
    operation: 'update',
    actorRole: 'Editor',
    actorUid: 'editor_1',
    payload: { id: 'global', allowSelfRegistration: false },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-10',
    description: 'Unauthenticated user cannot read curriculum subjects',
    collectionPath: 'subjects/math',
    operation: 'get',
    actorRole: 'anonymous',
    actorUid: null,
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-11',
    description: 'Oversized fullName (>120 chars) rejected by boundary guard',
    collectionPath: 'users/teacher_1',
    operation: 'update',
    actorRole: 'Teacher',
    actorUid: 'teacher_1',
    targetUid: 'teacher_1',
    payload: { fullName: 'A'.repeat(150) },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-12',
    description: 'Client cannot mutate immutable uid or createdAt fields',
    collectionPath: 'users/teacher_1',
    operation: 'update',
    actorRole: 'Teacher',
    actorUid: 'teacher_1',
    targetUid: 'teacher_1',
    payload: { uid: 'other_uid', createdAt: '2020-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
];
