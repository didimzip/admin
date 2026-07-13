"use client";

import Image from "next/image";
import Link from "next/link";
import ContentCard from "@/components/ui/ContentCard";
import SectionLabel from "@/components/ui/SectionLabel";
import type { ContentCard as ContentCardType } from "@/lib/mock-data";

export default function RecommendedSection({ items }: { items: ContentCardType[] }) {
  if (items.length === 0) return null;

  const main = items[0];
  const sub = items.slice(1, 5);

  return (
    <div>
      {/* Header — 회원 맞춤 추천 영역이라 Carousel/PaginationButton 미적용(피처드 + 하단 4카드 고정 노출) */}
      <div className="mb-5">
        <SectionLabel className="text-muted-foreground">조정언님이 좋아할 만한 콘텐츠</SectionLabel>
        <h2 className="mt-1 text-[24px] font-bold">놓치면 아쉬운 콘텐츠</h2>
      </div>

      {/* Main featured card — 하단 카드와 동일한 4컬럼 그리드 공유(grid-cols-4 gap-4).
          이미지=col-span-2(카드1~2 폭), 텍스트=col-span-2(카드3~4 폭), 중간 gap=카드 gap 동일. */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="col-span-2">
          <ContentCard item={main} hideInfo />
        </div>
        <div className="col-span-2 flex flex-col justify-center py-2 gap-1.5">
          <Link href={`/content/${main.id}`} className="group">
            <h3 className="text-[24px] font-semibold leading-[1.2] line-clamp-2 group-hover:underline decoration-1 underline-offset-4">
              {main.title}
            </h3>
          </Link>
          <p className="text-[16px] text-muted-foreground leading-relaxed line-clamp-3">
            {main.summary}
          </p>
          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <span className="font-semibold text-foreground">{main.author}</span>
            <span>{main.category} &gt; {main.subcategory}</span>
          </div>
        </div>
      </div>

      {/* Sub cards - 4 column grid using shared ContentCard */}
      <div className="grid grid-cols-4 gap-4">
        {sub.map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
