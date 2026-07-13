interface AdBadgeProps {
  label?: string;
}

// 유료 광고(isPaid=true) 배너에 노출되는 공통 AD 뱃지. 전 광고 위치에서 재사용.
export function AdBadge({ label = "AD" }: AdBadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 8px",
        backgroundColor: "rgba(153, 153, 153, 0.1)",
        border: "1px solid rgba(153, 153, 153, 0.1)",
        borderRadius: "300px",
        color: "#999999",
        fontSize: "12px",
        fontFamily: "Pretendard, sans-serif",
        fontWeight: 500,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

export default AdBadge;
