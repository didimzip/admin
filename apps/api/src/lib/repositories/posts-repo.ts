import type {
  Post,
  PostCreateInput,
  PostListQuery,
  PostStatus,
  PostUpdateInput,
} from "@didimzip/api";
import { readDb, writeDb } from "../db";

// ─── Posts Repository (교체 이음새) ──────────────────────────────────────────
//
// admin/web 은 이 repository 를 직접 쓰지 않고 API(Route Handler)를 통해 접근한다.
// PostgreSQL + Prisma 전환 시 아래 함수 구현만 Prisma 쿼리로 교체하면 되고,
// 함수 시그니처(계약)는 그대로 유지되므로 Route Handler·Client·UI는 무수정.

/**
 * 조회 시점에 유효 상태를 계산해 중앙화한다.
 * - SCHEDULED 이면서 예약시각이 지났으면 PUBLISHED
 * - PUBLISHED 이면서 게시종료일 다음날이 지났으면 HIDDEN
 * (기존 admin이 클라이언트 타이머로 하던 일을 서버로 이관 → admin·web 상태 일관)
 */
function effectiveStatus(p: Post, now: Date): PostStatus {
  if (p.status === "SCHEDULED" && p.scheduledAt && new Date(p.scheduledAt) <= now) {
    return "PUBLISHED";
  }
  if (p.status === "PUBLISHED" && p.publishEnd) {
    const end = new Date(p.publishEnd);
    const hideAt = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1, 0, 0, 0, 0);
    if (hideAt <= now) return "HIDDEN";
  }
  return p.status;
}

function withEffectiveStatus(p: Post): Post {
  return { ...p, status: effectiveStatus(p, new Date()) };
}

export const postsRepository = {
  async findAll(query?: PostListQuery): Promise<Post[]> {
    let posts = readDb().posts.map(withEffectiveStatus);

    if (query?.status) {
      posts = posts.filter((p) => p.status === query.status);
    }
    if (query?.category && query.category !== "전체") {
      posts = posts.filter((p) => p.category === query.category);
    }
    if (query?.q) {
      const q = query.q.toLowerCase();
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async findById(id: string): Promise<Post | null> {
    const found = readDb().posts.find((p) => p.id === id);
    return found ? withEffectiveStatus(found) : null;
  },

  async create(input: PostCreateInput): Promise<Post> {
    const db = readDb();
    const now = new Date().toISOString();
    const post: Post = {
      ...input,
      id: `post_${Date.now()}`,
      viewCount: input.viewCount ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    db.posts.unshift(post);
    writeDb(db);
    return post;
  },

  async update(id: string, input: PostUpdateInput): Promise<Post | null> {
    const db = readDb();
    const idx = db.posts.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    const existing = db.posts[idx];
    const updated: Post = {
      ...existing,
      ...input,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    db.posts[idx] = updated;
    writeDb(db);
    return updated;
  },

  async remove(id: string): Promise<boolean> {
    const db = readDb();
    const before = db.posts.length;
    db.posts = db.posts.filter((p) => p.id !== id);
    if (db.posts.length === before) return false;
    writeDb(db);
    return true;
  },
};
