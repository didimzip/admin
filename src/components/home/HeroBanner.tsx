"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

const banners = [
  {
    id: 1,
    badge: "디딤집 소개",
    title: "스타트업의 시작을 딛는 곳,\n디딤집에서 시작하세요",
    subtitle: "정부·지자체 지원사업과 성장 정보를 한곳에 모아,\n필요한 모든 것을 한 번에 제공합니다.",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    gradient: "from-[#f7f3ee] to-[#efe9e0]",
  },
  {
    id: 2,
    badge: "투자 유치",
    title: "시리즈 A 투자 유치,\n무엇부터 준비해야 할까?",
    subtitle: "현직 심사역이 알려주는 IR 피칭 전략과\n투자 유치 실전 가이드.",
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80",
    gradient: "from-[#eef2f7] to-[#e0e8f0]",
  },
  {
    id: 3,
    badge: "정부지원사업",
    title: "2026 상반기\n정부지원사업 총정리",
    subtitle: "놓치면 아쉬운 창업 지원 프로그램,\n지금 바로 확인하세요.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    gradient: "from-[#f3f0f7] to-[#e8e0f0]",
  },
  {
    id: 4,
    badge: "디딤멘토",
    title: "현직 전문가에게 직접\n1:1 멘토링 받으세요",
    subtitle: "자금조달, 마케팅, 법률까지\n분야별 전문 멘토를 만나보세요.",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80",
    gradient: "from-[#eef7f2] to-[#e0f0e8]",
  },
];

const DURATION = 5000;

export default function HeroBanner() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const elapsedRef = useRef(0);
  const startRef = useRef(Date.now());

  const goTo = useCallback((idx: number) => {
    setActive(idx);
    setProgress(0);
    elapsedRef.current = 0;
    startRef.current = Date.now();
  }, []);

  const next = useCallback(() => {
    goTo((active + 1) % banners.length);
  }, [active, goTo]);

  const prev = useCallback(() => {
    goTo((active - 1 + banners.length) % banners.length);
  }, [active, goTo]);

  // Reset elapsed when slide changes
  const activeRef = useRef(active);
  if (activeRef.current !== active) {
    activeRef.current = active;
    elapsedRef.current = 0;
    setProgress(0);
  }

  // Auto-play + progress
  useEffect(() => {
    if (paused) return;

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
      setActive((prev) => (prev + 1) % banners.length);
    }, remaining);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [active, paused]);

  return (
    <div className="relative w-full h-[300px] overflow-hidden rounded-[14px] mt-[30px] mx-[30px]" style={{ width: "calc(100% - 60px)" }}>
      {/* Slides */}
      {banners.map((banner, i) => (
        <div
          key={banner.id}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === active ? 1 : 0, zIndex: i === active ? 1 : 0 }}
        >
          {/* Background image */}
          <Image
            src={banner.image}
            alt={banner.title}
            fill
            className="object-cover"
            priority={i === 0}
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/10" />

          {/* Text */}
          <div className="relative z-10 h-full flex flex-col justify-end px-[60px] pb-[30px]">
            <div className="max-w-lg">
              <span className="inline-block text-[12px] font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white/80">
                {banner.badge}
              </span>
              <h2 className="text-[32px] font-bold leading-[1.3] whitespace-pre-line text-white mt-2">
                {banner.title}
              </h2>
              <p className="text-[14px] text-white/70 mt-2 whitespace-pre-line leading-relaxed">
                {banner.subtitle}
              </p>
            </div>
            <div className="mt-[36px]">
          <div className="flex items-center">
            <button
              onClick={prev}
              className="text-white/50 hover:text-white transition-colors mr-[10px]"
            >
              <ChevronLeft size={18} strokeWidth={2} />
            </button>
            <span className="text-sm tabular-nums font-medium text-white">
              {active + 1}
            </span>
            <span className="text-sm text-white/50 mx-[4px]">/</span>
            <span className="text-sm text-white/50">
              {banners.length}
            </span>
            <button
              onClick={next}
              className="text-white/50 hover:text-white transition-colors ml-[10px]"
            >
              <ChevronRight size={18} strokeWidth={2} />
            </button>

            <div className="flex-1 h-[2px] bg-white/20 rounded-full overflow-hidden ml-[10px]">
              <div
                className="h-full bg-white rounded-full"
                style={{
                  width: `${progress * 100}%`,
                  transition: progress < 0.01 ? "none" : undefined,
                }}
              />
            </div>
            <button
              onClick={() => setPaused(!paused)}
              className="ml-[10px] text-white/50 hover:text-white transition-colors"
            >
              {paused ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 1.5L12 7L3 12.5V1.5Z"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="2" y="1" width="3.5" height="12" rx="1"/><rect x="8.5" y="1" width="3.5" height="12" rx="1"/></svg>
              )}
            </button>
          </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
