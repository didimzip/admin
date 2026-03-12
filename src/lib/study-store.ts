import { mockStudies, type Study, type StudyStatus } from "@/data/mock-data";

const STORAGE_KEY = "didimzip_admin_studies";

function loadAll(): Study[] {
  if (typeof window === "undefined") return mockStudies;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && raw !== "[]") {
      const stored = JSON.parse(raw) as Study[];
      // mock 데이터 중 localStorage에 없는 항목 병합
      const storedIds = new Set(stored.map((s) => s.id));
      const missing = mockStudies.filter((s) => !storedIds.has(s.id));
      if (missing.length > 0) {
        const merged = [...stored, ...missing];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
      return stored;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockStudies));
    return [...mockStudies];
  } catch {
    return mockStudies;
  }
}

function saveAll(studies: Study[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(studies));
}

export function getAllStudies(): Study[] {
  return loadAll();
}

export function getStudy(id: string): Study | undefined {
  return loadAll().find((s) => s.id === id);
}

export function upsertStudy(
  data: Omit<Study, "id" | "createdAt" | "updatedAt"> & { id?: string | null }
): Study {
  const studies = loadAll();
  const now = new Date().toISOString();
  const existing = data.id ? studies.find((s) => s.id === data.id) : undefined;

  if (existing) {
    const updated: Study = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: now,
    };
    saveAll(studies.map((s) => (s.id === existing.id ? updated : s)));
    return updated;
  }

  const newStudy: Study = {
    ...(data as Omit<Study, "id" | "createdAt" | "updatedAt">),
    id: `study_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  saveAll([newStudy, ...studies]);
  return newStudy;
}

export function deleteStudy(id: string): void {
  saveAll(loadAll().filter((s) => s.id !== id));
}

export function deleteStudies(ids: string[]): void {
  const idSet = new Set(ids);
  saveAll(loadAll().filter((s) => !idSet.has(s.id)));
}

export function restoreStudies(items: Study[]): void {
  const current = loadAll();
  const existingIds = new Set(current.map((s) => s.id));
  saveAll([...items.filter((s) => !existingIds.has(s.id)), ...current]);
}

export function updateStudyStatus(id: string, status: StudyStatus): void {
  const studies = loadAll();
  const now = new Date().toISOString();
  saveAll(
    studies.map((s) => (s.id === id ? { ...s, status, updatedAt: now } : s))
  );
}
