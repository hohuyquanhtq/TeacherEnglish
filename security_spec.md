# Teacher English — Security Specification (Phase 2)

## 1. Data Invariants
1. A user cannot assign themselves `Admin` or `Editor` role on document creation or update (`users/{uid}`). Only `Teacher` is allowed on self-registration.
2. A user can never read, list, update, or delete another user's private document (`users/{otherUid}`, `userLibrary/{otherUid}`, `aiSessions/{otherUid}`, `learningRecords/{otherUid}`).
3. Curriculum collections (`subjects`, `lessons`, `classroomEnglish`, `quizzes`) are readable only by authenticated users and writable only by `Editor` or `Admin`.
4. `systemSettings/{settingId}` is writable only by `Admin`.
5. No client-forged timestamps (`createdAt`, `updatedAt` must match `request.time`) and no arbitrary shadow fields (`hasOnly` enforced).
6. Document path variables must match `^[a-zA-Z0-9_-]+$` and max length <= 128 chars.

## 2. "Dirty Dozen" Attack Payloads (Must Return PERMISSION_DENIED)
1. **Self-Role Escalation on Create**: Creating `users/{myUid}` with `role: "Admin"`.
2. **Self-Role Escalation on Update**: Updating `users/{myUid}` with `role: "Editor"`.
3. **Cross-User Profile Read**: Reading `users/{otherUid}` as a `Teacher`.
4. **Cross-User Library Write**: Writing `userLibrary/{otherUid}` as `myUid`.
5. **Cross-User Learning Record Read**: Reading `learningRecords/{otherUid}` as `myUid`.
6. **Cross-User AI Session Read**: Reading `aiSessions/{otherUid}` as `myUid`.
7. **Shadow Field Injection**: Updating `users/{myUid}` with an unexpected key `isVerifiedAdmin: true`.
8. **Teacher Writing Curriculum**: Creating/updating `lessons/{lessonId}` as a `Teacher`.
9. **Editor Writing System Settings**: Updating `systemSettings/global` as an `Editor` (must be `Admin` only).
10. **Unauthenticated Read**: Reading `subjects/math` without authentication.
11. **Oversized String Poisoning**: Writing `fullName` with length > 120 characters or `bio` > 1000 characters.
12. **Forged Timestamp / Immutable Field Mutation**: Updating `createdAt` or `uid` on `users/{myUid}`.
