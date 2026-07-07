import type { NextRequest } from "next/server";
import type {
  BannerCreateInput,
  BannerListQuery,
  BannerPosition,
  BannerType,
} from "@didimzip/api";
import { bannersRepository } from "@/lib/repositories/banners-repo";
import { ok, fail, preflight } from "@/lib/http";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query: BannerListQuery = {};
  const type = searchParams.get("type");
  const position = searchParams.get("position");
  const active = searchParams.get("active");
  if (type) query.type = type as BannerType;
  if (position) query.position = position as BannerPosition;
  if (active !== null) query.active = active === "true";

  const banners = await bannersRepository.findAll(query);
  return ok(banners);
}

/** 부분 입력이 와도 유효한 Banner 가 되도록 기본값을 채운다. */
function normalizeCreateInput(body: Partial<BannerCreateInput>): BannerCreateInput {
  const bannerType = body.bannerType ?? "HERO";
  return {
    name: body.name ?? "",
    bannerType,
    position: body.position ?? (bannerType === "HERO" ? "HOME_HERO" : "HOME_MIDDLE"),
    subtitle: body.subtitle ?? "",
    title: body.title ?? "",
    subText: body.subText ?? "",
    description: body.description ?? "",
    textColor: body.textColor ?? "light",
    imageUrl: body.imageUrl ?? "",
    imageData: body.imageData ?? "",
    imageUrlMobile: body.imageUrlMobile ?? "",
    imageDataMobile: body.imageDataMobile ?? "",
    linkUrl: body.linkUrl ?? "",
    linkTarget: body.linkTarget ?? "_self",
    weight: body.weight ?? 0,
    sortOrder: body.sortOrder ?? 1,
    isActive: body.isActive ?? true,
    startDate: body.startDate ?? "",
    endDate: body.endDate ?? "",
    createdBy: body.createdBy ?? null,
  };
}

export async function POST(req: NextRequest) {
  let body: Partial<BannerCreateInput>;
  try {
    body = (await req.json()) as Partial<BannerCreateInput>;
  } catch {
    return fail("INVALID_JSON", "요청 본문을 JSON으로 해석할 수 없습니다.", 400);
  }

  if ((!body.name || !body.name.trim()) && (!body.title || !body.title.trim())) {
    return fail("VALIDATION", "배너명(name) 또는 제목(title)은 필수입니다.", 422);
  }

  const created = await bannersRepository.create(normalizeCreateInput(body));
  return ok(created, 201);
}
