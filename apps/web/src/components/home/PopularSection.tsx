"use client";

import ContentCard from "@/components/ui/ContentCard";
import Carousel from "@/components/ui/Carousel";
import type { ContentCard as ContentCardType } from "@/lib/mock-data";

// 창업가들이 주목한 콘텐츠 — 공통 인피니트 Carousel(4열, 반응형).
export default function PopularSection({ items }: { items: ContentCardType[] }) {
  return (
    <Carousel
      items={items}
      perView={4}
      minItemWidth={240}
      gap={16}
      renderItem={(item: ContentCardType) => <ContentCard item={item} />}
      header={<h2 className="text-[24px] font-bold">창업가들이 주목한 콘텐츠</h2>}
    />
  );
}
