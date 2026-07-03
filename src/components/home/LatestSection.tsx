import ContentCard from "@/components/ui/ContentCard";
import SectionHeader from "@/components/ui/SectionHeader";
import { generateContents } from "@/lib/mock-data";

const items = generateContents(8);

export default function LatestSection() {
  return (
    <div>
      <SectionHeader title="새로 올라온 콘텐츠" href="/latest" />
      <div className="grid grid-cols-4 gap-5">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
