import { mockComments, type Comment, type CommentStatus } from "@/data/mock-data";

const STORAGE_KEY = "didimzip_admin_comments";

function loadAll(): Comment[] {
  if (typeof window === "undefined") return mockComments;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && raw !== "[]") {
      const stored = JSON.parse(raw) as Comment[];
      // mock 데이터 중 localStorage에 없는 항목 병합
      const storedIds = new Set(stored.map((c) => c.id));
      const missing = mockComments.filter((c) => !storedIds.has(c.id));
      if (missing.length > 0) {
        const merged = [...stored, ...missing];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
      return stored;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockComments));
    return [...mockComments];
  } catch {
    return mockComments;
  }
}

function saveAll(comments: Comment[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
}

export function getAllComments(): Comment[] {
  return loadAll();
}

export function getCommentsByPostId(postId: string): Comment[] {
  return loadAll().filter((c) => c.postId === postId);
}

export function updateCommentStatus(id: string, status: CommentStatus): void {
  const comments = loadAll();
  saveAll(
    comments.map((c) => (c.id === id ? { ...c, status } : c))
  );
}

export function deleteComment(id: string): void {
  saveAll(loadAll().filter((c) => c.id !== id));
}

export function deleteComments(ids: string[]): void {
  const idSet = new Set(ids);
  saveAll(loadAll().filter((c) => !idSet.has(c.id)));
}

/** localStorage를 mock 초기값으로 완전 리셋 */
export function resetComments(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
