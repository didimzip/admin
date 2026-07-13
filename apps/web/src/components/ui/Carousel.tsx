"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import PaginationButton from "@/components/ui/PaginationButton";

// SSR 안전 useLayoutEffect
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const DURATION = 500;

interface CarouselProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  gap: number; // 카드 간격(px)
  itemWidth?: number; // 고정 폭 모드(px). perView 와 둘 중 하나
  perView?: number; // 뷰포트에 정확히 N개 맞춤(반응형)
  minItemWidth?: number; // 이 폭 이하로 줄면 perView 감소(반응형)
  header?: ReactNode;
  subheader?: ReactNode;
  edgeFade?: boolean; // 화면 밖/부분 카드를 opacity 30% 로(가장자리 페이드). 이미지 없는 카드에서만 권장
}

// 공통 인피니트 캐러셀 — 양쪽 복제본으로 무한 루프.
//
// ✦ Flicker 방지 원칙 (Apple App Store / Netflix / YouTube 급 슬라이드):
//   1) 이동은 React state 가 아닌 ref + 직접 DOM(transform) 으로만 → 클릭 시 리렌더 0회.
//   2) transform "만" 애니메이션. opacity/box-shadow/filter 등 다른 속성은 슬라이드 중 변경하지 않는다
//      (transform+opacity 동시 애니메이션이 GPU 레이어 재합성/next-image repaint 를 유발했던 원인).
//   3) 각 카드는 translateZ(0)+backface-visibility+contain 으로 독립 GPU 레이어 고정 →
//      트랙이 움직여도 카드 내부는 재그리기(repaint) 없이 레이어 위치만 이동.
//   4) transform reset(무한 이음새)도 DOM 직접 스냅(transition none) → 동일 화면이라 무이음.
export default function Carousel<T>({
  items,
  renderItem,
  gap,
  itemWidth,
  perView,
  minItemWidth,
  header,
  subheader,
  edgeFade = false,
}: CarouselProps<T>) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const n = items.length;

  // 뷰포트 폭(초기값 고정 → SSR/최초 렌더 일치) → 측정 후 갱신(레이아웃 계산에만 사용)
  const [vpWidth, setVpWidth] = useState(1152);
  useIso(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const measure = () => setVpWidth(vp.clientWidth || 1152);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    return () => ro.disconnect();
  }, []);

  // 반응형 perView / 카드 폭
  const perViewEff = useMemo(() => {
    if (!perView) return null;
    if (!minItemWidth) return perView;
    const fit = Math.max(1, Math.floor((vpWidth + gap) / (minItemWidth + gap)));
    return Math.max(1, Math.min(perView, fit));
  }, [perView, minItemWidth, vpWidth, gap]);

  const cardWidth = itemWidth ?? (perViewEff ? (vpWidth - (perViewEff - 1) * gap) / perViewEff : vpWidth);
  const step = cardWidth + gap;
  const fullCount = perViewEff ?? Math.max(1, Math.floor((vpWidth - cardWidth) / step) + 1);

  const copiesEachSide = Math.max(2, Math.ceil(fullCount / Math.max(1, n)) + 1);
  const baseIndex = copiesEachSide * n;

  const extended = useMemo(() => {
    const total = copiesEachSide * 2 + 1;
    const arr: { item: T; key: string }[] = [];
    for (let c = 0; c < total; c++) for (let i = 0; i < n; i++) arr.push({ item: items[i], key: `${c}-${i}` });
    return arr;
  }, [items, n, copiesEachSide]);

  // 현재 위치는 ref (state 아님 → 이동 시 리렌더 없음)
  const indexRef = useRef(baseIndex);

  // transform 을 DOM 에 직접 반영. edgeFade 인 경우에만 카드 opacity 도 함께(둘 다 GPU 합성 속성).
  const apply = (animate: boolean) => {
    const track = trackRef.current;
    if (!track) return;
    track.style.transition = animate ? `transform ${DURATION}ms ${EASE}` : "none";
    track.style.transform = `translate3d(${-indexRef.current * step}px, 0, 0)`;
    if (!edgeFade) return;
    const children = track.children;
    for (let p = 0; p < children.length; p++) {
      const child = children[p] as HTMLElement;
      // opacity 도 transform 과 동일 타이밍으로 트랜지션 → 슬라이드와 함께 자연스럽게 fade
      child.style.transition = animate ? `opacity ${DURATION}ms ${EASE}` : "none";
      const offset = p - indexRef.current;
      child.style.opacity = offset >= 0 && offset < fullCount ? "1" : "0.3";
    }
  };

  // 레이아웃(폭/perView/복제본) 변경 또는 최초 마운트 시: 가운데 복제본으로 정렬(무애니메이션)
  useIso(() => {
    indexRef.current = baseIndex;
    apply(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseIndex, step, extended.length, fullCount]);

  const go = (dir: 1 | -1) => {
    indexRef.current += dir;
    apply(true);
  };

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    if (e.target !== trackRef.current || e.propertyName !== "transform") return;
    // 가운데 복제본 범위로 스냅(동일 화면 → 무이음, 애니메이션 없음)
    let next = indexRef.current;
    while (next >= baseIndex + n) next -= n;
    while (next < baseIndex) next += n;
    if (next !== indexRef.current) {
      indexRef.current = next;
      apply(false);
    }
  };

  // GPU 레이어 고정 힌트
  const trackStyle: CSSProperties = {
    gap: `${gap}px`,
    willChange: "transform",
    backfaceVisibility: "hidden",
    transformStyle: "preserve-3d",
  };
  const cardStyle: CSSProperties = {
    width: `${cardWidth}px`,
    transform: "translateZ(0)", // 각 카드를 독립 GPU 레이어로 → 트랙 이동 시 재그리기 방지
    backfaceVisibility: "hidden",
    contain: "paint",
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        {header}
        <PaginationButton onPrev={() => go(-1)} onNext={() => go(1)} />
      </div>

      {subheader}

      <div ref={viewportRef} className="overflow-hidden">
        <div ref={trackRef} className="flex" style={trackStyle} onTransitionEnd={handleTransitionEnd}>
          {extended.map(({ item, key }) => (
            <div key={key} style={cardStyle} className="shrink-0">
              {renderItem(item)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
