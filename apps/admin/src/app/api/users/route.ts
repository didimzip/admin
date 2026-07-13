import { NextRequest, NextResponse } from "next/server";
import { mockUsers } from "@/data/mock-users";
import type { UserWithProfile } from "@/types/user";
import type { PaginatedResponse } from "@/types/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const companyType = searchParams.get("companyType") || "ALL";
    const companyName = searchParams.get("companyName") || "";
    const position = searchParams.get("position") || "";
    const jobCategory = searchParams.get("jobCategory") || "";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // TODO: DB 연결 시 실제 쿼리로 교체
    let filtered = mockUsers;

    if (companyType !== "ALL") {
      filtered = filtered.filter((u) => u.companyType === companyType);
    }
    if (companyName) {
      filtered = filtered.filter((u) =>
        u.companyName.toLowerCase().includes(companyName.toLowerCase())
      );
    }
    if (position) {
      filtered = filtered.filter((u) =>
        u.position.toLowerCase().includes(position.toLowerCase())
      );
    }
    if (jobCategory) {
      filtered = filtered.filter((u) => u.jobCategory === jobCategory);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.nickname.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.realName.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    const response: PaginatedResponse<UserWithProfile> = {
      data,
      total,
      page,
      limit,
      totalPages,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Users list error:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
