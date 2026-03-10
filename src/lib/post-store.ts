export type StoredPost = {
  id: string;
  title: string;
  body: string; // TipTap HTML
  category: string;
  subCategory: string;
  thumbnailPreview: string;
  relatedLinks: Array<{ label: string; url: string }>;
  attachments: Array<{ name: string; size: number; dataUrl: string }>;
  tags: string[];
  publishStart: string;
  publishEnd: string;
  isScheduled: boolean;
  scheduledAt: string;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "HIDDEN";
  showConsultButton: boolean;
  authorId?: string;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "didimzip_admin_posts";

function loadAll(): StoredPost[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as StoredPost[];
  } catch {
    return [];
  }
}

function saveAll(posts: StoredPost[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

export function getAllPosts(): StoredPost[] {
  return loadAll();
}

export function getPost(id: string): StoredPost | undefined {
  return loadAll().find((p) => p.id === id);
}

export function getDrafts(): StoredPost[] {
  return loadAll().filter((p) => p.status === "DRAFT");
}

export function upsertPost(
  data: Omit<StoredPost, "id" | "createdAt" | "updatedAt"> & { id?: string | null }
): StoredPost {
  const posts = loadAll();
  const now = new Date().toISOString();
  const existing = data.id ? posts.find((p) => p.id === data.id) : undefined;

  if (existing) {
    const updated: StoredPost = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: now,
    };
    saveAll(posts.map((p) => (p.id === existing.id ? updated : p)));
    if (typeof window !== "undefined" && updated.status === "SCHEDULED" && updated.scheduledAt) {
      window.dispatchEvent(new CustomEvent("scheduled-post-saved", {
        detail: { id: updated.id, scheduledAt: updated.scheduledAt },
      }));
    }
    return updated;
  }

  const newPost: StoredPost = {
    ...(data as Omit<StoredPost, "id" | "createdAt" | "updatedAt">),
    id: `post_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  saveAll([newPost, ...posts]);
  if (typeof window !== "undefined" && newPost.status === "SCHEDULED" && newPost.scheduledAt) {
    window.dispatchEvent(new CustomEvent("scheduled-post-saved", {
      detail: { id: newPost.id, scheduledAt: newPost.scheduledAt },
    }));
  }
  return newPost;
}

export function deletePost(id: string): void {
  saveAll(loadAll().filter((p) => p.id !== id));
}

/**
 * PUBLISHED 상태인 게시물 중 publishEnd가 지난 것을 HIDDEN으로 변환.
 * 기준: 종료일 다음날 00:00:00 (로컬 시각). 즉, 종료일 당일은 노출 유지.
 * 변경된 건수를 반환.
 */
export function hideExpiredPosts(): number {
  const posts = loadAll();
  const now = new Date();
  let changed = 0;
  const updated = posts.map((p) => {
    if (p.status === "PUBLISHED" && p.publishEnd) {
      const end = new Date(p.publishEnd);
      // 종료일 다음날 00:00:00 (로컬 시각)
      const hideAt = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1, 0, 0, 0, 0);
      if (hideAt <= now) {
        changed++;
        return { ...p, status: "HIDDEN" as const, updatedAt: now.toISOString() };
      }
    }
    return p;
  });
  if (changed > 0) {
    saveAll(updated);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("posts-updated"));
    }
  }
  return changed;
}

/**
 * 저장된 모든 게시물의 태그를 중복 없이 반환.
 */
export function getAllTags(): string[] {
  const posts = loadAll();
  const tagSet = new Set<string>();
  posts.forEach((p) => p.tags?.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet);
}

/**
 * SCHEDULED 상태인 게시물 중 scheduledAt이 현재 시각 이전인 것을 PUBLISHED로 변환.
 * 변경된 건수를 반환. 변경이 있으면 'posts-updated' 커스텀 이벤트를 dispatch.
 */
export function publishScheduledPosts(): number {
  const posts = loadAll();
  const now = new Date();
  let changed = 0;
  const updated = posts.map((p) => {
    if (p.status === "SCHEDULED" && p.scheduledAt && new Date(p.scheduledAt) <= now) {
      changed++;
      return { ...p, status: "PUBLISHED" as const, updatedAt: now.toISOString() };
    }
    return p;
  });
  if (changed > 0) {
    saveAll(updated);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("posts-updated"));
    }
  }
  return changed;
}

/** 저장 전 Base64 이미지를 최대 800px / JPEG 0.65 품질로 압축 */
export async function compressImageForStorage(base64: string): Promise<string> {
  if (!base64 || !base64.startsWith("data:image")) return base64;
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX_W = 800;
      let w = img.width;
      let h = img.height;
      if (w > MAX_W) {
        h = Math.round((h * MAX_W) / w);
        w = MAX_W;
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.65));
    };
    img.onerror = () => resolve("");
    img.src = base64;
  });
}
