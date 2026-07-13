import type { NextRequest } from "next/server";
import type { AuthorUpsertInput } from "@didimzip/api";
import { authorsRepository } from "@/lib/repositories/authors-repo";
import { ok, fail, preflight } from "@/lib/http";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

// web: 작성자 신원 목록(최신 닉네임/프로필) 조회
export async function GET() {
  const authors = await authorsRepository.findAll();
  return ok(authors);
}

// admin: 관리자 계정 → 작성자 신원 동기화 (다건 upsert)
export async function POST(req: NextRequest) {
  let body: { authors?: AuthorUpsertInput[] };
  try {
    body = (await req.json()) as { authors?: AuthorUpsertInput[] };
  } catch {
    return fail("INVALID_JSON", "요청 본문을 JSON으로 해석할 수 없습니다.", 400);
  }

  if (!Array.isArray(body.authors)) {
    return fail("VALIDATION", "authors 배열은 필수입니다.", 422);
  }

  const saved = await authorsRepository.upsertMany(body.authors);
  return ok(saved);
}
