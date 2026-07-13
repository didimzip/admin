"use client";

import MentorCard from "./MentorCard";
import Carousel from "@/components/ui/Carousel";
import type { MentorProfile } from "@/lib/mock-data";

// 궁금한 점, 디딤멘토에게 물어보세요 — 공통 인피니트 Carousel(멘토 카드).
export default function MentorSection({ mentors }: { mentors: MentorProfile[] }) {
  return (
    <Carousel
      items={mentors}
      perView={4}
      minItemWidth={280}
      gap={16}
      renderItem={(m: MentorProfile) => <MentorCard mentor={m} />}
      header={<h2 className="text-[24px] font-bold">궁금한 점, 디딤멘토에게 물어보세요</h2>}
    />
  );
}
