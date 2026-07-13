import Skeleton from "@/components/ui/Skeleton";

// SmallContentCard 와 동일 레이아웃 스켈레톤 (썸네일 aspect-video + 2줄 제목 + 메타).
export default function SmallContentCardSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="aspect-video w-full overflow-hidden rounded-[10px] bg-[#ececec]">
        <div className="h-full w-full animate-pulse" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-[16px] w-full" />
        <Skeleton className="h-[16px] w-2/3" />
        <Skeleton className="h-[12px] w-1/2" />
      </div>
    </div>
  );
}
