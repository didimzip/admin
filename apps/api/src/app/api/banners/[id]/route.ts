import type { NextRequest } from "next/server";
import type { BannerUpdateInput } from "@didimzip/api";
import { bannersRepository } from "@/lib/repositories/banners-repo";
import { ok, fail, preflight } from "@/lib/http";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export function OPTIONS() {
  return preflight();
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const banner = await bannersRepository.findById(id);
  if (!banner) return fail("NOT_FOUND", "배너를 찾을 수 없습니다.", 404);
  return ok(banner);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  let body: BannerUpdateInput;
  try {
    body = (await req.json()) as BannerUpdateInput;
  } catch {
    return fail("INVALID_JSON", "요청 본문을 JSON으로 해석할 수 없습니다.", 400);
  }

  const updated = await bannersRepository.update(id, body);
  if (!updated) return fail("NOT_FOUND", "배너를 찾을 수 없습니다.", 404);
  return ok(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const removed = await bannersRepository.remove(id);
  if (!removed) return fail("NOT_FOUND", "배너를 찾을 수 없습니다.", 404);
  return ok({ id });
}
