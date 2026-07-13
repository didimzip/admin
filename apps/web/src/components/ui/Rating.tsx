import { FaStar } from "react-icons/fa";

// 공통 별점 컴포넌트 — 채워진 별 #ffbb33 / 빈 별 #e6e6e6. 후기·평점 등에서 재사용.
export default function Rating({
  value,
  max = 5,
  size = 16,
}: {
  value: number;
  max?: number;
  size?: number;
}) {
  return (
    <div className="flex items-center" role="img" aria-label={`별점 ${value}점 (${max}점 만점)`}>
      {Array.from({ length: max }).map((_, i) => (
        <FaStar key={i} size={size} className={i < value ? "text-[#ffbb33]" : "text-[#e6e6e6]"} />
      ))}
    </div>
  );
}
