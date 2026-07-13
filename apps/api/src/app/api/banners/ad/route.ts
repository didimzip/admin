import type { NextRequest } from "next/server";
import type { BannerPosition } from "@didimzip/api";
import { bannersRepository } from "@/lib/repositories/banners-repo";
import { ok, preflight } from "@/lib/http";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

/**
 * 광고 1개 조회. 조건(ADVERTISEMENT·ON·기간·위치) 충족 배너 중 weight 가중 랜덤.
 * 없으면 data=null. position 기본값 HOME_MIDDLE.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const position = (searchParams.get("position") ?? "HOME_MIDDLE") as BannerPosition;
  const ad = await bannersRepository.pickAd(position);
  return ok(ad);
}
