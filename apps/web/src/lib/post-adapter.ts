import type { Post } from "@didimzip/api";
import type { ContentCard } from "@/lib/mock-data";

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
 */
export function postToContentCard(post: Post): ContentCard {
  const summary = stripHtml(post.body);
  return {
    id: post.id,
    title: post.title,
    summary: summary || "내용을 확인해보세요.",
    thumbnail: post.thumbnailUrl || `https://picsum.photos/seed/${post.id}/480/320`,
    category: post.category,
    subcategory: post.subCategory,
    author: post.authorName ?? "디딤에디터",
    authorBadge: "editor",
    viewCount: post.viewCount,
    isHot: post.isHot,
    isAd: false,
    createdAt: formatDate(post.createdAt),
  };
}
