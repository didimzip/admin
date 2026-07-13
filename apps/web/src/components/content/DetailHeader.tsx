import type { ReactNode } from "react";

// 콘텐츠 상세 헤더 레이아웃 — 실제 헤더와 Skeleton 이 "동일한 구조"를 공유한다.
// 구조/간격/정렬을 여기 한 곳에서만 관리하므로, 레이아웃이 바뀌면 둘 다 함께 바뀐다.
//   브레드크럼 ↓6px 제목  ─(mt-18)─  [작성자 · 작성일|조회수(좌) │ 액션(우측 끝, items-end)]
export default function DetailHeader({
  breadcrumb,
  title,
  author,
  meta,
  actions,
}: {
  breadcrumb: ReactNode;
  title: ReactNode;
  author: ReactNode;
  meta: ReactNode;
  actions: ReactNode;
}) {
  return (
    <header className="flex flex-col">
      <div className="flex flex-col gap-[6px]">
        {breadcrumb}
        {title}
      </div>

      <div className="mt-[18px] flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          {author}
          {meta}
        </div>
        <div className="flex shrink-0 items-center gap-3">{actions}</div>
      </div>
    </header>
  );
}
