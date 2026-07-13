"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// 앱 전역 TanStack Query Provider. 카테고리 페이지의 useInfiniteQuery 등에서 사용.
// SSR(서버 컴포넌트) 구조에는 영향을 주지 않는다 — children 은 그대로 서버 렌더된다.
export default function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000, // 1분간 fresh — 재진입 시 불필요한 재요청 방지
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
