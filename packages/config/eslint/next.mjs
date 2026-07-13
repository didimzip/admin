import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Next.js 앱 공용 ESLint 베이스. 각 앱은 이 설정을 스프레드해서 사용한다.
//   import base from "@didimzip/config/eslint/next";
//   export default base;
const config = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default config;
