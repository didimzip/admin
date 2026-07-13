import { Suspense } from "react";
import { bannersApi } from "@didimzip/api";
import AdBanner from "@/components/home/AdBanner";
import ContentDetail from "@/components/content/ContentDetail";
import ContentDetailSkeleton from "@/components/content/ContentDetailSkeleton";

// 매 요청마다 최신 데이터 (admin 작성/수정 → web 새로고침 시 즉시 반영)
export const dynamic = "force-dynamic";

// 상세 상단 광고 — CONTENT_TOP 위치 조건 충족분 중 weight 가중 랜덤 1개(없으면 null).
// 카테고리 상단 광고(CATEGORY_TOP_BANNER)와 동일한 pickAd 엔진 + 동일 AdBanner 컴포넌트 재사용.
async function loadTopAd() {
  try {
    return await bannersApi.pickAd("CONTENT_TOP");
  } catch {
    return null;
  }
}

// 콘텐츠 상세 — SSR + Suspense. 데이터 로딩 중 실제 레이아웃과 동일한 스켈레톤 스트리밍.
export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const topAd = await loadTopAd();

  return (
    <div className="flex flex-col">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-[var(--space-xl)] pb-[120px]">
        {/* 콘텐츠 상단 광고 (CONTENT_TOP) — 카테고리 상단 광고와 동일 위치·레이아웃 */}
        {topAd && (
          <div className="mb-6">
            <AdBanner ad={topAd} />
          </div>
        )}

        <Suspense fallback={<ContentDetailSkeleton />}>
          <ContentDetail id={id} />
        </Suspense>
      </div>
    </div>
  );
}
