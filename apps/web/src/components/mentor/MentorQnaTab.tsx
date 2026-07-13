"use client";

import { useState, useMemo, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { BiSearch } from "react-icons/bi";
import FilterChip from "@/components/ui/FilterChip";
import Dropdown from "@/components/ui/Dropdown";
import QnaCardSkeleton from "@/components/ui/QnaCardSkeleton";
import LatestQnaCard from "./LatestQnaCard";
import { fetchQnaPage, type QnaSort } from "@/lib/qna-queries";
import { useInfiniteScrollSentinel } from "@/hooks/useInfiniteScrollSentinel";

const TABS = [
  "전체",
  "자금조달",
  "사업화전략",
  "오픈이노베이션",
  "기관투자자",
  "바우처공급기업",
  "창업공간",
];
const SORT_OPTIONS = ["최신순", "조회수순", "답변수순"] as const;
const PAGE_SIZE = 12; // 최초/추가 로드 단위

// 멘토에게 질문 — 카테고리 필터 + 정렬 + 검색 + Intersection Observer 기반 Infinite Scroll(useInfiniteQuery).
export default function MentorQnaTab() {
  const [category, setCategory] = useState("전체");
  const [sort, setSort] = useState<QnaSort>("최신순");
  const [search, setSearch] = useState("");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["mentor-qna", category, sort, search],
    queryFn: ({ pageParam }) =>
      fetchQnaPage({ page: pageParam, pageSize: PAGE_SIZE, category, search, sort }),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage ?? undefined,
  });

  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

  const onIntersect = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const sentinelRef = useInfiniteScrollSentinel<HTMLDivElement>(
    onIntersect,
    hasNextPage && !isFetchingNextPage,
  );

  return (
    <div>
      {/* 카테고리 탭 + 전문가 등록하기 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-[6px]">
          {TABS.map((tab) => (
            <FilterChip key={tab} active={category === tab} onClick={() => setCategory(tab)}>
              {tab}
            </FilterChip>
          ))}
        </div>
        <button
          type="button"
          className="h-[34px] shrink-0 rounded-md border border-[#e1e2e3] bg-white px-[14px] text-[14px] font-normal text-[#666666] transition-colors hover:border-[#999999]"
        >
          전문가 등록하기
        </button>
      </div>

      {/* 전체 건수 + 정렬 + 검색 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[14px] font-semibold text-[#333333]">전체 {total}건</span>
        <div className="flex items-center gap-[10px]">
          <Dropdown value={sort} options={SORT_OPTIONS} onChange={setSort} ariaLabel="정렬 기준" />
          <div className="flex h-[34px] w-[240px] items-center gap-[6px] rounded-md border border-[#e1e2e3] bg-white px-[10px] transition-colors focus-within:border-[#999999]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="멘토에게 질문 내 검색..."
              className="min-w-0 flex-1 bg-transparent text-[14px] text-[#333333] outline-none placeholder:text-[#999999]"
            />
            <BiSearch size={16} className="shrink-0 text-[#999999]" />
          </div>
        </div>
      </div>

      {/* 질문 리스트 — 최초 12개 스켈레톤 → 실제 카드, 추가 로드 시 하단 12개 스켈레톤 append */}
      <div className="flex flex-col gap-4">
        {isLoading
          ? Array.from({ length: PAGE_SIZE }).map((_, i) => <QnaCardSkeleton key={`first-${i}`} />)
          : items.map((item) => <LatestQnaCard key={item.id} item={item} />)}

        {isFetchingNextPage &&
          Array.from({ length: PAGE_SIZE }).map((_, i) => <QnaCardSkeleton key={`next-${i}`} />)}
      </div>

      {/* Intersection Observer 센티넬 — 보이면 다음 12개 자동 로드 */}
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />

      {!isLoading && items.length === 0 && (
        <p className="py-16 text-center text-[14px] text-[#999999]">
          {search.trim() ? "검색 결과가 없습니다." : "등록된 질문이 없습니다."}
        </p>
      )}
    </div>
  );
}
