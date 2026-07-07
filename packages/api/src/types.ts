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

export type BannerType = "HERO_SLIDE" | "AD";
export type BannerPosition =
  | "HOME_TOP"
  | "HOME_SIDE"
  | "POST_BETWEEN"
  | "POST_BOTTOM"
  | "LOGIN_PAGE";
export type BannerTextColor = "light" | "dark"; // light = 흰 텍스트, dark = 검정 텍스트

/** 배너 정식 모델. admin StoredBanner 와 동일한 필드 집합(무손실 왕복). */
export interface Banner {
  id: string;
  title: string; // 줄바꿈(\n) 포함 가능
  subtitle: string; // 상단 소제목/뱃지
  subText: string; // 하단 서브텍스트 (예: "자세히 보기 →")
  description: string;
  textColor: BannerTextColor;
  bannerType: BannerType;
  imageUrl: string; // 경로/URL
  imageData: string; // base64 업로드 이미지 (있으면 우선)
  linkUrl: string;
  position: BannerPosition;
  isActive: boolean;
  sortOrder: number;
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

/**
 * Admin 카테고리 아이콘 선택기에서 제공할 react-icons/ri 아이콘 이름 목록.
 * (데이터만 — 실제 컴포넌트 매핑은 각 앱에서 수행)
 */
export const CATEGORY_ICON_NAMES: string[] = [
  "RiLightbulbLine",
  "RiFundsLine",
  "RiTeamLine",
  "RiRocketLine",
  "RiBookOpenLine",
  "RiBriefcaseLine",
  "RiMegaphoneLine",
  "RiCalendarEventLine",
  "RiInformationLine",
  "RiLineChartLine",
  "RiHandCoinLine",
  "RiBuilding2Line",
  "RiPaletteLine",
  "RiCpuLine",
  "RiScales3Line",
  "RiCustomerService2Line",
  "RiGraduationCapLine",
  "RiGlobalLine",
  "RiShieldCheckLine",
  "RiFlashlightLine",
  "RiCompass3Line",
  "RiPriceTag3Line",
  "RiGroupLine",
  "RiStore2Line",
];

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
