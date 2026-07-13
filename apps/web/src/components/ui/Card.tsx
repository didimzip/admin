import Link from "next/link";
import type { ReactNode } from "react";
import clsx from "clsx";

// 공통 카드 셸 — 모든 카드 섹션(Q&A · 멘토 · 커뮤니티 라운지)이 공유하는 단일 디자인 시스템.
//   · Radius: 10px            · Border: #e6e6e6 (기본)
//   · Hover : border #333333  · Transition: colors 150ms ease-out (즉시 변화 방지, 셋 다 동일)
//   · Shadow 미사용           · Cursor : pointer (Link)
// href 를 주면 Link, 없으면 정적 div(스켈레톤/비링크 카드용) — 셸 스타일은 100% 동일.
// 내부 레이아웃(flex 방향/gap/padding 변형)은 className 으로 각 카드가 지정한다.
const SHELL = "rounded-[10px] border border-[#e6e6e6] bg-white px-[30px] py-[20px]";

export default function Card({
  href,
  className,
  children,
}: {
  href?: string;
  className?: string;
  children: ReactNode;
}) {
  if (!href) {
    return <div className={clsx(SHELL, className)}>{children}</div>;
  }
  return (
    <Link
      href={href}
      className={clsx(
        "cursor-pointer",
        SHELL,
        "transition-colors duration-150 ease-out hover:border-[#333333]",
        className,
      )}
    >
      {children}
    </Link>
  );
}
