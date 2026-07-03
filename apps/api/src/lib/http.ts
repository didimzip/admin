import { NextResponse } from "next/server";
import type { ApiError, ApiSuccess } from "@didimzip/api";

// 개발용 Mock API. 쿠키/자격증명을 쓰지 않으므로 CORS는 전체 허용.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ ok: true, data }, { status, headers: CORS_HEADERS });
}

export function fail(code: string, message: string, status = 400): NextResponse<ApiError> {
  return NextResponse.json(
    { ok: false, error: { code, message } },
    { status, headers: CORS_HEADERS },
  );
}

export function preflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
