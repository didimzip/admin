import Link from "next/link";
import { ChevronRight } from "lucide-react";
import CommuneCard from "./CommuneCard";
import type { CommunePost } from "@/lib/mock-data";

export default function CommuneSection({ posts }: { posts: CommunePost[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[24px] font-bold">지금 꼬뮨 라운지</h2>
        <Link
          href="/commune"
          className="flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground"
        >
          더보기
          <ChevronRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {posts.map((post) => (
          <CommuneCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
