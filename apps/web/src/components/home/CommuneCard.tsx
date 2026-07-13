import Image from "next/image";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import type { CommunePost } from "@/lib/mock-data";

// 커뮤니티 라운지 카드 — 가로형(좌: 텍스트, 우: 썸네일). 공통 Card 셸 + 공통 StatusBadge 재사용.
export default function CommuneCard({ post }: { post: CommunePost }) {
  const statusLabel = post.status === "recruiting" ? "모집중" : "모집완료";

  return (
    <Card href={`/commune/${post.id}`} className="flex items-center gap-6">
      {/* 좌측: 텍스트 */}
      <div className="flex min-w-0 flex-1 flex-col gap-[16px]">
        <div className="flex flex-col gap-[8px]">
          {/* 상태 뱃지 + 제목 */}
          <div className="flex min-w-0 items-center gap-2">
            <StatusBadge status={statusLabel} />
            <p className="truncate text-[18px] font-semibold leading-[1.2] text-[#191919]">
              {post.title}
            </p>
          </div>
          {/* 설명 */}
          <p className="truncate text-[14px] font-normal leading-[1.2] text-[#666666]">
            {post.summary}
          </p>
        </div>

        {/* 메타: 카테고리 | 조회수 N | 댓글수 N */}
        <div className="flex items-center gap-2.5 text-[12px] font-normal text-[#999999]">
          <span>{post.category}</span>
          <span className="h-[12px] w-px bg-[#e1e2e3]" />
          <span className="flex items-center gap-1">
            조회수 <span className="text-[#333333]">{post.viewCount.toLocaleString()}</span>
          </span>
          <span className="h-[12px] w-px bg-[#e1e2e3]" />
          <span className="flex items-center gap-1">
            댓글수 <span className="text-[#999999]">{post.commentCount}</span>
          </span>
        </div>
      </div>

      {/* 우측: 썸네일 (이미지 없어도 레이아웃 유지: 회색 박스) */}
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[10px] border border-[#eee] bg-[#f6f6f6]">
        {post.thumbnail && (
          <Image
            src={post.thumbnail}
            alt={post.title}
            width={80}
            height={80}
            className="h-full w-full object-cover"
          />
        )}
      </div>
    </Card>
  );
}
