import { allQnaItems, type LatestQnaItem } from "./mock-data";

// ─── 멘토에게 질문 목록 페이지네이션 (Infinite Scroll 데이터 계층) ─────────────
//
// useInfiniteQuery 가 pageParam(page)로 호출. 카테고리/검색/정렬은 queryKey 로 전달되어
// 조건 변경 시 1페이지부터 재조회. 반환 형태 { items, nextPage, total } 고정 →
// 실제 API 전환 시 이 함수 "본문만" 서버 요청(?page=&category=&q=&sort=)으로 교체.

export type QnaSort = "최신순" | "조회수순" | "답변수순";

export interface QnaPage {
  items: LatestQnaItem[];
  nextPage: number | null;
  total: number; // 조건 충족 전체 건수(‘전체 N건’ 표시용)
}

export interface FetchQnaParams {
  page: number;
  pageSize: number;
  category?: string;
  search?: string;
  sort?: QnaSort;
}

function sortItems(list: LatestQnaItem[], sort: QnaSort): LatestQnaItem[] {
  if (sort === "조회수순") return [...list].sort((a, b) => b.viewCount - a.viewCount);
  if (sort === "답변수순") return [...list].sort((a, b) => b.answerCount - a.answerCount);
  return [...list].sort((a, b) => b.date.localeCompare(a.date)); // 최신순
}

export async function fetchQnaPage({
  page,
  pageSize,
  category,
  search,
  sort = "최신순",
}: FetchQnaParams): Promise<QnaPage> {
  let list = allQnaItems;
  if (category && category !== "전체") list = list.filter((q) => q.category === category);
  const q = search?.trim();
  if (q) list = list.filter((it) => it.title.includes(q) || it.body.includes(q));
  list = sortItems(list, sort);

  const total = list.length;
  const start = (page - 1) * pageSize;
  const items = list.slice(start, start + pageSize);
  return { items, nextPage: start + pageSize < total ? page + 1 : null, total };
}
