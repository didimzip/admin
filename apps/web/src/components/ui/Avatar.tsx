import Image from "next/image";
import { BsPerson } from "react-icons/bs";

interface AvatarProps {
  src?: string;
  alt?: string;
  /** 지름(px). 기본 60 */
  size?: number;
}

// 공통 아바타. src 있으면 이미지, 없으면 BsPerson 기본 아이콘(빈 영역 방지).
// 원형 · 옅은 테두리 · 회색 배경. 전 서비스에서 재사용.
export default function Avatar({ src, alt = "", size = 60 }: AvatarProps) {
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#eee] bg-[#f6f6f6]"
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      ) : (
        <BsPerson size={size * 0.56} color="#333333" style={{ opacity: 0.2 }} />
      )}
    </div>
  );
}
