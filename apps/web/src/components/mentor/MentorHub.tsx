"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { PiChatCircleDotsFill } from "react-icons/pi";
import type { Banner } from "@didimzip/api";
import LNB, { type LnbTab } from "@/components/ui/LNB";
import QASection from "@/components/home/QASection";
import MentorCard from "@/components/home/MentorCard";
import AdBanner from "@/components/home/AdBanner";
import ReviewSection from "./ReviewSection";
import LatestQnaSection from "./LatestQnaSection";
import MentorQnaTab from "./MentorQnaTab";
import PaginationButton from "@/components/ui/PaginationButton";
import { qaItems, mentors, mentorReviews, latestQnaItems } from "@/lib/mock-data";

// LNB 탭 — 아이콘은 텍스트 색 상속(활성 #333 / 기본 #666)
const NAV_TABS: LnbTab[] = [
  { label: "홈" },
  { label: "멘토에게 질문" },
  { label: "전문 디딤멘토 매칭", icon: <PiChatCircleDotsFill size={20} /> },
];

// URL ?tab= 슬러그 ↔ 탭 라벨 (탭 상태의 단일 소스 = URL. 로컬 state 없음 → URL·화면 항상 일치)
function slugToNav(slug: string | null): string {
  if (slug === "question") return "멘토에게 질문";
  if (slug === "matching") return "전문 디딤멘토 매칭";
  return "홈";
}
function navToSlug(label: string): string {
  if (label === "멘토에게 질문") return "question";
  if (label === "전문 디딤멘토 매칭") return "matching";
  return "";
}

// 멘토 Q&A / 매칭 페이지 본문. 상단 광고+LNB+Q&A+디딤멘토 소개는 1200 컨테이너,
// '디딤멘토와 만난 후, 달라진 이야기'(후기)는 메인과 동일한 풀폭 그레이 밴드(#f6f6f6).
export default function MentorHub({ topAd }: { topAd: Banner | null }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  // 탭 상태는 URL 에서 파생(단일 소스). LNB 클릭은 URL 만 갱신 → 항상 한 번의 클릭으로 반영.
  const activeNav = slugToNav(searchParams.get("tab"));
  const isHome = activeNav === "홈";

  const handleNavChange = (label: string) => {
    const slug = navToSlug(label);
    router.push(slug ? `/mentor?tab=${slug}` : "/mentor");
  };

  return (
    <>
      {/* 컨테이너 영역 */}
      <div className="mx-auto w-full max-w-[1200px] px-6 pt-[var(--space-xl)]">
        {/* 상단 광고 (MENTOR_TOP) */}
        {topAd && (
          <div className="mb-6">
            <AdBanner ad={topAd} />
          </div>
        )}

        <div className="flex flex-col gap-[var(--space-xl)]">
          <LNB tabs={NAV_TABS} active={activeNav} onChange={handleNavChange} />

          {isHome && (
            <div className="flex flex-col gap-[var(--space-section)]">
              {/* 많이 본 Q&A — 메인과 동일 컴포넌트 재사용 */}
              <QASection items={qaItems} />

              {/* 디딤멘토를 소개합니다 — 3열 그리드(반응형), MentorCard 재사용 (기존 유지) */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[24px] font-bold">디딤멘토를 소개합니다</h2>
                  <PaginationButton />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {mentors.slice(0, 3).map((m) => (
                    <MentorCard key={m.id} mentor={m} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 멘토에게 질문 — 질문 리스트 + Infinite Scroll */}
          {activeNav === "멘토에게 질문" && (
            <div className="pb-[120px]">
              <MentorQnaTab />
            </div>
          )}
        </div>
      </div>

      {isHome && (
        <>
          {/* 디딤멘토와 만난 후, 달라진 이야기 — 멘토링 후기(Review). 풀폭 그레이 밴드(#f6f6f6) */}
          <div className="mt-[var(--space-section)] bg-[#f6f6f6] py-[var(--space-section)]">
            <div className="mx-auto w-full max-w-[1200px] px-6">
              <ReviewSection reviews={mentorReviews} />
            </div>
          </div>

          {/* 최신 Q&A — 전체 폭 Q&A 카드 리스트 */}
          <div className="mx-auto w-full max-w-[1200px] px-6 pt-[var(--space-section)] pb-[120px]">
            <LatestQnaSection items={latestQnaItems} />
          </div>
        </>
      )}

      {/* 전문 디딤멘토 매칭 — 준비 중 */}
      {activeNav === "전문 디딤멘토 매칭" && (
        <div className="mx-auto w-full max-w-[1200px] px-6 py-20 text-center text-[14px] text-[#999999]">
          준비 중입니다.
        </div>
      )}
    </>
  );
}
