import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import DetailHeader from "./DetailHeader";
import SmallContentCardSkeleton from "./SmallContentCardSkeleton";

const Divider = () => <div className="h-px w-full bg-[#e1e2e3]" />;

// 상세페이지 Suspense fallback — 실제 ContentDetail 과 "동일한 레이아웃 컴포넌트"(DetailHeader 등)를
// 공유해 위치/간격/정렬이 100% 일치. 콘텐츠만 Skeleton 바로 대체 → CLS 없음.
export default function ContentDetailSkeleton() {
  return (
    <div className="flex flex-col gap-[36px] lg:flex-row lg:items-start">
      {/* ── 본문 ── */}
      <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-lg)]">
        {/* 헤더 — 실제와 동일한 DetailHeader 구조(액션은 작성자 행 우측 끝) */}
        <DetailHeader
          breadcrumb={<Skeleton className="h-[18px] w-40" />}
          title={<Skeleton className="h-[40px] w-3/4" />}
          author={<Skeleton className="h-[20px] w-24" />}
          meta={<Skeleton className="h-[18px] w-64" />}
          actions={
            <>
              <Skeleton className="h-[18px] w-[18px] rounded-md" />
              <Skeleton className="h-[18px] w-[18px] rounded-md" />
              <Skeleton className="h-[18px] w-[18px] rounded-md" />
            </>
          }
        />

        <Divider />

        {/* 히어로 이미지 */}
        <div className="aspect-video w-full overflow-hidden rounded-[10px] border border-[#eee] bg-[#ececec]">
          <div className="h-full w-full animate-pulse" />
        </div>

        {/* 본문 텍스트 */}
        <div className="flex flex-col gap-3">
          {["w-full", "w-full", "w-11/12", "w-full", "w-4/5", "w-full", "w-3/4"].map((w, i) => (
            <Skeleton key={i} className={`h-[16px] ${w}`} />
          ))}
        </div>

        <Divider />

        {/* 관련 태그 */}
        <div className="flex flex-col gap-3">
          <Skeleton className="h-[22px] w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-[24px] w-16 rounded-md" />
            <Skeleton className="h-[24px] w-20 rounded-md" />
            <Skeleton className="h-[24px] w-14 rounded-md" />
          </div>
        </div>

        <Divider />

        {/* 추천 콘텐츠 */}
        <div className="flex flex-col gap-3">
          <Skeleton className="h-[22px] w-40" />
          <div className="grid grid-cols-2 gap-[18px] sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SmallContentCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>

      {/* ── 사이드바 ── */}
      <aside className="flex w-full shrink-0 flex-col gap-[var(--space-lg)] lg:w-[400px]">
        {/* 작성자 카드 */}
        <Card className="flex flex-col gap-[12px]">
          <div className="flex flex-col gap-[12px] pb-[12px]">
            <div className="flex items-center gap-[12px]">
              <Skeleton className="h-[60px] w-[60px] rounded-full" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-[20px] w-28" /> {/* 닉네임 */}
                {/* 회원 상태 배지 */}
                <div className="flex gap-1.5">
                  <Skeleton className="h-[22px] w-16 rounded-md" />
                  <Skeleton className="h-[22px] w-14 rounded-md" />
                </div>
              </div>
            </div>
            <div className="h-px bg-[#eee]" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-[14px] w-full" />
              <Skeleton className="h-[14px] w-11/12" />
              <Skeleton className="h-[14px] w-2/3" />
            </div>
          </div>
          <div className="flex gap-[12px]">
            <Skeleton className="h-[34px] flex-1 rounded-md" />
            <Skeleton className="h-[34px] flex-1 rounded-md" />
          </div>
        </Card>

        {/* 작성자 다른 콘텐츠 */}
        <Card className="flex flex-col gap-[var(--space-lg)]">
          <Skeleton className="h-[22px] w-52" />
          <div className="grid grid-cols-2 gap-[18px]">
            {Array.from({ length: 4 }).map((_, i) => (
              <SmallContentCardSkeleton key={i} />
            ))}
          </div>
          <Skeleton className="h-[34px] w-full rounded-md" />
        </Card>
      </aside>
    </div>
  );
}
