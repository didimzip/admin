// 공통 태그 칩. 일반 태그와 +N 칩 모두 동일 디자인으로 재사용한다.
export default function Tag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-md border border-[#eee] bg-[#f6f6f6] px-[6px] py-[2px] text-[12px] font-normal text-[#333333]">
      {label}
    </span>
  );
}
