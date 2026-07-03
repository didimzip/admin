import Link from "next/link";
import Image from "next/image";
import { Eye, MessageCircle, ChevronRight } from "lucide-react";
import { communePosts } from "@/lib/mock-data";

export default function CommuneSection() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">지금 꼬뮨 라운지</h2>
        <Link
          href="/commune"
          className="flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground"
        >
          더보기
          <ChevronRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {communePosts.map((post) => (
          <Link
            key={post.id}
            href={`/commune/${post.id}`}
            className="flex gap-4 p-4 rounded-lg border border-border hover:border-foreground/20 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {post.status === "recruiting" && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                    모집중
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground">
                  {post.category}
                </span>
              </div>
              <h3 className="text-sm font-semibold line-clamp-1">
                {post.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {post.summary}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Eye size={12} />
                  {post.viewCount.toLocaleString()}
                </span>
                <span className="flex items-center gap-0.5">
                  <MessageCircle size={12} />
                  {post.commentCount}
                </span>
                <span>~{post.deadline}</span>
              </div>
            </div>
            {post.thumbnail && (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                <Image
                  src={post.thumbnail}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
