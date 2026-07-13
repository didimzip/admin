"use client";

import Carousel from "@/components/ui/Carousel";
import SectionLabel from "@/components/ui/SectionLabel";
import ReviewCard from "./ReviewCard";
import type { MentorReview } from "@/lib/mock-data";

// 멘토링 후기 섹션 — 공통 인피니트 Carousel(화면밖 카드 30% + 무한 루프) + 공통 컴포넌트 재사용.
export default function ReviewSection({ reviews }: { reviews: MentorReview[] }) {
  return (
    <Carousel
      items={reviews}
      itemWidth={281}
      gap={24}
      edgeFade
      renderItem={(review: MentorReview) => <ReviewCard review={review} />}
      header={
        <div>
          <SectionLabel className="text-[#999999]">
            멘토링 이후, 실제로 달라진 창업가들의 이야기
          </SectionLabel>
          <h2 className="mt-1 text-[24px] font-bold">디딤멘토와 만난 후, 달라진 이야기</h2>
        </div>
      }
    />
  );
}
