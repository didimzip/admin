"use client";

import { useState } from "react";
import Link from "next/link";
import { AiOutlineRight } from "react-icons/ai";
import FilterChip from "@/components/ui/FilterChip";
import LatestQnaCard from "./LatestQnaCard";
import type { LatestQnaItem } from "@/lib/mock-data";

const TABS = [
  "전체",
  "자금조달",
  "사업화전략",
  "오픈이노베이션",
  "기관투자자",
  "바우처공급기업",
  "창업공간",
];

const MAX_ITEMS = 5; // 최대 5개만 노출, 나머지는 '더보기'로

// 최신 Q&A — 리스트 형태(카테고리 필터 + 최대 5개). Carousel/PaginationButton 미사용.
export default function LatestQnaSection({ items }: { items: LatestQnaItem[] }) {
  const [activeTab, setActiveTab] = useState("전체");

  const filtered = (
    activeTab === "전체" ? items : items.filter((q) => q.category === activeTab)
  ).slice(0, MAX_ITEMS);

  return (
    <div>
      {/* 헤더: 제목 + 더보기 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[24px] font-bold">최신 Q&A</h2>
        <Link
          href="/mentor?tab=question"
          className="flex items-center gap-1.5 text-[14px] font-semibold text-[#666666] transition-colors hover:text-[#333333]"
        >
          더보기
          <AiOutlineRight size={14} />
        </Link>
      </div>

      {/* 카테고리 필터 */}
      <div className="mb-5 flex flex-wrap gap-[6px]">
        {TABS.map((tab) => (
          <FilterChip key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
            {tab}
          </FilterChip>
        ))}
      </div>

      {/* 리스트 (최대 5개) */}
      {filtered.length > 0 ? (
        <div className="flex flex-col gap-4">
          {filtered.map((item) => (
            <LatestQnaCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-[14px] text-[#999999]">
          해당 카테고리의 최신 Q&A가 없습니다.
        </p>
      )}
    </div>
  );
}
