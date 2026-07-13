import { AiOutlineRight } from "react-icons/ai";
import SmallContentCard from "./SmallContentCard";
import type { SmallCardItem } from "@/lib/content-detail";

// 본문 하단 "{태그} 추천 콘텐츠" 섹션 — 헤더(더보기) + 스몰 카드 4개(4열).
// 현재는 태그/카테고리 기반 파생 데이터. 추후 추천 API 결과를 items 로 넘기면 그대로 사용.
export default function RelatedContentSection({
  tag,
  items,
}: {
  tag: string;
  items: SmallCardItem[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-semibold text-[#191919]">
          {tag} <span className="font-semibold">추천 콘텐츠</span>
        </h2>
        <button
          type="button"
          className="flex items-center gap-1.5 text-[14px] font-semibold text-[#666666] transition-colors hover:text-[#333333]"
        >
          더보기
          <AiOutlineRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-[18px] sm:grid-cols-4">
        {items.map((item) => (
          <SmallContentCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
