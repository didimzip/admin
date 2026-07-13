export type PostStatus = "모집중" | "모집완료" | "진행중" | "완료" | "채택완료" | "미채택";

// 상태별 스타일(상태 뱃지). 신규 상태는 이 맵에만 추가하면 된다.
const STATUS_STYLE: Record<PostStatus, string> = {
  모집중: "bg-[#333333] text-white",
  모집완료: "bg-[#999999] text-white",
  진행중: "bg-[#4a90d9] text-white",
  완료: "bg-[#eeeeee] text-[#666666]",
  채택완료: "bg-[#333333] text-white", // Q&A 채택 완료
  미채택: "bg-[#e1e2e3] text-white", // Q&A 미채택
};

// 공통 상태 뱃지 — 카드/목록 등에서 재사용.
export default function StatusBadge({ status }: { status: PostStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-md border border-[#eee] px-2 py-1 text-[12px] font-semibold ${STATUS_STYLE[status]}`}
    >
      {status}
    </span>
  );
}
