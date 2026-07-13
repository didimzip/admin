import type { ReactNode } from "react";
import clsx from "clsx";

// 공통 배지 프리미티브 — 아이콘 + 라벨. 색(배경/테두리/텍스트)은 className 으로 주입.
// 참고 디자인: gap 2 · pl6/pr8/py2 · radius 6 · border 1px · 12px/Regular · 아이콘 16(텍스트색 상속).
export default function SingleBadge({
  icon,
  label,
  className,
}: {
  icon?: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-[2px] whitespace-nowrap rounded-md border py-[2px] pl-[6px] pr-[8px] text-[12px] font-normal leading-none",
        className,
      )}
    >
      {icon}
      {label}
    </span>
  );
}
