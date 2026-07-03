"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ContentCard from "@/components/ui/ContentCard";
import type { ContentCard as ContentCardType } from "@/lib/mock-data";

export default function RecommendedSection({ items }: { items: ContentCardType[] }) {
  if (items.length === 0) return null;

  const main = items[0];
  const sub = items.slice(1, 5);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[13px] text-muted-foreground">
            조정언님이 좋아할 만한 콘텐츠
          </p>
          <h2 className="text-[20px] font-bold mt-1">놓치면 아쉬운 콘텐츠</h2>
        </div>
        <div className="flex gap-1.5">
          <button className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
          <button className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Main featured card - horizontal layout */}
      <div className="flex gap-6 mb-5">
        <div className="w-1/2 shrink-0">
          <ContentCard item={main} hideInfo />
        </div>
        <div className="flex-1 flex flex-col justify-center py-2">
          <Link href={`/contents/${main.id}`} className="group">
            <h3 className="text-[22px] font-bold leading-[1.4] line-clamp-2 group-hover:underline decoration-1 underline-offset-4">
              {main.title}
            </h3>
          </Link>
          <p className="text-[14px] text-muted-foreground mt-3 leading-relaxed line-clamp-3">
            {main.summary}
          </p>
          <div className="flex items-center gap-1.5 mt-4 text-[13px] text-muted-foreground">
            <span className="font-semibold text-foreground">{main.author}</span>
            <span>·</span>
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
