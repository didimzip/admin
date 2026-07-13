import Link from "next/link";
import { AiOutlineRight } from "react-icons/ai";

export interface Crumb {
  label: string;
  href?: string; // 없으면 이동 불가(일반 텍스트)
}

// 공통 브레드크럼 — 카테고리명은 Link(hover 강조), ">" 구분자는 클릭 불가.
// items 로 동적 구성 → 어느 페이지에서든 재사용.
export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-[14px] font-normal text-[#666666]">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-1.5">
          {i > 0 && <AiOutlineRight size={12} className="text-[#999999]" aria-hidden />}
          {item.href ? (
            <Link
              href={item.href}
              className="underline-offset-2 transition-colors hover:text-[#191919] hover:underline"
            >
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
