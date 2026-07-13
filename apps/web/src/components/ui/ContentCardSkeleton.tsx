import Skeleton from "@/components/ui/Skeleton";

// ContentCard 와 동일한 레이아웃의 스켈레톤 (썸네일 + 타이틀 + 서브텍스트 + 작성자/메타).
// 실제 카드와 같은 aspect-video·mt-[18px]·gap-1.5 를 사용해 교체 시 Layout Shift(CLS)가 없다.
// hideInfo=true 면 썸네일만(Recommended 대표 카드처럼 텍스트가 옆에 있는 경우).
export default function ContentCardSkeleton({ hideInfo = false }: { hideInfo?: boolean }) {
  return (
    <div className="block">
      {/* 썸네일 — 실제 카드와 동일한 aspect-video·rounded-xl 로 높이 예약 */}
      <div className="relative aspect-video overflow-hidden rounded-xl bg-[#ececec]">
        <div className="absolute inset-0 animate-pulse" />
      </div>

      {!hideInfo && (
        <div className="mt-[18px] flex flex-col gap-1.5">
          <Skeleton className="h-[20px] w-4/5" /> {/* 타이틀 */}
          <Skeleton className="h-[16px] w-full" /> {/* 서브텍스트 */}
          <Skeleton className="h-[13px] w-1/2" /> {/* 작성자 · 메타 */}
        </div>
      )}
    </div>
  );
}
