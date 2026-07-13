import { Suspense } from "react";
import { bannersApi, type Banner, type BannerPosition } from "@didimzip/api";
import HeroBanner, { type HeroSlide } from "@/components/home/HeroBanner";
import DidimPickSection from "@/components/home/DidimPickSection";
import AdBanner from "@/components/home/AdBanner";
import {
  RecommendedSectionAsync,
  LatestSectionAsync,
  PopularSectionAsync,
  TopicSectionAsync,
  QASectionAsync,
  MentorSectionAsync,
  CommuneSectionAsync,
} from "@/components/home/SectionsAsync";
import {
  RecommendedSectionSkeleton,
  LatestSectionSkeleton,
  PopularSectionSkeleton,
  TopicSectionSkeleton,
  QASectionSkeleton,
  MentorSectionSkeleton,
  CommuneSectionSkeleton,
} from "@/components/home/SectionSkeletons";

// 매 요청마다 최신 데이터 조회 (admin 생성/수정/삭제 → web 새로고침 시 즉시 반영)
export const dynamic = "force-dynamic";

// Hero: Admin > 배너 관리의 활성 히어로 슬라이드만 노출 순서대로 조회
async function loadHeroSlides(): Promise<HeroSlide[]> {
  try {
    const banners = await bannersApi.list({
      type: "HERO",
      position: "HOME_HERO",
      active: true,
    });
    return banners.map((b) => ({
      id: b.id,
      badge: b.subtitle, // 소제목 → Badge(Pill)
      title: b.title, // 타이틀
      subText: b.subText, // 하단 서브텍스트 → 하단 설명(일반 텍스트)
      image: b.imageData || b.imageUrl,
      textColor: b.textColor,
    }));
  } catch {
    return [];
  }
}

// 광고: Admin > 배너 관리의 ADVERTISEMENT 중 조건 충족분에서 weight 가중 랜덤 1개.
async function loadAd(position: BannerPosition): Promise<Banner | null> {
  try {
    return await bannersApi.pickAd(position);
  } catch {
    return null;
  }
}

export default async function HomePage() {
  // Hero·광고만 셸에서 즉시 로드(콘텐츠 카드 아님). 콘텐츠 섹션은 각자 Suspense 로 스트리밍.
  const [heroSlides, middleAd, bottomAd] = await Promise.all([
    loadHeroSlides(),
    loadAd("HOME_MIDDLE"),
    loadAd("HOME_BOTTOM"),
  ]);

  return (
    <div className="flex flex-col">
      <HeroBanner slides={heroSlides} />

      {/* 섹션 간격은 py-xl(30px) → 인접 섹션 사이 60px(=section) 리듬.
          각 콘텐츠 섹션은 Suspense 로 감싸 데이터 로딩 중 공통 스켈레톤을 노출(SSR·SEO 유지). */}
      <div className="max-w-[1200px] w-full mx-auto px-6">
        {/* 놓치면 아쉬운 콘텐츠 */}
        <section className="py-[var(--space-xl)]">
          <Suspense fallback={<RecommendedSectionSkeleton />}>
            <RecommendedSectionAsync />
          </Suspense>
        </section>

        {/* 중간 광고 배너 — 위 섹션과 60px(30+30) */}
        <div className="mt-[var(--space-xl)]">
          <AdBanner ad={middleAd} />
        </div>

        {/* 새로 올라온 콘텐츠 — 광고 배너와 30px(0+30) */}
        <section className="py-[var(--space-xl)]">
          <Suspense fallback={<LatestSectionSkeleton />}>
            <LatestSectionAsync />
          </Suspense>
        </section>

        {/* 창업가들이 주목한 콘텐츠 — 60px */}
        <section className="py-[var(--space-xl)]">
          <Suspense fallback={<PopularSectionSkeleton />}>
            <PopularSectionAsync />
          </Suspense>
        </section>

        {/* 주제별로 싹 모아둔 핵심 디딤.zip — 창업가 섹션과 동일 구조, 한 줄(4칸)만 노출 */}
        <section className="py-[var(--space-xl)]">
          <Suspense fallback={<TopicSectionSkeleton />}>
            <TopicSectionAsync />
          </Suspense>
        </section>
      </div>

      {/* 디딤집 Pick (하이라이트 밴드) */}
      <div className="bg-[#1a1a1a] py-[var(--space-section)] my-[var(--space-xl)]">
        <div className="max-w-[1200px] w-full mx-auto px-6">
          <DidimPickSection />
        </div>
      </div>

      {/* 많이 본 Q&A */}
      <div className="max-w-[1200px] w-full mx-auto px-6">
        <section className="py-[var(--space-xl)]">
          <Suspense fallback={<QASectionSkeleton />}>
            <QASectionAsync />
          </Suspense>
        </section>
      </div>

      {/* 궁금한 점, 디딤멘토에게 물어보세요 — 디딤집 Pick과 동일한 밴드 구조, 배경만 라이트 그레이(#F6F6F6) */}
      <div className="bg-[#f6f6f6] py-[var(--space-section)] my-[var(--space-xl)]">
        <div className="max-w-[1200px] w-full mx-auto px-6">
          <Suspense fallback={<MentorSectionSkeleton />}>
            <MentorSectionAsync />
          </Suspense>
        </div>
      </div>

      <div className="max-w-[1200px] w-full mx-auto px-6">
        {/* 지금 꼬뮨 라운지 */}
        <section className="py-[var(--space-xl)]">
          <Suspense fallback={<CommuneSectionSkeleton />}>
            <CommuneSectionAsync />
          </Suspense>
        </section>

        {/* 홈 하단 광고 배너 (HOME_BOTTOM) */}
        {bottomAd && (
          <section className="py-[var(--space-xl)]">
            <AdBanner ad={bottomAd} />
          </section>
        )}
      </div>
    </div>
  );
}
