import { postsApi, authorsApi } from "@didimzip/api";
import { postToContentCard, toAuthorMap } from "./post-adapter";
import type { ContentCard } from "./mock-data";
import { generateDummyContentCards } from "./dummy-content";

// ⚠️ 개발용: Infinite Scroll / Skeleton 테스트를 위해 더미 콘텐츠를 뒤에 덧붙인다.
// 실제 API 연결 시 아래 상수를 false 로 두거나, 이 줄과 dummy-content.ts 를 삭제하면 된다.
const USE_DUMMY_CONTENT = true;
const DUMMY_CONTENT: ContentCard[] = USE_DUMMY_CONTENT ? generateDummyContentCards(84) : [];

// ─── 콘텐츠 페이지네이션 페치 (Infinite Scroll 데이터 계층) ────────────────────
//
// useInfiniteQuery 가 pageParam(=page 번호)로 이 함수를 호출한다.
// 반환 형태 { items, nextPage } 는 백엔드 방식과 무관하게 고정 →
//   · 지금(Mock): 전체 목록을 받아 클라이언트에서 slice
//   · 실백엔드: 이 함수 "본문만" postsApi.list({ page, pageSize }) 서버 페이지네이션으로 교체
//   · Cursor 방식: nextPage 를 nextCursor 로 바꾸면 호출부 수정 없이 확장 가능
// 화면(useInfiniteQuery/스켈레톤/IO)은 어느 경우에도 그대로 사용한다.

export interface ContentPage {
  items: ContentCard[];
  /** 다음 페이지 번호. 더 없으면 null. (Cursor 전환 시 nextCursor 로 대체) */
  nextPage: number | null;
}

export interface FetchContentParams {
  page: number; // 1-based
  pageSize: number;
  category?: string; // 확장 지점: 카테고리/서브카테고리 필터
}

export async function fetchContentPage({
  page,
  pageSize,
}: FetchContentParams): Promise<ContentPage> {
  const [posts, authors] = await Promise.all([
    postsApi.list({ status: "PUBLISHED" }),
    authorsApi.list().catch(() => []),
  ]);
  const authorMap = toAuthorMap(authors);
  // 실제 발행 콘텐츠 + (개발용) 더미 콘텐츠. 더미는 실 콘텐츠 뒤에 붙는다.
  const all = [...posts.map((p) => postToContentCard(p, authorMap)), ...DUMMY_CONTENT];

  const start = (page - 1) * pageSize;
  const items = all.slice(start, start + pageSize);
  const hasMore = start + pageSize < all.length;

  return { items, nextPage: hasMore ? page + 1 : null };
}
