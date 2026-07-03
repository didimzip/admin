import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import GNB from "@/components/layout/GNB";

export const metadata: Metadata = {
  title: "디딤집 - 창업가를 위한 콘텐츠 플랫폼",
  description:
    "스타트업의 시작을 딛는 곳, 디딤집에서 시작하세요. 창업 콘텐츠, 멘토 Q&A, 커뮤니티를 한 곳에서.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full flex">
        <Suspense fallback={null}>
          <Sidebar />
        </Suspense>
        <div className="flex-1 flex flex-col min-h-screen">
          <GNB />
          <main className="flex-1 mt-14">{children}</main>
        </div>
      </body>
    </html>
  );
}
