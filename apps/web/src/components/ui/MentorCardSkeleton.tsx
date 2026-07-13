import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";

// 디딤멘토 카드 스켈레톤 — 공통 Card 셸(hrefless) + 상단(직업/이름/소개 + 아바타) + 하단 태그.
// 실제 MentorCard 와 동일한 gap-[16px]/gap-[8px]·아바타 56·태그 행 구조로 CLS 없음.
export default function MentorCardSkeleton() {
  return (
    <Card className="flex h-full flex-col gap-[16px]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
          <Skeleton className="h-[14px] w-16" /> {/* 직업 */}
          <Skeleton className="h-[20px] w-24" /> {/* 이름 */}
          <Skeleton className="h-[16px] w-full" /> {/* 소개 */}
        </div>
        {/* 아바타(56px 원형) */}
        <Skeleton className="h-[56px] w-[56px] shrink-0 rounded-full" />
      </div>
      {/* 태그 행 */}
      <div className="flex flex-wrap gap-[6px]">
        <Skeleton className="h-[24px] w-14 rounded-md" />
        <Skeleton className="h-[24px] w-16 rounded-md" />
        <Skeleton className="h-[24px] w-12 rounded-md" />
      </div>
    </Card>
  );
}
