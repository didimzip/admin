import type { UserWithProfile } from "@/types/user";
import { mockUsers } from "@/data/mock-users";

const STORAGE_KEY = "didimzip_admin_users";

function loadAll(): UserWithProfile[] {
  if (typeof window === "undefined") return mockUsers;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as UserWithProfile[];
    // 최초 실행 시 mock 데이터 저장
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUsers));
    return mockUsers;
  } catch {
    return mockUsers;
  }
}

function saveAll(users: UserWithProfile[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function getAllUsers(): UserWithProfile[] {
  return loadAll();
}

export function updateUser(updated: UserWithProfile): void {
  const users = loadAll();
  saveAll(users.map((u) => (u.id === updated.id ? updated : u)));
}

export function deleteUsers(ids: string[]): void {
  saveAll(loadAll().filter((u) => !ids.includes(u.id)));
}

export function saveUsers(users: UserWithProfile[]): void {
  saveAll(users);
}

export function restoreUsers(items: UserWithProfile[]): void {
  const current = loadAll();
  const existingIds = new Set(current.map((u) => u.id));
  saveAll([...items.filter((u) => !existingIds.has(u.id)), ...current]);
}
