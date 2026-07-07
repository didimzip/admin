"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface HeroSlide {
  id: string;
  badge: string; // subtitle (상단 소제목)
  title: string; // 줄바꿈(\n) 포함
  description: string;
  ctaText: string; // subText (하단 버튼 문구)
  linkUrl: string;
  image: string; // imageData(base64) || imageUrl
  textColor: "light" | "dark";
}

const DURATION = 5000;

export default function HeroBanner({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const elapsedRef = useRef(0);
  const startRef = useRef(0);

  const count = slides.length;

  const goTo = useCallback((idx: number) => {
    setActive(idx);
    setProgress(0);
    elapsedRef.current = 0;
  }, []);

  const next = useCallback(() => {
    if (count === 0) return;
    goTo((active + 1) % count);
  }, [active, count, goTo]);

  const prev = useCallback(() => {
    if (count === 0) return;
    goTo((active - 1 + count) % count);
  }, [active, count, goTo]);

  // Clamp active when slide count changes
  useEffect(() => {
    if (active >= count && count > 0) setActive(0);
  }, [count, active]);

  // Auto-play + progress
  useEffect(() => {
    if (paused || count <= 1) return;

    const savedElapsed = elapsedRef.current;
    startRef.current = Date.now() - savedElapsed;
    const remaining = DURATION - savedElapsed;

    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      elapsedRef.current = elapsed;
      setProgress(Math.min(elapsed / DURATION, 1));
    };
    const interval = setInterval(tick, 30);
    const timeout = setTimeout(() => {
      elapsedRef.current = 0;
      setActive((p) => (p + 1) % count);
    }, remaining);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [active, paused, count]);

  if (count === 0) {
    return (
      <div
        className="relative w-full h-[300px] overflow-hidden rounded-[14px] mt-[30px] mx-[30px] bg-muted flex items-center justify-center"
        style={{ width: "calc(100% - 60px)" }}
      >
        <p className="text-sm text-muted-foreground">등록된 배너가 없습니다.</p>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-[300px] overflow-hidden rounded-[14px] mt-[30px] mx-[30px]"
      style={{ width: "calc(100% - 60px)" }}
    >
      {slides.map((slide, i) => {
        const light = slide.textColor !== "dark"; // light = 흰 텍스트
        return (
          <div
            key={slide.id}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{ opacity: i === active ? 1 : 0, zIndex: i === active ? 1 : 0 }}
          >
            {/* Background image (data URL / remote URL 모두 지원) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.image}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Overlay */}
            <div
              className={
                light
                  ? "absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/10"
                  : "absolute inset-0 bg-gradient-to-r from-white/70 via-white/40 to-white/10"
              }
            />

            {/* Text */}
            <div className="relative z-10 h-full flex flex-col justify-end px-[60px] pb-[30px]">
              <div className="max-w-lg">
                {slide.badge && (
                  <span
                    className={
                      light
                        ? "inline-block text-[12px] font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white/80"
                        : "inline-block text-[12px] font-medium bg-black/10 backdrop-blur-sm px-3 py-1 rounded-full text-slate-700"
                    }
                  >
                    {slide.badge}
                  </span>
                )}
                <h2
                  className={
                    "text-[32px] font-bold leading-[1.3] whitespace-pre-line mt-2 " +
                    (light ? "text-white" : "text-slate-900")
                  }
                >
                  {slide.title}
                </h2>
                {slide.description && (
                  <p
                    className={
                      "text-[14px] mt-2 whitespace-pre-line leading-relaxed " +
                      (light ? "text-white/70" : "text-slate-600")
                    }
                  >
                    {slide.description}
                  </p>
                )}
                {slide.ctaText && (
                  <Link
                    href={slide.linkUrl || "#"}
                    className={
                      "inline-block mt-4 text-[13px] font-semibold rounded-full px-4 py-2 transition-colors " +
                      (light
                        ? "bg-white text-slate-900 hover:bg-white/90"
                        : "bg-slate-900 text-white hover:bg-slate-800")
                    }
                  >
                    {slide.ctaText}
                  </Link>
                )}
              </div>

              {/* Controls */}
              <div className="mt-[36px]">
                <div className="flex items-center">
                  <button
                    onClick={prev}
                    className={(light ? "text-white/50 hover:text-white" : "text-slate-500 hover:text-slate-900") + " transition-colors mr-[10px]"}
                    aria-label="이전"
                  >
                    <ChevronLeft size={18} strokeWidth={2} />
                  </button>
                  <span className={"text-sm tabular-nums font-medium " + (light ? "text-white" : "text-slate-900")}>
                    {active + 1}
                  </span>
                  <span className={"text-sm mx-[4px] " + (light ? "text-white/50" : "text-slate-500")}>/</span>
                  <span className={"text-sm " + (light ? "text-white/50" : "text-slate-500")}>{count}</span>
                  <button
                    onClick={next}
                    className={(light ? "text-white/50 hover:text-white" : "text-slate-500 hover:text-slate-900") + " transition-colors ml-[10px]"}
                    aria-label="다음"
                  >
                    <ChevronRight size={18} strokeWidth={2} />
                  </button>

                  <div className={"flex-1 h-[2px] rounded-full overflow-hidden ml-[10px] " + (light ? "bg-white/20" : "bg-black/10")}>
                    <div
                      className={"h-full rounded-full " + (light ? "bg-white" : "bg-slate-900")}
                      style={{
                        width: `${(i === active ? progress : 0) * 100}%`,
                        transition: progress < 0.01 ? "none" : undefined,
                      }}
                    />
                  </div>
                  <button
                    onClick={() => setPaused(!paused)}
                    className={(light ? "text-white/50 hover:text-white" : "text-slate-500 hover:text-slate-900") + " ml-[10px] transition-colors"}
                    aria-label={paused ? "재생" : "일시정지"}
                  >
                    {paused ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 1.5L12 7L3 12.5V1.5Z" /></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="2" y="1" width="3.5" height="12" rx="1" /><rect x="8.5" y="1" width="3.5" height="12" rx="1" /></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
