// Admin 미리보기용 AD 뱃지. Web(apps/web)의 AdBadge와 동일한 스타일을 사용해
// 미리보기와 실제 Web 화면이 동일하게 보이도록 한다. (isPaid=true 광고에만 노출)
export default function AdBadge({ label = "AD" }: { label?: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 10px",
        backgroundColor: "rgba(153, 153, 153, 0.1)",
        border: "1px solid rgba(153, 153, 153, 0.1)",
        borderRadius: "300px",
        color: "#999999",
        fontSize: "13px",
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
