"use client";

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import Tag from "./Tag";

// SSR 경고 없이 layout effect 사용
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const GAP = 6; // px — flex gap-[6px] 와 동일

// 태그를 한 줄에만 표시하고, 넘치면 마지막에 +N 칩으로 남은 개수를 표시한다.
// 노출 가능한 개수는 컨테이너 폭 기준으로 계산하며, 리사이즈 시 자동 재계산(반응형).
// +N 계산은 실제 태그 개수 기준(하드코딩 없음). +N 칩도 동일 Tag 컴포넌트 재사용.
export default function TagList({ tags }: { tags: string[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(tags.length);

  const recompute = useCallback(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) return;

    const avail = row.clientWidth;
    const chips = Array.from(measure.children) as HTMLElement[];
    const tagChips = chips.slice(0, tags.length);
    const plusW = chips[chips.length - 1]?.offsetWidth ?? 0; // 가장 넓은 +N 폭

    // 1) 전부 들어가면 +N 없이 모두 표시
    let total = 0;
    tagChips.forEach((c, i) => {
      total += c.offsetWidth + (i > 0 ? GAP : 0);
    });
    if (total <= avail) {
      setVisible(tags.length);
      return;
    }

    // 2) 넘치면: +N 칩 자리를 예약하고 들어가는 만큼만 표시
    let used = 0;
    let count = 0;
    for (let i = 0; i < tagChips.length; i++) {
      const w = tagChips[i].offsetWidth + (i > 0 ? GAP : 0);
      if (used + w + GAP + plusW <= avail) {
        used += w;
        count++;
      } else {
        break;
      }
    }
    setVisible(Math.max(count, 1)); // 최소 1개는 표시
  }, [tags]);

  useIsoLayoutEffect(() => {
    recompute();
    const row = rowRef.current;
    if (!row) return;
    const ro = new ResizeObserver(recompute);
    ro.observe(row);
    return () => ro.disconnect();
  }, [recompute]);

  const hidden = tags.length - visible;

  return (
    <div className="relative w-full">
      {/* 실제 렌더 — 한 줄, 넘침 클립 */}
      <div ref={rowRef} className="flex gap-[6px] overflow-hidden">
        {tags.slice(0, visible).map((t, i) => (
          <Tag key={`${t}-${i}`} label={t} />
        ))}
        {hidden > 0 && <Tag label={`+${hidden}`} />}
      </div>

      {/* 측정용 — 화면 밖, 전체 태그 + 최대 +N 폭 측정 */}
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none flex gap-[6px]"
        style={{ position: "absolute", left: -99999, top: 0 }}
      >
        {tags.map((t, i) => (
          <Tag key={`m-${t}-${i}`} label={t} />
        ))}
        <Tag label={`+${tags.length}`} />
      </div>
    </div>
  );
}
