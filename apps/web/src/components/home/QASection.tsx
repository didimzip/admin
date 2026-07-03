"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, MessageCircle } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import { qaItems, categories } from "@/lib/mock-data";
import clsx from "clsx";

const tabs = ["전체", "자금조달", "사업화전략", "마케팅", "조직문화"];

export default function QASection() {
  const [activeTab, setActiveTab] = useState("전체");

  const filtered =
    activeTab === "전체"
      ? qaItems
      : qaItems.filter((q) => q.category === activeTab);

  return (
    <div>
      <SectionHeader title="많이 본 Q&A" />

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "px-3 py-1.5 text-sm rounded-full border transition-colors",
              activeTab === tab
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white text-muted-foreground border-border hover:border-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Q&A List */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((item) => (
          <Link
            key={item.id}
            href={`/mentor/qna/${item.id}`}
            className="block p-4 rounded-lg border border-border hover:border-foreground/20 transition-colors"
          >
            <h3 className="text-sm font-semibold line-clamp-1">
              {item.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {item.summary}
            </p>
            <div className="flex items-center gap-3 mt-2.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">
                {item.category}
              </span>
              <span className="flex items-center gap-0.5">
                <Eye size={12} />
                {item.viewCount.toLocaleString()}
              </span>
              <span className="flex items-center gap-0.5">
                <MessageCircle size={12} />
                {item.answerCount}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
