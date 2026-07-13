"use client";

import ActionMenu, { type ActionMenuItem } from "@/components/ui/ActionMenu";

// 콘텐츠 상세 더보기(···) 액션. 현재는 Mock 권한 기반.
// ⚠️ 로그인/회원 시스템 연결 시: 아래 isAuthor 를 세션의 실제 작성자 여부로 교체하면
//    작성자(수정/삭제) / 타인(신고·문의·차단) 메뉴가 자동 전환된다. (구조만 미리 구성)
export default function ContentActions({ postId }: { postId: string }) {
  // Mock 권한 — 이 값만 바꾸면 메뉴 구성이 바뀐다.
  //   true  → 작성자: [수정, 삭제]
  //   false → 타인  : [신고, 문의 | 차단]
  const isAuthor = false;

  const authorActions: ActionMenuItem[] = [
    { label: "수정", onSelect: () => console.log("[content] edit", postId) },
    { label: "삭제", onSelect: () => console.log("[content] delete", postId), danger: true },
  ];

  const memberActions: ActionMenuItem[][] = [
    [
      { label: "콘텐츠 신고하기", onSelect: () => console.log("[content] report", postId) },
      { label: "문의하기", onSelect: () => console.log("[content] inquiry", postId) },
    ],
    [{ label: "작성자 차단하기", onSelect: () => console.log("[content] block", postId), danger: true }],
  ];

  const sections: ActionMenuItem[][] = isAuthor ? [authorActions] : memberActions;

  return <ActionMenu sections={sections} />;
}
