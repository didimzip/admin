"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { BiSearch } from "react-icons/bi";
import { useInfiniteQuery } from "@tanstack/react-query";
import ContentCard from "@/components/ui/ContentCard";
import ContentCardSkeleton from "@/components/ui/ContentCardSkeleton";
import FilterChip from "@/components/ui/FilterChip";
import Dropdown from "@/components/ui/Dropdown";
import AdBanner from "@/components/home/AdBanner";
import { categoriesApi, bannersApi, type Category, type Banner } from "@didimzip/api";
import { fetchContentPage } from "@/lib/content-queries";
import { useInfiniteScrollSentinel } from "@/hooks/useInfiniteScrollSentinel";

const PAGE_SIZE = 12; // 4열 × 3행
const NEXT_ROW = 4; // 다음 페이지 로딩 시 노출할 스켈레톤(1줄)
const SORT_OPTIONS = ["최신순", "인기순", "조회순"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.categorySlug as string;
  const tabParam = searchParams.get("tab");

  const [apiCategories, setApiCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState(tabParam ?? "all");
  const [sort, setSort] = useState<SortOption>("최신순");
  const [search, setSearch] = useState("");
  const [categoryAd, setCategoryAd] = useState<Banner | null>(null);

  const category = apiCategories.find((c) => c.slug === slug);

  // 카테고리·광고는 페이지네이션 대상이 아니므로 1회 조회 (콘텐츠는 아래 useInfiniteQuery)
  useEffect(() => {
    let alive = true;
    Promise.all([
      categoriesApi.list({ visible: true }).catch(() => []),
      bannersApi.pickAd("CATEGORY_TOP_BANNER").catch(() => null),
    ]).then(([cats, ad]) => {
      if (!alive) return;
      setApiCategories(cats);
      setCategoryAd(ad);
    });
    return () => {
      alive = false;
    };
  }, []);

  // ── Infinite Scroll: page 기반 useInfiniteQuery ──
  // queryKey 에 slug/tab 포함 → 카테고리/탭 전환 시 1페이지부터 새로 로드.
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["category-contents", slug, activeTab],
    queryFn: ({ pageParam }) => fetchContentPage({ page: pageParam, pageSize: PAGE_SIZE, category: slug }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
  });

  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  // 로드된 콘텐츠에 검색어 필터 + 정렬 적용 (클라이언트) — 추후 서버 파라미터로 승격 가능
  const displayItems = useMemo(() => {
    const q = search.trim();
    const filtered = q
      ? items.filter((i) => i.title.includes(q) || i.summary.includes(q))
      : items;
    if (sort === "최신순") return filtered; // API/더미 기본 순서 = 최신순
    return [...filtered].sort((a, b) => b.viewCount - a.viewCount); // 인기순·조회순
  }, [items, search, sort]);

  // 센티넬이 보이면 다음 페이지 요청 (다음 페이지 있고, 지금 로딩 중이 아닐 때만)
  const onIntersect = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const sentinelRef = useInfiniteScrollSentinel<HTMLDivElement>(
    onIntersect,
    hasNextPage && !isFetchingNextPage,
  );

  // URL 탭 파라미터 동기화
  useEffect(() => {
    setActiveTab(tabParam ?? "all");
  }, [tabParam]);

  const tabs = [
    { slug: "all", name: "전체" },
    ...(category?.subCategories ?? []).map((s) => ({ slug: s.slug, name: s.name })),
  ];
  const activeTabName = tabs.find((t) => t.slug === activeTab)?.name ?? "전체";

  return (
    <div className="flex flex-col">
      {/* 콘텐츠 영역 — 마지막 콘텐츠와 Footer 사이 항상 120px 여백(개수 무관, 반응형 동일). Footer 미변경. */}
      <div className="max-w-[1200px] w-full mx-auto px-6 pb-[120px]">
        {/* 광고 배너 (CATEGORY_TOP_BANNER) */}
        {categoryAd && (
          <div className="mt-6">
            <AdBanner ad={categoryAd} />
          </div>
        )}

        {/* Header — 타이틀 + 서브텍스트 + 구분선 */}
        <div className="mt-8 flex flex-col gap-[var(--space-lg)]">
          <div className="flex flex-col gap-[6px]">
            <h1 className="text-[36px] font-bold leading-[1.2] text-[#191919]">
              {category?.name ?? slug}
            </h1>
            <p className="text-[14px] font-normal text-[#666666]">
              {category?.name
                ? `${category.name} 카테고리의 콘텐츠를 모아봤어요.`
                : "콘텐츠를 확인해보세요."}
            </p>
          </div>
          <div className="h-px bg-[#e1e2e3]" />
        </div>

        {/* 2차 카테고리 — 공통 FilterChip(소프트 필). 많이 본 Q&A 탭과 동일 스타일 */}
        <div className="mt-[var(--space-lg)] flex flex-wrap gap-[6px]">
          {tabs.map((tab) => (
            <FilterChip
              key={tab.slug}
              active={activeTab === tab.slug}
              onClick={() =>
                router.push(
                  tab.slug === "all" ? `/contents/${slug}` : `/contents/${slug}?tab=${tab.slug}`,
                )
              }
            >
              {tab.name}
            </FilterChip>
          ))}
        </div>

        {/* 결과 수 + 정렬 + 검색 */}
        <div className="mt-[var(--space-lg)] mb-[var(--space-lg)] flex flex-wrap items-center justify-between gap-3">
          <span className="text-[14px] font-semibold text-[#333333]">
            {activeTabName} {displayItems.length}건
          </span>

          <div className="flex items-center gap-[10px]">
            {/* 정렬 — 공통 커스텀 Dropdown (네이티브 select 미사용) */}
            <Dropdown
              value={sort}
              options={SORT_OPTIONS}
              onChange={setSort}
              ariaLabel="정렬 기준"
            />

            {/* 검색 */}
            <div className="flex h-[34px] w-[240px] items-center gap-[6px] rounded-md border border-[#e1e2e3] bg-white px-[10px] transition-colors focus-within:border-[#999999]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`${category?.name ?? ""} 내 검색...`}
                className="min-w-0 flex-1 bg-transparent text-[14px] text-[#333333] outline-none placeholder:text-[#999999]"
              />
              <BiSearch size={16} className="shrink-0 text-[#999999]" />
            </div>
          </div>
        </div>

        {/* Content Grid — 첫 로딩은 스켈레톤 12개, 이후 실제 카드. 기존 카드는 다시 스켈레톤 되지 않음. */}
        <div className="grid grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <ContentCardSkeleton key={`first-${i}`} />
              ))
            : displayItems.map((item) => <ContentCard key={item.id} item={item} />)}

          {/* 다음 페이지 로딩 중: 새로 추가될 1줄만 스켈레톤 (기존 카드는 그대로 유지) */}
          {isFetchingNextPage &&
            Array.from({ length: NEXT_ROW }).map((_, i) => (
              <ContentCardSkeleton key={`next-${i}`} />
            ))}
        </div>

        {/* Intersection Observer 센티넬 — 보이면 다음 페이지 자동 요청 */}
        <div ref={sentinelRef} className="h-px w-full" aria-hidden />

        {/* Empty state */}
        {!isLoading && displayItems.length === 0 && (
          <p className="text-sm text-muted-foreground py-16 text-center">
            {search.trim() ? "검색 결과가 없습니다." : "아직 등록된 콘텐츠가 없습니다."}
          </p>
        )}
      </div>
    </div>
  );
}
