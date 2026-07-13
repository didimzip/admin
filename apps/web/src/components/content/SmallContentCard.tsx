import Link from "next/link";
import Image from "next/image";
import type { SmallCardItem } from "@/lib/content-detail";

// 공통 스몰 콘텐츠 카드 — 추천 콘텐츠 · 사이드바(작성자 다른 글)에서 재사용.
// 썸네일(aspect-video·radius10) + 2줄 제목 + 작성자·조회수. 폭은 부모 그리드 셀에 맞춤.
export default function SmallContentCard({ item }: { item: SmallCardItem }) {
  return (
    <Link href={`/content/${item.id}`} className="group flex min-w-0 flex-col gap-2">
      <div className="relative aspect-video overflow-hidden rounded-[10px] border border-[#eee] bg-[#f6f6f6]">
        <Image
          src={item.thumbnail}
          alt={item.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 200px"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="line-clamp-2 text-[16px] font-semibold leading-[1.2] text-[#191919] group-hover:underline decoration-1 underline-offset-2">
          {item.title}
        </p>
        <div className="flex items-center gap-1.5 text-[12px] font-normal text-[#999999]">
          <span className="font-semibold text-[#333333]">{item.author}</span>
          <span>조회수 {item.views.toLocaleString()}</span>
        </div>
      </div>
    </Link>
  );
}
