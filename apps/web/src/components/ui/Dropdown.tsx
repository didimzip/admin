"use client";

import { useState, useRef, useEffect } from "react";
import { BiChevronDown } from "react-icons/bi";
import clsx from "clsx";

interface DropdownProps<T extends string> {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
}

// 공통 커스텀 드롭다운 — 네이티브 <select> 대체. 정렬 등 옵션 선택 UI에 재사용.
//   · 트리거: h-34 · border #e1e2e3 (열림/hover/focus 시 #999999) · radius 6 · chevron 회전
//   · 메뉴  : 흰 배경 · border · radius 6 · shadow · py-1 · 아이템 hover/active
//   · 선택  : SemiBold #333 / 기본 Regular #666
//   · UX    : 외부 클릭·Esc 닫힘, ↑/↓ 이동, Enter/Space 선택 (키보드 접근성)
export default function Dropdown<T extends string>({
  value,
  options,
  onChange,
  className,
  ariaLabel,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  // 열 때 하이라이트를 현재 선택 항목으로 맞춤
  useEffect(() => {
    if (open) setActiveIndex(Math.max(0, options.indexOf(value)));
  }, [open, options, value]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function select(v: T) {
    onChange(v);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case "Escape":
        setOpen(false);
        break;
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % options.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + options.length) % options.length);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        select(options[activeIndex]);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={rootRef} className={clsx("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={clsx(
          "flex h-[34px] items-center gap-1 rounded-md border bg-white pl-[10px] pr-2 text-[14px] text-[#333333] outline-none transition-colors hover:border-[#999999] focus-visible:border-[#999999]",
          open ? "border-[#999999]" : "border-[#e1e2e3]",
        )}
      >
        <span className="whitespace-nowrap">{value}</span>
        <BiChevronDown
          size={18}
          className={clsx("shrink-0 text-[#333333] transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="absolute right-0 z-20 mt-1 min-w-full overflow-hidden rounded-md border border-[#e1e2e3] bg-white py-1 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
        >
          {options.map((opt, i) => {
            const selected = opt === value;
            const active = i === activeIndex;
            return (
              <li key={opt} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => select(opt)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={clsx(
                    "flex w-full items-center whitespace-nowrap px-[12px] py-[8px] text-left text-[14px] transition-colors",
                    selected ? "font-semibold text-[#333333]" : "font-normal text-[#666666]",
                    active ? "bg-black/[0.04]" : "bg-white",
                  )}
                >
                  {opt}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
