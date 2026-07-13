import Avatar from "@/components/ui/Avatar";
import Rating from "@/components/ui/Rating";
import type { MentorReview } from "@/lib/mock-data";

// 멘토링 후기 카드 — 상단(아바타·직무·멘토명) / 본문(후기, 7줄 말줄임) / 하단(별점·작성자).
// 공통 Avatar·Rating 재사용. 고정 크기(281×352)로 캐러셀 정렬.
export default function ReviewCard({ review }: { review: MentorReview }) {
  return (
    <div className="flex h-[352px] w-[281px] shrink-0 flex-col gap-4 rounded-[10px] border border-[#e6e6e6] bg-white px-[30px] pb-[30px] pt-[20px] transition-colors duration-150 ease-out hover:border-[#333333]">
      {/* 상단: 아바타 + 직무/멘토명 */}
      <div className="flex items-center gap-4">
        <Avatar src={review.profileImage} alt={review.mentorName} size={40} />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[12px] font-normal leading-[1.4] text-[#666666]">{review.role}</span>
          <span className="text-[14px] font-semibold leading-[1.4] text-[#191919]">
            {review.mentorName} 멘토
          </span>
        </div>
      </div>

      <div className="h-px w-full bg-[#e1e2e3]" />

      {/* 본문: 후기 + 별점/작성자 (space-between) */}
      <div className="flex min-h-0 flex-1 flex-col justify-between">
        <p className="line-clamp-[7] text-[14px] font-normal leading-[1.6] text-[#666666]">
          {review.content}
        </p>

        <div className="flex items-center gap-1.5">
          <Rating value={review.rating} />
          <span className="h-px w-5 bg-[#e6e6e6]" />
          <span className="text-[14px] font-normal text-[#666666]">{review.reviewer}</span>
        </div>
      </div>
    </div>
  );
}
