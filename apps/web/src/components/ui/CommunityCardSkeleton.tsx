import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";

// 커뮤니티 라운지 카드 스켈레톤 — 공통 Card 셸(hrefless) 가로형(좌: 텍스트, 우: 80×80 썸네일).
// 실제 CommuneCard 와 동일한 gap-6·gap-[16px]·80×80 구조로 CLS 없음.
export default function CommunityCardSkeleton() {
  return (
    <Card className="flex items-center gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-[16px]">
        <div className="flex flex-col gap-[8px]">
          {/* 상태 뱃지 + 제목 */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-[24px] w-14 rounded-md" />
            <Skeleton className="h-[20px] w-1/2" />
          </div>
          {/* 설명 */}
          <Skeleton className="h-[16px] w-full" />
        </div>
        {/* 메타 */}
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-[13px] w-12" />
          <Skeleton className="h-[13px] w-14" />
          <Skeleton className="h-[13px] w-12" />
        </div>
      </div>
      {/* 썸네일 80×80 */}
      <Skeleton className="h-20 w-20 shrink-0 rounded-[10px]" />
    </Card>
  );
}
