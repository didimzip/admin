import { cache } from "react";
import { postsApi, authorsApi, categoriesApi, type Post, type Author } from "@didimzip/api";
import { toAuthorMap } from "./post-adapter";
import type { Crumb } from "@/components/ui/Breadcrumb";

// ─── 콘텐츠 상세 데이터 로더 (서버, 요청 단위 캐시) ───────────────────────────
//
// Admin에서 저장된 Post + Authors(작성자 신원)를 조합해 상세페이지 데이터를 만든다.
// 추천/작성자 다른 글은 현재 발행 목록에서 파생(Mock) — `getPostDetail` 내부의
// 필터만 실제 추천 API 호출로 교체하면 화면은 그대로 사용 가능(교체 이음새).

export interface SmallCardItem {
  id: string;
  title: string;
  author: string;
  views: number;
  thumbnail: string;
}

export interface RelatedGroup {
  tag: string;
  items: SmallCardItem[];
}

export interface PostDetail {
  post: Post;
  author: Author | null;
  breadcrumb: Crumb[];
  related: RelatedGroup[];
  authorOther: SmallCardItem[];
}

// 카테고리(요청당 1회) — 브레드크럼 이름→slug 해석에 사용
const getCategories = cache(async () => {
  try {
    return await categoriesApi.list({ visible: true });
  } catch {
    return [];
  }
});

// 게시글의 1차/2차 카테고리명 → 카테고리 페이지 링크로 해석.
// slug 를 못 찾으면 href 없이 텍스트로만 표시(라우팅 규칙: /contents/{slug}?tab={subSlug}).
async function buildBreadcrumb(post: Post): Promise<Crumb[]> {
  const cats = await getCategories();
  const catMatch = cats.find((c) => c.name === post.category);
  const subMatch = catMatch?.subCategories.find((s) => s.name === post.subCategory);

  const crumbs: Crumb[] = [];
  if (post.category) {
    crumbs.push({
      label: post.category,
      href: catMatch ? `/contents/${catMatch.slug}` : undefined,
    });
  }
  if (post.subCategory) {
    crumbs.push({
      label: post.subCategory,
      href: catMatch && subMatch ? `/contents/${catMatch.slug}?tab=${subMatch.slug}` : undefined,
    });
  }
  return crumbs;
}

const placeholder = (id: string) => `https://picsum.photos/seed/${id}/320/200`;

function toSmall(post: Post, authorMap: Record<string, Author>): SmallCardItem {
  const author = post.authorId ? authorMap[post.authorId] : undefined;
  return {
    id: post.id,
    title: post.title,
    author: author?.nickname ?? post.authorName ?? "디딤에디터",
    views: post.viewCount,
    thumbnail: post.thumbnailUrl || placeholder(post.id),
  };
}

// 발행 콘텐츠 + 작성자 맵 (요청당 1회 — 추천/작성자 다른 글이 공유)
const getPublished = cache(
  async (): Promise<{ posts: Post[]; authorMap: Record<string, Author> }> => {
    const [posts, authors] = await Promise.all([
      postsApi.list({ status: "PUBLISHED" }),
      authorsApi.list().catch(() => []),
    ]);
    return { posts, authorMap: toAuthorMap(authors) };
  },
);

export const getPostDetail = cache(async (id: string): Promise<PostDetail | null> => {
  let post: Post;
  try {
    post = await postsApi.get(id);
  } catch {
    return null; // 없는 콘텐츠 → notFound 처리
  }

  const { posts, authorMap } = await getPublished();
  const author = post.authorId ? authorMap[post.authorId] ?? null : null;

  // 추천: ① 1차 카테고리 기준 ② 2차 카테고리 기준 (각 4개, 자기 자신 제외).
  // 매칭 콘텐츠가 있을 때만 섹션을 노출한다(비어 있으면 숨김).
  // ⚠️ 실제 추천 API 전환 지점 — 아래 필터를 recommendationsApi 호출로 교체.
  const related: RelatedGroup[] = [];
  if (post.category) {
    const items = posts
      .filter((p) => p.id !== post.id && p.category === post.category)
      .slice(0, 4)
      .map((p) => toSmall(p, authorMap));
    if (items.length > 0) related.push({ tag: post.category, items });
  }
  if (post.subCategory && post.subCategory !== post.category) {
    const items = posts
      .filter((p) => p.id !== post.id && p.subCategory === post.subCategory)
      .slice(0, 4)
      .map((p) => toSmall(p, authorMap));
    if (items.length > 0) related.push({ tag: post.subCategory, items });
  }

  // 작성자가 쓴 다른 콘텐츠 (authorId 기준)
  const authorOther = post.authorId
    ? posts
        .filter((p) => p.id !== post.id && p.authorId === post.authorId)
        .slice(0, 6)
        .map((p) => toSmall(p, authorMap))
    : [];

  const breadcrumb = await buildBreadcrumb(post);

  return { post, author, breadcrumb, related, authorOther };
});
