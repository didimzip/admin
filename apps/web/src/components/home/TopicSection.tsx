"use client";

import ContentCard from "@/components/ui/ContentCard";
import Carousel from "@/components/ui/Carousel";
import type { ContentCard as ContentCardType } from "@/lib/mock-data";

// 주제별로 싹 모아둔 핵심 디딤.zip — 공통 인피니트 Carousel(4열, ZIP variant).
export default function TopicSection({ items }: { items: ContentCardType[] }) {
  return (
    <Carousel
      items={items}
      perView={4}
      minItemWidth={240}
      gap={16}
      renderItem={(item: ContentCardType) => (
        // ZIP variant: HOT/카테고리 대신 '닉네임 | 콘텐츠 N개'. 개수는 viewCount 기반 결정적 값.
        <ContentCard item={item} zip zipCount={(item.viewCount % 45) + 5} />
      )}
      header={<h2 className="text-[24px] font-bold">주제별로 싹 모아둔 핵심 디딤.zip</h2>}
    />
  );
}
