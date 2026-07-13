import { cache } from "react";
import { postsApi, authorsApi } from "@didimzip/api";
import { postToContentCard, toAuthorMap } from "./post-adapter";
import {
  mentors,
  qaItems,
  communePosts,
  type ContentCard,
  type MentorProfile,
  type QAItem,
  type CommunePost,
} from "./mock-data";

// ─── 홈 섹션 데이터 로더 (서버, 요청 단위 캐시) ───────────────────────────────
//
// React cache() 로 요청당 1회만 실제 fetch → 여러 Suspense 섹션이 결과를 공유(중복요청 X).
// 각 로더는 async 시그니처를 유지하므로, 실백엔드(PostgreSQL/API) 전환 시
// 함수 "내부"만 교체하면 되고 섹션/Suspense 구조는 그대로다.

/** 발행 콘텐츠 → 카드 매핑 (작성자는 authorId 로 최신 닉네임/프로필 조회). */
export const getContentCards = cache(async (): Promise<ContentCard[]> => {
  try {
    const [posts, authors] = await Promise.all([
      postsApi.list({ status: "PUBLISHED" }),
      authorsApi.list().catch(() => []),
    ]);
    const authorMap = toAuthorMap(authors);
    return posts.map((p) => postToContentCard(p, authorMap));
  } catch {
    // API 미기동 등: 빈 목록 폴백 (페이지는 정상 렌더)
    return [];
  }
});

/** 조회수 내림차순 (창업가들이 주목한 콘텐츠). */
export const getPopularContentCards = cache(async (): Promise<ContentCard[]> => {
  const items = await getContentCards();
  return [...items].sort((a, b) => b.viewCount - a.viewCount);
});

// 아래 3개는 현재 mock 상수를 반환하지만 async 를 유지 → 실제 API 전환 시 본문만 교체.
export const getMentors = cache(async (): Promise<MentorProfile[]> => mentors);
export const getQaItems = cache(async (): Promise<QAItem[]> => qaItems);
export const getCommunePosts = cache(async (): Promise<CommunePost[]> => communePosts);
