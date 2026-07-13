"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import MemberStatus, { type MemberStatusType } from "@/components/ui/MemberStatus";

// 사이드바 작성자 카드 — Admin에서 관리하는 작성자(User) 정보 기준.
// 아바타(profileImage) + 닉네임 + 회원 상태 배지 + 소개 + 팔로우/상담 버튼(팔로우 토글은 클라이언트).
export default function AuthorCard({
  name,
  profileImage,
  bio,
  status,
}: {
  name: string;
  profileImage?: string;
  bio?: string;
  /** 회원 상태 — 추후 User.status 값을 그대로 전달하면 배지가 자동 노출 */
  status?: MemberStatusType | MemberStatusType[];
}) {
  const [followed, setFollowed] = useState(false);

  return (
    <Card className="flex flex-col gap-[12px]">
      <div className="flex flex-col gap-[12px] pb-[12px]">
        {/* 아바타 + 이름 + 회원 상태 배지 */}
        <div className="flex items-center gap-[12px]">
          <Avatar src={profileImage} alt={name} size={60} />
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="truncate text-[18px] font-semibold text-[#191919]">{name}</span>
            {status && <MemberStatus status={status} />}
          </div>
        </div>

        <div className="h-px bg-[#eee]" />

        {/* 소개 */}
        <p className="line-clamp-3 text-[14px] font-normal leading-[1.6] text-[#666666]">
          {bio ?? `${name}님이 작성한 콘텐츠를 만나보세요.`}
        </p>
      </div>

      {/* 버튼 행 */}
      <div className="flex gap-[12px]">
        <button
          type="button"
          onClick={() => setFollowed((f) => !f)}
          className={
            followed
              ? "h-[34px] flex-1 rounded-md border border-[#e1e2e3] bg-white text-[14px] font-semibold text-[#666666] transition-colors"
              : "h-[34px] flex-1 rounded-md border border-[#333333] bg-[#333333] text-[14px] font-semibold text-white transition-colors hover:bg-[#191919]"
          }
        >
          {followed ? "팔로잉" : "팔로우"}
        </button>
        <button
          type="button"
          className="h-[34px] flex-1 rounded-md border border-[#e1e2e3] bg-white text-[14px] font-normal text-[#666666] transition-colors hover:border-[#999999]"
        >
          상담 요청하기
        </button>
      </div>
    </Card>
  );
}
