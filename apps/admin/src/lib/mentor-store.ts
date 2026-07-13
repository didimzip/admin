import { mockMentors, type Mentor, type MentorStatus } from "@/data/mock-data";

const STORAGE_KEY = "didimzip_admin_mentors";

function loadAll(): Mentor[] {
  if (typeof window === "undefined") return mockMentors;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as Mentor[];
      // mock 데이터 중 localStorage에 없는 항목 병합
      const storedIds = new Set(stored.map((m) => m.id));
      const missing = mockMentors.filter((m) => !storedIds.has(m.id));
      if (missing.length > 0) {
        const merged = [...stored, ...missing];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
      return stored;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockMentors));
    return mockMentors;
  } catch {
    return mockMentors;
  }
}

function saveAll(mentors: Mentor[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mentors));
}

export function getAllMentors(): Mentor[] {
  return loadAll();
}

export function getMentor(id: string): Mentor | undefined {
  return loadAll().find((m) => m.id === id);
}

export function upsertMentor(
  data: Omit<Mentor, "id" | "createdAt" | "updatedAt"> & {
    id?: string | null;
  }
): Mentor {
  const mentors = loadAll();
  const now = new Date().toISOString();

  if (data.id) {
    const idx = mentors.findIndex((m) => m.id === data.id);
    if (idx !== -1) {
      const existing = mentors[idx];
      const updated: Mentor = {
        ...existing,
        ...data,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: now,
      };
      mentors[idx] = updated;
      saveAll(mentors);
      return updated;
    }
  }

  const newMentor: Mentor = {
    ...data,
    id: `mentor_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  } as Mentor;

  mentors.unshift(newMentor);
  saveAll(mentors);
  return newMentor;
}

export function deleteMentor(id: string): void {
  const mentors = loadAll().filter((m) => m.id !== id);
  saveAll(mentors);
}

export function deleteMentors(ids: string[]): void {
  const idSet = new Set(ids);
  const mentors = loadAll().filter((m) => !idSet.has(m.id));
  saveAll(mentors);
}

export function restoreMentors(items: Mentor[]): void {
  const current = loadAll();
  const existingIds = new Set(current.map((m) => m.id));
  saveAll([...items.filter((m) => !existingIds.has(m.id)), ...current]);
}

export function updateMentorStatus(
  id: string,
  status: MentorStatus,
  rejectReason?: string
): void {
  const mentors = loadAll();
  const idx = mentors.findIndex((m) => m.id === id);
  if (idx === -1) return;

  const now = new Date().toISOString();
  const prev = mentors[idx];

  // 승인: 최초 승인일만 기록, 재개(SUSPENDED→APPROVED) 시 기존 approvedAt 유지
  const approvedAt =
    status === "APPROVED" && !prev.approvedAt ? now : prev.approvedAt;

  // 승인 시 이전 반려사유 초기화 / 반려 시 사유 기록
  const nextRejectReason =
    status === "APPROVED" || status === "SUSPENDED"
      ? ""
      : rejectReason !== undefined
        ? rejectReason
        : prev.rejectReason;

  mentors[idx] = {
    ...prev,
    status,
    updatedAt: now,
    approvedAt,
    rejectReason: nextRejectReason,
  };
  saveAll(mentors);
}
