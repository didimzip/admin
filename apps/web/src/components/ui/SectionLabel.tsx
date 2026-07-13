import clsx from "clsx";
import type { ReactNode } from "react";

// 섹션 제목 위 서브텍스트(라벨) 공통 컴포넌트.
// 타이포그래피(14px · Pretendard · weight 400 · 기본 line-height/letter-spacing)는 전 섹션 공통,
// 색상만 각 섹션에서 className 으로 지정한다(예: text-muted-foreground, text-[#999999]).
export default function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={clsx("text-[14px]", className)}>{children}</p>;
}
