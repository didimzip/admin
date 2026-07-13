"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, HelpCircle, MessageSquare, ChevronDown } from "lucide-react";
import type { Category } from "@didimzip/api";
import { CategoryIcon } from "@/lib/category-icons";
import Logo from "./Logo";
import clsx from "clsx";

const COLLAPSED_W = 72; // 60 x 1.2 (전역 spacing 0.30rem 스케일에 맞춰 레일도 20% 확대, 아이콘 컬럼 정렬 유지)

// ─── GNB Sidebar ──────────────────────────────────────────────────────────────
// OpenSea/Linear/Notion 계열 확장형 사이드바 방식:
//  · Hover 확장은 "순수 CSS :hover / group-hover" 로만 처리 → hover 시 React re-render 0회
//    (빠르게 반복 hover 해도 CSS transition 이 부드럽게 되감김, flicker/버벅임 없음)
//  · position:fixed; left:0 + width 트랜지션 → 왼쪽 완전 고정, 오른쪽으로만 확장 (scaleX 아님)
//  · 아이콘은 고정폭 컬럼이라 크기/위치 불변, 텍스트는 transition-delay 로 살짝 늦게 fade-in
//  · React state 는 "서브메뉴 펼침(클릭)" 에만 사용 → hover 애니메이션과 무관
export default function Sidebar({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  // 서브메뉴 펼침 상태 — 클릭/라우트로만 변경(hover 와 무관, hover 시 re-render 없음)
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // 현재 카테고리만 자동 펼침
  useEffect(() => {
    const match = categories.find((cat) => pathname.startsWith(`/contents/${cat.slug}`));
    setExpanded(match ? new Set([match.slug]) : new Set());
  }, [pathname]);

  const toggleExpand = useCallback((slug: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  return (
    <>
      {/* 레이아웃 자리 확보(접힘폭). 사이드바는 fixed 로 위에 겹쳐 확장된다 */}
      <div className="shrink-0" style={{ width: COLLAPSED_W }} />

      <aside
        className={clsx(
          "group fixed top-0 left-0 z-40 h-screen bg-white flex flex-col overflow-hidden",
          // 왼쪽 고정 + width 만 확장(순수 CSS hover). 우측 경계선은 항상 1px(상태 무관 → 레이아웃 시프트 없음),
          // hover 시 그림자만 추가(box-shadow 는 레이아웃에 영향 없음 → 리플로우/깜빡임 없음)
          "w-[72px] hover:w-[264px]",
          "border-r border-[#ececec]",
          "hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.18)]",
          "transition-[width,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        )}
        style={{ willChange: "width" }}
      >
        {/* Logo — 원본 SVG 그대로. 심볼(항상 표시) 위에 전체 로고가 겹쳐 fade-in.
            심볼은 절대 이동/변형 없음, 전체 로고는 Logo.svg 원본이라 간격/비율 원본 유지. */}
        <Link
          href="/"
          className="relative flex items-center h-14 shrink-0 overflow-hidden text-foreground"
        >
          <span
            className="absolute inset-y-0 left-0 flex items-center justify-center"
            style={{ width: COLLAPSED_W }}
          >
            <Logo variant="symbol" size={24} />
          </span>
          <span
            className="absolute inset-y-0 flex items-center opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-hover:delay-100"
            style={{ left: 25 }}
            aria-hidden
          >
            <Logo variant="full" size={24} />
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex-1 overflow-x-hidden overflow-y-hidden group-hover:overflow-y-auto py-1 flex flex-col">
          <NavItem href="/" icon={<Home size={20} strokeWidth={1.5} />} label="홈" isActive={pathname === "/"} />

          <Divider />

          {categories.map((cat) => {
            const isExp = expanded.has(cat.slug);
            const isActive = pathname.startsWith(`/contents/${cat.slug}`);
            const hasSubs = cat.subCategories.length > 0;

            return (
              <div key={cat.id}>
                <div
                  className={clsx(
                    "flex items-center h-11 my-[1px] mx-2 rounded-xl overflow-hidden transition-colors duration-150",
                    isActive
                      ? "bg-[#f0f0f0] text-foreground"
                      : "text-[#707070] hover:bg-[#f5f5f5] hover:text-foreground",
                  )}
                >
                  <Link
                    href={`/contents/${cat.slug}`}
                    className={clsx(
                      "flex items-center h-full flex-1 min-w-0",
                      isActive ? "font-semibold" : "",
                    )}
                  >
                    <span className="w-11 shrink-0 flex items-center justify-center">
                      <CategoryIcon iconName={cat.iconName} size={20} />
                    </span>
                    <span className="text-[13px] whitespace-nowrap truncate opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-hover:delay-150">
                      {cat.name}
                    </span>
                  </Link>
                  {hasSubs && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleExpand(cat.slug);
                      }}
                      tabIndex={-1}
                      aria-hidden
                      className="p-1.5 mr-1 rounded-lg text-[#aaa] hover:text-foreground shrink-0 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-hover:delay-100 group-hover:[pointer-events:auto] pointer-events-none"
                    >
                      <ChevronDown
                        size={14}
                        className={clsx(
                          "transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                          isExp && "rotate-180",
                        )}
                      />
                    </button>
                  )}
                </div>

                {hasSubs && (
                  <SubMenu expanded={isExp}>
                    {cat.subCategories.map((sub) => {
                      const isSubActive = isActive && currentTab === sub.slug;
                      return (
                        <Link
                          key={sub.id}
                          href={`/contents/${cat.slug}?tab=${sub.slug}`}
                          className={clsx(
                            "block py-2 px-2.5 text-[13px] rounded-lg transition-colors whitespace-nowrap",
                            isSubActive
                              ? "bg-[#f0f0f0] text-foreground font-semibold"
                              : "text-muted-foreground hover:text-foreground hover:bg-[#f5f5f5]",
                          )}
                        >
                          {sub.name}
                        </Link>
                      );
                    })}
                  </SubMenu>
                )}
              </div>
            );
          })}

          <Divider />

          <NavItem href="/mentor" icon={<HelpCircle size={20} strokeWidth={1.5} />} label="멘토 Q&A/매칭" isActive={pathname.startsWith("/mentor")} />
          <NavItem href="/commune" icon={<MessageSquare size={20} strokeWidth={1.5} />} label="꼬뮨 라운지" isActive={pathname.startsWith("/commune")} />
        </nav>
      </aside>
    </>
  );
}

/* ── SubMenu ── 펼침(클릭) AND hover 일 때만 열림. grid-rows 애니메이션(측정 불필요).
   isExp 는 클릭 state, 열림 조건의 hover 는 group-hover(CSS) → hover 시 re-render 없음. */
function SubMenu({
  expanded,
  children,
}: {
  expanded: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        "ml-[52px] mr-2 grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
        expanded && "group-hover:grid-rows-[1fr] group-hover:opacity-100",
      )}
    >
      <div className="overflow-hidden">
        <div className="pb-1 pt-0.5 flex flex-col gap-1">{children}</div>
      </div>
    </div>
  );
}

/* ── Nav Item ── 아이콘 고정 컬럼 + 텍스트 지연 fade(group-hover). isOpen prop 불필요. */
function NavItem({
  href,
  icon,
  label,
  isActive,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center h-11 my-[1px] mx-2 rounded-xl overflow-hidden transition-colors duration-150",
        isActive
          ? "bg-[#f0f0f0] text-foreground font-semibold"
          : "text-[#707070] hover:bg-[#f5f5f5] hover:text-foreground",
      )}
    >
      <span className="w-11 shrink-0 flex items-center justify-center">{icon}</span>
      <span className="text-[13px] whitespace-nowrap opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-hover:delay-150">
        {label}
      </span>
    </Link>
  );
}

/* ── Divider ── */
function Divider() {
  return <div className="mx-4 my-2 border-t border-[#eee]" />;
}
