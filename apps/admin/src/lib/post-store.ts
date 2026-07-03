import { postsApi, type Post, type PostCreateInput, type PostUpdateInput } from "@didimzip/api";

// ─── 게시글 스토어 (API 기반) ────────────────────────────────────────────────
//
// 기존 localStorage 구현을 공유 Mock API(@didimzip/api)로 전환.
// admin은 계속 StoredPost 형태를 사용하고, 이 모듈이 API의 Post 모델과 매핑한다.
// 실백엔드 전환 시에도 admin 화면 코드는 무수정 (API Client/Repository만 교체).

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

// ─── 매핑 (Post ↔ StoredPost) ────────────────────────────────────────────────

function toStored(p: Post): StoredPost {
  return {
    id: p.id,
    title: p.title,
    body: p.body,
    category: p.category,
    subCategory: p.subCategory,
    thumbnailPreview: p.thumbnailUrl,
    relatedLinks: p.relatedLinks,
    attachments: p.attachments,
    tags: p.tags,
    publishStart: p.publishStart,
    publishEnd: p.publishEnd,
    isScheduled: p.isScheduled,
    scheduledAt: p.scheduledAt,
    status: p.status,
    showConsultButton: p.showConsultButton,
    authorId: p.authorId,
    authorName: p.authorName,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

type UpsertInput = Omit<StoredPost, "id" | "createdAt" | "updatedAt"> & { id?: string | null };

function toCreateInput(d: UpsertInput): PostCreateInput {
  return {
    title: d.title,
    body: d.body,
    category: d.category,
    subCategory: d.subCategory,
    tags: d.tags,
    thumbnailUrl: d.thumbnailPreview,
    relatedLinks: d.relatedLinks,
    attachments: d.attachments,
    status: d.status,
    isHot: false,
    viewCount: 0,
    showConsultButton: d.showConsultButton,
    publishStart: d.publishStart,
    publishEnd: d.publishEnd,
    isScheduled: d.isScheduled,
    scheduledAt: d.scheduledAt,
    authorId: d.authorId,
    authorName: d.authorName,
  };
}

// 수정 시에는 viewCount/isHot 을 건드리지 않는다 (서버 값 보존).
function toUpdateInput(d: UpsertInput): PostUpdateInput {
  return {
    title: d.title,
    body: d.body,
    category: d.category,
    subCategory: d.subCategory,
    tags: d.tags,
    thumbnailUrl: d.thumbnailPreview,
    relatedLinks: d.relatedLinks,
    attachments: d.attachments,
    status: d.status,
    showConsultButton: d.showConsultButton,
    publishStart: d.publishStart,
    publishEnd: d.publishEnd,
    isScheduled: d.isScheduled,
    scheduledAt: d.scheduledAt,
    authorId: d.authorId,
    authorName: d.authorName,
  };
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function getAllPosts(): Promise<StoredPost[]> {
  const posts = await postsApi.list();
  return posts.map(toStored);
}

export async function getPost(id: string): Promise<StoredPost | undefined> {
  try {
    return toStored(await postsApi.get(id));
  } catch {
    return undefined;
  }
}

export async function getDrafts(): Promise<StoredPost[]> {
  const posts = await postsApi.list({ status: "DRAFT" });
  return posts.map(toStored);
}

export async function upsertPost(data: UpsertInput): Promise<StoredPost> {
  if (data.id) {
    const updated = await postsApi.update(data.id, toUpdateInput(data));
    return toStored(updated);
  }
  const created = await postsApi.create(toCreateInput(data));
  return toStored(created);
}

export async function updatePostCategory(
  id: string,
  category: string,
  subCategory?: string,
): Promise<void> {
  await postsApi.update(id, { category, ...(subCategory !== undefined ? { subCategory } : {}) });
}

export async function deletePost(id: string): Promise<void> {
  await postsApi.remove(id);
}

/** 삭제 취소(undo)용: 삭제됐던 게시물을 다시 생성한다. */
export async function restorePosts(items: StoredPost[]): Promise<void> {
  for (const item of items) {
    await postsApi.create(toCreateInput(item));
  }
}

export async function getAllTags(): Promise<string[]> {
  const posts = await postsApi.list();
  const tagSet = new Set<string>();
  posts.forEach((p) => p.tags?.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet);
}

// 예약 게시/만료 숨김은 서버(Repository)가 조회 시점에 계산하므로 클라이언트 no-op.
export function hideExpiredPosts(): void {}
export function publishScheduledPosts(): void {}

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
