import type { NextRequest } from "next/server";
import type { FamilySiteInput, FamilySiteListQuery } from "@didimzip/api";
import { footerRepository } from "@/lib/repositories/footer-repo";
import { ok, fail, preflight } from "@/lib/http";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query: FamilySiteListQuery = {};
  const visible = searchParams.get("visible");
  if (visible !== null) query.visible = visible === "true";

  const sites = await footerRepository.listFamilySites(query);
  return ok(sites);
}

/** Admin 저장(save-all): 전체 관련 사이트 배열을 순서대로 교체 저장. */
export async function PUT(req: NextRequest) {
  let body: { sites?: unknown };
  try {
    body = (await req.json()) as { sites?: unknown };
  } catch {
    return fail("INVALID_JSON", "요청 본문을 JSON으로 해석할 수 없습니다.", 400);
  }

  if (!Array.isArray(body.sites)) {
    return fail("VALIDATION", "sites(배열)는 필수입니다.", 422);
  }
  const inputs = body.sites as FamilySiteInput[];
  if (inputs.some((s) => !s || typeof s.name !== "string" || !s.name.trim())) {
    return fail("VALIDATION", "각 관련 사이트에는 name이 필요합니다.", 422);
  }

  const saved = await footerRepository.saveFamilySites(inputs);
  return ok(saved);
}
