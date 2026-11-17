# Teacher English — Security Specification (Phase 2 Upgrade)

## 1. Data Invariants
1. A user cannot assign themselves `admin` or `editor` role, nor `status: "approved"`, on document creation or update (`users/{uid}`). Self-registration strictly forces `role: "teacher"` and `status: "pending"`.
2. Authorization relies on verified Firebase Custom Claims (`request.auth.token.role`, `request.auth.token.approved == true`). Hardcoded email auto-escalation is prohibited.
3. Unapproved (`pending`), `rejected`, and `suspended` accounts can only read their own `users/{uid}` status document and are denied access to `subjects`, `lessons`, `classroomEnglish`, `quizzes`, `userLibrary`, `aiSessions`, `learningRecords`, and `systemSettings`.
4. A user can never read, list, update, or delete another user's private document (`users/{otherUid}`, `userLibrary/{otherUid}`, `aiSessions/{otherUid}`, `learningRecords/{otherUid}`).
5. Curriculum collections (`subjects`, `lessons`, `classroomEnglish`, `quizzes`) are readable only by approved users and writable only by approved `editor` or `admin`.
6. `systemSettings/{settingId}` is writable only by approved `admin`.
7. `adminAuditLogs/{logId}` is readable only by approved `admin` and is strictly immutable from client SDKs (`allow write: if false`) — created solely via trusted backend Admin SDK.
8. No client-forged timestamps (`createdAt`, `updatedAt` must match `request.time`) and no arbitrary shadow fields (`hasOnly` enforced).
9. Document path variables must match `^[a-zA-Z0-9_-]+$` and max length <= 128 chars.

## 2. "Dirty Dozen" Attack Payloads (Must Return PERMISSION_DENIED)
1. **Self-Role Escalation on Create**: Creating `users/{myUid}` with `role: "admin"`.
2. **Self-Approval on Create/Update**: Creating or updating `users/{myUid}` with `status: "approved"` or `approvedBy`.
3. **Self-Role Escalation on Update**: Updating `users/{myUid}` with `role: "editor"`.
4. **Pending/Rejected/Suspended Curriculum Access**: Reading `subjects/math` or `lessons/lesson_1` when `approved != true`.
5. **Cross-User Profile Read**: Reading `users/{otherUid}` as an approved `teacher`.
6. **Cross-User Library Write**: Writing `userLibrary/{otherUid}` as `myUid`.
7. **Cross-User Learning Record Read**: Reading `learningRecords/{otherUid}` as `myUid`.
8. **Shadow Field Injection**: Updating `users/{myUid}` with an unexpected key `isVerifiedAdmin: true`.
9. **Teacher Writing Curriculum**: Creating/updating `lessons/{lessonId}` as an approved `teacher`.
10. **Editor Writing System Settings**: Updating `systemSettings/global` as an approved `editor` (must be `admin` only).
11. **Client Forging Audit Logs**: Creating or deleting `adminAuditLogs/{logId}` from client SDK (even as Admin).
12. **Forged Timestamp / Immutable Field Mutation**: Updating `createdAt` or `uid` on `users/{myUid}`.
