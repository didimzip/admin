"use client";

import { useEffect, useRef, useState } from "react";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import clsx from "clsx";

export interface ActionMenuItem {
  label: string;
  onSelect: () => void;
  danger?: boolean; // 삭제/차단 등 파괴적 액션(빨간 텍스트)
}

// 공통 액션 메뉴(더보기 ··· 팝오버) — 클릭형 액션 목록. 그룹(sections) 사이에 구분선.
//   · 트리거 : ··· 아이콘(plain)  · 메뉴: border #eee · radius 10 · shadow · py-1
//   · 아이템 : px4/py2.5 · 14px · hover bg · danger 빨강
//   · 애니메이션: opacity+scale 트랜지션(열림/닫힘 모두), 외부클릭·Esc 닫힘
// sections 를 권한에 따라 구성해 넘기면 됨(작성자/타인 메뉴 전환).
export default function ActionMenu({
  sections,
  ariaLabel = "더보기",
}: {
  sections: ActionMenuItem[][];
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="flex cursor-pointer items-center text-[#666666] transition-colors hover:text-[#333333]"
      >
        <HiOutlineDotsHorizontal size={18} />
      </button>

      {/* 항상 마운트 + visibility/opacity 토글 → 열림·닫힘 모두 부드럽게 */}
      <div
        role="menu"
        className={clsx(
          "absolute right-0 top-full z-30 mt-2 w-[180px] origin-top-right overflow-hidden rounded-[10px] border border-[#eee] bg-white py-1 shadow-[0_6px_24px_rgba(0,0,0,0.10)] transition-all duration-150 ease-out",
          open
            ? "visible scale-100 opacity-100"
            : "pointer-events-none invisible scale-95 opacity-0",
        )}
      >
        {sections.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <div className="my-1 h-px bg-[#eee]" />}
            {group.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  item.onSelect();
                  setOpen(false);
                }}
                className={clsx(
                  "block w-full px-4 py-2.5 text-left text-[14px] font-normal transition-colors",
                  item.danger
                    ? "text-[#e5484d] hover:bg-[#e5484d]/[0.06]"
                    : "text-[#333333] hover:bg-black/[0.04]",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
