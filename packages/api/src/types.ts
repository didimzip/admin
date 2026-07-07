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
// 노출 위치. 값 추가만으로 확장 가능(예: POST_BETWEEN 등).
export type BannerPosition = "HOME_HERO" | "HOME_MIDDLE";
export type BannerTextColor = "light" | "dark"; // light = 흰 텍스트, dark = 검정 텍스트
export type BannerLinkTarget = "_self" | "_blank"; // 현재창 | 새창

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
