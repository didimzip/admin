import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { mentors } from "@/lib/mock-data";

export default function MentorSection() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">
          궁금한 점, 디딤멘토에게 물어보세요
        </h2>
        <Link
          href="/mentor"
          className="flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground"
        >
          더보기
          <ChevronRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {mentors.map((mentor) => (
          <Link
            key={mentor.id}
            href={`/mentor/${mentor.id}`}
            className="flex flex-col items-center p-6 rounded-xl border border-border hover:shadow-md transition-shadow text-center"
          >
            <div className="relative w-20 h-20 rounded-full overflow-hidden mb-3">
              <Image
                src={mentor.profileImage}
                alt={mentor.name}
                fill
                className="object-cover"
              />
            </div>
            <p className="text-xs text-muted-foreground">{mentor.job}</p>
            <h3 className="text-sm font-semibold mt-0.5">{mentor.name}</h3>
            <div className="flex flex-wrap gap-1 mt-2 justify-center">
              {mentor.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
