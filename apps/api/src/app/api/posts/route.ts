import type { NextRequest } from "next/server";
import type { PostCreateInput, PostListQuery, PostStatus } from "@didimzip/api";
import { postsRepository } from "@/lib/repositories/posts-repo";
import { ok, fail, preflight } from "@/lib/http";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query: PostListQuery = {};
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const q = searchParams.get("q");
  if (status) query.status = status as PostStatus;
  if (category) query.category = category;
  if (q) query.q = q;

  const posts = await postsRepository.findAll(query);
  return ok(posts);
}

/** 부분 입력이 와도 유효한 Post 가 되도록 기본값을 채운다. */
function normalizeCreateInput(body: Partial<PostCreateInput>): PostCreateInput {
  return {
    title: body.title ?? "",
    body: body.body ?? "",
    category: body.category ?? "",
    subCategory: body.subCategory ?? "",
    tags: body.tags ?? [],
    thumbnailUrl: body.thumbnailUrl ?? "",
    relatedLinks: body.relatedLinks ?? [],
    attachments: body.attachments ?? [],
    status: body.status ?? "DRAFT",
    isHot: body.isHot ?? false,
    viewCount: body.viewCount ?? 0,
    showConsultButton: body.showConsultButton ?? false,
    publishStart: body.publishStart ?? "",
    publishEnd: body.publishEnd ?? "",
    isScheduled: body.isScheduled ?? false,
    scheduledAt: body.scheduledAt ?? "",
    authorId: body.authorId,
    authorName: body.authorName,
  };
}

export async function POST(req: NextRequest) {
  let body: Partial<PostCreateInput>;
  try {
    body = (await req.json()) as Partial<PostCreateInput>;
  } catch {
    return fail("INVALID_JSON", "요청 본문을 JSON으로 해석할 수 없습니다.", 400);
  }

  if (!body.title || !body.title.trim()) {
    return fail("VALIDATION", "제목(title)은 필수입니다.", 422);
  }

  const created = await postsRepository.create(normalizeCreateInput(body));
  return ok(created, 201);
}
