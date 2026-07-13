"use client";

import { useState } from "react";
import { IoShareOutline } from "react-icons/io5";
import clsx from "clsx";

// 공통 공유 버튼 — Web Share API 지원 시 네이티브 공유, 아니면 현재 URL 클립보드 복사.
// 상세 헤더 등에서 재사용. 복사되면 잠깐 "복사됨" 툴팁 표시.
export default function ShareButton({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      // 사용자가 공유 취소 등 — 무시
    }
  }

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={handleShare}
        aria-label="공유"
        className={clsx(
          "flex shrink-0 cursor-pointer items-center justify-center text-[#666666] transition-colors hover:text-[#333333]",
          className,
        )}
      >
        <IoShareOutline size={18} />
      </button>
      {copied && (
        <span className="absolute right-0 top-full mt-1 whitespace-nowrap rounded-md bg-[#333333] px-2 py-1 text-[11px] text-white">
          링크 복사됨
        </span>
      )}
    </div>
  );
}
