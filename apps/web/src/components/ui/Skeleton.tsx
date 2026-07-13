import clsx from "clsx";

// 공통 스켈레톤 프리미티브 — 로딩 자리표시자 1개(bar/box).
// 모든 카드 스켈레톤이 이 위에서 조립된다. 색/애니메이션은 여기 한 곳에서만 관리.
export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={clsx("animate-pulse rounded-md bg-[#ececec]", className)}
    />
  );
}
