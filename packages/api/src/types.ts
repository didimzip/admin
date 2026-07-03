// ─── 공유 도메인 타입 (admin · web · api 공통 계약) ───────────────────────────

export type PostStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "HIDDEN";

export interface RelatedLink {
  label: string;
  url: string;
}

export interface PostAttachment {
  name: string;
  size: number;
  dataUrl: string;
}

/** 게시글 정식 모델. 실백엔드(PostgreSQL) 전환 시에도 이 형태를 유지한다. */
export interface Post {
  id: string;
  title: string;
  body: string; // 리치 텍스트 HTML
  category: string;
  subCategory: string;
  tags: string[];
  thumbnailUrl: string;
  relatedLinks: RelatedLink[];
  attachments: PostAttachment[];
  status: PostStatus;
  isHot: boolean;
  viewCount: number;
  showConsultButton: boolean;
  publishStart: string;
  publishEnd: string;
  isScheduled: boolean;
  scheduledAt: string;
  authorId?: string;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
}

/** 생성 입력: 서버가 채우는 필드(id/createdAt/updatedAt)는 제외. */
export type PostCreateInput = Omit<Post, "id" | "createdAt" | "updatedAt">;

/** 수정 입력: 부분 갱신. */
export type PostUpdateInput = Partial<PostCreateInput>;

/** 목록 조회 필터. */
export interface PostListQuery {
  status?: PostStatus;
  category?: string;
  q?: string;
}

// ─── 공통 API Response 계약 ──────────────────────────────────────────────────

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
