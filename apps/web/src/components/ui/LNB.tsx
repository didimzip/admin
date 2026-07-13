import type { ReactNode } from "react";
import clsx from "clsx";

export interface LnbTab {
  label: string;
  icon?: ReactNode; // 아이콘은 텍스트 색(currentColor) 상속
}

// 공통 LNB(탭 내비게이션) — 탭별 언더라인(활성 2px/#333 · 기본 1px/#e1e2e3) + 우측 여백 라인.
//   · 활성: 18px SemiBold #333  · 기본: 18px Regular #666 (hover #333)
// active/onChange 로 제어. 어느 페이지에서든 재사용.
export default function LNB({
  tabs,
  active,
  onChange,
}: {
  tabs: LnbTab[];
  active: string;
  onChange: (label: string) => void;
}) {
  return (
    <nav className="w-full">
      <div className="flex items-end overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.label === active;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => onChange(tab.label)}
              aria-current={isActive ? "page" : undefined}
              className="flex shrink-0 flex-col"
            >
              <span
                className={clsx(
                  "flex items-center gap-1 whitespace-nowrap px-3 py-1.5 text-[18px] transition-colors",
                  isActive
                    ? "font-semibold text-[#333333]"
                    : "font-normal text-[#666666] hover:text-[#333333]",
                )}
              >
                {tab.icon}
                {tab.label}
              </span>
              <span className={clsx("w-full", isActive ? "h-0.5 bg-[#333333]" : "h-px bg-[#e1e2e3]")} />
            </button>
          );
        })}
        {/* 남은 폭 채우는 기준선 */}
        <span className="h-px flex-1 self-end bg-[#e1e2e3]" />
      </div>
    </nav>
  );
}
