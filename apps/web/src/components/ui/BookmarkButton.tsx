"use client";

import { useState } from "react";
import { BiBookmark, BiSolidBookmark } from "react-icons/bi";
import clsx from "clsx";

interface BookmarkButtonProps {
  /** 초기 저장 상태 (추후 서버 값으로 주입) */
  defaultBookmarked?: boolean;
  /** 저장/해제 시 콜백 — 실제 북마크 API 연동 지점 */
  onChange?: (bookmarked: boolean) => void;
  /** circle: 36×36 원형 흰 버튼(카드 썸네일) · plain: 배경 없는 아이콘(상세 헤더) */
  variant?: "circle" | "plain";
  className?: string;
}

// 공통 북마크 버튼 — 상태: 기본 BiBookmark / 저장됨 BiSolidBookmark. onChange 로 추후 API 연동.
export default function BookmarkButton({
  defaultBookmarked = false,
  onChange,
  variant = "circle",
  className,
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(defaultBookmarked);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !bookmarked;
    setBookmarked(next);
    onChange?.(next);
  };

  const isPlain = variant === "plain";
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "북마크 해제" : "북마크"}
      className={clsx(
        "flex shrink-0 cursor-pointer items-center justify-center",
        isPlain
          ? "text-[#666666] transition-colors hover:text-[#333333]"
          : "h-[36px] w-[36px] rounded-full border border-[#eee] bg-white",
        className,
      )}
    >
      {bookmarked ? (
        <BiSolidBookmark size={isPlain ? 18 : 16} className={isPlain ? "" : "text-[#333333]"} />
      ) : (
        <BiBookmark size={isPlain ? 18 : 16} className={isPlain ? "" : "text-[#333333]"} />
      )}
    </button>
  );
}
