import { mockMentors, type Mentor, type MentorStatus } from "@/data/mock-data";

const STORAGE_KEY = "didimzip_admin_mentors";

function loadAll(): Mentor[] {
  if (typeof window === "undefined") return mockMentors;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Mentor[];
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

export function updateMentorStatus(
  id: string,
  status: MentorStatus,
  rejectReason?: string
): void {
  const mentors = loadAll();
  const idx = mentors.findIndex((m) => m.id === id);
  if (idx === -1) return;

  const now = new Date().toISOString();
  mentors[idx] = {
    ...mentors[idx],
    status,
    updatedAt: now,
    ...(status === "APPROVED" ? { approvedAt: now } : {}),
    ...(rejectReason !== undefined ? { rejectReason } : {}),
  };
  saveAll(mentors);
}
