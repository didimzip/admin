"use client";

import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import {
  RiFolderLine,
  RiLightbulbLine,
  RiFundsLine,
  RiTeamLine,
  RiRocketLine,
  RiBookOpenLine,
  RiBriefcaseLine,
  RiMegaphoneLine,
  RiCalendarEventLine,
  RiInformationLine,
  RiLineChartLine,
  RiHandCoinLine,
  RiBuilding2Line,
  RiPaletteLine,
  RiCpuLine,
  RiScales3Line,
  RiCustomerService2Line,
  RiGraduationCapLine,
  RiGlobalLine,
  RiShieldCheckLine,
  RiFlashlightLine,
  RiCompass3Line,
  RiPriceTag3Line,
  RiGroupLine,
  RiStore2Line,
  RiArticleLine,
  RiMoneyDollarCircleLine,
  RiHome5Line,
  RiHeartLine,
  RiStarLine,
  RiFireLine,
  RiTrophyLine,
  RiCodeLine,
  RiPencilLine,
  RiSearchLine,
  RiSettings3Line,
  RiUser3Line,
  RiFileList3Line,
  RiChat3Line,
  RiMapPin2Line,
} from "react-icons/ri";

// ─── 카테고리 아이콘 렌더/검색 ────────────────────────────────────────────────
//
// iconName(문자열) → react-icons/ri 컴포넌트 매핑. 컴포넌트는 저장하지 않는다.
// - 자주 쓰는 아이콘은 named import(SSR 즉시 렌더, 트리셰이킹)
// - 그 외 전체(~2,800개)는 lazy 동적 import(별도 청크, 필요 시 로드 + 캐시)

export type IconComp = ComponentType<SVGProps<SVGSVGElement> & { size?: number; title?: string }>;

const SYNC_MAP: Record<string, IconComp> = {
  RiFolderLine,
  RiLightbulbLine,
  RiFundsLine,
  RiTeamLine,
  RiRocketLine,
  RiBookOpenLine,
  RiBriefcaseLine,
  RiMegaphoneLine,
  RiCalendarEventLine,
  RiInformationLine,
  RiLineChartLine,
  RiHandCoinLine,
  RiBuilding2Line,
  RiPaletteLine,
  RiCpuLine,
  RiScales3Line,
  RiCustomerService2Line,
  RiGraduationCapLine,
  RiGlobalLine,
  RiShieldCheckLine,
  RiFlashlightLine,
  RiCompass3Line,
  RiPriceTag3Line,
  RiGroupLine,
  RiStore2Line,
  RiArticleLine,
  RiMoneyDollarCircleLine,
  RiHome5Line,
  RiHeartLine,
  RiStarLine,
  RiFireLine,
  RiTrophyLine,
  RiCodeLine,
  RiPencilLine,
  RiSearchLine,
  RiSettings3Line,
  RiUser3Line,
  RiFileList3Line,
  RiChat3Line,
  RiMapPin2Line,
};

const FALLBACK: IconComp = RiFolderLine;

// 전체 ri 모듈 lazy 로드 (1회, 캐시)
const asyncCache = new Map<string, IconComp>();
let riPromise: Promise<Record<string, unknown>> | null = null;
function loadRi(): Promise<Record<string, unknown>> {
  return (riPromise ??= import("react-icons/ri") as Promise<Record<string, unknown>>);
}

export function CategoryIcon({
  iconName,
  size = 22,
  className,
}: {
  iconName: string;
  size?: number;
  className?: string;
}) {
  const sync = SYNC_MAP[iconName];
  const [lazy, setLazy] = useState<IconComp | null>(() => asyncCache.get(iconName) ?? null);

  useEffect(() => {
    if (sync || asyncCache.has(iconName)) return;
    let alive = true;
    loadRi().then((mod) => {
      if (!alive) return;
      const C = (mod[iconName] as IconComp) ?? FALLBACK;
      asyncCache.set(iconName, C);
      setLazy(() => C);
    });
    return () => {
      alive = false;
    };
  }, [iconName, sync]);

  const Comp = sync ?? lazy ?? FALLBACK;
  return <Comp size={size} className={className} />;
}

/** 아이콘 검색용: 전체 ri 아이콘 이름 목록을 lazy 로드해 반환. */
export async function loadAllRiIconNames(): Promise<string[]> {
  const mod = await loadRi();
  return Object.keys(mod)
    .filter((k) => /^Ri[A-Z]/.test(k))
    .sort();
}
