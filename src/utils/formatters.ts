import { SCHOOL_STAGE_OPTIONS, SUBJECT_OPTIONS } from '@/src/config/curriculum';
import { SchoolStage, SubjectId } from '@/src/types';

export function getSubjectLabel(subjectId: SubjectId): string {
  return SUBJECT_OPTIONS.find((item) => item.id === subjectId)?.name ?? 'Chưa chọn môn';
}

export function getStageLabel(stage: SchoolStage): string {
  return SCHOOL_STAGE_OPTIONS.find((item) => item.id === stage)?.label ?? 'THPT';
}

export function formatGradesLabel(grades: number[]): string {
  if (!grades.length) return 'Chưa chọn khối lớp';
  const sorted = [...grades].sort((a, b) => a - b);
  return `Lớp ${sorted.join(', ')}`;
}

export function formatMinutesToHours(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins} phút`;
  if (mins === 0) return `${hours} giờ`;
  return `${hours} giờ ${mins} phút`;
}

export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'GV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function clampPercentage(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
