import type { NextRequest } from "next/server";
import type { PostUpdateInput } from "@didimzip/api";
import { postsRepository } from "@/lib/repositories/posts-repo";
import { ok, fail, preflight } from "@/lib/http";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export function OPTIONS() {
  return preflight();
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const post = await postsRepository.findById(id);
  if (!post) return fail("NOT_FOUND", "게시글을 찾을 수 없습니다.", 404);
  return ok(post);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  let body: PostUpdateInput;
  try {
    body = (await req.json()) as PostUpdateInput;
  } catch {
    return fail("INVALID_JSON", "요청 본문을 JSON으로 해석할 수 없습니다.", 400);
  }

  const updated = await postsRepository.update(id, body);
  if (!updated) return fail("NOT_FOUND", "게시글을 찾을 수 없습니다.", 404);
  return ok(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const removed = await postsRepository.remove(id);
  if (!removed) return fail("NOT_FOUND", "게시글을 찾을 수 없습니다.", 404);
  return ok({ id });
}
