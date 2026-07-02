"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  RiArrowLeftLine,
  RiPencilLine,
  RiCalendarLine,
  RiPriceTag3Line,
  RiEyeLine,
  RiTimeLine,
  RiFireLine,
  RiDeleteBinLine,
  RiAttachmentLine,
  RiFileTextLine,
  RiDownloadLine,
  RiMessage2Line,
  RiCalendarScheduleLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPost, deletePost, getAllPosts, type StoredPost } from "@/lib/post-store";
import { getCommentsByPostId, updateCommentStatus } from "@/lib/comment-store";
import { useToast } from "@/lib/toast-context";
import { recordLog } from "@/lib/audit-log-store";
import { mockPosts, type Post, type Comment, type CommentStatus } from "@/data/mock-data";
import { cn } from "@/lib/utils";

const COMMENT_STATUS_CONFIG: Record<Exclude<CommentStatus, "DELETED">, { label: string; chip: string }> = {
  ACTIVE:   { label: "정상",   chip: "bg-green-100 text-green-700" },
  REPORTED: { label: "신고됨", chip: "bg-amber-100 text-amber-700" },
  HIDDEN:   { label: "숨김",   chip: "bg-slate-100 text-slate-500" },
};

function PostCommentSection({ postId }: { postId: string }) {
  const { showToast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    setComments(getCommentsByPostId(postId));
  }, [postId]);

  const reload = () => setComments(getCommentsByPostId(postId));

  const handleStatusChange = (id: string, status: CommentStatus) => {
    updateCommentStatus(id, status);
    reload();
    if (status === "HIDDEN") {
      showToast("댓글이 숨김 처리되었습니다.");
      recordLog("COMMENT_HIDE", `댓글 숨김 처리: ${id}`, { targetType: "comment", targetId: id });
    } else if (status === "ACTIVE") {
      showToast("댓글이 복원되었습니다.");
      recordLog("COMMENT_RESTORE", `댓글 복원: ${id}`, { targetType: "comment", targetId: id });
    }
  };

  const activeComments = comments.filter((c) => c.status !== "DELETED");

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
        <RiMessage2Line className="h-4 w-4 text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-700">댓글</h2>
        <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
          {activeComments.length}
        </span>
      </div>

      {activeComments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <RiMessage2Line className="mb-3 h-8 w-8 opacity-20" />
          <p className="text-sm">아직 작성된 댓글이 없습니다.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {activeComments.map((comment) => {
            const sc = COMMENT_STATUS_CONFIG[comment.status as Exclude<CommentStatus, "DELETED">];
            return (
              <div key={comment.id} className={cn("px-5 py-3.5", comment.status === "HIDDEN" && "opacity-50")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-800">{comment.authorNickname}</span>
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", sc.chip)}>
                        {sc.label}
                      </span>
                      {comment.reportCount > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-red-400">
                          신고 {comment.reportCount}건
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {new Date(comment.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{comment.content}</p>
                    {comment.reportReason && (
                      <p className="mt-1 text-xs text-amber-600">사유: {comment.reportReason}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {comment.status === "HIDDEN" ? (
                      <button
                        onClick={() => handleStatusChange(comment.id, "ACTIVE")}
                        className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-50 transition-colors"
                      >
                        복원
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(comment.id, "HIDDEN")}
                        className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-50 transition-colors"
                      >
                        숨김
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const statusConfig = {
  PUBLISHED: { label: "게시중", variant: "success" as const },
  DRAFT: { label: "임시저장", variant: "secondary" as const },
  SCHEDULED: { label: "예약", variant: "warning" as const },
  HIDDEN: { label: "숨김", variant: "destructive" as const },
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

type ListPost = { id: string; title: string; status: string; createdAt: string };

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const id = params.id as string;

  const [storedPost, setStoredPost] = useState<StoredPost | null>(null);
  const [mockPost, setMockPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [allListPosts, setAllListPosts] = useState<ListPost[]>([]);

  useEffect(() => {
    const sp = getPost(id);
    if (sp) {
      setStoredPost(sp);
    } else {
      setMockPost(mockPosts.find((p) => p.id === id) ?? null);
    }

    // 사이드바용 전체 게시물 목록
    const stored = getAllPosts().map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      createdAt: p.createdAt,
    }));
    const mocks = mockPosts.map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      createdAt: p.createdAt,
    }));
    setAllListPosts([...stored, ...mocks]);

    setLoading(false);
  }, [id]);

  const handleDelete = () => {
    if (!confirm("이 콘텐츠를 삭제하시겠습니까?")) return;
    const title = storedPost?.title ?? mockPost?.title ?? id;
    deletePost(id);
    recordLog("POST_DELETE", `게시물 삭제: ${title}`, { targetType: "post", targetId: id });
    showToast("콘텐츠가 삭제되었습니다.");
    router.push("/posts");
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        로딩 중...
      </div>
    );
  }

  if (!storedPost && !mockPost) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
        <p>콘텐츠를 찾을 수 없습니다.</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/posts")}>
          <RiArrowLeftLine className="mr-1.5 h-4 w-4" />
          목록으로
        </Button>
      </div>
    );
  }

  /* ── 공통 사이드바 ── */
  const PostListSidebar = () => (
    <div className="w-[240px] shrink-0">
      <div className="sticky top-4 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <RiFileTextLine className="h-4 w-4 text-slate-400" />
            콘텐츠 목록
          </h3>
        </div>
        <div className="max-h-[calc(100vh-220px)] overflow-y-auto divide-y divide-slate-50 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb:hover]:bg-slate-300">
          {allListPosts.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-slate-400">콘텐츠가 없습니다</p>
          ) : (
            allListPosts.map((post) => {
              const sc = statusConfig[post.status as keyof typeof statusConfig];
              const isActive = post.id === id;
              return (
                <button
                  key={post.id}
                  onClick={() => router.push(`/posts/${post.id}`)}
                  className={cn(
                    "w-full px-4 py-3 text-left transition-colors hover:bg-slate-50",
                    isActive && "bg-indigo-50 border-l-2 border-indigo-500"
                  )}
                >
                  <p className={cn(
                    "text-xs font-medium line-clamp-2 leading-snug",
                    isActive ? "text-indigo-700" : "text-slate-700"
                  )}>
                    {post.title}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {sc && (
                      <Badge variant={sc.variant} className="text-[10px] px-1.5 py-0">
                        {sc.label}
                      </Badge>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  /* ── 사용자가 작성한 게시물 ── */
  if (storedPost) {
    const sc = statusConfig[storedPost.status];
    return (
      <div className="flex gap-5">
        {/* 메인 콘텐츠 */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* 액션 헤더 */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/posts")}
              className="text-slate-500"
            >
              <RiArrowLeftLine className="mr-1.5 h-4 w-4" />
              목록으로
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-red-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
              >
                <RiDeleteBinLine className="mr-1.5 h-4 w-4" />
                삭제
              </Button>
              <Button
                size="sm"
                onClick={() => router.push(`/posts/new?id=${storedPost.id}`)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <RiPencilLine className="mr-1.5 h-4 w-4" />
                수정하기
              </Button>
            </div>
          </div>

          {/* 본문 카드 */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {storedPost.thumbnailPreview && (
              <img
                src={storedPost.thumbnailPreview}
                alt="썸네일"
                className="h-56 w-full rounded-t-xl object-cover"
              />
            )}

            <div className="p-6">
              {/* 상태 & 카테고리 */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant={sc.variant}>{sc.label}</Badge>
                {storedPost.category && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                    {storedPost.category}
                    {storedPost.subCategory ? ` / ${storedPost.subCategory}` : ""}
                  </span>
                )}
              </div>

              {/* 제목 */}
              <h1 className="mb-4 text-2xl font-bold text-slate-900">
                {storedPost.title}
              </h1>

              {/* 메타 정보 */}
              <div className="mb-5 flex flex-wrap items-center gap-4 border-b border-slate-100 pb-5 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <RiCalendarLine className="h-3.5 w-3.5" />
                  {new Date(storedPost.createdAt).toLocaleDateString("ko-KR")} 작성
                </span>
                {storedPost.updatedAt !== storedPost.createdAt && (
                  <span className="flex items-center gap-1">
                    <RiTimeLine className="h-3.5 w-3.5" />
                    {new Date(storedPost.updatedAt).toLocaleDateString("ko-KR")} 수정
                  </span>
                )}
                {storedPost.publishStart && (
                  <span className="flex items-center gap-1">
                    <RiEyeLine className="h-3.5 w-3.5" />
                    {storedPost.publishStart}
                    {storedPost.publishEnd
                      ? ` ~ ${storedPost.publishEnd}`
                      : " ~ 계속"}
                  </span>
                )}
                {storedPost.status === "SCHEDULED" && storedPost.scheduledAt && (
                  <span className="flex items-center gap-1 text-amber-500">
                    <RiCalendarScheduleLine className="h-3.5 w-3.5" />
                    {new Date(storedPost.scheduledAt).toLocaleString("ko-KR", {
                      month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })} 예약 게시
                  </span>
                )}
              </div>

              {/* 본문 */}
              {storedPost.body ? (
                <div
                  className="ProseMirror"
                  dangerouslySetInnerHTML={{ __html: storedPost.body }}
                />
              ) : (
                <p className="text-sm text-slate-400">본문 내용이 없습니다.</p>
              )}

              {/* 태그 */}
              {storedPost.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center gap-1.5">
                  <RiPriceTag3Line className="h-3.5 w-3.5 text-slate-400" />
                  {storedPost.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 관련 링크 */}
              {storedPost.relatedLinks.some((l) => l.url) && (
                <div className="mt-5 rounded-lg bg-slate-50 p-3">
                  <p className="mb-2 text-xs font-semibold text-slate-600">관련 링크</p>
                  <div className="space-y-1">
                    {storedPost.relatedLinks
                      .filter((l) => l.url)
                      .map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:underline"
                        >
                          {link.label || link.url}
                        </a>
                      ))}
                  </div>
                </div>
              )}

              {/* 첨부 파일 */}
              {storedPost.attachments?.length > 0 && (
                <div className="mt-5 rounded-lg bg-slate-50 p-3">
                  <p className="mb-2 text-xs font-semibold text-slate-600">첨부 파일</p>
                  <ul className="space-y-1.5">
                    {storedPost.attachments.map((file, i) => (
                      <li key={i} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs">
                        <RiAttachmentLine className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        {file.dataUrl ? (
                          <a
                            href={file.dataUrl}
                            download={file.name}
                            className="flex-1 truncate text-indigo-600 hover:underline"
                          >
                            {file.name}
                          </a>
                        ) : (
                          <span className="flex-1 truncate text-slate-400">{file.name}</span>
                        )}
                        <span className="shrink-0 text-slate-400">{formatSize(file.size)}</span>
                        {file.dataUrl ? (
                          <a
                            href={file.dataUrl}
                            download={file.name}
                            className="ml-1 flex items-center justify-center rounded p-0.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                            title="다운로드"
                          >
                            <RiDownloadLine className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <span className="ml-1 text-slate-300">저장 불가</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 댓글 섹션 */}
          <PostCommentSection postId={storedPost.id} />
        </div>

        {/* 우측 게시물 목록 사이드바 */}
        <PostListSidebar />
      </div>
    );
  }

  /* ── 목업 게시물 (읽기 전용) ── */
  if (!mockPost) return null;
  const mp = mockPost;
  const sc = statusConfig[mp.status];
  return (
    <div className="flex gap-5">
      {/* 메인 콘텐츠 */}
      <div className="flex-1 min-w-0 space-y-5">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/posts")}
            className="text-slate-500"
          >
            <RiArrowLeftLine className="mr-1.5 h-4 w-4" />
            목록으로
          </Button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant={sc.variant}>{sc.label}</Badge>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
              {mp.category}
            </span>
            {mp.isHot && (
              <span className="flex items-center gap-0.5 text-xs font-medium text-red-500">
                <RiFireLine className="h-3.5 w-3.5" />
                HOT
              </span>
            )}
          </div>

          <h1 className="mb-4 text-2xl font-bold text-slate-900">{mp.title}</h1>

          <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 pb-4 text-xs text-slate-400">
            <span>작성자: {mp.authorNickname}</span>
            <span>조회수: {(mp.viewCount + mp.virtualViewCount).toLocaleString()}</span>
            <span>스크랩: {mp.scrapCount}</span>
            <span>댓글: {mp.commentCount}</span>
            <span>작성일: {new Date(mp.createdAt).toLocaleDateString("ko-KR")}</span>
            {mp.status === "SCHEDULED" && mp.scheduledAt && (
              <span className="flex items-center gap-1 text-amber-500">
                <RiCalendarScheduleLine className="h-3.5 w-3.5" />
                {new Date(mp.scheduledAt).toLocaleString("ko-KR", {
                  month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
                })} 예약 게시
              </span>
            )}
          </div>

          <p className="mt-6 text-sm italic text-slate-400">
            * 이 게시물은 샘플 데이터입니다. 본문 내용을 표시할 수 없습니다.
          </p>
        </div>

        {/* 댓글 섹션 */}
        <PostCommentSection postId={mp.id} />
      </div>

      {/* 우측 게시물 목록 사이드바 */}
      <PostListSidebar />
    </div>
  );
}
