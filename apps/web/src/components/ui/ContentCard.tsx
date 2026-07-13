"use client";

import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import BookmarkButton from "@/components/ui/BookmarkButton";
import AdBadge from "@/components/ui/AdBadge";
import type { ContentCard as ContentCardType } from "@/lib/mock-data";

interface ContentCardProps {
  item: ContentCardType;
  /** White text for dark backgrounds (e.g. 디딤집 Pick) */
  dark?: boolean;
  /** Hide text info below thumbnail */
  hideInfo?: boolean;
  /** ZIP(컬렉션) 카드 variant — HOT 뱃지/카테고리 숨김, 하단 메타를 '닉네임 | 콘텐츠 N개'로 표시 */
  zip?: boolean;
  /** ZIP variant 하단에 노출할 컬렉션 내 콘텐츠 개수 */
  zipCount?: number;
}

export default function ContentCard({ item, dark, hideInfo, zip, zipCount = 0 }: ContentCardProps) {
  return (
    <Link href={`/content/${item.id}`} className="group block">
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
        <Image
          src={item.thumbnail}
          alt={item.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 25vw"
        />
        {/* HOT Badge (ZIP 카드에서는 숨김) */}
        {!zip && item.isHot && (
          <span className="absolute top-0 left-0 bg-[#333333] text-white text-[12px] font-semibold px-2.5 py-1 rounded-br-[6px] z-10">
            HOT
          </span>
        )}
        {/* Hover overlay (장식용 — 클릭 통과) */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out" />
        {/* 북마크 버튼 — 썸네일 우측 하단(bottom/right 20px), hover 시에만 노출 */}
        <div className="absolute bottom-[20px] right-[20px] z-10 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-out">
          <BookmarkButton />
        </div>
      </div>

      {/* Info */}
      {!hideInfo && (
        <div className="mt-[18px] flex flex-col gap-1.5">
          {/* 제목 + (광고 시) AD 뱃지 — 제목 영역 우측 끝(Flex End) */}
          <div className="flex items-center gap-2">
            <h3
              className={clsx(
                "min-w-0 flex-1 text-[18px] font-semibold leading-[1.2] line-clamp-1",
                dark && "text-white"
              )}
            >
              {item.title}
            </h3>
            {item.isAd && <AdBadge />}
          </div>
          {/* 서브텍스트 — ZIP·광고 카드에서는 숨김(광고는 제목/광고주만) */}
          {!zip && !item.isAd && (
            <p
              className={clsx(
                "text-[14px] font-normal line-clamp-1",
                dark ? "text-white/50" : "text-muted-foreground"
              )}
            >
              {item.summary}
            </p>
          )}
          {zip ? (
            /* ZIP 메타: 닉네임(600/#333) | 콘텐츠(400/#999) N개(600/#333) */
            <div className="flex items-center gap-1.5 text-[12px]">
              <span className="font-semibold text-[#333333]">{item.author}</span>
              <span className="font-normal text-[#999999]">콘텐츠 {zipCount}개</span>
            </div>
          ) : item.isAd ? (
            /* 광고: 광고주명을 서브텍스트(설명)와 동일 스타일로 표시 (작성자보다 낮은 정보 위계) */
            <p
              className={clsx(
                "text-[14px] font-normal line-clamp-1",
                dark ? "text-white/50" : "text-muted-foreground"
              )}
            >
              {item.company ?? item.author}
            </p>
          ) : (
            <div
              className={clsx(
                "flex items-center gap-1.5 text-[12px] font-normal",
                dark ? "text-white/40" : "text-muted-foreground"
              )}
            >
              <span className={clsx("font-semibold", dark ? "text-white/60" : "text-foreground")}>
                {item.author}
              </span>
              <span>
                {item.category} &gt; {item.subcategory}
              </span>
            </div>
          )}
        </div>
      )}
    </Link>
  );
}
