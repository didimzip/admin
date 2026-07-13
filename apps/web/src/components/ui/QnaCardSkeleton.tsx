import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";

// 많이 본 Q&A 카드 스켈레톤 — 공통 Card 셸(hrefless) + 제목/2줄 본문/메타 자리표시자.
// 실제 QA 카드와 동일한 gap-2 구조로 CLS 없음.
export default function QnaCardSkeleton() {
  return (
    <Card className="flex flex-col gap-2">
      <Skeleton className="h-[20px] w-3/4" /> {/* 제목 */}
      <Skeleton className="h-[15px] w-full" /> {/* 본문 1줄 */}
      <Skeleton className="h-[15px] w-5/6" /> {/* 본문 2줄 */}
      {/* 메타: 카테고리 | 조회수 | 답변수 */}
      <div className="mt-1 flex items-center gap-2">
        <Skeleton className="h-[13px] w-10" />
        <Skeleton className="h-[13px] w-14" />
        <Skeleton className="h-[13px] w-12" />
      </div>
    </Card>
  );
}
