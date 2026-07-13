export const metadata = {
  title: "DidimZip API",
  description: "디딤집 개발용 Mock API 서버",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
