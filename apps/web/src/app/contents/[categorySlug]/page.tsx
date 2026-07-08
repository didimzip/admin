"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Search, ChevronDown } from "lucide-react";
import ContentCard from "@/components/ui/ContentCard";
import AdBanner from "@/components/home/AdBanner";
import Footer from "@/components/layout/Footer";
import type { ContentCard as ContentCardType } from "@/lib/mock-data";
import { postsApi, categoriesApi, bannersApi, type Category, type Banner } from "@didimzip/api";
import { postToContentCard } from "@/lib/post-adapter";
import clsx from "clsx";

export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.categorySlug as string;
  const tabParam = searchParams.get("tab");

  const [apiCategories, setApiCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState(tabParam ?? "all");
  const [sortBy] = useState("최신순");
  const [contents, setContents] = useState<ContentCardType[]>([]);
  const [categoryAd, setCategoryAd] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);

  const category = apiCategories.find((c) => c.slug === slug);

  // API에서 게시글·카테고리·광고 조회 (admin 변경이 새로고침 시 반영됨)
  // 광고: CATEGORY_TOP_BANNER 위치 조건 충족분 중 weight 가중 랜덤 1개 (없으면 null)
  useEffect(() => {
    let alive = true;
    Promise.all([
      postsApi.list({ status: "PUBLISHED" }).catch(() => []),
      categoriesApi.list({ visible: true }).catch(() => []),
      bannersApi.pickAd("CATEGORY_TOP_BANNER").catch(() => null),
    ])
      .then(([posts, cats, ad]) => {
        if (!alive) return;
        setContents(posts.map(postToContentCard));
        setApiCategories(cats);
        setCategoryAd(ad);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Sync tab state when URL param changes
  useEffect(() => {
    setActiveTab(tabParam ?? "all");
  }, [tabParam]);

  const tabs = [
    { slug: "all", name: "전체" },
    ...(category?.subCategories ?? []).map((s) => ({ slug: s.slug, name: s.name })),
  ];

  return (
    <div className="flex flex-col">
      <div className="max-w-[1200px] w-full mx-auto px-6">
        {/* 광고 배너 (CATEGORY_TOP_BANNER) — Admin CMS → API(pickAd) → Web, weight 가중 랜덤.
            없으면 렌더되지 않음. 검색 영역 바로 아래 · 카테고리 제목 위. */}
        {categoryAd && (
          <div className="mt-6">
            <AdBanner ad={categoryAd} />
          </div>
        )}

        {/* Category Title */}
        <div className="mt-8">
          <h1 className="text-2xl font-bold">{category?.name ?? slug}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {category?.name ? `${category.name} 카테고리의 콘텐츠를 확인하세요.` : ""}
          </p>
        </div>

        {/* Subcategory Tabs */}
        <div className="flex gap-2 mt-6">
          {tabs.map((tab) => (
            <button
              key={tab.slug}
              onClick={() => {
                if (tab.slug === "all") {
                  router.push(`/contents/${slug}`);
                } else {
                  router.push(`/contents/${slug}?tab=${tab.slug}`);
                }
              }}
              className={clsx(
                "px-4 py-1.5 text-sm rounded-full border transition-colors",
                activeTab === tab.slug
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white text-muted-foreground border-border hover:border-foreground hover:text-foreground"
              )}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* List Controller */}
        <div className="flex items-center justify-between mt-6 mb-4">
          <p className="text-sm">
            전체{" "}
            <span className="font-semibold text-primary">
              {contents.length}건
            </span>
          </p>
          <div className="flex items-center gap-3">
            {/* Sort */}
            <div className="relative">
              <button className="flex items-center gap-1 text-sm text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:border-foreground transition-colors">
                {sortBy}
                <ChevronDown size={14} />
              </button>
            </div>
            {/* Search */}
            <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-1.5 w-56">
              <input
                type="text"
                placeholder={`${category?.name ?? ""} 내 검색...`}
                className="text-sm bg-transparent outline-none flex-1 placeholder:text-muted-foreground"
              />
              <Search size={14} className="text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-4 gap-5">
          {contents.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>

        {/* Skeleton loading */}
        {loading && (
          <div className="grid grid-cols-4 gap-5 mt-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video rounded-lg bg-muted" />
                <div className="h-3 bg-muted rounded mt-3 w-3/4" />
                <div className="h-2.5 bg-muted rounded mt-2 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && contents.length === 0 && (
          <p className="text-sm text-muted-foreground py-16 text-center">
            아직 등록된 콘텐츠가 없습니다.
          </p>
        )}
      </div>

      <Footer />
    </div>
  );
}
