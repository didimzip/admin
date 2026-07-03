"use client";

import HeroBanner from "@/components/home/HeroBanner";
import RecommendedSection from "@/components/home/RecommendedSection";
import LatestSection from "@/components/home/LatestSection";
import PopularSection from "@/components/home/PopularSection";
import DidimPickSection from "@/components/home/DidimPickSection";
import QASection from "@/components/home/QASection";
import MentorSection from "@/components/home/MentorSection";
import CommuneSection from "@/components/home/CommuneSection";
import PromoBanner from "@/components/home/PromoBanner";
import Footer from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroBanner />

      <div className="max-w-[1200px] w-full mx-auto px-6">
        {/* 놓치면 아쉬운 콘텐츠 */}
        <section className="py-8">
          <RecommendedSection />
        </section>

        {/* 중간 배너 */}
        <PromoBanner />

        {/* 새로 올라온 콘텐츠 */}
        <section className="py-8">
          <LatestSection />
        </section>

        {/* 창업가들이 주목한 콘텐츠 */}
        <section className="py-8">
          <PopularSection />
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
