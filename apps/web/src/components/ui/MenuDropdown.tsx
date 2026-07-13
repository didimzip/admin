"use client";

import { useEffect, useRef, useState } from "react";
import { BiChevronDown } from "react-icons/bi";
import clsx from "clsx";

export interface MenuDropdownItem {
  label: string;
  href: string;
  newTab?: boolean;
}

// 공통 링크 메뉴 드롭다운 — 항목이 <a href> 로 이동하는 내비게이션형 드롭다운.
// (값-선택형은 Dropdown.tsx 사용. 이건 관련 사이트처럼 "선택=이동"인 경우)
//   · 트리거 : h-44 · border #e6e6e6(열림/hover/focus #333) · radius 4 · chevron 180° 회전
//   · 메뉴   : border #333 · 트리거와 이어지는 seam · hover bg · 말줄임 · 외부클릭 닫힘
//   · openUp : true 면 위로 펼침(Footer 등 하단 배치용)
export default function MenuDropdown({
  label,
  items,
  emptyText = "등록된 항목이 없습니다",
  openUp = false,
  className,
}: {
  label: string;
  items: MenuDropdownItem[];
  emptyText?: string;
  openUp?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className={clsx("relative w-[220px]", className)}>
      {/* 트리거 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={clsx(
          "flex h-[44px] w-full items-center justify-between border bg-white pl-4 pr-2 text-[14px] font-normal text-[#333333] outline-none transition-colors",
          open
            ? clsx(
                "border-[#333333]",
                openUp ? "rounded-b-[4px] rounded-t-none" : "rounded-t-[4px] rounded-b-none",
              )
            : "rounded-[4px] border-[#e6e6e6] hover:border-[#999999] focus-visible:border-[#333333]",
        )}
      >
        <span className="truncate">{label}</span>
        <BiChevronDown
          size={18}
          className={clsx(
            "shrink-0 text-[#484848] transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* 메뉴 — 트리거와 seam 으로 이어짐(중복 테두리 제거) */}
      {open && (
        <ul
          role="listbox"
          className={clsx(
            "absolute left-0 z-20 max-h-64 w-full overflow-y-auto border border-[#333333] bg-white",
            openUp
              ? "bottom-full rounded-t-[4px] rounded-b-none border-b-0"
              : "top-full rounded-b-[4px] rounded-t-none border-t-0",
          )}
        >
          {items.length === 0 ? (
            <li className="px-4 py-3 text-[14px] text-[#999999]">{emptyText}</li>
          ) : (
            items.map((item, i) => (
              <li key={`${item.href}-${i}`}>
                <a
                  href={item.href}
                  target={item.newTab ? "_blank" : "_self"}
                  rel={item.newTab ? "noopener noreferrer" : undefined}
                  onClick={() => setOpen(false)}
                  className="block truncate px-4 py-3 text-[14px] text-[#333333] transition-colors hover:bg-black/[0.03]"
                >
                  {item.label}
                </a>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
