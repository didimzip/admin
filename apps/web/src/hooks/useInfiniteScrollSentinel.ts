import { useEffect, useRef } from "react";

// Intersection Observer 기반 무한 스크롤 센티넬 훅 (Scroll Event 미사용).
// 반환한 ref 를 리스트 하단 sentinel 요소에 달면, 화면에 들어올 때 onIntersect 를 호출한다.
// enabled=false(다음 페이지 없음/로딩 중)면 관찰을 멈춘다.
export function useInfiniteScrollSentinel<T extends HTMLElement>(
  onIntersect: () => void,
  enabled: boolean,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onIntersect();
      },
      { rootMargin: "300px" }, // 하단 300px 도달 전에 미리 다음 페이지 요청 (끊김 없는 스크롤)
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onIntersect, enabled]);

  return ref;
}
