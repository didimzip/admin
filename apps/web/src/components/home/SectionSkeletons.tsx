import ContentCardSkeleton from "@/components/ui/ContentCardSkeleton";
import QnaCardSkeleton from "@/components/ui/QnaCardSkeleton";
import MentorCardSkeleton from "@/components/ui/MentorCardSkeleton";
import CommunityCardSkeleton from "@/components/ui/CommunityCardSkeleton";
import Skeleton from "@/components/ui/Skeleton";

// 홈 섹션 Suspense fallback 모음.
// 헤더(타이틀)는 데이터가 필요 없으므로 즉시 실제 텍스트를 노출하고, 카드 영역만 스켈레톤 →
// "페이지는 준비돼 있고 콘텐츠만 이어서 채워진다"는 느낌 + 헤더 CLS 제거.

/** 섹션 헤더 — 실제 타이틀 + (옵션)라벨 + 페이지네이션 자리표시자. 실제 섹션과 동일한 여백. */
function SkeletonHeader({
  title,
  label,
  mb = "mb-4",
}: {
  title: string;
  label?: string;
  mb?: string;
}) {
  return (
    <div className={`flex items-end justify-between ${mb}`}>
      <div>
        {label && <p className="text-[12px] text-muted-foreground">{label}</p>}
        <h2 className={`text-[24px] font-bold ${label ? "mt-1" : ""}`}>{title}</h2>
      </div>
      <Skeleton className="h-9 w-[140px] rounded-full" />
    </div>
  );
}

/** 놓치면 아쉬운 콘텐츠 — 대표 카드(2+2) + 하단 4카드 */
export function RecommendedSectionSkeleton() {
  return (
    <div>
      <SkeletonHeader title="놓치면 아쉬운 콘텐츠" label="조정언님이 좋아할 만한 콘텐츠" mb="mb-5" />
      <div className="mb-5 grid grid-cols-4 gap-4">
        <div className="col-span-2">
          <ContentCardSkeleton hideInfo />
        </div>
        <div className="col-span-2 flex flex-col justify-center gap-2 py-2">
          <Skeleton className="h-[28px] w-5/6" />
          <Skeleton className="h-[28px] w-2/3" />
          <Skeleton className="mt-1 h-[16px] w-full" />
          <Skeleton className="h-[16px] w-4/5" />
          <Skeleton className="mt-1 h-[13px] w-1/3" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ContentCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** 새로 올라온 콘텐츠 — 4열 × 2행(8) */
export function LatestSectionSkeleton() {
  return (
    <div>
      <SkeletonHeader title="새로 올라온 콘텐츠" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ContentCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** 창업가들이 주목한 콘텐츠 — 가로 스크롤(1행 4카드) */
export function PopularSectionSkeleton() {
  return (
    <div>
      <SkeletonHeader title="창업가들이 주목한 콘텐츠" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ContentCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** 주제별로 싹 모아둔 핵심 디딤.zip — 1행 4카드 */
export function TopicSectionSkeleton() {
  return (
    <div>
      <SkeletonHeader title="주제별로 싹 모아둔 핵심 디딤.zip" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ContentCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** 많이 본 Q&A — 탭 + 3열 × 2행(6) */
export function QASectionSkeleton() {
  return (
    <div>
      <SkeletonHeader title="많이 본 Q&A" />
      <div className="mb-5 flex flex-wrap gap-[6px]">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[33px] w-16 rounded-md" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <QnaCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** 궁금한 점, 디딤멘토에게 물어보세요 — 가로 스크롤(1행 4카드) */
export function MentorSectionSkeleton() {
  return (
    <div>
      <SkeletonHeader title="궁금한 점, 디딤멘토에게 물어보세요" />
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-w-[300px] flex-1">
            <MentorCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}

/** 지금 꼬뮨 라운지 — 2열 × 2행(4) */
export function CommuneSectionSkeleton() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[24px] font-bold">지금 꼬뮨 라운지</h2>
        <Skeleton className="h-[20px] w-14" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CommunityCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
