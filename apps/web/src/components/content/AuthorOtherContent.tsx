import Card from "@/components/ui/Card";
import SmallContentCard from "./SmallContentCard";
import type { SmallCardItem } from "@/lib/content-detail";

// 사이드바 "{작성자}님이 작성한 다른 콘텐츠" 카드 — 스몰 카드 2열 그리드 + 더보기.
export default function AuthorOtherContent({
  name,
  items,
}: {
  name: string;
  items: SmallCardItem[];
}) {
  if (items.length === 0) return null;

  return (
    <Card className="flex flex-col gap-[var(--space-lg)]">
      <h2 className="text-[18px] font-semibold text-[#191919]">
        <span className="text-[#191919]">{name}</span>님이 작성한 다른 콘텐츠
      </h2>

      <div className="grid grid-cols-2 gap-[18px]">
        {items.map((item) => (
          <SmallContentCard key={item.id} item={item} />
        ))}
      </div>

      <button
        type="button"
        className="h-[34px] w-full rounded-md border border-[#e1e2e3] bg-white text-[14px] font-normal text-[#666666] transition-colors hover:border-[#999999]"
      >
        콘텐츠 더보기
      </button>
    </Card>
  );
}
