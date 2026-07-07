import type { NextRequest } from "next/server";
import type { CategoryInput, CategoryListQuery } from "@didimzip/api";
import { categoriesRepository } from "@/lib/repositories/categories-repo";
import { ok, fail, preflight } from "@/lib/http";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query: CategoryListQuery = {};
  const visible = searchParams.get("visible");
  if (visible !== null) query.visible = visible === "true";

  const categories = await categoriesRepository.findAll(query);
  return ok(categories);
}

/** Admin 저장(save-all): 전체 카테고리 배열을 순서대로 교체 저장. */
export async function PUT(req: NextRequest) {
  let body: { categories?: unknown };
  try {
    body = (await req.json()) as { categories?: unknown };
  } catch {
    return fail("INVALID_JSON", "요청 본문을 JSON으로 해석할 수 없습니다.", 400);
  }

  if (!Array.isArray(body.categories)) {
    return fail("VALIDATION", "categories(배열)는 필수입니다.", 422);
  }
  const inputs = body.categories as CategoryInput[];
  if (inputs.some((c) => !c || typeof c.name !== "string" || !c.name.trim())) {
    return fail("VALIDATION", "각 카테고리에는 name이 필요합니다.", 422);
  }

  const saved = await categoriesRepository.replaceAll(inputs);
  return ok(saved);
}
