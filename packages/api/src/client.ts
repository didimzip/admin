import type {
  ApiResponse,
  Banner,
  BannerCreateInput,
  BannerListQuery,
  BannerPosition,
  BannerUpdateInput,
  Category,
  CategoryInput,
  CategoryListQuery,
  Post,
  PostCreateInput,
  PostListQuery,
  PostUpdateInput,
} from "./types";

// ─── API Client (admin · web 공통 사용) ──────────────────────────────────────
//
// baseUrl 은 NEXT_PUBLIC_API_URL 환경변수로 주입한다. 실백엔드로 교체할 때는
// 이 환경변수만 실제 API 주소로 바꾸면 되고, admin/web 코드는 수정하지 않는다.

const DEFAULT_BASE_URL = "http://localhost:4000";

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_BASE_URL;
}

export class ApiClientError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    // 개발 단계에서 항상 최신 데이터를 조회 (admin 생성 → web 새로고침 시 즉시 반영)
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError("INVALID_RESPONSE", `서버 응답을 해석할 수 없습니다 (HTTP ${res.status})`);
  }

  if (!json.ok) {
    throw new ApiClientError(json.error.code, json.error.message);
  }
  return json.data;
}

function toPostQuery(query?: PostListQuery): string {
  if (!query) return "";
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.category) params.set("category", query.category);
  if (query.q) params.set("q", query.q);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export const postsApi = {
  list: (query?: PostListQuery) => request<Post[]>(`/api/posts${toPostQuery(query)}`),
  get: (id: string) => request<Post>(`/api/posts/${id}`),
  create: (input: PostCreateInput) =>
    request<Post>(`/api/posts`, { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: PostUpdateInput) =>
    request<Post>(`/api/posts/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  remove: (id: string) =>
    request<{ id: string }>(`/api/posts/${id}`, { method: "DELETE" }),
};

function toBannerQuery(query?: BannerListQuery): string {
  if (!query) return "";
  const params = new URLSearchParams();
  if (query.type) params.set("type", query.type);
  if (query.position) params.set("position", query.position);
  if (query.active !== undefined) params.set("active", String(query.active));
  const s = params.toString();
  return s ? `?${s}` : "";
}

export const bannersApi = {
  list: (query?: BannerListQuery) => request<Banner[]>(`/api/banners${toBannerQuery(query)}`),
  get: (id: string) => request<Banner>(`/api/banners/${id}`),
  create: (input: BannerCreateInput) =>
    request<Banner>(`/api/banners`, { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: BannerUpdateInput) =>
    request<Banner>(`/api/banners/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  remove: (id: string) =>
    request<{ id: string }>(`/api/banners/${id}`, { method: "DELETE" }),
  reorder: (orderedIds: string[]) =>
    request<Banner[]>(`/api/banners/reorder`, {
      method: "POST",
      body: JSON.stringify({ orderedIds }),
    }),
  // 광고: 조건(ADVERTISEMENT·ON·기간·위치) 충족 배너 중 weight 가중 랜덤 1개(없으면 null)
  pickAd: (position: BannerPosition) =>
    request<Banner | null>(`/api/banners/ad?position=${encodeURIComponent(position)}`),
};

function toCategoryQuery(query?: CategoryListQuery): string {
  if (!query) return "";
  const params = new URLSearchParams();
  if (query.visible !== undefined) params.set("visible", String(query.visible));
  const s = params.toString();
  return s ? `?${s}` : "";
}

export const categoriesApi = {
  list: (query?: CategoryListQuery) =>
    request<Category[]>(`/api/categories${toCategoryQuery(query)}`),
  // Admin 저장(save-all): 전체 카테고리 배열을 순서대로 교체 저장
  replaceAll: (categories: CategoryInput[]) =>
    request<Category[]>(`/api/categories`, {
      method: "PUT",
      body: JSON.stringify({ categories }),
    }),
};
