# @didimzip/config

앱 전체가 공유하는 빌드/린트/디자인 설정.

## 포함

- `tsconfig/base.json` — 공통 TypeScript 컴파일러 옵션
- `tsconfig/nextjs.json` — base + Next.js 플러그인
- `eslint/next.mjs` — Next.js 앱 공용 ESLint 베이스
- `tailwind/theme.css` — 공유 디자인 토큰 (Tailwind v4, `:root` 변수 + `@theme`)

## 사용

**tsconfig** (`apps/*/tsconfig.json`)

```json
{
  "extends": "@didimzip/config/tsconfig/nextjs.json",
  "compilerOptions": { "paths": { "@/*": ["./src/*"] } },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

**eslint** (`apps/*/eslint.config.mjs`)

```js
import base from "@didimzip/config/eslint/next";
export default base;
```

**tailwind theme** (`apps/*/src/app/globals.css`)

```css
@import "tailwindcss";
@import "@didimzip/config/tailwind/theme.css";
```

> Phase 1에서는 admin이 tsconfig만 이 패키지를 사용한다. eslint/theme 및
> `@didimzip/ui`, `@didimzip/types`, `@didimzip/utils` 추출은 web 앱을 추가하는
> Phase 2에서 실제 공통 사용이 시작될 때 진행한다.
