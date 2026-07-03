import ContentCard from "@/components/ui/ContentCard";
import SectionHeader from "@/components/ui/SectionHeader";
import type { ContentCard as ContentCardType } from "@/lib/mock-data";

export default function LatestSection({ items }: { items: ContentCardType[] }) {
  return (
    <div>
      <SectionHeader title="새로 올라온 콘텐츠" href="/latest" />
      <div className="grid grid-cols-4 gap-5">
        {items.slice(0, 8).map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
