"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Search, ChevronDown } from "lucide-react";
import ContentCard from "@/components/ui/ContentCard";
import Footer from "@/components/layout/Footer";
import { categories, generateContents } from "@/lib/mock-data";
import clsx from "clsx";

const contents = generateContents(12);

const sortOptions = ["최신순", "인기순", "댓글순", "조회순"];

export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.categorySlug as string;
  const tabParam = searchParams.get("tab");

  const category = categories.find((c) => c.slug === slug) ?? categories[0];
  const [activeTab, setActiveTab] = useState(tabParam ?? "all");
  const [sortBy, setSortBy] = useState("최신순");

  // Sync tab state when URL param changes
  useEffect(() => {
    setActiveTab(tabParam ?? "all");
  }, [tabParam]);

  const tabs = [
    { slug: "all", name: "전체" },
    ...category.subcategories.map((s) => ({ slug: s.slug, name: s.name })),
  ];

  return (
    <div className="flex flex-col">
      <div className="max-w-[1200px] w-full mx-auto px-6">
        {/* Promo Banner */}
        <div className="mt-6 rounded-xl overflow-hidden bg-gradient-to-r from-amber-50 to-orange-50 flex items-center justify-between px-8 py-6">
          <div>
            <span className="text-[10px] font-medium bg-white/80 px-2 py-0.5 rounded-full text-muted-foreground">
              스타트업 채용
            </span>
            <h3 className="text-lg font-bold mt-2">
              좋은 팀원을 찾는 게 가장 어렵다면
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              검증된 인재를 빠르게 만날 수 있는 채용 플랫폼
            </p>
          </div>
          <div className="text-3xl font-black text-orange-500 tracking-tighter">
            wanted
          </div>
        </div>

        {/* Category Title */}
        <div className="mt-8">
          <h1 className="text-2xl font-bold">{category.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {category.description}
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
                placeholder={`${category.name} 내 검색...`}
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
        <div className="grid grid-cols-4 gap-5 mt-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video rounded-lg bg-muted" />
              <div className="h-3 bg-muted rounded mt-3 w-3/4" />
              <div className="h-2.5 bg-muted rounded mt-2 w-1/2" />
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
