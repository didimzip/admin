import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import type { LatestQnaItem } from "@/lib/mock-data";

// 최신 Q&A 카드 — 전체 폭. 공통 Card 셸(border/radius/hover 통일) + 공통 StatusBadge.
// 상단: 상태뱃지 + 제목 / 질문 요약. 하단: 카테고리·조회수·답변수(좌) | 작성일(우).
export default function LatestQnaCard({ item }: { item: LatestQnaItem }) {
  return (
    <Card href={`/mentor/qna/${item.id}`} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <StatusBadge status={item.status} />
          <h3 className="truncate text-[18px] font-semibold leading-[1.2] text-[#191919]">
            {item.title}
          </h3>
        </div>
        <p className="truncate text-[14px] font-normal leading-[1.4] text-[#666666]">{item.body}</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        {/* 카테고리 | 조회수 N | 답변수 N — 기존 Q&A 카드와 동일 메타 스타일 */}
        <div className="flex items-center gap-2 text-[12px] font-normal text-[#999999]">
          <span>{item.category}</span>
          <span className="h-[10px] w-px bg-[#e1e2e3]" />
          <span>
            조회수 <span className="text-[#333333]">{item.viewCount.toLocaleString()}</span>
          </span>
          <span className="h-[10px] w-px bg-[#e1e2e3]" />
          <span>
            답변수 <span className="text-[#999999]">{item.answerCount}</span>
          </span>
        </div>
        {/* 작성일 */}
        <span className="shrink-0 text-[12px] font-normal text-[#999999]">{item.date}</span>
      </div>
    </Card>
  );
}
