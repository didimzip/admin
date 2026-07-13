# DidimZip (Fundable)

디딤집 서비스 모노레포. 하나의 저장소에서 고객용 Web과 관리자용 Admin을 함께 관리합니다.

## 구조

```
apps/
  admin/     관리자 서비스 (admin.fundable.com)
  web/       고객 서비스 (fundable.com) — 추가 예정
packages/    공통 UI · 타입 · 유틸 (추가 예정)
```

## 요구 사항

- Node.js 20+
- pnpm 10+

## 개발

```bash
pnpm install          # 의존성 설치 (워크스페이스 전체)

pnpm dev              # 모든 앱 동시 실행
pnpm dev:admin        # 관리자만 실행
pnpm dev:web          # 웹만 실행 (추가 후)
```

## 빌드

```bash
pnpm build            # 전체 빌드
pnpm build:admin      # 관리자만 빌드
```

## 배포

- `apps/web` → fundable.com
- `apps/admin` → admin.fundable.com

두 앱은 하나의 백엔드 API를 공유합니다.
