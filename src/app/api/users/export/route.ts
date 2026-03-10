import { NextRequest, NextResponse } from "next/server";
import { mockUsers } from "@/data/mock-users";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const companyType = searchParams.get("companyType") || "ALL";
    const companyName = searchParams.get("companyName") || "";
    const search = searchParams.get("search") || "";

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
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.nickname.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.realName.toLowerCase().includes(q)
      );
    }

    const headers = [
      "닉네임",
      "실명",
      "이메일",
      "회원유형",
      "회사명",
      "직책",
      "직종",
      "인증뱃지",
      "가입일",
    ];

    const rows = filtered.map((u) => [
      u.nickname,
      u.realName,
      u.email,
      u.companyType,
      u.companyName,
      u.position,
      u.jobCategory,
      u.hasBadge ? "O" : "X",
      new Date(u.createdAt).toLocaleDateString("ko-KR"),
    ]);

    // BOM (\uFEFF) for Korean characters in Excel
    const csv =
      "\uFEFF" + [headers, ...rows].map((r) => r.join(",")).join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="members_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
