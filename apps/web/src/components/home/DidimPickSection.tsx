"use client";

import ContentCard from "@/components/ui/ContentCard";
import Carousel from "@/components/ui/Carousel";
import SectionLabel from "@/components/ui/SectionLabel";
import { generateContents } from "@/lib/mock-data";

// 디딤집이 직접 선별한 추천 콘텐츠 — 광고(isAd) 제외. 7개 생성 후 AD 걸러 6개.
const items = generateContents(7).filter((c) => !c.isAd);

// 디딤집 Pick — 공통 인피니트 Carousel(4열, 다크 카드).
export default function DidimPickSection() {
  return (
    <Carousel
      items={items}
      perView={4}
      minItemWidth={240}
      gap={16}
      renderItem={(item) => <ContentCard item={item} dark />}
      header={
        <div>
          <SectionLabel className="text-[#999999]">디딤집이 직접 선별한 추천 콘텐츠</SectionLabel>
          <h2 className="mt-1 text-[24px] font-bold text-white">디딤집 Pick</h2>
        </div>
      }
    />
  );
}
