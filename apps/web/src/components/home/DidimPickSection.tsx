"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ContentCard from "@/components/ui/ContentCard";
import { generateContents } from "@/lib/mock-data";

const items = generateContents(6);

export default function DidimPickSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">디딤집 Pick</h2>
        <div className="flex gap-1">
          <button
            onClick={() => scroll("left")}
            className="p-1.5 rounded-lg border border-white/20 hover:bg-white/10 transition-colors text-white"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1.5 rounded-lg border border-white/20 hover:bg-white/10 transition-colors text-white"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item) => (
          <div key={item.id} className="min-w-[calc((100%-48px)/4)] max-w-[calc((100%-48px)/4)] shrink-0">
            <ContentCard item={item} dark />
          </div>
        ))}
      </div>
    </div>
  );
}
