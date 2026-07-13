import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import TagList from "@/components/ui/TagList";
import type { MentorProfile } from "@/lib/mock-data";

// 멘토 카드 — 공통 Card 셸 사용. 상단: 직무/이름/소개 + 아바타, 하단: 태그(넘치면 +N).
export default function MentorCard({ mentor }: { mentor: MentorProfile }) {
  return (
    <Card href={`/mentor/${mentor.id}`} className="flex h-full flex-col gap-[16px]">
      {/* 상단: 텍스트 + 아바타 (직업↔이름↔소개 각 8px) */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-[8px]">
          <span className="text-[12px] font-normal leading-[1.2] text-[#666666]">{mentor.job}</span>
          <span className="text-[18px] font-semibold leading-[1.2] text-[#191919]">{mentor.name}</span>
          <p className="truncate text-[14px] font-normal leading-[1.2] text-[#666666]">
            {mentor.description}
          </p>
        </div>
        <Avatar src={mentor.profileImage} alt={mentor.name} size={56} />
      </div>

      {/* 하단: 태그 (한 줄 · 넘치면 +N) */}
      <TagList tags={mentor.tags} />
    </Card>
  );
}
