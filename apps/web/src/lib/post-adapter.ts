import type { Author, Post } from "@didimzip/api";
import type { ContentCard } from "@/lib/mock-data";

/** authorId → Author 조회 맵. web 페이지가 authorsApi.list() 결과로 1회 구성해 넘긴다. */
export type AuthorMap = Record<string, Author>;

export function toAuthorMap(authors: Author[]): AuthorMap {
  return Object.fromEntries(authors.map((a) => [a.id, a]));
}

/** HTML 본문에서 텍스트만 추출해 요약으로 사용. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** ISO 날짜 → "2026.06.01" */
function formatDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, ".");
}

/**
 * 공유 도메인 모델(Post)을 web 카드 표현(ContentCard)으로 매핑한다.
 * 데이터 소스가 바뀌어도(Mock→실백엔드) 이 어댑터만 유지하면 UI는 무영향.
 *
 * 작성자명/프로필은 문자열 스냅샷(authorName)이 아니라 authorId 로 Authors 테이블에서
 * 최신값을 조회한다 → Admin에서 닉네임/프로필을 바꾸면 기존 콘텐츠에도 즉시 반영된다.
 * authors 맵이 없거나 매칭이 없으면 과거 authorName 스냅샷으로 폴백한다(하위호환).
 */
export function postToContentCard(post: Post, authors?: AuthorMap): ContentCard {
  const summary = stripHtml(post.body);
  const author = post.authorId ? authors?.[post.authorId] : undefined;
  return {
    id: post.id,
    title: post.title,
    summary: summary || "내용을 확인해보세요.",
    thumbnail: post.thumbnailUrl || `https://picsum.photos/seed/${post.id}/480/320`,
    category: post.category,
    subcategory: post.subCategory,
    author: author?.nickname ?? post.authorName ?? "디딤에디터",
    authorProfileImage: author?.profileImage || undefined,
    authorBadge: "editor",
    viewCount: post.viewCount,
    isHot: post.isHot,
    isAd: false,
    createdAt: formatDate(post.createdAt),
  };
}
