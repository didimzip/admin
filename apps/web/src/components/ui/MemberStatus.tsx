import type { ReactNode } from "react";
import { BiUser, BiSolidCheckShield } from "react-icons/bi";
import { PiStarFourFill, PiGraduationCapFill } from "react-icons/pi";
import SingleBadge from "./SingleBadge";

// 회원 상태 종류 — 추후 User.status / User.memberStatus 값이 이 유니온과 매핑된다.
export type MemberStatusType = "일반회원" | "디딤메이커" | "전문가" | "디딤멘토";

// 상태별 라벨/아이콘/색상. 신규 상태는 이 맵에만 추가하면 전 서비스에 반영(확장 이음새).
// 아이콘 색은 텍스트 색을 상속(currentColor)하므로 className 의 text-* 한 곳만 관리.
const STATUS_CONFIG: Record<
  MemberStatusType,
  { label: string; icon: ReactNode; className: string }
> = {
  일반회원: {
    label: "일반 회원",
    icon: <BiUser size={16} />,
    className: "bg-[#f6f6f6] border-[#eee] text-[#000000]",
  },
  디딤메이커: {
    label: "디딤메이커",
    icon: <PiStarFourFill size={16} />,
    className: "bg-[#f6f6f6] border-[#eee] text-[#000000]",
  },
  전문가: {
    label: "전문가",
    icon: <BiSolidCheckShield size={16} />,
    className: "bg-[rgba(46,116,255,0.1)] border-[#d7e4ff] text-[#2e74ff]",
  },
  디딤멘토: {
    label: "디딤멘토",
    icon: <PiGraduationCapFill size={16} />,
    className: "bg-[rgba(255,136,31,0.1)] border-[#ff881f] text-[#ff881f]",
  },
};

// 공통 회원 상태 배지 — 단일/복수 상태 모두 지원.
// 추후 회원 데이터 연결 시 status 에 User.status 값만 넘기면 자동으로 배지가 노출된다.
export default function MemberStatus({
  status,
}: {
  status: MemberStatusType | MemberStatusType[];
}) {
  const list = Array.isArray(status) ? status : [status];
  if (list.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-[6px]">
      {list.map((s) => {
        const config = STATUS_CONFIG[s];
        return <SingleBadge key={s} icon={config.icon} label={config.label} className={config.className} />;
      })}
    </div>
  );
}
