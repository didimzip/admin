import type { ReactNode } from "react";
import clsx from "clsx";

// 공통 필터 칩(소프트 필) — 2차 카테고리/탭 필터에 재사용.
//   · 기본  : 흰 배경 · border #e1e2e3 · #666 · Regular
//   · 선택  : bg-black/5 · border #999999 · #333 · SemiBold
//   · radius 6 · px10/py6 · 14px · hover 시 텍스트 진하게
// (많이 본 Q&A 탭 · 카테고리 페이지 서브카테고리 필터가 동일 스타일 공유)
export default function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "whitespace-nowrap rounded-md border px-[10px] py-[6px] text-sm transition-colors",
        active
          ? "border-[#999999] bg-black/5 font-semibold text-[#333333]"
          : "border-[#e1e2e3] bg-white font-normal text-[#666666] hover:text-[#333333]",
      )}
    >
      {children}
    </button>
  );
}
