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

// ─── 배너 ────────────────────────────────────────────────────────────────────

export type BannerType = "HERO" | "ADVERTISEMENT";
/**
 * 노출 위치. 신규 위치는 이 union + BANNER_POSITION_META 두 곳에만 추가하면
 * Admin 셀렉트·Web·Repository가 자동 반영된다(확장 이음새).
 */
export type BannerPosition =
  | "HOME_HERO"
  | "HOME_MIDDLE"
  | "HOME_BOTTOM"
  | "CATEGORY_TOP_BANNER"
  | "CATEGORY_BOTTOM_BANNER"
  | "CONTENT_TOP"
  | "CONTENT_BOTTOM";
export type BannerTextColor = "light" | "dark"; // light = 흰 텍스트, dark = 검정 텍스트
export type BannerLinkTarget = "_self" | "_blank"; // 현재창 | 새창

/**
 * 노출 위치 레지스트리 — 위치의 유일한 원천(single source of truth).
 * - label   : 관리 UI 표기
 * - forType : 어떤 배너 타입 셀렉트에 노출할지 (HERO | ADVERTISEMENT)
 * - enabled : 현재 선택 가능 여부. 예약 위치는 false로 두고, 활성화 시 true로만 변경.
 * 신규 위치 추가/활성화는 여기 한 곳만 바꾸면 Admin 셀렉트와 Web에 그대로 반영된다.
 */
export interface BannerPositionMeta {
  label: string;
  forType: BannerType;
  enabled: boolean;
}

export const BANNER_POSITION_META: Record<BannerPosition, BannerPositionMeta> = {
  HOME_HERO: { label: "홈 히어로", forType: "HERO", enabled: true },
  HOME_MIDDLE: { label: "홈 중간 광고", forType: "ADVERTISEMENT", enabled: true },
  CATEGORY_TOP_BANNER: { label: "카테고리 상단 광고", forType: "ADVERTISEMENT", enabled: true },
  // ── 예약(설계상 확장 지점) — enabled: true 로만 바꾸면 즉시 활성화, Admin 코드 수정 불필요 ──
  HOME_BOTTOM: { label: "홈 하단 광고", forType: "ADVERTISEMENT", enabled: false },
  CATEGORY_BOTTOM_BANNER: { label: "카테고리 하단 광고", forType: "ADVERTISEMENT", enabled: false },
  CONTENT_TOP: { label: "콘텐츠 상단 광고", forType: "ADVERTISEMENT", enabled: false },
  CONTENT_BOTTOM: { label: "콘텐츠 하단 광고", forType: "ADVERTISEMENT", enabled: false },
};

const ALL_BANNER_POSITIONS = Object.keys(BANNER_POSITION_META) as BannerPosition[];

/** 위치 → 라벨 매핑 (관리 UI 표기용). 레지스트리에서 파생. */
export const BANNER_POSITIONS: Record<BannerPosition, string> = ALL_BANNER_POSITIONS.reduce(
  (acc, p) => {
    acc[p] = BANNER_POSITION_META[p].label;
    return acc;
  },
  {} as Record<BannerPosition, string>,
);

/** 현재 선택 가능한 Hero 위치 (Admin 셀렉트가 이 배열을 map). */
export const HERO_POSITIONS: BannerPosition[] = ALL_BANNER_POSITIONS.filter(
  (p) => BANNER_POSITION_META[p].forType === "HERO" && BANNER_POSITION_META[p].enabled,
);

/** 현재 선택 가능한 광고 위치 (Admin 셀렉트가 이 배열을 map). */
export const AD_POSITIONS: BannerPosition[] = ALL_BANNER_POSITIONS.filter(
  (p) => BANNER_POSITION_META[p].forType === "ADVERTISEMENT" && BANNER_POSITION_META[p].enabled,
);

/**
 * 배너 정식 모델 (CMS). Hero(순서 고정)와 Advertisement(가중치 랜덤)가 같은 모델을 쓰되
 * 출력 방식만 다르다. 실백엔드(PostgreSQL) 전환 시에도 이 형태를 유지한다.
 */
export interface Banner {
  id: string;
  name: string; // 관리용 배너명
  bannerType: BannerType;
  position: BannerPosition;
  subtitle: string; // Badge(소제목)
  title: string; // 메인 제목 (줄바꿈 \n 가능)
  subText: string; // Hero 하단 텍스트
  description: string; // (예비)
  textColor: BannerTextColor;
  imageUrl: string; // PC 배경 이미지 경로/URL
  imageData: string; // PC base64 업로드 (있으면 우선)
  imageUrlMobile: string; // 모바일 배경 (확장, 현재 미사용)
  imageDataMobile: string; // 모바일 base64 (확장, 현재 미사용)
  linkUrl: string;
  linkTarget: BannerLinkTarget; // 링크 열기 방식
  weight: number; // 광고 전용: 가중치(클수록 자주 노출)
  sortOrder: number; // Hero 전용: 노출 순서(Display Order)
  isActive: boolean; // 노출 상태 ON/OFF
  startDate: string;
  endDate: string;
  clickCount: number;
  impressionCount: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 생성 입력: 서버가 채우는 필드는 제외. */
export type BannerCreateInput = Omit<
  Banner,
  "id" | "createdAt" | "updatedAt" | "clickCount" | "impressionCount"
>;

/** 수정 입력: 부분 갱신. */
export type BannerUpdateInput = Partial<BannerCreateInput>;

/** 목록 조회 필터. */
export interface BannerListQuery {
  type?: BannerType;
  position?: BannerPosition;
  active?: boolean;
}

// ─── 카테고리 ────────────────────────────────────────────────────────────────

export interface CategorySub {
  id: string;
  name: string;
  slug: string;
}

/**
 * 카테고리 정식 모델. 아이콘은 컴포넌트가 아니라 이름 문자열(iconName)로만 저장한다.
 * → PostgreSQL 등 실백엔드에서도 문자열 컬럼으로 그대로 사용 가능.
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string; // 예: "RiLightbulbLine" (react-icons/ri). 빈 문자열이면 기본 아이콘.
  sortOrder: number;
  isVisible: boolean;
  subCategories: CategorySub[];
  createdAt: string;
  updatedAt: string;
}

/** 저장(bulk replace) 입력 1건. id/slug 미지정 시 서버가 생성한다. */
export interface CategoryInput {
  id?: string;
  name: string;
  slug?: string;
  iconName?: string;
  isVisible?: boolean;
  subCategories?: Array<{ id?: string; name: string; slug?: string }>;
}

/** 목록 조회 필터. */
export interface CategoryListQuery {
  visible?: boolean;
}

// 아이콘은 iconName(문자열)만 저장한다. 선택 가능한 아이콘 목록은 고정하지 않고,
// 각 앱이 react-icons/ri 전체를 lazy 로드해 검색/렌더한다. (DB에는 문자열만)

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
