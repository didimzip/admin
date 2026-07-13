// 본문 렌더러 — Admin 에디터(TipTap)가 생성한 리치 텍스트 HTML 을 그대로 출력.
// 자식 선택자(arbitrary variants)로 Heading/Paragraph/Image/Quote/List/Link 등에
// 일관된 타이포를 적용해, 향후 에디터가 만드는 요소도 자연스럽게 렌더링된다.
const BODY_STYLE = [
  "text-[18px] font-normal leading-[1.7] text-[#333333]",
  "[&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:text-[28px] [&_h1]:font-bold [&_h1]:leading-[1.3] [&_h1]:text-[#191919]",
  "[&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-[24px] [&_h2]:font-bold [&_h2]:leading-[1.3] [&_h2]:text-[#191919]",
  "[&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-[20px] [&_h3]:font-semibold [&_h3]:text-[#191919]",
  "[&_p]:my-4",
  "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1",
  "[&_blockquote]:my-5 [&_blockquote]:border-l-4 [&_blockquote]:border-[#e1e2e3] [&_blockquote]:pl-4 [&_blockquote]:text-[#666666]",
  "[&_img]:my-6 [&_img]:w-full [&_img]:rounded-[10px] [&_img]:border [&_img]:border-[#eee]",
  "[&_a]:text-[#4a90d9] [&_a]:underline [&_a]:underline-offset-2",
  "[&_strong]:font-semibold",
  "[&_hr]:my-8 [&_hr]:border-[#e1e2e3]",
].join(" ");

export default function ArticleBody({ html }: { html: string }) {
  return <div className={BODY_STYLE} dangerouslySetInnerHTML={{ __html: html }} />;
}
