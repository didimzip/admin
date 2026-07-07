import { postsApi, bannersApi } from "@didimzip/api";
import HeroBanner, { type HeroSlide } from "@/components/home/HeroBanner";
import RecommendedSection from "@/components/home/RecommendedSection";
import LatestSection from "@/components/home/LatestSection";
import PopularSection from "@/components/home/PopularSection";
import DidimPickSection from "@/components/home/DidimPickSection";
import QASection from "@/components/home/QASection";
import MentorSection from "@/components/home/MentorSection";
import CommuneSection from "@/components/home/CommuneSection";
import PromoBanner from "@/components/home/PromoBanner";
import Footer from "@/components/layout/Footer";
import { postToContentCard } from "@/lib/post-adapter";
import type { ContentCard } from "@/lib/mock-data";

// 매 요청마다 최신 데이터 조회 (admin 생성/수정/삭제 → web 새로고침 시 즉시 반영)
export const dynamic = "force-dynamic";

async function loadPosts(): Promise<ContentCard[]> {
  try {
    const posts = await postsApi.list({ status: "PUBLISHED" });
    return posts.map(postToContentCard);
  } catch {
    // API 서버 미기동 등: 빈 목록으로 폴백 (페이지는 정상 렌더)
    return [];
  }
}

// Hero: Admin > 배너 관리의 활성 히어로 슬라이드만 노출 순서대로 조회
async function loadHeroSlides(): Promise<HeroSlide[]> {
  try {
    const banners = await bannersApi.list({
      type: "HERO_SLIDE",
      position: "HOME_TOP",
      active: true,
    });
    return banners.map((b) => ({
      id: b.id,
      badge: b.subtitle,
      title: b.title,
      description: b.description,
      ctaText: b.subText,
      linkUrl: b.linkUrl,
      image: b.imageData || b.imageUrl,
      textColor: b.textColor,
    }));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [items, heroSlides] = await Promise.all([loadPosts(), loadHeroSlides()]);
  const popular = [...items].sort((a, b) => b.viewCount - a.viewCount);

  return (
    <div className="flex flex-col">
      <HeroBanner slides={heroSlides} />

      <div className="max-w-[1200px] w-full mx-auto px-6">
        {/* 놓치면 아쉬운 콘텐츠 */}
        <section className="py-8">
          <RecommendedSection items={items} />
        </section>

        {/* 중간 배너 */}
        <PromoBanner />

        {/* 새로 올라온 콘텐츠 */}
        <section className="py-8">
          <LatestSection items={items} />
        </section>

        {/* 창업가들이 주목한 콘텐츠 */}
        <section className="py-8">
          <PopularSection items={popular} />
        </section>
      </div>

      {/* 디딤집 Pick */}
      <div className="bg-[#1a1a1a] py-10">
        <div className="max-w-[1200px] w-full mx-auto px-6">
          <DidimPickSection />
        </div>
      </div>

      <div className="max-w-[1200px] w-full mx-auto px-6">
        {/* 많이 본 Q&A */}
        <section className="py-8">
          <QASection />
        </section>

        {/* 궁금한 점, 디딤멘토에게 물어보세요 */}
        <section className="py-8">
          <MentorSection />
        </section>

        {/* 지금 꼬뮨 라운지 */}
        <section className="py-8">
          <CommuneSection />
        </section>

        {/* 하단 배너 */}
        <section className="py-8">
          <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 p-8 flex items-center justify-between text-white">
            <div>
              <p className="text-sm opacity-80">스타트업 방문 중</p>
              <h3 className="text-xl font-bold mt-1">
                스타트업을 위한 올인원 업무 관리 툴
              </h3>
              <p className="text-sm opacity-80 mt-1">
                프로젝트 관리, 커뮤니케이션, 문서 관리까지
              </p>
            </div>
            <div className="text-4xl font-black tracking-tighter opacity-90">N</div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
