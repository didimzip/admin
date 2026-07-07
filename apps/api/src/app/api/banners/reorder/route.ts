import type { NextRequest } from "next/server";
import { bannersRepository } from "@/lib/repositories/banners-repo";
import { ok, fail, preflight } from "@/lib/http";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

export async function POST(req: NextRequest) {
  let body: { orderedIds?: unknown };
  try {
    body = (await req.json()) as { orderedIds?: unknown };
  } catch {
    return fail("INVALID_JSON", "요청 본문을 JSON으로 해석할 수 없습니다.", 400);
  }

  if (!Array.isArray(body.orderedIds) || !body.orderedIds.every((x) => typeof x === "string")) {
    return fail("VALIDATION", "orderedIds(문자열 배열)는 필수입니다.", 422);
  }

  const banners = await bannersRepository.reorder(body.orderedIds as string[]);
  return ok(banners);
}
