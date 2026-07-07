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
// Admin이 저장한 iconName 문자열을 렌더 시점에 이 맵으로 조회한다.
// (컴포넌트를 저장/직렬화하지 않음 → 실백엔드 DB에서도 문자열만 사용)
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

const FALLBACK: IconType = RiFolderLine;

export function CategoryIcon({
  iconName,
  className,
  size,
}: {
  iconName: string;
  className?: string;
  size?: number;
}) {
  const Icon = ICON_MAP[iconName] ?? FALLBACK;
  return <Icon className={className} size={size} />;
}
