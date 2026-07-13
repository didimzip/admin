import Image from "next/image";
import { notFound } from "next/navigation";
import Tag from "@/components/ui/Tag";
import Breadcrumb from "@/components/ui/Breadcrumb";
import DetailHeader from "./DetailHeader";
import ContentActions from "./ContentActions";
import BookmarkButton from "@/components/ui/BookmarkButton";
import ShareButton from "@/components/ui/ShareButton";
import ArticleBody from "./ArticleBody";
import RelatedContentSection from "./RelatedContentSection";
import AuthorCard from "./AuthorCard";
import AuthorOtherContent from "./AuthorOtherContent";
import { getPostDetail } from "@/lib/content-detail";

const Divider = () => <div className="h-px w-full bg-[#e1e2e3]" />;

/** ISO → "2026.07.09. 오전 9:13" (저장된 작성일 데이터의 벽시계 값을 그대로 사용) */
function formatDateTime(iso: string): string {
  if (!iso) return "";
  const date = iso.slice(0, 10).replace(/-/g, "."); // 2026.07.09
  const time = iso.slice(11, 16); // "09:13"
  if (!/^\d{2}:\d{2}$/.test(time)) return `${date}.`;
  const [h, m] = time.split(":").map(Number);
  const ampm = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${date}. ${ampm} ${h12}:${String(m).padStart(2, "0")}`;
}

export default async function ContentDetail({ id }: { id: string }) {
  const detail = await getPostDetail(id);
  if (!detail) notFound();

  const { post, author, breadcrumb, related, authorOther } = detail;
  const authorName = author?.nickname ?? post.authorName ?? "디딤에디터";

  return (
    <div className="flex flex-col gap-[36px] lg:flex-row lg:items-start">
      {/* ── 본문 ── */}
      <article className="flex min-w-0 flex-1 flex-col gap-[var(--space-lg)]">
        {/* 헤더 — 공유 DetailHeader 레이아웃(스켈레톤과 동일 구조) */}
        <DetailHeader
          breadcrumb={<Breadcrumb items={breadcrumb} />}
          title={
            <h1 className="text-[32px] font-bold leading-[1.3] text-[#191919]">{post.title}</h1>
          }
          author={<span className="text-[14px] font-semibold text-[#333333]">{authorName}</span>}
          meta={
            <div className="flex items-center gap-2 text-[14px]">
              <span className="font-normal text-[#666666]">{formatDateTime(post.createdAt)}</span>
              <span className="h-[12px] w-px bg-[#e6e6e6]" />
              <span className="font-normal text-[#666666]">
                조회수 {post.viewCount.toLocaleString()}
              </span>
            </div>
          }
          actions={
            <>
              <BookmarkButton variant="plain" />
              <ShareButton />
              <ContentActions postId={post.id} />
            </>
          }
        />

        <Divider />

        {/* 히어로 이미지 (없어도 레이아웃 유지: 회색 박스) */}
        <div className="relative aspect-video w-full overflow-hidden rounded-[10px] border border-[#eee] bg-[#f6f6f6]">
          {post.thumbnailUrl && (
            <Image
              src={post.thumbnailUrl}
              alt={post.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 760px"
            />
          )}
        </div>

        {/* 본문 */}
        <ArticleBody html={post.body} />

        {/* 관련 태그 */}
        {post.tags.length > 0 && (
          <>
            <Divider />
            <section className="flex flex-col gap-3">
              <h2 className="text-[18px] font-semibold text-[#191919]">관련 태그</h2>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Tag key={tag} label={tag} />
                ))}
              </div>
            </section>
          </>
        )}

        {/* 관련 추천 콘텐츠 (태그/카테고리 기준) */}
        {related.map((group) => (
          <div key={group.tag} className="flex flex-col gap-[var(--space-lg)]">
            <Divider />
            <RelatedContentSection tag={group.tag} items={group.items} />
          </div>
        ))}
      </article>

      {/* ── 사이드바 ── */}
      <aside className="flex w-full shrink-0 flex-col gap-[var(--space-lg)] lg:sticky lg:top-[80px] lg:w-[400px]">
        {/* status: 현재는 Mock. 추후 회원 시스템 연결 시 author.status(User.status) 로 교체 */}
        <AuthorCard
          name={authorName}
          profileImage={author?.profileImage}
          status={["디딤메이커", "전문가"]}
        />
        <AuthorOtherContent name={authorName} items={authorOther} />
      </aside>
    </div>
  );
}
