import type { Banner } from "@didimzip/api";

// 광고 배너 (디자인 스펙: 180px · #333 · Badge + Title). Admin 미리보기와 동일.
// Description·CTA 버튼 없음. 데이터는 Admin CMS → API(pickAd) → Web.
export default function AdBanner({ ad }: { ad: Banner | null }) {
  if (!ad) return null;

  const image = ad.imageData || ad.imageUrl;

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
        gap: "36px",
      }}
    >
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
      )}
      {ad.subtitle && (
        <span className="relative z-10 w-fit rounded-full bg-white/15 px-2.5 py-0.5 text-[13px] font-medium text-white/80">
          {ad.subtitle}
        </span>
      )}
      {ad.title && (
        <h3 className="relative z-10 whitespace-pre-line text-[22px] font-bold leading-tight text-white">
          {ad.title}
        </h3>
      )}
    </div>
  );

  if (!ad.linkUrl) return <div className="my-2">{card}</div>;

  return (
    <a
      href={ad.linkUrl}
      target={ad.linkTarget}
      rel={ad.linkTarget === "_blank" ? "noopener noreferrer" : undefined}
      className="block my-2"
    >
      {card}
    </a>
  );
}
