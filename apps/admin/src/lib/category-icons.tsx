import type { IconType } from "react-icons";
import {
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
  RiFolderLine,
} from "react-icons/ri";

// iconName(문자열) → react-icons 컴포넌트 매핑.
// 컴포넌트를 저장하지 않고, 문자열만 저장 후 렌더 시점에 이 맵으로 조회한다.
const ICON_MAP: Record<string, IconType> = {
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
};

// 기본 아이콘 (iconName 미지정/미등록 시)
const FALLBACK: IconType = RiFolderLine;

export function getCategoryIcon(iconName: string): IconType {
  return ICON_MAP[iconName] ?? FALLBACK;
}

export function CategoryIcon({
  iconName,
  className,
  size,
}: {
  iconName: string;
  className?: string;
  size?: number;
}) {
  const Icon = getCategoryIcon(iconName);
  return <Icon className={className} size={size} />;
}
