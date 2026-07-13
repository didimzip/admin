import type { NextRequest } from "next/server";
import type { FooterSettingsInput } from "@didimzip/api";
import { footerRepository } from "@/lib/repositories/footer-repo";
import { ok, fail, preflight } from "@/lib/http";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

export async function GET() {
  const settings = await footerRepository.getSettings();
  return ok(settings);
}

/** Admin 저장: Footer 회사/고객센터 정보 부분 업데이트. */
export async function PUT(req: NextRequest) {
  let body: FooterSettingsInput;
  try {
    body = (await req.json()) as FooterSettingsInput;
  } catch {
    return fail("INVALID_JSON", "요청 본문을 JSON으로 해석할 수 없습니다.", 400);
  }
  const updated = await footerRepository.updateSettings(body);
  return ok(updated);
}
