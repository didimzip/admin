"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import clsx from "clsx";
import type { ContentCard as ContentCardType } from "@/lib/mock-data";

interface ContentCardProps {
  item: ContentCardType;
  /** White text for dark backgrounds (e.g. 디딤집 Pick) */
  dark?: boolean;
  /** Hide text info below thumbnail */
  hideInfo?: boolean;
}

export default function ContentCard({ item, dark, hideInfo }: ContentCardProps) {
  const [scraped, setScraped] = useState(false);

  return (
    <Link href={`/contents/${item.id}`} className="group block">
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
        <Image
          src={item.thumbnail}
          alt={item.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 25vw"
        />
        {/* HOT Badge */}
        {item.isHot && (
          <span className="absolute top-0 left-0 bg-[#333333] text-white text-[12px] font-semibold px-2.5 py-1 rounded-br-[6px] z-10">
            HOT
          </span>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out" />
        {/* Scrap button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setScraped(!scraped);
          }}
          className="absolute bottom-[20px] right-[20px] w-9 h-9 rounded-full bg-white flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-out z-10"
        >
          <Bookmark
            size={18}
            strokeWidth={2}
            className={scraped ? "fill-[#333333] text-[#333333]" : "text-[#333333]"}
          />
        </button>
      </div>

      {/* Info */}
      {!hideInfo && (
        <div className="mt-2.5">
          <h3
            className={clsx(
              "text-sm font-semibold leading-snug line-clamp-1",
              dark && "text-white"
            )}
          >
            {item.title}
            {item.isAd && (
              <span className="ml-1.5 inline-block bg-yellow-400 text-[10px] font-bold text-black px-1 py-0.5 rounded align-middle">
                AD
              </span>
            )}
          </h3>
          <p
            className={clsx(
              "text-xs mt-1 line-clamp-1",
              dark ? "text-white/50" : "text-muted-foreground"
            )}
          >
            {item.summary}
          </p>
          <div
            className={clsx(
              "flex items-center gap-1 mt-2 text-xs",
              dark ? "text-white/40" : "text-muted-foreground"
            )}
          >
            <span className={clsx("font-medium", dark ? "text-white/60" : "text-foreground")}>
              {item.author}
            </span>
            <span>·</span>
            <span>
              {item.category} &gt; {item.subcategory}
            </span>
          </div>
        </div>
      )}
    </Link>
  );
}
