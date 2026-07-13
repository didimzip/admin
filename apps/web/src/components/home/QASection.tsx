"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import FilterChip from "@/components/ui/FilterChip";
import Carousel from "@/components/ui/Carousel";
import type { QAItem } from "@/lib/mock-data";

const tabs = ["전체", "자금조달", "사업화전략", "마케팅", "조직문화"];

// 많이 본 Q&A — 공통 인피니트 Carousel(3열). 탭 필터는 subheader 로 헤더와 트랙 사이에 배치.
export default function QASection({ items }: { items: QAItem[] }) {
  const [activeTab, setActiveTab] = useState("전체");

  const filtered =
    activeTab === "전체" ? items : items.filter((q) => q.category === activeTab);

  return (
    <Carousel
      items={filtered}
      perView={3}
      minItemWidth={300}
      gap={16}
      renderItem={(item: QAItem) => (
        <Card href={`/mentor/qna/${item.id}`} className="flex h-full flex-col gap-2">
          <h3 className="text-[18px] font-semibold leading-[1.2] line-clamp-1">{item.title}</h3>
          <p className="text-[14px] font-normal text-muted-foreground leading-relaxed line-clamp-2">
            {item.summary}
          </p>
          {/* 메타: 카테고리 | 조회수 N | 답변수 N */}
          <div className="mt-1 flex items-center gap-2 text-[12px] font-normal text-[#999999]">
            <span>{item.category}</span>
            <span className="h-[10px] w-px bg-[#e1e2e3]" />
            <span>
              조회수 <span className="font-normal text-[#333333]">{item.viewCount.toLocaleString()}</span>
            </span>
            <span className="h-[10px] w-px bg-[#e1e2e3]" />
            <span>
              답변수 <span className="font-normal text-[#999999]">{item.answerCount}</span>
            </span>
          </div>
        </Card>
      )}
      header={<h2 className="text-[24px] font-bold">많이 본 Q&A</h2>}
      subheader={
        <div className="mb-5 flex flex-wrap gap-[6px]">
          {tabs.map((tab) => (
            <FilterChip key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
              {tab}
            </FilterChip>
          ))}
        </div>
      }
    />
  );
}
