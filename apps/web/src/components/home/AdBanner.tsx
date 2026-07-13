import type { Banner } from "@didimzip/api";
import AdBadge from "@/components/ui/AdBadge";

// 광고 배너 (디자인 스펙: 180px · #333 · Badge + Title). Admin 미리보기와 동일.
// Description·CTA 버튼 없음. 데이터는 Admin CMS → API(pickAd) → Web.
export default function AdBanner({ ad }: { ad: Banner | null }) {
  if (!ad) return null;

  const image = ad.imageData || ad.imageUrl;
  const dark = ad.textColor === "dark"; // dark = 밝은 배경 → 어두운 텍스트

  const card = (
    <div
      className="relative overflow-hidden"
      style={{
        borderRadius: "14px",
        border: "1px solid #EEE",
        background: "#333",
        display: "flex",
        height: "180px",
        padding: "30px 60px",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        gap: "8px",
      }}
    >
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
        />
      )}
      {/* 유료 광고일 때만 AD 뱃지 — 우측 상단 top 20 / right 20 고정 */}
      {ad.isPaid && (
        <div style={{ position: "absolute", top: 20, right: 20, zIndex: 20 }}>
          <AdBadge />
        </div>
      )}
      {ad.subtitle && (
        <span
          className={`relative z-10 w-fit rounded-full px-2.5 py-0.5 text-[13px] font-medium ${
            dark ? "bg-black/8 text-black/60" : "bg-white/15 text-white/80"
          }`}
        >
          {ad.subtitle}
        </span>
      )}
      {ad.title && (
        <h3
          className={`relative z-10 whitespace-pre-line text-[22px] font-bold leading-tight ${
            dark ? "text-black/90" : "text-white"
          }`}
        >
          {ad.title}
        </h3>
      )}
      {/* 서브텍스트(Description): 입력된 경우에만 렌더 (없으면 영역 자체를 그리지 않음) */}
      {ad.description && (
        <p
          className={`relative z-10 whitespace-pre-line text-[14px] leading-relaxed ${
            dark ? "text-black/60" : "text-white/70"
          }`}
        >
          {ad.description}
        </p>
      )}
    </div>
  );

  if (!ad.linkUrl) return card;

  return (
    <a
      href={ad.linkUrl}
      target={ad.linkTarget}
      rel={ad.linkTarget === "_blank" ? "noopener noreferrer" : undefined}
      className="block"
    >
      {card}
    </a>
  );
}
