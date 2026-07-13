"use client";

import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";

interface PaginationButtonProps {
  onPrev?: () => void;
  onNext?: () => void;
  disablePrev?: boolean;
  disableNext?: boolean;
}

// 모든 섹션 헤더 우측에 공통으로 쓰는 페이지네이션(이전/다음) 버튼.
// 디자인 변경 시 이 컴포넌트만 수정하면 전 섹션에 반영된다.
export function PaginationButton({
  onPrev,
  onNext,
  disablePrev = false,
  disableNext = false,
}: PaginationButtonProps) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 12px",
        backgroundColor: "#FFFFFF",
        border: "1px solid #EEEEEE",
        borderRadius: "6px",
        width: "66px",
        height: "36px",
        boxSizing: "border-box",
      }}
    >
      <button
        onClick={onPrev}
        disabled={disablePrev}
        style={{
          all: "unset",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: disablePrev ? "not-allowed" : "pointer",
          opacity: disablePrev ? 0.2 : 1,
          color: "#333333",
        }}
      >
        <AiOutlineLeft size={16} />
      </button>

      <button
        onClick={onNext}
        disabled={disableNext}
        style={{
          all: "unset",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: disableNext ? "not-allowed" : "pointer",
          opacity: disableNext ? 0.2 : 1,
          color: "#333333",
        }}
      >
        <AiOutlineRight size={16} />
      </button>
    </div>
  );
}

export default PaginationButton;
